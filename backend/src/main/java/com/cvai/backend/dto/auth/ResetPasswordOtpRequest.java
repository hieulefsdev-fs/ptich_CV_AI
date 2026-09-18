package com.cvai.backend.dto.auth;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ResetPasswordOtpRequest {
    @NotBlank @Email
    private String email;

    @NotBlank
    private String otpCode;

    @NotBlank @Size(min = 6)
    private String newPassword;
}
