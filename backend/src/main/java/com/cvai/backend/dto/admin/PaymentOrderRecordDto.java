package com.cvai.backend.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentOrderRecordDto {
    private Long id;
    private String txnRef;
    private Long amount;
    private String status;
    private String userEmail;
    private String userFullName;
    private String vnpBankCode;
    private Instant createdAt;
    private Instant paidAt;
}
