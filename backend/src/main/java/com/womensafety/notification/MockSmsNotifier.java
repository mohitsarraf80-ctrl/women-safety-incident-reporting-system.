package com.womensafety.notification;

import com.womensafety.enums.NotificationChannel;
import org.springframework.stereotype.Component;

/**
 * Development SMS notifier. No gateway is configured for this prototype, therefore every
 * message is reported as SIMULATED. It must never be changed to report SENT unless a real
 * provider confirms delivery.
 */
@Component
public class MockSmsNotifier implements Notifier {

    @Override
    public NotificationChannel channel() {
        return NotificationChannel.SMS;
    }

    @Override
    public NotificationMessage.DeliveryOutcome deliver(NotificationMessage message) {
        return NotificationMessage.DeliveryOutcome.simulated(
                "DEMO MODE: SMS delivery was simulated. No message left this computer.");
    }
}
