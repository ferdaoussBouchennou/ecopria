package com.ecopria.action.service;

import com.ecopria.action.model.Association;
import com.ecopria.action.repository.AssociationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;

import com.ecopria.action.dto.AssociationOptionDTO;
import com.ecopria.action.dto.AssociationPublicDTO;
import com.ecopria.action.dto.AssociationDetailDTO;
import com.ecopria.action.dto.AdminAssociationManageRequest;

@Service
@RequiredArgsConstructor
@Slf4j
public class AssociationService {

    private final AssociationRepository associationRepository;

    @Transactional(readOnly = true)
    public List<AssociationOptionDTO> listForAdmin() {
        return associationRepository.findAll().stream()
                .sorted(Comparator.comparing(Association::getName, String.CASE_INSENSITIVE_ORDER))
                .map(a -> AssociationOptionDTO.builder()
                        .id(a.getId())
                        .userId(a.getUserId())
                        .name(a.getName())
                        .city(a.getCity())
                        .validated(a.getIsValidated())
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AssociationDetailDTO> listDetailsForAdmin() {
        return associationRepository.findAll().stream()
                .sorted(Comparator.comparing(Association::getName, String.CASE_INSENSITIVE_ORDER))
                .map(this::toDetailDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public AssociationDetailDTO getDetailForAdmin(Long id) {
        Association association = associationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Association introuvable: " + id));
        return toDetailDTO(association);
    }

    @Transactional
    public AssociationDetailDTO adminCreate(AdminAssociationManageRequest request) {
        return associationRepository.findByUserId(request.getUserId())
                .map(existing -> adminUpdate(existing.getId(), request))
                .orElseGet(() -> {
                    boolean validated = request.getValidated() == null || request.getValidated();
                    Association association = Association.builder()
                            .userId(request.getUserId())
                            .name(request.getName().trim())
                            .description(trimOrNull(request.getDescription()))
                            .logoUrl(trimOrNull(request.getLogoUrl()))
                            .city(trimOrNull(request.getCity()))
                            .isValidated(validated)
                            .build();
                    return toDetailDTO(associationRepository.save(association));
                });
    }

    @Transactional
    public AssociationDetailDTO adminUpdate(Long id, AdminAssociationManageRequest request) {
        Association association = associationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Association introuvable: " + id));

        if (request.getName() != null && !request.getName().isBlank()) {
            association.setName(request.getName().trim());
        }
        association.setDescription(trimOrNull(request.getDescription()));
        association.setLogoUrl(trimOrNull(request.getLogoUrl()));
        association.setCity(trimOrNull(request.getCity()));
        if (request.getValidated() != null) {
            association.setIsValidated(request.getValidated());
        }
        if (request.getUserId() != null && !request.getUserId().equals(association.getUserId())) {
            if (associationRepository.existsByUserId(request.getUserId())) {
                throw new RuntimeException("userId déjà utilisé: " + request.getUserId());
            }
            association.setUserId(request.getUserId());
        }

        return toDetailDTO(associationRepository.save(association));
    }

    @Transactional
    public AssociationDetailDTO adminUpdateLogoUrl(Long id, String logoUrl) {
        Association association = associationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Association introuvable: " + id));
        association.setLogoUrl(trimOrNull(logoUrl));
        return toDetailDTO(associationRepository.save(association));
    }

    @Transactional(readOnly = true)
    public List<AssociationPublicDTO> listPublic() {
        return associationRepository.findAll().stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsValidated()))
                .sorted(Comparator.comparing(Association::getName, String.CASE_INSENSITIVE_ORDER))
                .map(this::toPublicDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public AssociationPublicDTO getPublicByUserId(Long userId) {
        Association association = associationRepository.findByUserId(userId)
                .filter(a -> Boolean.TRUE.equals(a.getIsValidated()))
                .orElseThrow(() -> new RuntimeException("Association non trouvée"));
        return toPublicDTO(association);
    }

    private AssociationPublicDTO toPublicDTO(Association association) {
        return AssociationPublicDTO.builder()
                .id(association.getId())
                .userId(association.getUserId())
                .name(association.getName())
                .description(association.getDescription())
                .logoUrl(association.getLogoUrl())
                .city(association.getCity())
                .build();
    }

    private AssociationDetailDTO toDetailDTO(Association association) {
        return AssociationDetailDTO.builder()
                .id(association.getId())
                .userId(association.getUserId())
                .name(association.getName())
                .description(association.getDescription())
                .logoUrl(association.getLogoUrl())
                .city(association.getCity())
                .validated(association.getIsValidated())
                .createdAt(association.getCreatedAt())
                .updatedAt(association.getUpdatedAt())
                .build();
    }

    private static String trimOrNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    // appelé par le consumer Kafka quand asso.validee
    @Transactional
    public void createValidatedFromKafkaEvent(Map<String, Object> event) {
        Long userId = Long.valueOf(event.get("userId").toString());

        if (associationRepository.existsByUserId(userId)) {
            log.warn("Association déjà existante pour userId: {}", userId);
            return;
        }

        String eventCity = event.get("city") != null ? event.get("city").toString() :
                (event.get("ville") != null ? event.get("ville").toString() : null);

        Association association = Association.builder()
                .userId(userId)
                .name(event.get("nom") != null ? event.get("nom").toString() : "")
                .description(event.get("description") != null ? event.get("description").toString() : null)
                .logoUrl(event.get("logoUrl") != null ? event.get("logoUrl").toString() : null)
                .city(eventCity)
                .isValidated(true)
                .build();

        associationRepository.save(association);
        log.info("Association validée créée pour userId: {}", userId);
    }

    @Transactional
    public Association getOrCreateAssociation(Long userId) {
        return associationRepository.findByUserId(userId)
                .orElseGet(() -> {
                    Association assoc = Association.builder()
                            .userId(userId)
                            .name("Association")
                            .build();
                    log.info("Association par défaut créée pour userId: {}", userId);
                    return associationRepository.save(assoc);
                });
    }
}