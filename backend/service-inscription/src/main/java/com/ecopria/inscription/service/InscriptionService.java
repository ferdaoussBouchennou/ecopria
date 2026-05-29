package com.ecopria.inscription.service;

import com.ecopria.inscription.client.ActionClient;
import com.ecopria.inscription.client.UtilisateurClient;
import com.ecopria.inscription.dto.ActionDTO;
import com.ecopria.inscription.dto.InscriptionRequestDTO;
import com.ecopria.inscription.dto.InscriptionResponseDTO;
import com.ecopria.inscription.kafka.InscriptionProducer;
import com.ecopria.inscription.model.Inscription;
import com.ecopria.inscription.repository.InscriptionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class InscriptionService {

    private static final int TRUST_SCORE_SEUIL = 70;

    private final InscriptionRepository inscriptionRepository;
    private final ActionClient actionClient;
    private final InscriptionProducer inscriptionProducer;
    private final UtilisateurClient utilisateurClient;

    public InscriptionService(InscriptionRepository inscriptionRepository,
                              ActionClient actionClient,
                              InscriptionProducer inscriptionProducer,
                              UtilisateurClient utilisateurClient) {
        this.inscriptionRepository = inscriptionRepository;
        this.actionClient = actionClient;
        this.inscriptionProducer = inscriptionProducer;
        this.utilisateurClient = utilisateurClient;
    }

    @Transactional
    public InscriptionResponseDTO inscrire(InscriptionRequestDTO request) {
        if (inscriptionRepository.existsByUserIdAndActionId(request.getUserId(), request.getActionId())) {
            throw new IllegalStateException(
                    "L'utilisateur " + request.getUserId() + " est déjà inscrit à l'action " + request.getActionId());
        }

        ActionDTO action = actionClient.getAction(request.getActionId());

        Inscription inscription = new Inscription();
        inscription.setUserId(request.getUserId());
        inscription.setActionId(request.getActionId());
        inscription.setDateInscription(LocalDateTime.now());
        inscription.setPointsAction(action.getPoints());
        
        if (request.getAccompagnants() != null) {
            inscription.setAccompagnants(request.getAccompagnants());
        }
        inscription.setMotivation(request.getMotivation());
        inscription.setConditions(request.getConditions());
        if (request.getImageRights() != null) {
            inscription.setImageRights(request.getImageRights());
        }
        if (request.getNewsletter() != null) {
            inscription.setNewsletter(request.getNewsletter());
        }

        if (action.getPlacesDisponibles() <= 0) {
            inscription.setStatut("EN_ATTENTE");
            Inscription saved = inscriptionRepository.save(inscription);
            return toResponseDTO(saved);
        }

        // Vérifier le Trust Score : si < seuil, mise en attente automatique
        int trustScore = utilisateurClient.getTrustScore(request.getUserId());
        if (trustScore < 70) {
            inscription.setStatut("EN_ATTENTE");
            Inscription saved = inscriptionRepository.save(inscription);
            return toResponseDTO(saved);
        }

        inscription.setStatut("CONFIRMEE");
        Inscription saved = inscriptionRepository.save(inscription);
        inscriptionProducer.envoyerConfirmation(saved);
        return toResponseDTO(saved);
    }

    public List<InscriptionResponseDTO> getMesInscriptions(Long userId) {
        return inscriptionRepository.findByUserId(userId)
                .stream().map(this::toResponseDTO).collect(Collectors.toList());
    }

    public List<InscriptionResponseDTO> getInscriptionsParAction(Long actionId) {
        return inscriptionRepository.findByActionId(actionId)
                .stream().map(this::toResponseDTO).collect(Collectors.toList());
    }

    public InscriptionResponseDTO getInscription(Long id) {
        Inscription inscription = inscriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inscription introuvable : id=" + id));
        return toResponseDTO(inscription);
    }

    @Transactional
    public void desinscrire(Long inscriptionId) {
        Inscription inscription = inscriptionRepository.findById(inscriptionId)
                .orElseThrow(() -> new RuntimeException("Inscription introuvable : id=" + inscriptionId));

        if ("ANNULEE".equals(inscription.getStatut())) {
            throw new IllegalStateException("Cette inscription est déjà annulée.");
        }

        inscription.setStatut("ANNULEE");
        inscriptionRepository.save(inscription);
        inscriptionProducer.envoyerAnnulation(inscription);
    }

    private InscriptionResponseDTO toResponseDTO(Inscription inscription) {
        InscriptionResponseDTO dto = new InscriptionResponseDTO();
        dto.setId(inscription.getId());
        dto.setUserId(inscription.getUserId());
        dto.setActionId(inscription.getActionId());
        dto.setDateInscription(inscription.getDateInscription());
        dto.setStatut(inscription.getStatut());
        dto.setPointsAction(inscription.getPointsAction());
        Map<String, Object> profile = utilisateurClient.getParticipantProfile(inscription.getUserId());
        dto.setFirstName(stringValue(profile.get("firstName")));
        dto.setLastName(stringValue(profile.get("lastName")));
        dto.setEmail(stringValue(profile.get("email")));
        dto.setPhone(stringValue(profile.get("phone")));
        dto.setCity(stringValue(profile.get("city")));
        dto.setPhotoUrl(stringValue(profile.get("photo")));
        return dto;
    }

    private String stringValue(Object value) {
        return value == null ? null : String.valueOf(value);
    }
}
