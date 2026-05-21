package com.example.admin_service.service;

import com.example.admin_service.dto.response.LogAdminResponse;
import com.example.admin_service.model.LogAdmin;
import com.example.admin_service.repository.LogAdminRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminLogService {

    private final LogAdminRepository logAdminRepository;

    public List<LogAdminResponse> getLogs(LocalDate fromDate,
                                          LocalDate toDate,
                                          String action,
                                          String cibleType) {
        Specification<LogAdmin> specification = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(
                        root.get("createdAt"),
                        fromDate.atStartOfDay()
                ));
            }
            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(
                        root.get("createdAt"),
                        toDate.atTime(23, 59, 59)
                ));
            }
            if (action != null && !action.isBlank()) {
                predicates.add(cb.equal(root.get("action"), action));
            }
            if (cibleType != null && !cibleType.isBlank()) {
                predicates.add(cb.equal(root.get("cibleType"), cibleType));
            }

            query.orderBy(cb.desc(root.get("createdAt")));
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return logAdminRepository.findAll(specification)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<LogAdminResponse> getRecentLogs(int limit) {
        return logAdminRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .limit(limit)
                .map(this::toResponse)
                .toList();
    }

    private LogAdminResponse toResponse(LogAdmin log) {
        return LogAdminResponse.builder()
                .id(log.getId())
                .adminId(log.getAdminId())
                .action(log.getAction())
                .cibleId(log.getCibleId())
                .cibleType(log.getCibleType())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
