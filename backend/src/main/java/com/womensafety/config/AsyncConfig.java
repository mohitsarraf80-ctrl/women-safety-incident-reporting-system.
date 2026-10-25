package com.womensafety.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Dedicated pool for alert delivery. Keeping notification work off the request thread
 * means a slow provider can never block an SOS or an incident submission; failures are
 * persisted on the alert row and retried by the scheduler.
 */
@Configuration
public class AsyncConfig {

    @Bean(name = "alertExecutor")
    public Executor alertExecutor(@Value("${app.alerts.pool-size:4}") int poolSize) {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(poolSize);
        executor.setMaxPoolSize(poolSize);
        executor.setQueueCapacity(500);
        executor.setThreadNamePrefix("alert-");
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(10);
        executor.initialize();
        return executor;
    }
}
