package com.ecopria.presence.kafka;



import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class PresenceProducer {

    private static final String TOPIC_PRESENCE_VALIDEE = "presence.validee";
    private static final String TOPIC_FRAUDE_DETECTEE  = "fraude.detectee";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public PresenceProducer(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void envoyerPresenceValidee(PresenceValideeEvent event) {
        kafkaTemplate.send(TOPIC_PRESENCE_VALIDEE,
                String.valueOf(event.getUserId()), event);
        System.out.println("Kafka [presence.validee] publié pour userId=" + event.getUserId());
    }

    public void envoyerFraudeDetectee(FraudeDetecteeEvent event) {
        kafkaTemplate.send(TOPIC_FRAUDE_DETECTEE,
                String.valueOf(event.getUserId()), event);
        System.out.println("Kafka [fraude.detectee] publié pour userId=" + event.getUserId());
    }
}
