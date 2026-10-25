package com.womensafety.service;

import com.womensafety.entity.AuditLog;
import com.womensafety.repository.AuditLogRepository;
import com.womensafety.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Writes security-relevant administrative actions to the audit table. Passwords, tokens
 * and full incident descriptions are never passed to this class.
 */
@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void record(String action, String entityType, String entityId, String details) {
        try {
            UserPrincipal actor = currentPrincipal();
            auditLogRepository.save(AuditLog.of(
                    actor == null ? null : actor.getId(),
                    actor == null ? null : actor.getEmail(),
                    action, entityType, entityId, truncate(details), clientIp()));
        } catch (RuntimeException ex) {
            // Auditing must never break the business operation it is observing.
            log.warn("Could not write audit row for action {}: {}", action, ex.getMessage());
        }
    }

    private UserPrincipal currentPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal principal) {
            return principal;
        }
        return null;
    }

    private String clientIp() {
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes) {
            HttpServletRequest request = attributes.getRequest();
            String forwarded = request.getHeader("X-Forwarded-For");
            if (forwarded != null && !forwarded.isBlank()) {
                return forwarded.split(",")[0].trim();
            }
            return request.getRemoteAddr();
        }
        return null;
    }

    private String truncate(String value) {
        if (value == null) {
            return null;
        }
        return value.length() > 1000 ? value.substring(0, 1000) : value;
    }
}
