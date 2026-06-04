package com.example.auth_service.service;

import com.example.auth_service.dto.OrganizationAccountResponse;
import com.example.auth_service.dto.OrganizationAccountsPageResponse;
import com.example.auth_service.dto.PendingAccountResponse;
import com.example.auth_service.dto.UserInternalResponse;
import com.example.auth_service.dto.UserStatsResponse;
import com.example.auth_service.entity.RegistrationProfile;
import com.example.auth_service.entity.User;
import com.example.auth_service.repository.RegistrationProfileRepository;
import com.example.auth_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InternalUserService {

    private final UserRepository userRepository;
    private final RegistrationProfileRepository profileRepository;

    public List<UserInternalResponse> getAll() {
        return userRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public UserInternalResponse getById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + id));
        return toResponse(user);
    }

    public void deactivate(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + id));
        user.setIsActive(false);
        userRepository.save(user);
    }

    public void activate(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + id));
        user.setIsActive(true);
        userRepository.save(user);
    }

    public UserStatsResponse getStats() {
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByIsActiveTrueAndIsVerifiedTrue();
        long newUsersThisWeek = userRepository.countByCreatedAtAfter(LocalDateTime.now().minusDays(7));
        long pendingAssociations = userRepository.countByRoleAndIsVerifiedTrueAndIsActiveFalse(User.Role.ASSOCIATION);
        long pendingPartenaires = userRepository.countByRoleAndIsVerifiedTrueAndIsActiveFalse(User.Role.PARTNER);
        return UserStatsResponse.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .newUsersThisWeek(newUsersThisWeek)
                .pendingAssociations(pendingAssociations)
                .pendingPartenaires(pendingPartenaires)
                .pendingValidations(pendingAssociations + pendingPartenaires)
                .build();
    }

    public List<PendingAccountResponse> getPendingAccounts() {
        return userRepository
                .findByRoleInAndIsVerifiedTrueAndIsActiveFalse(
                        List.of(User.Role.ASSOCIATION, User.Role.PARTNER))
                .stream()
                .map(this::toPendingAccount)
                .toList();
    }

    public OrganizationAccountsPageResponse getOrganizationAccounts(String filter, List<Long> rejectedUserIds) {
        List<User.Role> orgRoles = List.of(User.Role.ASSOCIATION, User.Role.PARTNER);
        List<OrganizationAccountResponse> items;
        long pendingCount;
        long approvedCount;
        long rejectedCount;

        switch (filter == null ? "pending" : filter.toLowerCase()) {
            case "approved", "valide", "validé", "validee" -> {
                List<User> users = userRepository.findByRoleInAndIsVerifiedTrueAndIsActiveTrue(orgRoles);
                items = users.stream().map(u -> toAccount(u, "Validé")).toList();
                pendingCount = userRepository.findByRoleInAndIsVerifiedTrueAndIsActiveFalse(orgRoles).size();
                approvedCount = users.size();
                rejectedCount = rejectedUserIds != null ? rejectedUserIds.size() : 0;
                break;
            }
            case "rejected", "rejete", "rejeté" -> {
                if (rejectedUserIds == null || rejectedUserIds.isEmpty()) {
                    items = List.of();
                } else {
                    items = userRepository.findAllById(rejectedUserIds).stream()
                            .filter(u -> u.getRole() == User.Role.ASSOCIATION || u.getRole() == User.Role.PARTNER)
                            .map(u -> toAccount(u, "Rejeté"))
                            .toList();
                }
                pendingCount = userRepository.findByRoleInAndIsVerifiedTrueAndIsActiveFalse(orgRoles).size();
                approvedCount = userRepository.findByRoleInAndIsVerifiedTrueAndIsActiveTrue(orgRoles).size();
                rejectedCount = items.size();
                break;
            }
            case "all", "tous" -> {
                List<User> pending = userRepository.findByRoleInAndIsVerifiedTrueAndIsActiveFalse(orgRoles);
                List<User> approved = userRepository.findByRoleInAndIsVerifiedTrueAndIsActiveTrue(orgRoles);
                items = new java.util.ArrayList<>();
                pending.forEach(u -> items.add(toAccount(u, "En attente")));
                approved.forEach(u -> items.add(toAccount(u, "Validé")));
                if (rejectedUserIds != null) {
                    userRepository.findAllById(rejectedUserIds).forEach(u ->
                            items.add(toAccount(u, "Rejeté")));
                }
                items.sort((a, b) -> (b.getCreatedAt() != null ? b.getCreatedAt() : LocalDateTime.MIN)
                        .compareTo(a.getCreatedAt() != null ? a.getCreatedAt() : LocalDateTime.MIN));
                pendingCount = pending.size();
                approvedCount = approved.size();
                rejectedCount = rejectedUserIds != null ? rejectedUserIds.size() : 0;
                break;
            }
            default -> {
                List<User> users = userRepository.findByRoleInAndIsVerifiedTrueAndIsActiveFalse(orgRoles);
                items = users.stream().map(u -> toAccount(u, "En attente")).toList();
                pendingCount = users.size();
                approvedCount = userRepository.findByRoleInAndIsVerifiedTrueAndIsActiveTrue(orgRoles).size();
                rejectedCount = rejectedUserIds != null ? rejectedUserIds.size() : 0;
            }
        }

        return OrganizationAccountsPageResponse.builder()
                .pendingCount(pendingCount)
                .approvedCount(approvedCount)
                .rejectedCount(rejectedCount)
                .totalCount(pendingCount + approvedCount + rejectedCount)
                .items(items)
                .build();
    }

    private OrganizationAccountResponse toAccount(User user, String statusLabel) {
        String name = profileRepository.findById(user.getUserId())
                .map(RegistrationProfile::getNom)
                .filter(n -> n != null && !n.isBlank())
                .orElse(user.getEmail());
        String prefix = user.getRole() == User.Role.ASSOCIATION ? "Asso" : "Partenaire";
        return OrganizationAccountResponse.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .role(user.getRole().name())
                .name(prefix + " \"" + name + "\"")
                .documentPath(profileRepository.findById(user.getUserId())
                        .map(RegistrationProfile::getDocument)
                        .orElse(null))
                .createdAt(user.getCreatedAt())
                .status(statusLabel)
                .build();
    }

    private PendingAccountResponse toPendingAccount(User user) {
        OrganizationAccountResponse account = toAccount(user, "En attente");
        return PendingAccountResponse.builder()
                .userId(account.getUserId())
                .email(account.getEmail())
                .role(account.getRole())
                .name(account.getName())
                .documentPath(account.getDocumentPath())
                .createdAt(account.getCreatedAt())
                .build();
    }

    private UserInternalResponse toResponse(User user) {
        String displayName = profileRepository.findById(user.getUserId())
                .map(profile -> {
                    if (profile.getNom() != null && !profile.getNom().isBlank()) {
                        return profile.getNom();
                    }
                    String first = profile.getFirstName() != null ? profile.getFirstName() : "";
                    String last = profile.getLastName() != null ? profile.getLastName() : "";
                    String full = (first + " " + last).trim();
                    return full.isEmpty() ? null : full;
                })
                .orElse(null);

        return UserInternalResponse.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .role(user.getRole().name())
                .isActive(user.getIsActive())
                .isVerified(user.getIsVerified())
                .displayName(displayName)
                .createdAt(user.getCreatedAt())
                .build();
    }
}