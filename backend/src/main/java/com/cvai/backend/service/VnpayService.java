package com.cvai.backend.service;

import com.cvai.backend.dto.payment.CreateVnpayRequest;
import com.cvai.backend.dto.payment.VnpayCreateResponse;
import com.cvai.backend.dto.payment.VnpayReturnResult;
import com.cvai.backend.entity.OrderStatus;
import com.cvai.backend.entity.PaymentOrder;
import com.cvai.backend.entity.Tier;
import com.cvai.backend.entity.User;
import com.cvai.backend.exception.ApiException;
import com.cvai.backend.repository.PaymentOrderRepository;
import com.cvai.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class VnpayService {

    private final PaymentOrderRepository paymentOrderRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Value("${app.vnpay.tmn-code}")
    private String tmnCode;

    @Value("${app.vnpay.hash-secret}")
    private String hashSecret;

    @Value("${app.vnpay.pay-url}")
    private String payUrl;

    @Value("${app.vnpay.return-url}")
    private String returnUrl;

    @Value("${app.vnpay.plus-price-vnd}")
    private long plusPriceVnd;

    private static final DateTimeFormatter VNP_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final SecureRandom RANDOM = new SecureRandom();

    @Transactional
    public VnpayCreateResponse createPaymentUrl(User user, CreateVnpayRequest request, String clientIp) {
        if (tmnCode == null || tmnCode.isBlank() || hashSecret == null || hashSecret.isBlank()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Cổng thanh toán VNPay chưa được cấu hình.");
        }

        String txnRef = generateTxnRef();
        long amount = plusPriceVnd;

        PaymentOrder order = PaymentOrder.builder()
                .user(user)
                .txnRef(txnRef)
                .amount(amount)
                .orderDesc(request.getOrderDesc() != null ? request.getOrderDesc() : "Nang cap goi Plus - CV AI Analysis")
                .bankCode(request.getBankCode())
                .status(OrderStatus.PENDING)
                .build();
        paymentOrderRepository.save(order);

        String createDate = ZonedDateTime.now(ZoneId.of("Etc/GMT-7")).format(VNP_DATE_FORMAT);

        Map<String, String> params = new TreeMap<>();
        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", tmnCode);
        params.put("vnp_Amount", String.valueOf(amount * 100L));
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", txnRef);
        params.put("vnp_OrderInfo", order.getOrderDesc());
        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn");
        params.put("vnp_ReturnUrl", returnUrl);
        params.put("vnp_IpAddr", (clientIp == null || clientIp.isBlank()) ? "127.0.0.1" : clientIp);
        params.put("vnp_CreateDate", createDate);
        if (request.getBankCode() != null && !request.getBankCode().isBlank()) {
            params.put("vnp_BankCode", request.getBankCode());
        }

        String hashData = buildQuery(params);
        String query = hashData; // VNPay's official Java sample URL-encodes both the hash data and the redirect query identically
        String secureHash = hmacSha512(hashSecret, hashData);

        String paymentUrl = payUrl + "?" + query + "&vnp_SecureHash=" + secureHash;
        String qrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data="
                + URLEncoder.encode(paymentUrl, StandardCharsets.UTF_8);

        return VnpayCreateResponse.builder()
                .paymentUrl(paymentUrl)
                .txnRef(txnRef)
                .amount(amount)
                .qrCodeUrl(qrCodeUrl)
                .orderDesc(order.getOrderDesc())
                .build();
    }

    @Transactional
    public VnpayReturnResult handleReturn(Map<String, String> allParams) {
        Map<String, String> params = new TreeMap<>(allParams);
        String receivedHash = params.remove("vnp_SecureHash");
        params.remove("vnp_SecureHashType");

        String hashData = buildQuery(params);
        String computedHash = hmacSha512(hashSecret, hashData);

        if (receivedHash == null || !computedHash.equalsIgnoreCase(receivedHash)) {
            return VnpayReturnResult.builder()
                    .success(false)
                    .status("INVALID_SIGNATURE")
                    .message("Chữ ký giao dịch không hợp lệ.")
                    .build();
        }

        String txnRef = params.get("vnp_TxnRef");
        String responseCode = params.get("vnp_ResponseCode");

        PaymentOrder order = paymentOrderRepository.findByTxnRef(txnRef).orElse(null);
        if (order == null) {
            return VnpayReturnResult.builder()
                    .success(false)
                    .status("ORDER_NOT_FOUND")
                    .message("Không tìm thấy đơn hàng.")
                    .txnRef(txnRef)
                    .build();
        }

        if (order.getStatus() == OrderStatus.SUCCESS) {
            User user = order.getUser();
            return VnpayReturnResult.builder()
                    .success(true)
                    .status("ALREADY_CONFIRMED")
                    .message("Giao dịch đã được xác nhận trước đó.")
                    .txnRef(txnRef)
                    .amount(order.getAmount())
                    .userTier(user.getTier().name())
                    .build();
        }

        boolean paymentSuccess = "00".equals(responseCode);
        order.setStatus(paymentSuccess ? OrderStatus.SUCCESS : OrderStatus.FAILED);
        order.setVnpTransactionNo(params.get("vnp_TransactionNo"));
        if (paymentSuccess) {
            order.setPaidAt(java.time.Instant.now());
        }
        paymentOrderRepository.save(order);

        User user = order.getUser();
        if (paymentSuccess) {
            user.setTier(Tier.PLUS);
            userRepository.save(user);
            emailService.sendPaymentSuccessEmail(user.getEmail(), user.getFullName(),
                    order.getAmount() == null ? 0L : order.getAmount(), txnRef);
        }

        return VnpayReturnResult.builder()
                .success(paymentSuccess)
                .status(paymentSuccess ? "SUCCESS" : "FAILED")
                .message(paymentSuccess ? "Thanh toán thành công, tài khoản đã được nâng cấp lên Plus."
                        : "Thanh toán thất bại hoặc bị hủy.")
                .txnRef(txnRef)
                .amount(order.getAmount())
                .userTier(user.getTier().name())
                .build();
    }

    private String generateTxnRef() {
        return System.currentTimeMillis() + String.valueOf(100 + RANDOM.nextInt(900));
    }

    private String buildQuery(Map<String, String> params) {
        StringBuilder sb = new StringBuilder();
        Iterator<Map.Entry<String, String>> it = params.entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry<String, String> entry = it.next();
            if (entry.getValue() == null || entry.getValue().isEmpty()) continue;
            sb.append(URLEncoder.encode(entry.getKey(), StandardCharsets.UTF_8)).append('=');
            sb.append(URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8));
            if (it.hasNext()) sb.append('&');
        }
        return sb.toString();
    }

    private String hmacSha512(String key, String data) {
        try {
            Mac hmac = Mac.getInstance("HmacSHA512");
            hmac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            byte[] bytes = hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : bytes) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (Exception e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi tạo chữ ký thanh toán.");
        }
    }
}
