package com.womensafety.notification;

import com.womensafety.enums.NotificationChannel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * The in-app channel is real: the alert row itself is the delivered notification and is
 * displayed in the administrator alert feed. No external call is involved.
 */
@Component
public class InAppNotifier implements Notifier {

    private static final Logger log = LoggerFactory.getLogger(InAppNotifier.class);

    @Override
    public NotificationChannel channel() {
        return NotificationChannel.IN_APP;
    }

    @Override
    public NotificationMessage.DeliveryOutcome deliver(NotificationMessage message) {
        log.info("In-app alert recorded for {} ({})", message.recipientCategory(), message.type());
        return NotificationMessage.DeliveryOutcome.sent("Stored in the in-app administrator alert feed.");
    }
}
