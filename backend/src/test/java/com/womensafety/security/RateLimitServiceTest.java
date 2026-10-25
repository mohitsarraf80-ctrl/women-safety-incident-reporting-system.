package com.womensafety.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class RateLimitServiceTest {

    @Test
    @DisplayName("The per-minute allowance is enforced per bucket and per client")
    void enforcesLimit() {
        RateLimitService service = new RateLimitService(3, 5, 5, 5);
        for (int i = 0; i < 3; i++) {
            assertThat(service.tryAcquire("login", "1.2.3.4")).isTrue();
        }
        assertThat(service.tryAcquire("login", "1.2.3.4")).isFalse();
        assertThat(service.tryAcquire("login", "5.6.7.8")).isTrue();
        assertThat(service.tryAcquire("tracking", "1.2.3.4")).isTrue();
    }
}
