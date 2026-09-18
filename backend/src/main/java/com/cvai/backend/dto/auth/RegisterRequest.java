package com.cvai.backend.dto.auth;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class RegisterRequest {
    @NotBlank @Email
    private String email;

    @NotBlank
    private String fullName;

    @NotBlank @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;
}
