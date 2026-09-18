package com.cvai.backend.dto.payment;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class CreateVnpayRequest {
    @JsonProperty("bank_code")
    private String bankCode;

    @JsonProperty("order_desc")
    private String orderDesc;
}
