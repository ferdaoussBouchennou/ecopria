package com.ecopria.inscription.service;

import com.ecopria.inscription.client.ActionClient;
import com.ecopria.inscription.client.UtilisateurClient;
import com.ecopria.inscription.dto.ActionDTO;
import com.ecopria.inscription.dto.InscriptionRequestDTO;
import com.ecopria.inscription.dto.InscriptionResponseDTO;
import com.ecopria.inscription.kafka.InscriptionProducer;
import com.ecopria.inscription.model.Inscription;
import com.ecopria.inscription.repository.InscriptionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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
        if (!utilisateurClient.isCitizen(request.getUserId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Seuls les participants peuvent s'inscrire à une action.");
        }

        if (inscriptionRepository.existsByUserIdAndActionId(request.getUserId(), request.getActionId())) {
            throw new IllegalStateException(
                    "L'utilisateur " + request.getUserId() + " est déjà inscrit à l'action " + request.getActionId());
        }

        ActionDTO action = actionClient.getAction(request.getActionId());
        if (!"PUBLISHED".equals(action.getStatut())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Cette action n'est plus ouverte aux inscriptions.");
        }
        utilisateurClient.syncParticipantProfile(request);
        Map<String, Object> profile = utilisateurClient.getParticipantProfile(request.getUserId());
        String participantEmail = firstNonBlank(request.getEmail(), stringValue(profile.get("email")));
        String participantFirstName = firstNonBlank(request.getFirstName(), stringValue(profile.get("firstName")));

        Inscription inscription = new Inscription();
        inscription.setUserId(request.getUserId());
        inscription.setActionId(request.getActionId());
        inscription.setDateInscription(LocalDateTime.now());
        inscription.setPointsAction(action.getPoints());
        inscription.setMotivation(request.getMotivation());
        inscription.setConditions(request.getConditions());
        inscription.setParticipantFirstName(trimToNull(request.getFirstName()));
        inscription.setParticipantLastName(trimToNull(request.getLastName()));
        inscription.setParticipantEmail(trimToNull(request.getEmail()));
        inscription.setParticipantPhone(trimToNull(request.getPhone()));
        inscription.setParticipantCity(trimToNull(request.getCity()));
        if (request.getImageRights() != null) {
            inscription.setImageRights(request.getImageRights());
        }
        if (request.getNewsletter() != null) {
            inscription.setNewsletter(request.getNewsletter());
        }

        if (action.getPlacesDisponibles() <= 0) {
            inscription.setStatut("EN_ATTENTE");
            inscription.setEnAttenteMotif(Inscription.MOTIF_PLACES);
            Inscription saved = inscriptionRepository.save(inscription);
            publishInscriptionNotification(saved, action, participantEmail, participantFirstName);
            return toResponseDTO(saved);
        }

        int trustScore = utilisateurClient.getTrustScore(request.getUserId());
        if (trustScore < TRUST_SCORE_SEUIL) {
            inscription.setStatut("EN_ATTENTE");
            inscription.setEnAttenteMotif(Inscription.MOTIF_TRUST);
            Inscription saved = inscriptionRepository.save(inscription);
            publishInscriptionNotification(saved, action, participantEmail, participantFirstName);
            return toResponseDTO(saved);
        }

        inscription.setStatut("CONFIRMEE");
        inscription.setEnAttenteMotif(null);
        Inscription saved = inscriptionRepository.save(inscription);
        publishInscriptionNotification(saved, action, participantEmail, participantFirstName);
        return toResponseDTO(saved);
    }

    private void publishInscriptionNotification(Inscription inscription,
                                                ActionDTO action,
                                                String profileEmail,
                                                String profileFirstName) {
        String email = firstNonBlank(inscription.getParticipantEmail(), profileEmail);
        String firstName = firstNonBlank(inscription.getParticipantFirstName(), profileFirstName);
        inscriptionProducer.envoyerNotification(inscription, action, email, firstName);
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

    /** Annule silencieusement toutes les inscriptions actives d'une action (événement action.annulee). */
    @Transactional
    public int annulerInscriptionsPourAction(Long actionId) {
        int count = 0;
        for (Inscription inscription : inscriptionRepository.findByActionId(actionId)) {
            if ("ANNULEE".equals(inscription.getStatut())) {
                continue;
            }
            inscription.setStatut("ANNULEE");
            inscriptionRepository.save(inscription);
            count++;
        }
        return count;
    }

    /** Confirmation manuelle d'une inscription en attente pour score de confiance (espace association). */
    @Transactional
    public InscriptionResponseDTO confirmerAttenteConfiance(Long inscriptionId) {
        Inscription inscription = inscriptionRepository.findById(inscriptionId)
                .orElseThrow(() -> new RuntimeException("Inscription introuvable : id=" + inscriptionId));

        if (!"EN_ATTENTE".equals(inscription.getStatut())) {
            throw new IllegalStateException("Seules les inscriptions en attente peuvent être confirmées.");
        }
        if (!Inscription.MOTIF_TRUST.equals(inscription.getEnAttenteMotif())) {
            throw new IllegalStateException(
                    "La confirmation manuelle ne concerne que les inscriptions en revue (score de confiance).");
        }

        ActionDTO action = actionClient.getAction(inscription.getActionId());
        if (action.getPlacesDisponibles() <= 0) {
            throw new IllegalStateException("Aucune place disponible pour confirmer cette inscription.");
        }

        inscription.setStatut("CONFIRMEE");
        inscription.setEnAttenteMotif(null);
        Inscription saved = inscriptionRepository.save(inscription);

        String email = firstNonBlank(saved.getParticipantEmail(),
                stringValue(utilisateurClient.getParticipantProfile(saved.getUserId()).get("email")));
        String firstName = firstNonBlank(saved.getParticipantFirstName(),
                stringValue(utilisateurClient.getParticipantProfile(saved.getUserId()).get("firstName")));
        publishInscriptionNotification(saved, action, email, firstName);
        return toResponseDTO(saved);
    }

    /** Refus manuel d'une inscription en attente pour score de confiance. */
    @Transactional
    public void refuserAttenteConfiance(Long inscriptionId) {
        Inscription inscription = inscriptionRepository.findById(inscriptionId)
                .orElseThrow(() -> new RuntimeException("Inscription introuvable : id=" + inscriptionId));

        if (!"EN_ATTENTE".equals(inscription.getStatut())) {
            throw new IllegalStateException("Seules les inscriptions en attente peuvent être refusées.");
        }
        if (!Inscription.MOTIF_TRUST.equals(inscription.getEnAttenteMotif())) {
            throw new IllegalStateException(
                    "Le refus manuel ne concerne que les inscriptions en revue (score de confiance).");
        }

        inscription.setStatut("ANNULEE");
        inscription.setEnAttenteMotif(null);
        inscriptionRepository.save(inscription);
    }

    @Transactional
    public void desinscrire(Long inscriptionId) {
        Inscription inscription = inscriptionRepository.findById(inscriptionId)
                .orElseThrow(() -> new RuntimeException("Inscription introuvable : id=" + inscriptionId));

        if ("ANNULEE".equals(inscription.getStatut())) {
            throw new IllegalStateException("Cette inscription est déjà annulée.");
        }

        String statutAvant = inscription.getStatut();
        inscription.setStatut("ANNULEE");
        inscriptionRepository.save(inscription);
        String actionTitle = null;
        try {
            actionTitle = actionClient.getAction(inscription.getActionId()).getTitre();
        } catch (Exception ignored) {
        }
        inscriptionProducer.envoyerAnnulation(inscription, statutAvant, actionTitle);
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
        dto.setFirstName(firstNonBlank(inscription.getParticipantFirstName(), stringValue(profile.get("firstName"))));
        dto.setLastName(firstNonBlank(inscription.getParticipantLastName(), stringValue(profile.get("lastName"))));
        dto.setEmail(firstNonBlank(inscription.getParticipantEmail(), stringValue(profile.get("email"))));
        dto.setPhone(firstNonBlank(inscription.getParticipantPhone(), stringValue(profile.get("phone"))));
        dto.setCity(firstNonBlank(inscription.getParticipantCity(), stringValue(profile.get("city"))));
        dto.setPhotoUrl(stringValue(profile.get("photo")));
        dto.setMotivation(inscription.getMotivation());
        dto.setConditions(inscription.getConditions());
        dto.setImageRights(inscription.getImageRights());
        dto.setNewsletter(inscription.getNewsletter());
        dto.setEnAttenteMotif(inscription.getEnAttenteMotif());
        try {
            dto.setTrustScore(utilisateurClient.getTrustScore(inscription.getUserId()));
        } catch (Exception e) {
            dto.setTrustScore(null);
        }
        return dto;
    }

    private String stringValue(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String firstNonBlank(String primary, String fallback) {
        if (primary != null && !primary.isBlank()) {
            return primary.trim();
        }
        if (fallback != null && !fallback.isBlank()) {
            return fallback.trim();
        }
        return null;
    }
}
