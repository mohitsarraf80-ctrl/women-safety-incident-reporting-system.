package com.womensafety.security;

import com.womensafety.entity.RevokedToken;
import com.womensafety.entity.User;
import com.womensafety.repository.RevokedTokenRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

/**
 * Issues and validates HS256 JSON Web Tokens. Every token carries a unique id (jti) so
 * that logout can revoke it server-side instead of relying on the client to forget it.
 */
@Service
public class JwtTokenService {

    private static final Logger log = LoggerFactory.getLogger(JwtTokenService.class);

    private final SecretKey signingKey;
    private final Duration accessTokenTtl;
    private final String issuer;
    private final RevokedTokenRepository revokedTokenRepository;

    public JwtTokenService(@Value("${app.jwt.secret}") String secret,
                           @Value("${app.jwt.access-token-ttl:PT2H}") Duration accessTokenTtl,
                           @Value("${app.jwt.issuer:women-safety-platform}") String issuer,
                           RevokedTokenRepository revokedTokenRepository) {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("JWT_SECRET must be at least 32 characters long");
        }
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenTtl = accessTokenTtl;
        this.issuer = issuer;
        this.revokedTokenRepository = revokedTokenRepository;
    }

    @Transactional
    public IssuedToken issue(User user) {
        Instant now = Instant.now();
        Instant expiry = now.plus(accessTokenTtl);
        String jti = UUID.randomUUID().toString();
        String token = Jwts.builder()
                .issuer(issuer)
                .subject(user.getEmail())
                .id(jti)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .claim("uid", user.getId())
                .claim("role", user.getRole().name())
                .claim("name", user.getDisplayName())
                .signWith(signingKey, Jwts.SIG.HS256)
                .compact();
        return new IssuedToken(token, jti, expiry);
    }

    public Claims parse(String token) throws JwtException {
        return Jwts.parser()
                .verifyWith(signingKey)
                .requireIssuer(issuer)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    @Transactional
    public void revoke(String token) {
        try {
            Claims claims = parse(token);
            if (claims.getId() == null || revokedTokenRepository.existsByJti(claims.getId())) {
                return;
            }
            revokedTokenRepository.save(RevokedToken.of(claims.getId(), claims.getExpiration().toInstant()));
        } catch (JwtException | IllegalArgumentException ex) {
            log.debug("Ignoring logout for an unparsable token: {}", ex.getMessage());
        }
    }

    public boolean isRevoked(String jti) {
        return jti != null && revokedTokenRepository.existsByJti(jti);
    }

    @Transactional
    public int purgeExpiredRevocations() {
        return (int) revokedTokenRepository.deleteByExpiresAtBefore(Instant.now());
    }

    public Duration getAccessTokenTtl() {
        return accessTokenTtl;
    }

    /** A freshly issued token together with the metadata the client needs. */
    public record IssuedToken(String token, String jti, Instant expiresAt) {
    }
}
