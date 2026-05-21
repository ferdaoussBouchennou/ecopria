package com.ecopria.utilisateur.dto;

import lombok.Data;

@Data
public class UpdatePreferencesDTO {
    private Boolean nearbyActions;
    private Boolean reminders;
    private Boolean catalogNews;
    private Boolean newsletter;
}
