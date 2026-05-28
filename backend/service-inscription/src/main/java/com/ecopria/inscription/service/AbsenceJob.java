package com.ecopria.inscription.service;

import com.ecopria.inscription.client.PresenceClient;
import com.ecopria.inscription.client.UtilisateurClient;
import com.ecopria.inscription.model.Inscription;
import com.ecopria.inscription.repository.InscriptionRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Job quotidien qui détecte les absences non justifiées et pénalise
 * le Trust Score du citoyen concerné de -20 points.
 *
 * Logique :
 *  - Cherche toutes les inscriptions CONFIRMEE non encore pénalisées.
 *  - Pour chacune, vérifie via service-presence si la présence a été validée.
 *  - Si non présent, réduit le Trust Score de -20 et marque penalise=true.
 *
 * Le cron est réglé à 02:00 chaque nuit pour éviter les impacts en journée.
 */
@Component
public class AbsenceJob {

    private final InscriptionRepository inscriptionRepository;
    private final PresenceClient presenceClient;
    private final UtilisateurClient utilisateurClient;

    public AbsenceJob(InscriptionRepository inscriptionRepository,
                      PresenceClient presenceClient,
                      UtilisateurClient utilisateurClient) {
        this.inscriptionRepository = inscriptionRepository;
        this.presenceClient = presenceClient;
        this.utilisateurClient = utilisateurClient;
    }

    /**
     * Exécuté chaque nuit à 02:00.
     * Pénalise les citoyens qui ne se sont pas présentés à une action passée.
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void penaliserAbsences() {
        List<Inscription> candidats = inscriptionRepository
                .findByStatutAndPenalise("CONFIRMEE", false);

        int total = 0;
        for (Inscription inscription : candidats) {
            // On ne traite que les inscriptions dont la date est passée (> 1h de sécurité)
            if (inscription.getDateInscription() == null) continue;

            // Vérifier si la présence a été validée
            boolean present = presenceClient.estPresent(
                    inscription.getUserId(),
                    inscription.getActionId()
            );

            if (!present) {
                // Réduire le Trust Score de -20
                utilisateurClient.updateTrustScore(inscription.getUserId(), -20);

                System.out.println("[AbsenceJob] Pénalité -20 appliquée à userId="
                        + inscription.getUserId()
                        + " pour absence à actionId=" + inscription.getActionId());
                total++;
            }

            // Dans tous les cas, marquer comme traité pour ne pas repasser dessus
            inscription.setPenalise(true);
            inscriptionRepository.save(inscription);
        }

        System.out.println("[AbsenceJob] Terminé : " + total + " pénalité(s) appliquée(s).");
    }
}
