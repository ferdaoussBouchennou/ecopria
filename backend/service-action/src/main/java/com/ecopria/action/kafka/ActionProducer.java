package com.ecopria.action.kafka;

import com.ecopria.action.kafka.event.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ActionProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${kafka.topics.action-created:action.creee}")
    private String actionCreatedTopic;

    @Value("${kafka.topics.action-cancelled:action.annulee}")
    private String actionCancelledTopic;

    @Value("${kafka.topics.action-places-updated:action.places.mises.a.jour}")
    private String actionPlacesUpdatedTopic;

    public void publishActionCreated(ActionCreatedEvent event) {
        log.info("Publication action.creee pour actionId: {}", event.getActionId());
        kafkaTemplate.send(actionCreatedTopic, String.valueOf(event.getActionId()), event);
    }

    public void publishActionCancelled(ActionCancelledEvent event) {
        log.info("Publication action.annulee pour actionId: {}", event.getActionId());
        kafkaTemplate.send(actionCancelledTopic, String.valueOf(event.getActionId()), event);
    }

    public void publishActionPlacesUpdated(ActionPlacesUpdatedEvent event) {
        log.info("Publication action.places.mises.a.jour pour actionId: {}", event.getActionId());
        kafkaTemplate.send(actionPlacesUpdatedTopic, String.valueOf(event.getActionId()), event);
    }
}