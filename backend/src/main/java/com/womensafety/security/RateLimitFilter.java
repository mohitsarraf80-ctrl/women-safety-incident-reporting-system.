package com.womensafety.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Applies {@link RateLimitService} to the unauthenticated write endpoints most attractive
 * to abuse: login, anonymous reporting, tracking lookups and SOS.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimitService rateLimitService;
    private final ObjectMapper objectMapper;

    public RateLimitFilter(RateLimitService rateLimitService, ObjectMapper objectMapper) {
        this.rateLimitService = rateLimitService;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }
        String bucket = bucketFor(request.getRequestURI());
        if (bucket == null) {
            filterChain.doFilter(request, response);
            return;
        }
        if (!rateLimitService.tryAcquire(bucket, clientKey(request))) {
            response.setStatus(429);
            response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("type", "https://womensafety.local/errors/rate-limit-exceeded");
            body.put("title", "Too many requests");
            body.put("status", 429);
            body.put("detail", "Too many attempts. Please wait a minute and try again.");
            body.put("code", "rate-limit-exceeded");
            objectMapper.writeValue(response.getOutputStream(), body);
            return;
        }
        filterChain.doFilter(request, response);
    }

    private String bucketFor(String uri) {
        if (uri == null) {
            return null;
        }
        return switch (uri) {
            case "/api/auth/login" -> "login";
            case "/api/reports/track" -> "tracking";
            case "/api/incidents" -> "report";
            case "/api/sos" -> "sos";
            default -> null;
        };
    }

    private String clientKey(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
