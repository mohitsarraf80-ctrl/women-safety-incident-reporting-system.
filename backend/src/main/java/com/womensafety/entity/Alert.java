package com.womensafety.entity;

import com.womensafety.enums.AlertStatus;
import com.womensafety.enums.AlertType;
import com.womensafety.enums.NotificationChannel;
import com.womensafety.enums.RecipientCategory;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * A persisted alert. Alerts are the durable record of "something must be looked at";
 * delivery through SMS/e-mail is simulated in the prototype and labelled SIMULATED.
 */
@Entity
@Table(name = "alerts", indexes = {
        @Index(name = "idx_alerts_status", columnList = "status"),
        @Index(name = "idx_alerts_created_at", columnList = "created_at")
})
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "incident_id", nullable = false)
    private Incident incident;

    @Enumerated(EnumType.STRING)
    @Column(name = "alert_type", nullable = false, length = 40)
    private AlertType alertType;

    @Enumerated(EnumType.STRING)
    @Column(name = "recipient_category", nullable = false, length = 30)
    private RecipientCategory recipientCategory;

    @Column(name = "recipient_ref", nullable = false, length = 160)
    private String recipientRef;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NotificationChannel channel;

    /** Non-sensitive message: no description, evidence or precise coordinates. */
    @Column(nullable = false, length = 500)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AlertStatus status = AlertStatus.PENDING;

    @Column(name = "error_detail", length = 500)
    private String errorDetail;

    @Column(nullable = false)
    private int attempts;

    @Column(name = "deduplication_key", nullable = false, unique = true, length = 120)
    private String deduplicationKey;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "sent_at")
    private Instant sentAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Alert() {
        // Required by JPA.
    }

    public static Alert create(Incident incident, AlertType type, RecipientCategory category,
                               NotificationChannel channel, String recipientRef, String message,
                               String deduplicationKey) {
        Alert alert = new Alert();
        alert.incident = incident;
        alert.alertType = type;
        alert.recipientCategory = category;
        alert.channel = channel;
        alert.recipientRef = recipientRef;
        alert.message = message;
        alert.deduplicationKey = deduplicationKey;
        alert.status = AlertStatus.PENDING;
        return alert;
    }

    @PrePersist
    void stamp() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void touch() {
        updatedAt = Instant.now();
    }

    public void markSent() {
        this.status = AlertStatus.SENT;
        this.sentAt = Instant.now();
        this.attempts++;
    }

    public void markSimulated() {
        this.status = AlertStatus.SIMULATED;
        this.sentAt = Instant.now();
        this.attempts++;
    }

    public void markFailed(String error) {
        this.status = AlertStatus.FAILED;
        this.errorDetail = error == null ? "Unknown delivery error" : error.substring(0, Math.min(500, error.length()));
        this.attempts++;
    }

    public void resetForRetry() {
        this.status = AlertStatus.PENDING;
        this.errorDetail = null;
    }

    public Long getId() {
        return id;
    }

    public Incident getIncident() {
        return incident;
    }

    public AlertType getAlertType() {
        return alertType;
    }

    public RecipientCategory getRecipientCategory() {
        return recipientCategory;
    }

    public String getRecipientRef() {
        return recipientRef;
    }

    public NotificationChannel getChannel() {
        return channel;
    }

    public String getMessage() {
        return message;
    }

    public AlertStatus getStatus() {
        return status;
    }

    public String getErrorDetail() {
        return errorDetail;
    }

    public int getAttempts() {
        return attempts;
    }

    public String getDeduplicationKey() {
        return deduplicationKey;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getSentAt() {
        return sentAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
