package com.womensafety.repository;

import com.womensafety.entity.RevokedToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;

public interface RevokedTokenRepository extends JpaRepository<RevokedToken, Long> {

    boolean existsByJti(String jti);

    long deleteByExpiresAtBefore(Instant cutoff);
}
