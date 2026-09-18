package com.cvai.backend.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
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
