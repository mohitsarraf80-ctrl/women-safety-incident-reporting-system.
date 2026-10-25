package com.womensafety.scheduler;

import com.womensafety.security.JwtTokenService;
import com.womensafety.service.AlertService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Retries failed alert deliveries with a bounded attempt count, and clears expired token
 * revocations. Runs outside the request cycle so a slow provider never blocks a submission.
 */
@Component
public class AlertRetryScheduler {

    private static final Logger log = LoggerFactory.getLogger(AlertRetryScheduler.class);
    private static final int MAX_ATTEMPTS = 3;

    private final AlertService alertService;
    private final JwtTokenService jwtTokenService;

    public AlertRetryScheduler(AlertService alertService, JwtTokenService jwtTokenService) {
        this.alertService = alertService;
        this.jwtTokenService = jwtTokenService;
    }

    @Scheduled(initialDelayString = "${app.alerts.retry-initial-delay-ms:60000}",
            fixedDelayString = "${app.alerts.retry-interval-ms:120000}")
    public void retryFailedAlerts() {
        try {
            int retried = alertService.retryFailedAlerts(MAX_ATTEMPTS);
            if (retried > 0) {
                log.info("Retried {} failed alert(s)", retried);
            }
        } catch (RuntimeException ex) {
            log.warn("Alert retry cycle failed: {}", ex.getMessage());
        }
    }

    @Scheduled(cron = "0 15 3 * * *")
    public void purgeExpiredRevocations() {
        int removed = jwtTokenService.purgeExpiredRevocations();
        if (removed > 0) {
            log.info("Removed {} expired token revocation rows", removed);
        }
    }
}
