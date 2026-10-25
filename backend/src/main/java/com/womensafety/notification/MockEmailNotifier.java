package com.womensafety.notification;

import com.womensafety.enums.NotificationChannel;
import org.springframework.stereotype.Component;

/**
 * Development e-mail notifier. No SMTP provider is configured for this prototype, so the
 * outcome is SIMULATED and the UI labels it accordingly.
 */
@Component
public class MockEmailNotifier implements Notifier {

    @Override
    public NotificationChannel channel() {
        return NotificationChannel.EMAIL;
    }

    @Override
    public NotificationMessage.DeliveryOutcome deliver(NotificationMessage message) {
        return NotificationMessage.DeliveryOutcome.simulated(
                "DEMO MODE: e-mail delivery was simulated. No message left this computer.");
    }
}
