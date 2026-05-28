package com.ecopria.presence.kafka;



import com.ecopria.presence.model.QrCodeAction;
import com.ecopria.presence.repository.QrCodeActionRepository;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.time.LocalDateTime;
import java.util.Base64;

@Service
public class InscriptionConfirmeeConsumer {

    private static final String SECRET_KEY = "ecopria-secret-hmac-2026";

    private final QrCodeActionRepository qrCodeActionRepository;

    public InscriptionConfirmeeConsumer(QrCodeActionRepository qrCodeActionRepository) {
        this.qrCodeActionRepository = qrCodeActionRepository;
    }

    @KafkaListener(topics = "inscription.confirmee", groupId = "service-presence")
    public void onInscriptionConfirmee(InscriptionConfirmeeEvent event) {
        System.out.println("Kafka reçu [inscription.confirmee] actionId=" + event.getActionId());

        // Si le QR Code de cette action existe déjà → pas besoin d'en créer un nouveau
        if (qrCodeActionRepository.existsByActionId(event.getActionId())) {
            System.out.println("QR Code déjà existant pour actionId=" + event.getActionId());
            return;
        }

        // Générer UN seul QR Code par action
        String qrCode = genererQrCode(event.getActionId());

        QrCodeAction qrCodeAction = new QrCodeAction();
        qrCodeAction.setActionId(event.getActionId());
        qrCodeAction.setQrCode(qrCode);
        qrCodeAction.setPoints(100); // sera récupéré via ActionClient
        // Générer un code PIN à 6 chiffres pour la validation manuelle
        String pinCode = String.format("%06d", (int)(Math.random() * 1000000));
        qrCodeAction.setPinCode(pinCode);
        qrCodeAction.setDateCreation(LocalDateTime.now());
        qrCodeActionRepository.save(qrCodeAction);

        System.out.println("QR Code généré pour actionId=" + event.getActionId()
                + " → " + qrCode);
    }

    public static String genererQrCode(Long actionId) {
        try {
            String payload = "ACTION-" + actionId + "-" + System.currentTimeMillis();
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(
                    SECRET_KEY.getBytes(), "HmacSHA256");
            mac.init(keySpec);
            String signature = Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(mac.doFinal(payload.getBytes()));
            return payload + "." + signature;
        } catch (Exception e) {
            throw new RuntimeException("Erreur génération QR Code", e);
        }
    }
}
