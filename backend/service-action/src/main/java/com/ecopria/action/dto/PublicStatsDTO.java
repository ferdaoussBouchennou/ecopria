package com.ecopria.action.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicStatsDTO {
    /** Actions terminées (statut COMPLETED). */
    private long actionsRealisees;
    /** Somme des inscriptions sur actions publiées ou terminées. */
    private long participantsInscrits;
    /** Actions publiées dont la date de fin n'est pas passée. */
    private long actionsEnCours;
}
