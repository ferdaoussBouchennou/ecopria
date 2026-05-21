package com.ecopria.inscription.service;

import com.ecopria.inscription.client.ActionClient;
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
import java.util.stream.Collectors;

@Service
public class InscriptionService {

    private final InscriptionRepository inscriptionRepository;
    private final ActionClient actionClient;
    private final InscriptionProducer inscriptionProducer;

    public InscriptionService(InscriptionRepository inscriptionRepository,
                              ActionClient actionClient,
                              InscriptionProducer inscriptionProducer) {
        this.inscriptionRepository = inscriptionRepository;
        this.actionClient = actionClient;
        this.inscriptionProducer = inscriptionProducer;
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

        if (action.getPlacesDisponibles() <= 0) {
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
        return dto;
    }
}