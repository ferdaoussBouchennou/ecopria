package com.ecopria.utilisateur.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "notification_preferences")
public class NotificationPreference {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "profile_id", nullable = false, unique = true)
    private Profile profile;

    @Column(name = "nearby_actions")
    private Boolean nearbyActions = true;     // "Nouvelles actions près de chez moi"

    @Column(name = "reminders")
    private Boolean reminders = true;            // "Rappels avant une action"

    @Column(name = "catalog_news")
    private Boolean catalogNews = false; // "Nouveautés du catalogue"

    @Column(name = "newsletter")
    private Boolean newsletter = true;         // "Newsletter mensuelle"
}
