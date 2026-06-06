package com.example.admin_service.service;

import com.example.admin_service.dto.response.*;
import com.example.admin_service.model.LogAdmin;
import com.example.admin_service.repository.LogAdminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminRecompenseService {

    private final RestTemplate restTemplate;
    private final LogAdminRepository logAdminRepository;

    @Value("${services.recompense-url}")
    private String recompenseServiceUrl;

    private static final String BASE = "/internal/admin";

    public List<AdminRecompenseOffreResponse> listOffres() {
        List<Map<String, Object>> raw = restTemplate.exchange(
                recompenseServiceUrl + BASE + "/offres",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<Map<String, Object>>>() {}
        ).getBody();
        return raw == null ? List.of() : raw.stream().map(this::toOffreResponse).collect(Collectors.toList());
    }

    public void activateOffre(Long id, Long adminId) {
        restTemplate.put(recompenseServiceUrl + BASE + "/offres/" + id + "/activate", null);
        saveLog(adminId, "RECOMPENSE_OFFRE_ACTIVER", id, "OFFRE");
    }

    public void suspendOffre(Long id, Long adminId) {
        restTemplate.put(recompenseServiceUrl + BASE + "/offres/" + id + "/suspend", null);
        saveLog(adminId, "RECOMPENSE_OFFRE_SUSPENDRE", id, "OFFRE");
    }

    public List<AdminRecompenseCommissionResponse> listCommissions() {
        List<Map<String, Object>> raw = restTemplate.exchange(
                recompenseServiceUrl + BASE + "/commissions",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<Map<String, Object>>>() {}
        ).getBody();
        return raw == null ? List.of() : raw.stream().map(this::toCommissionResponse).collect(Collectors.toList());
    }

    public AdminRecompenseCommissionSummaryResponse commissionSummary() {
        Map<String, Object> raw = restTemplate.getForObject(
                recompenseServiceUrl + BASE + "/commissions/summary",
                Map.class
        );
        if (raw == null) {
            return AdminRecompenseCommissionSummaryResponse.builder()
                    .totalCommission(0.0)
                    .currentMonthCommission(0.0)
                    .totalCoupons(0L)
                    .monthlyHistory(List.of())
                    .build();
        }
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> monthly = (List<Map<String, Object>>) raw.get("monthlyHistory");
        return AdminRecompenseCommissionSummaryResponse.builder()
                .totalCommission(asDouble(raw.get("totalCommission")))
                .currentMonthCommission(asDouble(raw.get("currentMonthCommission")))
                .totalCoupons(asLong(raw.get("totalCoupons")))
                .monthlyHistory(monthly == null ? List.of() :
                        monthly.stream().map(this::toCommissionMoisResponse).collect(Collectors.toList()))
                .build();
    }

    public List<AdminRecompenseAvisResponse> listAvis() {
        List<Map<String, Object>> raw = restTemplate.exchange(
                recompenseServiceUrl + BASE + "/avis",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<Map<String, Object>>>() {}
        ).getBody();
        return raw == null ? List.of() : raw.stream().map(this::toAvisResponse).collect(Collectors.toList());
    }

    public void hideAvis(Long id, Long adminId) {
        restTemplate.put(recompenseServiceUrl + BASE + "/avis/" + id + "/hide", null);
        saveLog(adminId, "RECOMPENSE_AVIS_MASQUER", id, "AVIS");
    }

    public void showAvis(Long id, Long adminId) {
        restTemplate.put(recompenseServiceUrl + BASE + "/avis/" + id + "/show", null);
        saveLog(adminId, "RECOMPENSE_AVIS_AFFICHER", id, "AVIS");
    }

    public void deleteAvis(Long id, Long adminId) {
        restTemplate.delete(recompenseServiceUrl + BASE + "/avis/" + id);
        saveLog(adminId, "RECOMPENSE_AVIS_SUPPRIMER", id, "AVIS");
    }

    private AdminRecompenseOffreResponse toOffreResponse(Map<String, Object> row) {
        return AdminRecompenseOffreResponse.builder()
                .id(asLong(row.get("id")))
                .partenaireId(asLong(row.get("partenaireId")))
                .partenaireName(asString(row.get("partenaireName")))
                .partenaireCategory(asString(row.get("partenaireCategory")))
                .title(asString(row.get("title")))
                .description(asString(row.get("description")))
                .imageUrl(asString(row.get("imageUrl")))
                .pointsNecessaires(asInt(row.get("pointsNecessaires")))
                .type(asString(row.get("type")))
                .stock(asInt(row.get("stock")))
                .discountPercentage(asInt(row.get("discountPercentage")))
                .valeurDh(asDouble(row.get("valeurDh")))
                .dateExpiration(asDateTime(row.get("dateExpiration")))
                .isActive(asBoolean(row.get("isActive")))
                .isAvailable(asBoolean(row.get("isAvailable")))
                .couponsDistribues(asLong(row.get("couponsDistribues")))
                .couponsUtilises(asLong(row.get("couponsUtilises")))
                .createdAt(asDateTime(row.get("createdAt")))
                .build();
    }

    private AdminRecompenseCommissionResponse toCommissionResponse(Map<String, Object> row) {
        return AdminRecompenseCommissionResponse.builder()
                .id(asLong(row.get("id")))
                .partenaireId(asLong(row.get("partenaireId")))
                .partenaireName(asString(row.get("partenaireName")))
                .couponCode(asString(row.get("couponCode")))
                .offreTitle(asString(row.get("offreTitle")))
                .valeurDh(asDouble(row.get("valeurDh")))
                .montantCommission(asDouble(row.get("montantCommission")))
                .tauxCommission(asDouble(row.get("tauxCommission")))
                .moisFacturation(asString(row.get("moisFacturation")))
                .createdAt(asDateTime(row.get("createdAt")))
                .build();
    }

    private AdminRecompenseCommissionMoisResponse toCommissionMoisResponse(Map<String, Object> row) {
        return AdminRecompenseCommissionMoisResponse.builder()
                .mois(asString(row.get("mois")))
                .couponsUtilises(asLong(row.get("couponsUtilises")))
                .caGenere(asDouble(row.get("caGenere")))
                .commission(asDouble(row.get("commission")))
                .build();
    }

    private AdminRecompenseAvisResponse toAvisResponse(Map<String, Object> row) {
        return AdminRecompenseAvisResponse.builder()
                .id(asLong(row.get("id")))
                .partenaireId(asLong(row.get("partenaireId")))
                .partenaireName(asString(row.get("partenaireName")))
                .authorName(asString(row.get("authorName")))
                .rating(asInt(row.get("rating")))
                .comment(asString(row.get("comment")))
                .reponse(asString(row.get("reponse")))
                .visible(asBoolean(row.get("visible")))
                .createdAt(asDateTime(row.get("createdAt")))
                .build();
    }

    private void saveLog(Long adminId, String action, Long cibleId, String cibleType) {
        logAdminRepository.save(LogAdmin.builder()
                .adminId(adminId)
                .action(action)
                .cibleId(cibleId)
                .cibleType(cibleType)
                .createdAt(LocalDateTime.now())
                .build());
    }

    private static Long asLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        return null;
    }

    private static Integer asInt(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        return null;
    }

    private static Double asDouble(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        return null;
    }

    private static Boolean asBoolean(Object value) {
        if (value instanceof Boolean bool) {
            return bool;
        }
        return null;
    }

    private static String asString(Object value) {
        return value == null ? null : value.toString();
    }

    private static LocalDateTime asDateTime(Object value) {
        if (value instanceof String str && !str.isBlank()) {
            return LocalDateTime.parse(str);
        }
        return null;
    }
}
