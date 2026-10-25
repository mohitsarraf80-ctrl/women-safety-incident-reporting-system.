package com.womensafety.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Small fixed-window rate limiter for abuse-prone unauthenticated endpoints (login,
 * anonymous reporting, report tracking, SOS). It is intentionally in-memory: a single
 * prototype instance is protected, and a real deployment would move this to Redis or a
 * gateway. Documented in the README's security limitations.
 */
@Service
public class RateLimitService {

    private static final long WINDOW_SECONDS = 60;

    private final Map<String, Window> windows = new ConcurrentHashMap<>();
    private final int loginLimit;
    private final int trackingLimit;
    private final int reportLimit;
    private final int sosLimit;

    public RateLimitService(@Value("${app.security.rate-limit.login-per-minute:8}") int loginLimit,
                            @Value("${app.security.rate-limit.tracking-per-minute:15}") int trackingLimit,
                            @Value("${app.security.rate-limit.report-per-minute:8}") int reportLimit,
                            @Value("${app.security.rate-limit.sos-per-minute:6}") int sosLimit) {
        this.loginLimit = loginLimit;
        this.trackingLimit = trackingLimit;
        this.reportLimit = reportLimit;
        this.sosLimit = sosLimit;
    }

    public int limitFor(String bucket) {
        return switch (bucket) {
            case "login" -> loginLimit;
            case "tracking" -> trackingLimit;
            case "report" -> reportLimit;
            case "sos" -> sosLimit;
            default -> 30;
        };
    }

    /** @return true when the caller is still inside the allowance for the current minute. */
    public boolean tryAcquire(String bucket, String clientKey) {
        long window = Instant.now().getEpochSecond() / WINDOW_SECONDS;
        String key = bucket + "|" + clientKey;
        Window entry = windows.compute(key, (k, existing) -> {
            if (existing == null || existing.window != window) {
                return new Window(window, new AtomicInteger(1));
            }
            existing.count.incrementAndGet();
            return existing;
        });
        return entry.count.get() <= limitFor(bucket);
    }

    /** Test/diagnostic helper. */
    public void reset() {
        windows.clear();
    }

    @Scheduled(fixedDelay = 600_000)
    void evictStaleWindows() {
        long current = Instant.now().getEpochSecond() / WINDOW_SECONDS;
        windows.entrySet().removeIf(entry -> entry.getValue().window < current - 2);
    }

    private static final class Window {
        private final long window;
        private final AtomicInteger count;

        private Window(long window, AtomicInteger count) {
            this.window = window;
            this.count = count;
        }
    }
}
