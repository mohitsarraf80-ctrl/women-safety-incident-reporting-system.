package com.womensafety.notification;

import com.womensafety.enums.NotificationChannel;

/**
 * Abstraction over a delivery channel (in-app, SMS, e-mail). The interface is the
 * polymorphism point described in the project presentation: the alert service depends on
 * {@code Notifier}, not on any concrete provider.
 */
public interface Notifier {

    NotificationChannel channel();

    NotificationMessage.DeliveryOutcome deliver(NotificationMessage message);
}
