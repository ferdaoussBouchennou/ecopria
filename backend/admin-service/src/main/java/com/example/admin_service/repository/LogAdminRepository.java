package com.example.admin_service.repository;

import com.example.admin_service.model.LogAdmin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.util.List;

public interface LogAdminRepository extends JpaRepository<LogAdmin, Long>, JpaSpecificationExecutor<LogAdmin> {
    List<LogAdmin> findAllByOrderByCreatedAtDesc();
    List<LogAdmin> findByAdminIdOrderByCreatedAtDesc(Long adminId);
}
