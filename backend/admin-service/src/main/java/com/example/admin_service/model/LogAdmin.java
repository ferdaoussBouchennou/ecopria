package com.example.admin_service.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "logs_admin")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LogAdmin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "admin_id", nullable = false)
    private Long adminId;

    @Column(nullable = false, length = 255)
    private String action;

    @Column(name = "cible_id", nullable = false)
    private Long cibleId;

    @Column(name = "cible_type", nullable = false, length = 50)
    private String cibleType;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
