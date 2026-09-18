package com.cvai.backend.dto.auth;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Legacy link-based reset flow: token is a short-lived JWT emailed as a link.
 *  Frontend only sends "new_password" (snake_case) for this endpoint. */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ResetPasswordRequest {
    @NotBlank
    private String token;

    @NotBlank @Size(min = 6)
    @JsonAlias({"new_password", "newPassword"})
    private String newPassword;
}
