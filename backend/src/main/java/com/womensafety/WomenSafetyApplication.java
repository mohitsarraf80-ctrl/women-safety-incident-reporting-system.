package com.womensafety;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Entry point of the Women Safety Incident Reporting Platform backend.
 *
 * <p>The application is a modular monolith: authentication, incident reporting,
 * severity scoring, alerting, hotspot detection and analytics all live in one
 * Spring Boot process behind a layered package structure.</p>
 */
@SpringBootApplication
@EnableAsync
@EnableScheduling
public class WomenSafetyApplication {

    public static void main(String[] args) {
        SpringApplication.run(WomenSafetyApplication.class, args);
    }
}
