package com.ecopria.presence.repository;


import com.ecopria.presence.model.QrCodeAction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface QrCodeActionRepository extends JpaRepository<QrCodeAction, Long> {
    Optional<QrCodeAction> findByActionId(Long actionId);
    Optional<QrCodeAction> findByQrCode(String qrCode);
    boolean existsByActionId(Long actionId);
}
