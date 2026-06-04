package com.ecopria.notification.repository;

import com.ecopria.notification.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Notification> findByUserIdAndIsReadFalse(Long userId);

    boolean existsByUserIdAndTitleAndMessageAndCreatedAtAfter(
            Long userId, String title, String message, LocalDateTime since);
}
