package com.example.auth_service.service;

import com.example.auth_service.dto.OrganizationAccountResponse;
import com.example.auth_service.dto.CreateAssociationUserRequest;
import com.example.auth_service.dto.CreateAssociationUserResponse;
import com.example.auth_service.dto.OrganizationAccountsPageResponse;
import com.example.auth_service.dto.PendingAccountResponse;
import com.example.auth_service.dto.UserInternalResponse;
import com.example.auth_service.dto.UserStatsResponse;
import com.example.auth_service.entity.AdminVerificationStatus;
import com.example.auth_service.entity.RegistrationProfile;
import com.example.auth_service.entity.User;
import com.example.auth_service.repository.RegistrationProfileRepository;
import com.example.auth_service.repository.UserRepository;
import com.example.auth_service.repository.VerificationDocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InternalUserService {

    private final UserRepository userRepository;
    private final RegistrationProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;
    private final OrganizationVerificationService organizationVerificationService;
    private final VerificationDocumentRepository verificationDocumentRepository;

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
        organizationVerificationService.markApproved(user);
        userRepository.save(user);
    }

    public void rejectOrganization(Long id, String reason) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + id));
        if (user.getRole() != User.Role.ASSOCIATION && user.getRole() != User.Role.PARTNER) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ce compte n'est pas une organisation");
        }
        organizationVerificationService.markRejected(user, reason);
        userRepository.save(user);
    }

    public CreateAssociationUserResponse createAssociationUser(CreateAssociationUserRequest request) {
        String email = request.getEmail() == null ? "" : request.getEmail().trim().toLowerCase();
        if (email.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email obligatoire");
        }
        String name = request.getName() == null ? "" : request.getName().trim();
        if (name.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nom obligatoire");
        }

        Optional<User> existing = userRepository.findByEmail(email);
        if (existing.isPresent()) {
            User user = existing.get();
            if (user.getRole() != User.Role.ASSOCIATION) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email déjà utilisé par un autre type de compte");
            }
            user.setIsActive(true);
            user.setIsVerified(true);
            userRepository.save(user);

            RegistrationProfile profile = profileRepository.findById(user.getUserId()).orElseGet(() ->
                    RegistrationProfile.builder().userId(user.getUserId()).build());
            profile.setNom(name);
            profileRepository.save(profile);

            return CreateAssociationUserResponse.builder()
                    .userId(user.getUserId())
                    .email(user.getEmail())
                    .temporaryPassword(null)
                    .build();
        }

        String rawPassword = request.getPassword();
        boolean generated = !StringUtils.hasText(rawPassword);
        String password = generated ? generateTemporaryPassword() : rawPassword.trim();

        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(password))
                .role(User.Role.ASSOCIATION)
                .isActive(true)
                .isVerified(true)
                .createdAt(LocalDateTime.now())
                .build();
        user = userRepository.save(user);

        profileRepository.save(RegistrationProfile.builder()
                .userId(user.getUserId())
                .nom(name)
                .build());

        return CreateAssociationUserResponse.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .temporaryPassword(generated ? password : null)
                .build();
    }

    private static String generateTemporaryPassword() {
        return "Asso-" + UUID.randomUUID().toString().replace("-", "").substring(0, 10);
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
        List<User> allOrgUsers = userRepository.findAll().stream()
                .filter(u -> orgRoles.contains(u.getRole()) && Boolean.TRUE.equals(u.getIsVerified()))
                .toList();

        List<User> pending = allOrgUsers.stream().filter(this::isPendingOrganization).toList();
        List<User> approved = allOrgUsers.stream().filter(this::isApprovedOrganization).toList();
        List<User> rejected = allOrgUsers.stream()
                .filter(u -> isRejectedOrganization(u, rejectedUserIds))
                .toList();

        List<OrganizationAccountResponse> items;
        switch (filter == null ? "pending" : filter.toLowerCase()) {
            case "approved", "valide", "validé", "validee" ->
                    items = approved.stream().map(u -> toAccount(u, "Validé")).toList();
            case "rejected", "rejete", "rejeté" ->
                    items = rejected.stream().map(u -> toAccount(u, "Rejeté")).toList();
            case "all", "tous" -> {
                items = new java.util.ArrayList<>();
                pending.forEach(u -> items.add(toAccount(u, "En attente")));
                approved.forEach(u -> items.add(toAccount(u, "Validé")));
                rejected.forEach(u -> items.add(toAccount(u, "Rejeté")));
                items.sort((a, b) -> (b.getCreatedAt() != null ? b.getCreatedAt() : LocalDateTime.MIN)
                        .compareTo(a.getCreatedAt() != null ? a.getCreatedAt() : LocalDateTime.MIN));
            }
            default -> items = pending.stream().map(u -> toAccount(u, "En attente")).toList();
        }

        return OrganizationAccountsPageResponse.builder()
                .pendingCount(pending.size())
                .approvedCount(approved.size())
                .rejectedCount(rejected.size())
                .totalCount(pending.size() + approved.size() + rejected.size())
                .items(items)
                .build();
    }

    private boolean isPendingOrganization(User user) {
        if (user.getAdminVerificationStatus() == AdminVerificationStatus.PENDING) {
            return true;
        }
        if (user.getAdminVerificationStatus() == AdminVerificationStatus.REJECTED) {
            return false;
        }
        if (user.getAdminVerificationStatus() == AdminVerificationStatus.APPROVED) {
            return false;
        }
        return Boolean.TRUE.equals(user.getIsVerified()) && !Boolean.TRUE.equals(user.getIsActive());
    }

    private boolean isApprovedOrganization(User user) {
        if (user.getAdminVerificationStatus() == AdminVerificationStatus.APPROVED) {
            return true;
        }
        if (user.getAdminVerificationStatus() == AdminVerificationStatus.REJECTED) {
            return false;
        }
        return Boolean.TRUE.equals(user.getIsVerified()) && Boolean.TRUE.equals(user.getIsActive());
    }

    private boolean isRejectedOrganization(User user, List<Long> legacyRejectedIds) {
        if (user.getAdminVerificationStatus() == AdminVerificationStatus.REJECTED) {
            return true;
        }
        return legacyRejectedIds != null && legacyRejectedIds.contains(user.getUserId());
    }

    private OrganizationAccountResponse toAccount(User user, String statusLabel) {
        String orgName = resolveOrganizationName(user);
        String prefix = user.getRole() == User.Role.ASSOCIATION ? "Asso" : "Partenaire";
        String documentPath = user.getVerificationDocument();
        if (!StringUtils.hasText(documentPath)) {
            documentPath = profileRepository.findById(user.getUserId())
                    .map(RegistrationProfile::getDocument)
                    .orElse(null);
        }
        boolean hasStoredDocument = verificationDocumentRepository.existsById(user.getUserId())
                || StringUtils.hasText(documentPath);

        return OrganizationAccountResponse.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .role(user.getRole().name())
                .name(prefix + " \"" + orgName + "\"")
                .documentPath(documentPath)
                .hasStoredDocument(hasStoredDocument)
                .rejectionReason(user.getRejectionReason())
                .createdAt(user.getCreatedAt())
                .status(statusLabel)
                .build();
    }

    private String resolveOrganizationName(User user) {
        if (StringUtils.hasText(user.getOrganizationName())) {
            return user.getOrganizationName().trim();
        }
        return profileRepository.findById(user.getUserId())
                .map(RegistrationProfile::getNom)
                .filter(n -> n != null && !n.isBlank())
                .orElse(user.getEmail());
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