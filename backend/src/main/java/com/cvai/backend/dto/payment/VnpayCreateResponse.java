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
public class VnpayCreateResponse {
    @JsonProperty("payment_url")
    private String paymentUrl;

    @JsonProperty("txn_ref")
    private String txnRef;

    private Long amount;

    @JsonProperty("qr_code_url")
    private String qrCodeUrl;

    @JsonProperty("order_desc")
    private String orderDesc;
}
