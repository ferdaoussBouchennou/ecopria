package com.ecopria.recompense.kafka;

import com.ecopria.recompense.kafka.event.RecompenseEchangeeEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class RecompenseProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${kafka.topics.recompense-echangee:recompense.echangee}")
    private String recompenseEchangeeTopic;

    public void publishRecompenseEchangee(RecompenseEchangeeEvent event) {
        log.info("Publication recompense.echangee pour userId: {}", event.getUserId());
        kafkaTemplate.send(recompenseEchangeeTopic,
                String.valueOf(event.getUserId()), event);
    }
}