package com.example.admin_service.controller;

import com.example.admin_service.dto.response.LogAdminResponse;
import com.example.admin_service.service.AdminLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/admin/logs")
@RequiredArgsConstructor
public class AdminLogController {

    private final AdminLogService service;

    @GetMapping
    public ResponseEntity<List<LogAdminResponse>> getLogs(
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String cibleType
    ) {
        return ResponseEntity.ok(service.getLogs(fromDate, toDate, action, cibleType));
    }
}
