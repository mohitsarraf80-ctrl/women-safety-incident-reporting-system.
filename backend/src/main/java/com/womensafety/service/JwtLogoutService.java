package com.womensafety.service;

import com.womensafety.security.JwtTokenService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/** Extracts the bearer token from the logout request and revokes its identifier. */
@Service
public class JwtLogoutService {

    private static final Logger log = LoggerFactory.getLogger(JwtLogoutService.class);
    private static final String BEARER = "Bearer ";

    private final JwtTokenService jwtTokenService;

    public JwtLogoutService(JwtTokenService jwtTokenService) {
        this.jwtTokenService = jwtTokenService;
    }

    public void revoke(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith(BEARER)) {
            return;
        }
        String token = authorizationHeader.substring(BEARER.length()).trim();
        jwtTokenService.revoke(token);
        log.debug("Access token revocation requested");
    }
}
