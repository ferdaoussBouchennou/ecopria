package com.ecopria.presence.service;



import com.ecopria.presence.client.ActionClient;
import com.ecopria.presence.dto.ActionDTO;
import com.ecopria.presence.dto.PointsByActionsDTO;
import com.ecopria.presence.dto.PresenceResponseDTO;
import com.ecopria.presence.dto.ValidationByPinDTO;
import com.ecopria.presence.dto.ValidationRequestDTO;
import com.ecopria.presence.kafka.FraudeDetecteeEvent;
import com.ecopria.presence.kafka.PresenceProducer;
import com.ecopria.presence.kafka.PresenceValideeEvent;
import com.ecopria.presence.model.Presence;
import com.ecopria.presence.model.QrCodeAction;
import com.ecopria.presence.repository.PresenceRepository;
import com.ecopria.presence.repository.QrCodeActionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class PresenceService {

    // Compteur de tentatives frauduleuses par userId
    private final Map<Long, Integer> tentativesEchouees = new ConcurrentHashMap<>();

    private final PresenceRepository presenceRepository;
    private final QrCodeActionRepository qrCodeActionRepository;
    private final PresenceProducer presenceProducer;
    private final ActionClient actionClient;

    public PresenceService(PresenceRepository presenceRepository,
                           QrCodeActionRepository qrCodeActionRepository,
                           PresenceProducer presenceProducer,
                           ActionClient actionClient) {
        this.presenceRepository = presenceRepository;
        this.qrCodeActionRepository = qrCodeActionRepository;
        this.presenceProducer = presenceProducer;
        this.actionClient = actionClient;
    }

    @Transactional
    public PresenceResponseDTO validerPresence(ValidationRequestDTO request) {

        // 1. Trouver le QR Code de l'action
        QrCodeAction qrCodeAction = qrCodeActionRepository
                .findByQrCode(request.getQrCode())
                .orElseThrow(() -> {
                    enregistrerTentativeEchouee(request.getUserId(),
                            null, "QR Code invalide ou inexistant");
                    return new IllegalArgumentException("QR Code invalide");
                });

        Long actionId = qrCodeAction.getActionId();

        // 2. Vérifier si déjà présent
        if (presenceRepository.existsByUserIdAndActionId(request.getUserId(), actionId)) {
            enregistrerTentativeEchouee(request.getUserId(), actionId, "QR déjà scanné");
            throw new IllegalStateException("Vous avez déjà scanné ce QR Code");
        }

        // 3. Récupérer les points de l'action
        ActionDTO action = actionClient.getAction(actionId);

        // 4. Valider la présence
        Presence presence = new Presence();
        presence.setUserId(request.getUserId());
        presence.setActionId(actionId);
        presence.setPoints(action.getPoints());
        presence.setDateValidation(LocalDateTime.now());
        presence.setStatut("VALIDE");
        Presence saved = presenceRepository.save(presence);

        // 5. Réinitialiser le compteur de fraude
        tentativesEchouees.remove(request.getUserId());

        // 6. Publier presence.validee sur Kafka
        presenceProducer.envoyerPresenceValidee(new PresenceValideeEvent(
                saved.getId(),
                saved.getUserId(),
                saved.getActionId(),
                saved.getPoints(),
                saved.getDateValidation()
        ));

        System.out.println("Présence validée pour userId=" + request.getUserId()
                + " actionId=" + actionId);

        return toResponseDTO(saved);
    }

    public String getQrCodeParAction(Long actionId) {
        QrCodeAction qrCodeAction = qrCodeActionRepository
                .findByActionId(actionId)
                .orElseThrow(() -> new RuntimeException(
                        "QR Code non encore généré pour actionId=" + actionId));
        return qrCodeAction.getQrCode();
    }

    public String getPinCodeParAction(Long actionId) {
        QrCodeAction qrCodeAction = qrCodeActionRepository
                .findByActionId(actionId)
                .orElseThrow(() -> new RuntimeException(
                        "QR Code non encore généré pour actionId=" + actionId));
        return qrCodeAction.getPinCode();
    }

    @Transactional
    public PresenceResponseDTO validerPresenceParPin(ValidationByPinDTO request) {
        // Find the QR code action by PIN
        QrCodeAction qrCodeAction = qrCodeActionRepository
                .findByPinCode(request.getPinCode())
                .orElseThrow(() -> {
                    enregistrerTentativeEchouee(request.getUserId(), null, "PIN invalide");
                    return new IllegalArgumentException("PIN invalide ou inexistant");
                });
        // Reuse existing QR validation logic
        ValidationRequestDTO vr = new ValidationRequestDTO();
        vr.setQrCode(qrCodeAction.getQrCode());
        vr.setUserId(request.getUserId());
        return validerPresence(vr);
    }

    /**
     * Vérifie si un citoyen a une présence validée pour une action donnée.
     * Appelé par l'endpoint /verif pour le job AbsenceJob de service-inscription.
     */
    public boolean estPresent(Long userId, Long actionId) {
        return presenceRepository.existsByUserIdAndActionId(userId, actionId);
    }

    public List<PresenceResponseDTO> getPresencesParAction(Long actionId) {
        return presenceRepository.findByActionId(actionId).stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    /** Somme des points crédités (présences validées) pour une ou plusieurs actions. */
    public PointsByActionsDTO getPointsByActions(List<Long> actionIds) {
        if (actionIds == null || actionIds.isEmpty()) {
            return new PointsByActionsDTO(0L, Collections.emptyMap());
        }
        Long total = presenceRepository.sumPointsByActionIds(actionIds);
        Map<Long, Integer> byAction = new HashMap<>();
        for (Object[] row : presenceRepository.sumPointsGroupedByActionIds(actionIds)) {
            Long actionId = (Long) row[0];
            Number sum = (Number) row[1];
            byAction.put(actionId, sum != null ? sum.intValue() : 0);
        }
        return new PointsByActionsDTO(total != null ? total : 0L, byAction);
    }

    private void enregistrerTentativeEchouee(Long userId, Long actionId, String raison) {
        if (userId == null) return;
        int tentatives = tentativesEchouees.merge(userId, 1, Integer::sum);
        System.out.println("Tentative échouée userId=" + userId
                + " (" + tentatives + "/3) — " + raison);

        if (tentatives >= 3) {
            presenceProducer.envoyerFraudeDetectee(new FraudeDetecteeEvent(
                    userId, actionId, raison, tentatives, LocalDateTime.now()
            ));
            tentativesEchouees.remove(userId);
        }
    }

    private PresenceResponseDTO toResponseDTO(Presence presence) {
        PresenceResponseDTO dto = new PresenceResponseDTO();
        dto.setId(presence.getId());
        dto.setUserId(presence.getUserId());
        dto.setActionId(presence.getActionId());
        dto.setPoints(presence.getPoints());
        dto.setDateValidation(presence.getDateValidation());
        dto.setStatut(presence.getStatut());
        return dto;
    }
}
