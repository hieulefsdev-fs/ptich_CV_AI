package com.cvai.backend.service;

import com.cvai.backend.dto.admin.AdminStatsDto;
import com.cvai.backend.dto.admin.AnalysisSummaryDto;
import com.cvai.backend.dto.admin.PaymentOrderRecordDto;
import com.cvai.backend.dto.auth.MessageResponse;
import com.cvai.backend.dto.auth.UserDto;
import com.cvai.backend.entity.OrderStatus;
import com.cvai.backend.entity.PaymentOrder;
import com.cvai.backend.entity.Tier;
import com.cvai.backend.entity.User;
import com.cvai.backend.exception.ApiException;
import com.cvai.backend.repository.CvAnalysisRepository;
import com.cvai.backend.repository.PaymentOrderRepository;
import com.cvai.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final CvAnalysisRepository cvAnalysisRepository;
    private final PaymentOrderRepository paymentOrderRepository;
    private final AuthService authService;

    @Value("${app.quota.max-free-analyses}")
    private int maxFreeAnalyses;

    public AdminStatsDto stats() {
        List<User> users = userRepository.findAll();
        long total = users.size();
        long plus = users.stream().filter(u -> u.getTier() == Tier.PLUS).count();
        long free = total - plus;
        long totalAnalyses = cvAnalysisRepository.count();

        List<PaymentOrder> orders = paymentOrderRepository.findAll();
        long successfulOrders = orders.stream().filter(o -> o.getStatus() == OrderStatus.SUCCESS).count();
        long totalRevenue = orders.stream()
                .filter(o -> o.getStatus() == OrderStatus.SUCCESS)
                .mapToLong(PaymentOrder::getAmount)
                .sum();

        return AdminStatsDto.builder()
                .totalUsers(total)
                .freeUsers(free)
                .plusUsers(plus)
                .totalAnalyses(totalAnalyses)
                .successfulOrders(successfulOrders)
                .totalRevenue(totalRevenue)
                .build();
    }

    public List<UserDto> listUsers() {
        return userRepository.findAll().stream().map(authService::toDto).toList();
    }

    public List<AnalysisSummaryDto> listAnalyses() {
        return cvAnalysisRepository.findAll().stream()
                .map(a -> AnalysisSummaryDto.builder()
                        .id(a.getId())
                        .userEmail(a.getUser().getEmail())
                        .targetJobTitle(a.getTargetJobTitle())
                        .atsScore(a.getAtsScore())
                        .originalFilename(a.getOriginalFilename())
                        .hasOriginalCv(a.hasOriginalCv())
                        .createdAt(a.getCreatedAt())
                        .build())
                .toList();
    }

    public List<PaymentOrderRecordDto> listOrders() {
        return paymentOrderRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(o -> PaymentOrderRecordDto.builder()
                        .id(o.getId())
                        .txnRef(o.getTxnRef())
                        .amount(o.getAmount())
                        .status(o.getStatus().name())
                        .userEmail(o.getUser().getEmail())
                        .userFullName(o.getUser().getFullName())
                        .vnpBankCode(o.getBankCode())
                        .createdAt(o.getCreatedAt())
                        .paidAt(o.getPaidAt())
                        .build())
                .toList();
    }

    @Transactional
    public MessageResponse toggleActive(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng."));
        user.setIsActive(!user.getIsActive());
        userRepository.save(user);
        return new MessageResponse(user.getIsActive() ? "Đã kích hoạt tài khoản." : "Đã vô hiệu hóa tài khoản.");
    }

    @Transactional
    public MessageResponse changeTier(Long userId, String tier) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng."));
        Tier newTier;
        try {
            newTier = Tier.valueOf(tier.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Gói không hợp lệ. Chỉ chấp nhận FREE hoặc PLUS.");
        }
        user.setTier(newTier);
        if (newTier == Tier.FREE) {
            user.setCvQuotaUsed(0);
        }
        userRepository.save(user);
        return new MessageResponse("Đã cập nhật gói người dùng thành " + newTier.name() + ".");
    }
}
