package com.cvai.backend.controller;

import com.cvai.backend.dto.admin.AdminStatsDto;
import com.cvai.backend.dto.admin.AnalysisSummaryDto;
import com.cvai.backend.dto.admin.PaymentOrderRecordDto;
import com.cvai.backend.dto.auth.MessageResponse;
import com.cvai.backend.dto.auth.UserDto;
import com.cvai.backend.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public AdminStatsDto stats() {
        return adminService.stats();
    }

    @GetMapping("/users")
    public List<UserDto> users() {
        return adminService.listUsers();
    }

    @GetMapping("/analyses")
    public List<AnalysisSummaryDto> analyses() {
        return adminService.listAnalyses();
    }

    @GetMapping("/orders")
    public List<PaymentOrderRecordDto> orders() {
        return adminService.listOrders();
    }

    @PutMapping("/users/{id}/toggle-active")
    public MessageResponse toggleActive(@PathVariable Long id) {
        return adminService.toggleActive(id);
    }

    @PutMapping("/users/{id}/change-tier")
    public MessageResponse changeTier(@PathVariable Long id, @RequestParam String tier) {
        return adminService.changeTier(id, tier);
    }
}
