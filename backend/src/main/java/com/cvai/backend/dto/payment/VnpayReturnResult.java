package com.cvai.backend.dto.payment;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VnpayReturnResult {
    private boolean success;
    private String status;
    private String message;

    @JsonProperty("txn_ref")
    private String txnRef;

    private Long amount;

    @JsonProperty("user_tier")
    private String userTier;
}
