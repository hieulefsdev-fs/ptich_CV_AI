package com.cvai.backend.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsDto {
    private long totalUsers;
    private long freeUsers;
    private long plusUsers;
    private long totalAnalyses;
    private long successfulOrders;
    private long totalRevenue;
}
