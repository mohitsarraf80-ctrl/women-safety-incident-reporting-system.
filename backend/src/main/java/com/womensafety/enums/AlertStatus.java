package com.womensafety.enums;

/**
 * Delivery state of an alert. SIMULATED is deliberately separate from SENT: in the
 * prototype no SMS or e-mail provider is configured, so the UI must never present a
 * simulated message as a genuinely delivered one.
 */
public enum AlertStatus {
    PENDING,
    SENT,
    FAILED,
    SIMULATED
}
