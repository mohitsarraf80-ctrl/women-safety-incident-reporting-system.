package com.womensafety.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * Revoked JWT identifiers. Logout stores the token id here so the token cannot be
 * replayed even though JWTs are stateless.
 */
@Entity
@Table(name = "revoked_tokens")
public class RevokedToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String jti;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "revoked_at", nullable = false)
    private Instant revokedAt;

    protected RevokedToken() {
        // Required by JPA.
    }

    public static RevokedToken of(String jti, Instant expiresAt) {
        RevokedToken token = new RevokedToken();
        token.jti = jti;
        token.expiresAt = expiresAt;
        return token;
    }

    @PrePersist
    void stamp() {
        this.revokedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getJti() {
        return jti;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public Instant getRevokedAt() {
        return revokedAt;
    }
}
