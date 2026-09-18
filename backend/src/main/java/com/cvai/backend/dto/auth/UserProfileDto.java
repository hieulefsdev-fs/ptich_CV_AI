package com.cvai.backend.dto.auth;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Snake_case user shape — used by /auth/* endpoints (Navbar, DashboardPage,
 * AuthContext all read user.full_name, user.cv_quota_used, user.max_free_quota).
 * Admin pages use the separate camelCase {@link UserDto} instead.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class UserProfileDto {
    private Long id;
    private String email;
    private String fullName;
    private String role;
    private String tier;
    private Integer cvQuotaUsed;
    private Integer maxFreeQuota;
    private Boolean isActive;
    private Boolean isVerified;
    private Instant createdAt;
}
