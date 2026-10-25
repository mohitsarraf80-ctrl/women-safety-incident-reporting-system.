package com.womensafety.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * Security-relevant audit trail. Passwords, tokens and full incident descriptions are
 * deliberately never written here.
 */
@Entity
@Table(name = "audit_logs", indexes = {
        @Index(name = "idx_audit_created_at", columnList = "created_at"),
        @Index(name = "idx_audit_action", columnList = "action")
})
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "actor_user_id")
    private Long actorUserId;

    @Column(name = "actor_email", length = 160)
    private String actorEmail;

    @Column(nullable = false, length = 60)
    private String action;

    @Column(name = "entity_type", nullable = false, length = 40)
    private String entityType;

    @Column(name = "entity_id", length = 60)
    private String entityId;

    @Column(length = 1000)
    private String details;

    @Column(name = "ip_address", length = 60)
    private String ipAddress;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected AuditLog() {
        // Required by JPA.
    }

    public static AuditLog of(Long actorUserId, String actorEmail, String action, String entityType,
                              String entityId, String details, String ipAddress) {
        AuditLog log = new AuditLog();
        log.actorUserId = actorUserId;
        log.actorEmail = actorEmail;
        log.action = action;
        log.entityType = entityType;
        log.entityId = entityId;
        log.details = details;
        log.ipAddress = ipAddress;
        return log;
    }

    @PrePersist
    void stamp() {
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Long getActorUserId() {
        return actorUserId;
    }

    public String getActorEmail() {
        return actorEmail;
    }

    public String getAction() {
        return action;
    }

    public String getEntityType() {
        return entityType;
    }

    public String getEntityId() {
        return entityId;
    }

    public String getDetails() {
        return details;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
