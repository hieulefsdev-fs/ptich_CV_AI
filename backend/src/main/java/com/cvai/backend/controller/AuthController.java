package com.cvai.backend.controller;

import com.cvai.backend.dto.auth.*;
import com.cvai.backend.security.CustomUserDetails;
import com.cvai.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public MessageResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/verify-registration-otp")
    public AuthResponse verifyRegistrationOtp(@Valid @RequestBody VerifyOtpRequest request) {
        return authService.verifyRegistrationOtp(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public UserProfileDto me(@AuthenticationPrincipal CustomUserDetails principal) {
        return authService.me(principal.getUser());
    }

    @PostMapping("/forgot-password")
    public MessageResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return authService.forgotPassword(request);
    }

    @PostMapping("/reset-password-otp")
    public MessageResponse resetPasswordOtp(@Valid @RequestBody ResetPasswordOtpRequest request) {
        return authService.resetPasswordWithOtp(request);
    }

    @PostMapping("/reset-password")
    public MessageResponse resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return authService.resetPasswordWithToken(request.getToken(), request.getNewPassword());
    }
}
