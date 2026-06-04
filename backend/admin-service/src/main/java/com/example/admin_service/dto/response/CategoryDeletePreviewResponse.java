package com.example.admin_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryDeletePreviewResponse {
    private Long id;
    private String nom;
    private long actionCount;
    private List<LinkedActionSummary> linkedActions;
}
