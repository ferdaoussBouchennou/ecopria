package com.example.auth_service.service;

import com.example.auth_service.dto.UserInternalResponse;
import com.example.auth_service.dto.UserStatsResponse;
import com.example.auth_service.entity.User;
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
        long newUsersThisWeek = userRepository.countByCreatedAtAfter(LocalDateTime.now().minusDays(7));
        return UserStatsResponse.builder()
                .totalUsers(totalUsers)
                .newUsersThisWeek(newUsersThisWeek)
                .build();
    }

    private UserInternalResponse toResponse(User user) {
        return UserInternalResponse.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .role(user.getRole().name())
                .isActive(user.getIsActive())
                .isVerified(user.getIsVerified())
                .build();
    }
}