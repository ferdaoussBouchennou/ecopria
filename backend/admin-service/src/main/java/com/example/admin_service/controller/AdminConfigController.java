package com.example.admin_service.controller;


import com.example.admin_service.dto.request.ConfigurationRequest;
import com.example.admin_service.dto.response.ConfigurationResponse;
import com.example.admin_service.service.AdminConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/admin/configurations")
@RequiredArgsConstructor
public class AdminConfigController {

    private final AdminConfigService service;

    @GetMapping
    public ResponseEntity<List<ConfigurationResponse>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @PutMapping("/{cle}")
    public ResponseEntity<ConfigurationResponse> update(
            @PathVariable String cle,
            @RequestBody ConfigurationRequest request,
            @RequestHeader("X-User-Id") Long adminId) {
        return ResponseEntity.ok(service.update(cle, request, adminId));
    }
}
