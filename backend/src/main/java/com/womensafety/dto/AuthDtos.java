package com.womensafety.dto;

import com.womensafety.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;

/** Request/response payloads for registration, login and profile management. */
public final class AuthDtos {

    private AuthDtos() {
    }

    public record RegisterRequest(
            @NotBlank(message = "Display name is required")
            @Size(min = 2, max = 120, message = "Display name must be 2-120 characters")
            String displayName,

            @NotBlank(message = "Email is required")
            @Email(message = "Enter a valid email address")
            @Size(max = 160)
            String email,

            @NotBlank(message = "Password is required")
            @Size(min = 8, max = 72, message = "Password must be 8-72 characters")
            @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$",
                    message = "Password must contain at least one letter and one number")
            String password,

            @Size(max = 30, message = "Phone number is too long")
            String phone
    ) {
    }

    public record LoginRequest(
            @NotBlank(message = "Email is required")
            @Email(message = "Enter a valid email address")
            String email,

            @NotBlank(message = "Password is required")
            String password
    ) {
    }

    public record UserResponse(
            Long id,
            String displayName,
            String email,
            String phone,
            UserRole role,
            String roleLabel,
            Instant createdAt
    ) {
    }

    public record AuthResponse(
            String token,
            String tokenType,
            Instant expiresAt,
            UserResponse user
    ) {
    }

    public record ProfileUpdateRequest(
            @NotBlank(message = "Display name is required")
            @Size(min = 2, max = 120)
            String displayName,

            @Size(max = 30)
            String phone
    ) {
    }

    public record ChangePasswordRequest(
            @NotBlank(message = "Current password is required")
            String currentPassword,

            @NotBlank(message = "New password is required")
            @Size(min = 8, max = 72, message = "Password must be 8-72 characters")
            @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$",
                    message = "Password must contain at least one letter and one number")
            String newPassword
    ) {
    }
}
