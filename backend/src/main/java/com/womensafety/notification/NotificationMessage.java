package com.womensafety.notification;

import com.womensafety.enums.AlertStatus;
import com.womensafety.enums.AlertType;
import com.womensafety.enums.NotificationChannel;
import com.womensafety.enums.RecipientCategory;

/**
 * A channel-independent notification. The message must never contain the incident
 * description, evidence or precise coordinates.
 */
public record NotificationMessage(
        AlertType type,
        RecipientCategory recipientCategory,
        NotificationChannel channel,
        String recipient,
        String subject,
        String body
) {
    /** Result of one delivery attempt. */
    public record DeliveryOutcome(AlertStatus status, String detail) {
        public static DeliveryOutcome sent(String detail) {
            return new DeliveryOutcome(AlertStatus.SENT, detail);
        }

        public static DeliveryOutcome simulated(String detail) {
            return new DeliveryOutcome(AlertStatus.SIMULATED, detail);
        }

        public static DeliveryOutcome failed(String detail) {
            return new DeliveryOutcome(AlertStatus.FAILED, detail);
        }
    }
}
