package com.womensafety.service;

import com.womensafety.dto.AuthDtos;
import com.womensafety.entity.User;
import com.womensafety.enums.UserRole;
import com.womensafety.exception.DuplicateResourceException;
import com.womensafety.exception.InvalidCredentialsException;
import com.womensafety.repository.UserRepository;
import com.womensafety.security.JwtTokenService;
import com.womensafety.security.UserPrincipal;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

/** Registration, login, token issuance and profile updates. */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenService jwtTokenService;
    private final AuditService auditService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager, JwtTokenService jwtTokenService,
                       AuditService auditService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtTokenService = jwtTokenService;
        this.auditService = auditService;
    }

    @Transactional
    public AuthDtos.AuthResponse register(AuthDtos.RegisterRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new DuplicateResourceException("An account with this email already exists.");
        }
        User user = User.create(request.displayName().trim(), email,
                passwordEncoder.encode(request.password()), UserRole.CITIZEN);
        if (request.phone() != null && !request.phone().isBlank()) {
            user.updateProfile(request.displayName().trim(), request.phone().trim());
        }
        userRepository.save(user);
        auditService.record("USER_REGISTERED", "User", String.valueOf(user.getId()), "Citizen self-registration");
        return issueToken(user);
    }

    @Transactional
    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.password()));
        } catch (AuthenticationException ex) {
            throw new InvalidCredentialsException();
        }
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(InvalidCredentialsException::new);
        if (!user.isActive()) {
            throw new InvalidCredentialsException();
        }
        auditService.record("USER_LOGIN", "User", String.valueOf(user.getId()), "Successful password login");
        return issueToken(user);
    }

    public AuthDtos.UserResponse me(UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(InvalidCredentialsException::new);
        return toResponse(user);
    }

    @Transactional
    public AuthDtos.UserResponse updateProfile(UserPrincipal principal, AuthDtos.ProfileUpdateRequest request) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(InvalidCredentialsException::new);
        user.updateProfile(request.displayName().trim(), request.phone());
        userRepository.save(user);
        return toResponse(user);
    }

    @Transactional
    public void changePassword(UserPrincipal principal, AuthDtos.ChangePasswordRequest request) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(InvalidCredentialsException::new);
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }
        user.changePasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        auditService.record("PASSWORD_CHANGED", "User", String.valueOf(user.getId()), "Password changed by owner");
    }

    public AuthDtos.UserResponse toResponse(User user) {
        return new AuthDtos.UserResponse(user.getId(), user.getDisplayName(), user.getEmail(), user.getPhone(),
                user.getRole(), label(user.getRole()), user.getCreatedAt());
    }

    private AuthDtos.AuthResponse issueToken(User user) {
        JwtTokenService.IssuedToken issued = jwtTokenService.issue(user);
        return new AuthDtos.AuthResponse(issued.token(), "Bearer", issued.expiresAt(), toResponse(user));
    }

    private String label(UserRole role) {
        return switch (role) {
            case CITIZEN -> "Citizen";
            case ADMIN -> "Administrator";
            case RESPONDER -> "Responder";
        };
    }
}
