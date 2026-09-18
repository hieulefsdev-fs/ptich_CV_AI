package com.cvai.backend.controller;

import com.cvai.backend.dto.payment.CreateVnpayRequest;
import com.cvai.backend.dto.payment.VnpayCreateResponse;
import com.cvai.backend.dto.payment.VnpayReturnResult;
import com.cvai.backend.security.CustomUserDetails;
import com.cvai.backend.service.VnpayService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final VnpayService vnpayService;

    @PostMapping("/create-vnpay-url")
    public VnpayCreateResponse createVnpayUrl(@AuthenticationPrincipal CustomUserDetails principal,
                                               @RequestBody CreateVnpayRequest request,
                                               HttpServletRequest httpRequest) {
        String clientIp = extractClientIp(httpRequest);
        return vnpayService.createPaymentUrl(principal.getUser(), request, clientIp);
    }

    @GetMapping("/vnpay-return")
    public VnpayReturnResult vnpayReturn(HttpServletRequest request) {
        Map<String, String> params = new HashMap<>();
        request.getParameterMap().forEach((key, values) -> {
            if (values != null && values.length > 0) {
                params.put(key, values[0]);
            }
        });
        return vnpayService.handleReturn(params);
    }

    private String extractClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
