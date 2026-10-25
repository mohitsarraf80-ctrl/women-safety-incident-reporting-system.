package com.womensafety.controller;

import com.womensafety.dto.AuthDtos;
import com.womensafety.security.UserPrincipal;
import com.womensafety.service.AuthService;
import com.womensafety.service.JwtLogoutService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtLogoutService jwtLogoutService;

    public AuthController(AuthService authService, JwtLogoutService jwtLogoutService) {
        this.authService = authService;
        this.jwtLogoutService = jwtLogoutService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthDtos.AuthResponse register(@Valid @RequestBody AuthDtos.RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthDtos.AuthResponse login(@Valid @RequestBody AuthDtos.LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public AuthDtos.UserResponse me(@AuthenticationPrincipal UserPrincipal principal) {
        return authService.me(principal);
    }

    @PatchMapping("/profile")
    public AuthDtos.UserResponse updateProfile(@AuthenticationPrincipal UserPrincipal principal,
                                               @Valid @RequestBody AuthDtos.ProfileUpdateRequest request) {
        return authService.updateProfile(principal, request);
    }

    @PostMapping("/change-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@AuthenticationPrincipal UserPrincipal principal,
                               @Valid @RequestBody AuthDtos.ChangePasswordRequest request) {
        authService.changePassword(principal, request);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        jwtLogoutService.revoke(authorization);
    }
}
