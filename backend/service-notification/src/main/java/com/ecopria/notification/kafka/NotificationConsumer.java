package com.ecopria.notification.kafka;

import com.ecopria.notification.client.InscriptionInternalClient;
import com.ecopria.notification.client.UtilisateurContactClient;
import com.ecopria.notification.client.dto.CitizenContactSnapshot;
import com.ecopria.notification.model.Notification;
import com.ecopria.notification.service.NotificationDispatcher;
import com.ecopria.notification.service.NotificationService;
import com.ecopria.notification.service.VerificationEmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Locale;

/**
 * Écoute les topics listés dans {@code docs/KAFKA_TOPICS.md} (racine du dépôt).
 * Chaque handler passe par {@link com.ecopria.notification.service.NotificationDispatcher} pour in-app + e-mail.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationConsumer {

    private final NotificationDispatcher dispatcher;
    private final NotificationService notificationService;
    private final VerificationEmailService verificationEmailService;
    private final UtilisateurContactClient utilisateurContactClient;
    private final InscriptionInternalClient inscriptionInternalClient;

    private Long requireAuthUserId(Map<String, Object> event, String topic) {
        return firstLongId(event, topic, "userId", "auth_id", "id");
    }

    private Long firstLongId(Map<String, Object> event, String topic, String... keys) {
        for (String k : keys) {
            Object v = event.get(k);
            if (v != null) {
                return toLong(v);
            }
        }
        log.error("{} : identifiant introuvable (candidats {}) : {}", topic, String.join(",", keys), event);
        return null;
    }

    private static long toLong(Object v) {
        if (v instanceof Number n) {
            return n.longValue();
        }
        return Long.parseLong(v.toString());
    }

    private String readString(Map<String, Object> event, String field, String fallback) {
        Object value = event.get(field);
        return value == null ? fallback : value.toString();
    }

    private String readStringAny(Map<String, Object> event, String fallback, String... fields) {
        for (String f : fields) {
            Object value = event.get(f);
            if (value != null && !value.toString().isBlank()) {
                return value.toString();
            }
        }
        return fallback;
    }

    private Integer readIntAny(Map<String, Object> event, String... keys) {
        for (String k : keys) {
            Object v = event.get(k);
            if (v == null) {
                continue;
            }
            if (v instanceof Number n) {
                return n.intValue();
            }
            return Integer.parseInt(v.toString());
        }
        return null;
    }

    private String emailFromEvent(Map<String, Object> event) {
        Object e = event.get("email");
        if (e == null) {
            return null;
        }
        String s = e.toString().trim();
        return s.isEmpty() ? null : s;
    }

    @KafkaListener(topics = "email.verification", groupId = "notification-email-verification-group")
    public void onEmailVerification(Map<String, Object> event) {
        log.info("📥 [Kafka] email.verification : {}", event);
        String email = emailFromEvent(event);
        if (email == null) {
            log.warn("email.verification sans destinataire");
            return;
        }
        String code = readStringAny(event, "", "code");
        String firstName = readStringAny(event, "", "firstName", "first_name");
        verificationEmailService.send(email, code, firstName);
    }

    @KafkaListener(topics = "user.statut.change", groupId = "notification-user-statut-group")
    public void onUserStatutChange(Map<String, Object> event) {
        log.info("📥 [Kafka] user.statut.change : {}", event);
        String type = readStringAny(event, "USER", "type");
        if (!"USER".equalsIgnoreCase(type)) {
            return;
        }

        Long userId = requireAuthUserId(event, "user.statut.change");
        if (userId == null) {
            return;
        }

        String action = readStringAny(event, "", "action");
        String raison = readStringAny(event, "", "raison");

        if ("BANNI".equalsIgnoreCase(action)) {
            String reason = raison != null && !raison.isBlank() ? raison.trim() : "Non précisée";
            notificationService.create(
                    userId,
                    "Compte banni",
                    "Votre compte a été banni. Raison : " + reason,
                    Notification.NotificationType.ALERT
            );
            return;
        }

        if ("REACTIVE".equalsIgnoreCase(action)) {
            notificationService.create(
                    userId,
                    "Compte réactivé",
                    "Votre compte a été réactivé. Vous pouvez vous reconnecter.",
                    Notification.NotificationType.SUCCESS
            );
        }
    }

    @KafkaListener(topics = { "user.inscrit", "citoyen.inscrit" }, groupId = "notification-citoyen-group")
    public void onCitoyenOuUserInscrit(Map<String, Object> event) {
        log.info("📥 [Kafka] user/citoyen.inscrit : {}", event);
        Long userId = requireAuthUserId(event, "user/citoyen.inscrit");
        if (userId == null) {
            return;
        }
        String firstName = readStringAny(event, "", "firstName", "first_name");
        dispatcher.notifyUser(userId,
                "Bienvenue sur EcoPria 🌿",
                "Votre compte a ete cree. Rejoignez votre premiere action ecologique !",
                Notification.NotificationType.SUCCESS,
                "Bienvenue sur EcoPria 🌿",
                "Bonjour " + firstName + ",\n\n" +
                        "Bienvenue sur EcoPria ! Votre compte est pret.\n\n" +
                        "Commencez par explorer les actions pres de chez vous et gagnez vos premiers points.\n\n" +
                        "- L'equipe EcoPria\n" +
                        "https://ecopria.ma",
                emailFromEvent(event));
    }

    @KafkaListener(topics = "inscription.confirmee", groupId = "notification-inscription-confirmee-group")
    public void onInscriptionConfirmee(Map<String, Object> event) {
        log.info("📥 [Kafka] inscription.confirmee : {}", event);
        Long userId = requireAuthUserId(event, "inscription.confirmee");
        if (userId == null) {
            return;
        }
        String dateAction = formatEventDate(readStringAny(event, "", "dateAction", "date_action"));
        String actionTitle = readStringAny(event, "", "actionTitle", "title", "action_title", "titre");
        String city = readStringAny(event, "", "city", "ville");
        String address = readStringAny(event, "", "address", "adresse");
        String firstName = readStringAny(event, "", "firstName", "first_name");
        Integer points = readIntAny(event, "pointsAction", "points_action");
        String statut = readStringAny(event, "CONFIRMEE", "statut");
        Long associationUserId = firstLongId(event, "inscription.confirmee",
                "associationUserId", "association_user_id", "associationAuthId");
        if (actionTitle.isBlank()) {
            actionTitle = "Action EcoPria";
        }

        String greeting = firstName.isBlank() ? "Bonjour," : "Bonjour " + firstName + ",";
        String locationLine = buildLocationLine(address, city);
        String pointsLine = points != null && points > 0
                ? "Points EcoPria : +" + points + " pts\n"
                : "";

        boolean enAttente = "EN_ATTENTE".equalsIgnoreCase(statut);
        String mailSubject;
        String mailBody;
        String inAppTitle;
        String inAppMessage;

        if (enAttente) {
            mailSubject = "Liste d'attente — " + actionTitle;
            inAppTitle = "Inscription en liste d'attente";
            inAppMessage = "Vous etes en liste d'attente pour : " + actionTitle + ".";
            mailBody = greeting + "\n\n" +
                    "Votre demande de participation a bien ete enregistree.\n" +
                    "L'action \"" + actionTitle + "\" est complete pour le moment : vous etes en liste d'attente.\n\n" +
                    "Recapitulatif :\n" +
                    "- Action : " + actionTitle + "\n" +
                    (dateAction.isBlank() ? "" : "- Date : " + dateAction + "\n") +
                    locationLine +
                    pointsLine + "\n" +
                    "Si une place se libere, vous recevrez un e-mail de confirmation avec votre QR code.\n\n" +
                    "Consultez vos inscriptions : https://ecopria.ma/espace/actions\n\n" +
                    "- L'equipe EcoPria\n" +
                    "https://ecopria.ma";
        } else {
            mailSubject = "Inscription confirmee — " + actionTitle;
            inAppTitle = "Inscription confirmee";
            inAppMessage = "Votre inscription pour \"" + actionTitle + "\" est confirmee. Consultez vos e-mails pour le recapitulatif.";
            mailBody = greeting + "\n\n" +
                    "Votre inscription pour l'action suivante est confirmee :\n\n" +
                    "Action : " + actionTitle + "\n" +
                    (dateAction.isBlank() ? "" : "Date : " + dateAction + "\n") +
                    locationLine +
                    pointsLine + "\n" +
                    "Votre QR code personnel sera genere et envoye avant l'evenement.\n" +
                    "Retrouvez vos inscriptions : https://ecopria.ma/espace/actions\n\n" +
                    "- L'equipe EcoPria\n" +
                    "https://ecopria.ma";
        }

        dispatcher.notifyUser(userId,
                inAppTitle,
                inAppMessage,
                enAttente ? Notification.NotificationType.INFO : Notification.NotificationType.SUCCESS,
                mailSubject,
                mailBody,
                emailFromEvent(event));

        if (associationUserId != null) {
            String participantLabel = firstName.isBlank()
                    ? "Un nouveau participant"
                    : firstName + " s'est inscrit";
            dispatcher.notifyUser(associationUserId,
                    "Nouvel inscrit",
                    participantLabel + " à votre action : " + actionTitle,
                    Notification.NotificationType.INFO,
                    null,
                    null,
                    null);
        }
    }

    private static String buildLocationLine(String address, String city) {
        if ((address == null || address.isBlank()) && (city == null || city.isBlank())) {
            return "";
        }
        String lieu = address == null || address.isBlank()
                ? city
                : (city == null || city.isBlank() ? address : address + ", " + city);
        return "Lieu : " + lieu + "\n";
    }

    private static String formatEventDate(String raw) {
        if (raw == null || raw.isBlank()) {
            return "";
        }
        try {
            LocalDateTime dt = LocalDateTime.parse(raw);
            return dt.format(DateTimeFormatter.ofPattern("EEEE d MMMM yyyy 'a' HH:mm", Locale.FRENCH));
        } catch (DateTimeParseException ignored) {
            return raw;
        }
    }

    private String formatEventDateFromEvent(Map<String, Object> event) {
        Object raw = event.get("dateStart");
        if (raw == null) {
            raw = event.get("date_start");
        }
        if (raw == null) {
            return formatEventDate(readStringAny(event, "", "dateAction", "date_action"));
        }
        if (raw instanceof List<?> list && list.size() >= 3) {
            try {
                int year = toInt(list.get(0));
                int month = toInt(list.get(1));
                int day = toInt(list.get(2));
                int hour = list.size() > 3 ? toInt(list.get(3)) : 0;
                int minute = list.size() > 4 ? toInt(list.get(4)) : 0;
                LocalDateTime dt = LocalDateTime.of(year, month, day, hour, minute);
                return dt.format(DateTimeFormatter.ofPattern("EEEE d MMMM yyyy 'a' HH:mm", Locale.FRENCH));
            } catch (Exception e) {
                return raw.toString();
            }
        }
        return formatEventDate(raw.toString());
    }

    private static int toInt(Object v) {
        if (v instanceof Number n) {
            return n.intValue();
        }
        return Integer.parseInt(v.toString());
    }

    @KafkaListener(topics = "inscription.annulee", groupId = "notification-inscription-annulee-group")
    public void onInscriptionAnnulee(Map<String, Object> event) {
        log.info("📥 [Kafka] inscription.annulee : {}", event);
        Long userId = requireAuthUserId(event, "inscription.annulee");
        if (userId == null) {
            return;
        }
        String actionTitle = readStringAny(event, "l'action", "actionTitle", "title", "action_title");
        dispatcher.notifyUser(userId,
                "Desinscription enregistree",
                "Votre desinscription a ete prise en compte pour : " + actionTitle,
                Notification.NotificationType.INFO,
                "EcoPria — desinscription",
                "Bonjour,\n\n" +
                        "Votre desinscription pour \"" + actionTitle + "\" a bien ete enregistree.\n\n" +
                        "- L'equipe EcoPria",
                emailFromEvent(event));
    }

    @KafkaListener(topics = "presence.validee", groupId = "notification-presence-group")
    public void onPresenceValidee(Map<String, Object> event) {
        log.info("📥 [Kafka] presence.validee : {}", event);
        Long userId = requireAuthUserId(event, "presence.validee");
        if (userId == null) {
            return;
        }
        String points = readStringAny(event, "0", "points");
        dispatcher.notifyUser(userId,
                "Presence validee 🎉",
                "Felicitations ! +" + points + " points ont ete credites sur votre compte.",
                Notification.NotificationType.SUCCESS,
                "+" + points + " points credites sur votre compte EcoPria",
                "Bonjour,\n\n" +
                        "Votre presence a ete validee.\n" +
                        points + " points ont ete credites sur votre compte.\n\n" +
                        "https://ecopria.ma/espace\n\n" +
                        "- L'equipe EcoPria",
                emailFromEvent(event));
    }

    @KafkaListener(topics = "fraude.detectee", groupId = "notification-fraude-group")
    public void onFraudeDetectee(Map<String, Object> event) {
        log.warn("🚨 [Kafka] fraude.detectee : {}", event);
        Long userId = requireAuthUserId(event, "fraude.detectee");
        if (userId == null) {
            return;
        }
        String raison = readString(event, "raison", "activite suspecte");
        dispatcher.notifyUser(userId,
                "Securite — tentative detectee",
                "Une activite inhabituelle a ete detectee sur votre compte. Raison : " + raison,
                Notification.NotificationType.ALERT,
                "EcoPria — alerte securite",
                "Bonjour,\n\n" +
                        "Une activite inhabituelle a ete signalee sur votre compte.\n" +
                        "Detail : " + raison + "\n\n" +
                        "Si ce n'est pas vous, contactez le support.\n\n" +
                        "- L'equipe EcoPria",
                emailFromEvent(event));
    }

    @KafkaListener(topics = "action.creee", groupId = "notification-action-creee-group")
    public void onActionCreee(Map<String, Object> event) {
        log.info("📥 [Kafka] action.creee : {}", event);
        String title = readStringAny(event, "?", "title", "titre");
        String city = readStringAny(event, "", "city", "ville");
        String category = readStringAny(event, "", "category", "categorie");
        String points = readStringAny(event, "", "points");
        String dateStart = readStringAny(event, "", "dateStart", "date_start");
        if (city.isBlank()) {
            log.warn("action.creee sans ville — impossible de cibler les citoyens");
            return;
        }
        List<CitizenContactSnapshot> contacts = utilisateurContactClient.findCitizensByCity(city);
        for (CitizenContactSnapshot c : contacts) {
            String prenom = c.getFirstName() != null ? c.getFirstName() : "";
            String inApp = "Nouvelle action pres de vous : " + title + " (" + city + ").";
            String subject = "Nouvelle action ecologique — " + city;
            String body = "Bonjour " + prenom + ",\n\n" +
                    "Une nouvelle action vient d'etre publiee a " + city + ".\n\n" +
                    title + "\n" +
                    (category.isEmpty() ? "" : "📂 " + category + "\n") +
                    (points.isEmpty() ? "" : "🏆 " + points + " points\n") +
                    (dateStart.isEmpty() ? "" : "📅 " + dateStart + "\n") +
                    "\nhttps://ecopria.ma\n" +
                    "- L'equipe EcoPria";
            dispatcher.notifyUser(c.getAuthId(),
                    "Nouvelle action 🌿",
                    inApp,
                    Notification.NotificationType.INFO,
                    subject,
                    body,
                    c.getEmail());
        }
    }

    @KafkaListener(topics = "action.annulee", groupId = "notification-action-annulee-group")
    public void onActionAnnulee(Map<String, Object> event) {
        log.info("📥 [Kafka] action.annulee : {}", event);
        Long actionId = firstLongId(event, "action.annulee", "actionId", "action_id");
        if (actionId == null) {
            return;
        }
        String title = readStringAny(event, "Action EcoPria", "title", "titre");
        String reason = readStringAny(event, "", "cancellationReason", "reason", "raison");
        String city = readStringAny(event, "", "city", "ville");
        String address = readStringAny(event, "", "address", "adresse");
        String associationName = readStringAny(event, "", "associationName", "association_name");
        String dateAction = formatEventDateFromEvent(event);

        String locationLine = buildLocationLine(address, city);
        String motifBlock = reason.isBlank()
                ? "Motif : non précisé par l'organisateur.\n"
                : "Motif de l'annulation :\n\"" + reason + "\"\n";

        int notified = 0;
        for (Map<String, Object> row : inscriptionInternalClient.listInscriptionsForAction(actionId)) {
            String statut = readString(row, "statut", "");
            if ("ANNULEE".equalsIgnoreCase(statut)) {
                continue;
            }
            if (!"CONFIRMEE".equalsIgnoreCase(statut) && !"EN_ATTENTE".equalsIgnoreCase(statut)) {
                continue;
            }
            Object uidObj = row.get("userId");
            if (uidObj == null) {
                continue;
            }
            Long uid = toLong(uidObj);
            String firstName = readStringAny(row, "", "firstName", "first_name");
            String email = readStringAny(row, "", "email", "participantEmail");
            String greeting = firstName.isBlank() ? "Bonjour," : "Bonjour " + firstName + ",";

            String inAppMessage = "L'action \"" + title + "\" a été annulée."
                    + (reason.isEmpty() ? "" : " Motif : " + reason);
            String mailBody = greeting + "\n\n" +
                    "Nous sommes désolés de vous informer que l'action suivante a été annulée par l'organisateur.\n\n" +
                    "Action : " + title + "\n" +
                    (associationName.isBlank() ? "" : "Organisateur : " + associationName + "\n") +
                    (dateAction.isBlank() ? "" : "Date prévue : " + dateAction + "\n") +
                    locationLine + "\n" +
                    motifBlock + "\n" +
                    "Votre inscription est automatiquement annulée. Aucun point ne sera crédité.\n" +
                    "Découvrez d'autres actions près de chez vous : https://ecopria.ma/actions\n\n" +
                    "- L'équipe EcoPria\n" +
                    "https://ecopria.ma";

            dispatcher.notifyUser(uid,
                    "Action annulée",
                    inAppMessage,
                    Notification.NotificationType.ALERT,
                    "Action annulée — " + title,
                    mailBody,
                    email.isBlank() ? null : email);
            notified++;
        }
        log.info("[action.annulee] actionId={} — {} participant(s) notifié(s)", actionId, notified);
    }

    @KafkaListener(topics = "action.places.mises.a.jour", groupId = "notification-action-places-group")
    public void onActionPlacesMisesAJour(Map<String, Object> event) {
        log.info("📥 [Kafka] action.places.mises.a.jour : {}", event);
        Integer available = readIntAny(event, "availablePlaces", "available_places");
        Long actionId = firstLongId(event, "action.places", "actionId", "action_id");
        if (actionId == null || available == null) {
            return;
        }
        if (available != 0) {
            return;
        }
        for (Map<String, Object> row : inscriptionInternalClient.listInscriptionsForAction(actionId)) {
            if (!"EN_ATTENTE".equalsIgnoreCase(readString(row, "statut", ""))) {
                continue;
            }
            Object uid = row.get("userId");
            if (uid == null) {
                continue;
            }
            long userId = toLong(uid);
            dispatcher.notifyUser(userId,
                    "Liste d'attente 📋",
                    "L'action est complete. Vous etes en liste d'attente ; nous vous previendrons si une place se libere.",
                    Notification.NotificationType.INFO,
                    "EcoPria — liste d'attente",
                    "Bonjour,\n\n" +
                            "L'action (id " + actionId + ") est complete. Vous figurez sur la liste d'attente.\n" +
                            "Vous serez notifie si une place se libere.\n\n" +
                            "- L'equipe EcoPria",
                    null);
        }
    }

    @KafkaListener(topics = "points.credites", groupId = "notification-points-group")
    public void onPointsCredites(Map<String, Object> event) {
        log.info("📥 [Kafka] points.credites : {}", event);
        Long userId = requireAuthUserId(event, "points.credites");
        if (userId == null) {
            return;
        }
        String total = readStringAny(event, "0", "totalPoints", "total_points");
        dispatcher.notifyUser(userId,
                "Solde mis a jour 💰",
                "Votre solde total est maintenant de " + total + " points.",
                Notification.NotificationType.INFO,
                "EcoPria — points credites",
                "Bonjour,\n\n" +
                        "Votre solde est maintenant de " + total + " points.\n\n" +
                        "https://ecopria.ma/espace\n" +
                        "- L'equipe EcoPria",
                emailFromEvent(event));
    }

    @KafkaListener(topics = "badge.debloque", groupId = "notification-badge-group")
    public void onBadgeDebloque(Map<String, Object> event) {
        log.info("📥 [Kafka] badge.debloque : {}", event);
        Long userId = requireAuthUserId(event, "badge.debloque");
        if (userId == null) {
            return;
        }
        String badge = readStringAny(event, "badge", "badge_name", "badgeName");
        String description = readString(event, "description", "");
        dispatcher.notifyUser(userId,
                "Nouveau badge debloque 🏆",
                "Felicitations ! Vous avez debloque : " + badge,
                Notification.NotificationType.SUCCESS,
                "Nouveau badge : " + badge,
                "Bonjour,\n\n" +
                        "Badge debloque : " + badge + "\n" +
                        description + "\n\n" +
                        "https://ecopria.ma/espace\n" +
                        "- L'equipe EcoPria",
                emailFromEvent(event));
    }

    @KafkaListener(topics = "recompense.echangee", groupId = "notification-recompense-echangee-group")
    public void onRecompenseEchangee(Map<String, Object> event) {
        log.info("📥 [Kafka] recompense.echangee : {}", event);
        Long userId = requireAuthUserId(event, "recompense.echangee");
        if (userId == null) {
            return;
        }
        String coupon = readStringAny(event, "", "codeCoupon", "code");
        String pointsUsed = readStringAny(event, "?", "pointsUtilises", "pointsUsed", "points_used");
        String recompenseTitle = readStringAny(event, "", "recompenseTitle", "title");
        String partenaireName = readStringAny(event, "", "partenaireName", "partenaire");
        boolean mystere = recompenseTitle != null && recompenseTitle.startsWith("[MYSTÈRE]");
        String notifTitle = mystere ? "Boite mystere ouverte 🎲" : "Recompense obtenue 🎁";
        String notifBody = mystere
                ? "Vous avez gagne : " + recompenseTitle + ". Code : " + coupon
                : "Votre coupon : " + coupon + ". " + (partenaireName.isEmpty() ? "Utilisez-le en magasin." : "Chez " + partenaireName + ".");
        String subject = mystere ? "Votre boite mystere EcoPria" : "Votre coupon EcoPria : " + coupon;
        String body = mystere
                ? buildEmailMystere(recompenseTitle, coupon, partenaireName, pointsUsed)
                : buildEmailEchangeNormal(recompenseTitle, partenaireName, coupon, pointsUsed);
        dispatcher.notifyUser(userId, notifTitle, notifBody, Notification.NotificationType.SUCCESS, subject, body,
                emailFromEvent(event));
    }

    private String buildEmailEchangeNormal(String titre, String partenaire, String coupon, String pointsUsed) {
        return "Bonjour,\n\n" +
                "Vous avez echange " + pointsUsed + " points contre une recompense.\n\n" +
                (titre.isEmpty() ? "" : "🏷️ Recompense : " + titre + "\n") +
                (partenaire.isEmpty() ? "" : "🏪 Partenaire : " + partenaire + "\n") +
                "🎟️ Code : " + coupon + "\n\n" +
                "https://ecopria.ma/espace/recompenses\n" +
                "- L'equipe EcoPria";
    }

    private String buildEmailMystere(String titre, String coupon, String partenaire, String pointsUsed) {
        return "Bonjour,\n\n" +
                "Votre boite mystere vient d'etre ouverte.\n\n" +
                "🎁 " + titre + "\n" +
                (partenaire.isEmpty() ? "" : "🏪 " + partenaire + "\n") +
                "🎟️ Code : " + coupon + "\n" +
                "💰 Points utilises : " + pointsUsed + "\n\n" +
                "https://ecopria.ma/espace/recompenses\n" +
                "- L'equipe EcoPria";
    }

    @KafkaListener(topics = "partenaire.validee", groupId = "notification-partenaire-group")
    public void onPartenaireValidee(Map<String, Object> event) {
        log.info("📥 [Kafka] partenaire.validee : {}", event);
        Long userId = requireAuthUserId(event, "partenaire.validee");
        if (userId == null) {
            return;
        }
        String nom = readStringAny(event, "Partenaire", "nom", "name");
        String categorie = readStringAny(event, "", "categorie", "category");
        dispatcher.notifyUser(userId,
                "Bienvenue partenaire EcoPria 🎉",
                "Votre compte " + nom + " est valide. Vous pouvez publier vos offres.",
                Notification.NotificationType.SUCCESS,
                "Bienvenue sur EcoPria, " + nom,
                "Bonjour,\n\n" +
                        "Votre compte partenaire a ete valide.\n\n" +
                        "🏪 " + nom + "\n" +
                        (categorie.isEmpty() ? "" : "📂 " + categorie + "\n") +
                        "https://ecopria.ma\n" +
                        "- L'equipe EcoPria",
                emailFromEvent(event));
    }

    @KafkaListener(topics = "asso.validee", groupId = "notification-asso-group")
    public void onAssoValidee(Map<String, Object> event) {
        log.info("📥 [Kafka] asso.validee : {}", event);
        Long userId = requireAuthUserId(event, "asso.validee");
        if (userId == null) {
            return;
        }
        String nom = readStringAny(event, "Association", "nom", "name");
        String city = readStringAny(event, "", "city", "ville");
        dispatcher.notifyUser(userId,
                "Association validee 🌱",
                "Votre structure " + nom + " est reconnue sur EcoPria. Vous pouvez proposer des actions.",
                Notification.NotificationType.SUCCESS,
                "EcoPria — association validee",
                "Bonjour,\n\n" +
                        "Votre association \"" + nom + "\" a ete validee.\n" +
                        (city.isEmpty() ? "" : "📍 " + city + "\n") +
                        "\nhttps://ecopria.ma\n" +
                        "- L'equipe EcoPria",
                emailFromEvent(event));
    }

    @KafkaListener(topics = "action.fixe.creee", groupId = "notification-action-fixe-creee-group")
    public void onActionFixeCreee(Map<String, Object> event) {
        log.info("📥 [Kafka] action.fixe.creee : {}", event);
        String titre = readStringAny(event, "Action", "titre", "title");
        String city = readStringAny(event, "", "lieu", "city", "ville");
        String points = readStringAny(event, "", "points");
        if (city.isBlank()) {
            return;
        }
        List<CitizenContactSnapshot> contacts = utilisateurContactClient.findCitizensByCity(city);
        for (CitizenContactSnapshot c : contacts) {
            String prenom = c.getFirstName() != null ? c.getFirstName() : "";
            dispatcher.notifyUser(c.getAuthId(),
                    "Nouvelle action permanente 🌿",
                    "Action admin : " + titre + " a " + city,
                    Notification.NotificationType.INFO,
                    "EcoPria — nouvelle action a " + city,
                    "Bonjour " + prenom + ",\n\n" +
                            "Une action permanente a ete publiee : " + titre + ".\n" +
                            (points.isEmpty() ? "" : "🏆 " + points + " points\n") +
                            "\nhttps://ecopria.ma\n" +
                            "- L'equipe EcoPria",
                    c.getEmail());
        }
    }

    @KafkaListener(topics = "action.fixe.modifiee", groupId = "notification-action-fixe-modifiee-group")
    public void onActionFixeModifiee(Map<String, Object> event) {
        log.info("📥 [Kafka] action.fixe.modifiee : {}", event);
        String titre = readStringAny(event, "Action", "titre", "title");
        String city = readStringAny(event, "", "lieu", "city", "ville");
        if (city.isBlank()) {
            return;
        }
        List<CitizenContactSnapshot> contacts = utilisateurContactClient.findCitizensByCity(city);
        for (CitizenContactSnapshot c : contacts) {
            String prenom = c.getFirstName() != null ? c.getFirstName() : "";
            dispatcher.notifyUser(c.getAuthId(),
                    "Action mise a jour",
                    "L'action \"" + titre + "\" a ete modifiee (" + city + ").",
                    Notification.NotificationType.INFO,
                    "EcoPria — action mise a jour",
                    "Bonjour " + prenom + ",\n\n" +
                            "Une action permanente a ete mise a jour : " + titre + ".\n\n" +
                            "https://ecopria.ma\n" +
                            "- L'equipe EcoPria",
                    c.getEmail());
        }
    }

    @KafkaListener(topics = "coupon.utilise", groupId = "notification-coupon-group")
    public void onCouponUtilise(Map<String, Object> event) {
        log.info("📥 [Kafka] coupon.utilise : {}", event);
        Long userId = requireAuthUserId(event, "coupon.utilise");
        if (userId == null) {
            return;
        }
        String code = readStringAny(event, "", "codeCoupon", "code");
        String titre = readStringAny(event, "", "recompenseTitle", "title");
        String partenaire = readStringAny(event, "", "partenaireName", "partenaire");
        String valideLe = readStringAny(event, "", "valideLe", "valide_le");
        dispatcher.notifyUser(userId,
                "Coupon utilise ✅",
                "Votre code " + code + " a ete valide en magasin.",
                Notification.NotificationType.SUCCESS,
                "Votre coupon EcoPria a ete utilise",
                "Bonjour,\n\n" +
                        "🎟️ Code : " + code + "\n" +
                        (titre.isEmpty() ? "" : "🏷️ " + titre + "\n") +
                        (partenaire.isEmpty() ? "" : "🏪 " + partenaire + "\n") +
                        (valideLe.isEmpty() ? "" : "📅 " + valideLe + "\n") +
                        "\n- L'equipe EcoPria",
                emailFromEvent(event));
    }

    @KafkaListener(topics = "recompense.epuisee", groupId = "notification-recompense-epuisee-group")
    public void onRecompenseEpuisee(Map<String, Object> event) {
        log.info("📥 [Kafka] recompense.epuisee : {}", event);
        Long partenaireUserId = firstLongId(event, "recompense.epuisee",
                "partenaireUserId", "userId", "auth_id");
        if (partenaireUserId == null) {
            return;
        }
        String titre = readStringAny(event, "Offre", "recompenseTitle", "title");
        String partenaire = readStringAny(event, "", "partenaireName", "partenaire");
        dispatcher.notifyUser(partenaireUserId,
                "Offre epuisee ⚠️",
                "L'offre \"" + titre + "\" n'a plus de stock sur EcoPria.",
                Notification.NotificationType.ALERT,
                "EcoPria — stock epuise",
                "Bonjour,\n\n" +
                        "Votre offre \"" + titre + "\" est epuisee.\n" +
                        (partenaire.isEmpty() ? "" : partenaire + "\n") +
                        "\n- L'equipe EcoPria",
                emailFromEvent(event));
    }
}
