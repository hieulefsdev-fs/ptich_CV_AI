package com.cvai.backend.service;

import com.cvai.backend.dto.auth.*;
import com.cvai.backend.entity.*;
import com.cvai.backend.exception.ApiException;
import com.cvai.backend.repository.OtpCodeRepository;
import com.cvai.backend.repository.UserRepository;
import com.cvai.backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final OtpCodeRepository otpCodeRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    @Value("${app.otp.expiration-minutes}")
    private long otpExpirationMinutes;

    @Value("${app.quota.max-free-analyses}")
    private int maxFreeAnalyses;

    @Value("${app.admin.bootstrap-email:}")
    private String adminBootstrapEmail;

    private static final SecureRandom RANDOM = new SecureRandom();

    @Transactional
    public MessageResponse register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        userRepository.findByEmail(email).ifPresent(existing -> {
            if (Boolean.TRUE.equals(existing.getIsVerified())) {
                throw new ApiException(HttpStatus.CONFLICT, "Email này đã được đăng ký.");
            }
        });

        String otp = generateOtp();
        String passwordHash = passwordEncoder.encode(request.getPassword());

        OtpCode otpCode = OtpCode.builder()
                .email(email)
                .otpCode(otp)
                .purpose(OtpPurpose.REGISTER)
                .pendingFullName(request.getFullName().trim())
                .pendingPasswordHash(passwordHash)
                .used(false)
                .expiresAt(Instant.now().plus(otpExpirationMinutes, ChronoUnit.MINUTES))
                .build();
        otpCodeRepository.save(otpCode);

        emailService.sendOtpEmail(email, otp, "đăng ký tài khoản");

        return new MessageResponse("Mã OTP đã được gửi tới email của bạn.");
    }

    @Transactional
    public AuthResponse verifyRegistrationOtp(VerifyOtpRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        OtpCode otpCode = otpCodeRepository
                .findTopByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(email, OtpPurpose.REGISTER)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Không tìm thấy yêu cầu đăng ký cho email này."));

        validateOtp(otpCode, request.getOtpCode());

        if (userRepository.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "Email này đã được đăng ký.");
        }

        Role role = (!adminBootstrapEmail.isBlank() && adminBootstrapEmail.equalsIgnoreCase(email))
                ? Role.ADMIN : Role.USER;

        User user = User.builder()
                .email(email)
                .fullName(otpCode.getPendingFullName())
                .passwordHash(otpCode.getPendingPasswordHash())
                .role(role)
                .tier(Tier.FREE)
                .cvQuotaUsed(0)
                .isActive(true)
                .isVerified(true)
                .build();
        user = userRepository.save(user);

        otpCode.setUsed(true);
        otpCodeRepository.save(otpCode);

        String token = jwtUtil.generateToken(user.getEmail(), user.getId());
        return new AuthResponse(token, toProfileDto(user));
    }

    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không đúng."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không đúng.");
        }
        if (!Boolean.TRUE.equals(user.getIsVerified())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Tài khoản chưa được xác thực OTP.");
        }
        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Tài khoản đã bị vô hiệu hóa.");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getId());
        return new AuthResponse(token, toProfileDto(user));
    }

    public UserProfileDto me(User user) {
        return toProfileDto(user);
    }

    @Transactional
    public MessageResponse forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản với email này."));

        String otp = generateOtp();
        OtpCode otpCode = OtpCode.builder()
                .email(email)
                .otpCode(otp)
                .purpose(OtpPurpose.RESET_PASSWORD)
                .used(false)
                .expiresAt(Instant.now().plus(otpExpirationMinutes, ChronoUnit.MINUTES))
                .build();
        otpCodeRepository.save(otpCode);

        emailService.sendOtpEmail(email, otp, "đặt lại mật khẩu");

        return new MessageResponse("Mã OTP đặt lại mật khẩu đã được gửi tới email của bạn.");
    }

    @Transactional
    public MessageResponse resetPasswordWithOtp(ResetPasswordOtpRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        OtpCode otpCode = otpCodeRepository
                .findTopByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(email, OtpPurpose.RESET_PASSWORD)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Không tìm thấy yêu cầu đặt lại mật khẩu."));

        validateOtp(otpCode, request.getOtpCode());

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản."));

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        otpCode.setUsed(true);
        otpCodeRepository.save(otpCode);

        return new MessageResponse("Đặt lại mật khẩu thành công.");
    }

    @Transactional
    public MessageResponse resetPasswordWithToken(String token, String newPassword) {
        if (!jwtUtil.isTokenValid(token)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.");
        }
        String email = jwtUtil.extractEmail(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản."));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return new MessageResponse("Đặt lại mật khẩu thành công.");
    }

    private void validateOtp(OtpCode otpCode, String suppliedOtp) {
        if (Boolean.TRUE.equals(otpCode.getUsed())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Mã OTP đã được sử dụng.");
        }
        if (otpCode.isExpired()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Mã OTP đã hết hạn, vui lòng yêu cầu mã mới.");
        }
        if (!otpCode.getOtpCode().equals(suppliedOtp.trim())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Mã OTP không chính xác.");
        }
    }

    private String generateOtp() {
        int code = 100000 + RANDOM.nextInt(900000);
        return String.valueOf(code);
    }

    /** camelCase shape — used by admin endpoints (AdminPage reads u.fullName, u.cvQuotaUsed...). */
    public UserDto toDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role("ROLE_" + user.getRole().name())
                .tier(user.getTier().name().toLowerCase())
                .cvQuotaUsed(user.getCvQuotaUsed())
                .maxFreeQuota(maxFreeAnalyses)
                .isActive(user.getIsActive())
                .isVerified(user.getIsVerified())
                .createdAt(user.getCreatedAt())
                .build();
    }

    /** snake_case shape — used by /auth/* endpoints (Navbar, DashboardPage, AuthContext). */
    public UserProfileDto toProfileDto(User user) {
        return UserProfileDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role("ROLE_" + user.getRole().name())
                .tier(user.getTier().name().toLowerCase())
                .cvQuotaUsed(user.getCvQuotaUsed())
                .maxFreeQuota(maxFreeAnalyses)
                .isActive(user.getIsActive())
                .isVerified(user.getIsVerified())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
