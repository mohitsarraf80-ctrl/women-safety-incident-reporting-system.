package com.womensafety.entity;

import com.womensafety.enums.IncidentStatus;
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
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * Append-only status history. Nothing is ever overwritten when a case moves forward,
 * so the complete audit trail remains available to an administrator.
 */
@Entity
@Table(name = "incident_status_history", indexes = {
        @Index(name = "idx_history_incident", columnList = "incident_id, changed_at")
})
public class IncidentStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "incident_id", nullable = false)
    private Incident incident;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", length = 20)
    private IncidentStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false, length = 20)
    private IncidentStatus toStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_user_id")
    private User actorUser;

    @Column(name = "actor_label", nullable = false, length = 160)
    private String actorLabel;

    @Column(length = 1000)
    private String note;

    @Column(name = "changed_at", nullable = false)
    private Instant changedAt;

    protected IncidentStatusHistory() {
        // Required by JPA.
    }

    public static IncidentStatusHistory record(Incident incident, IncidentStatus from, IncidentStatus to,
                                               User actor, String actorLabel, String note) {
        IncidentStatusHistory history = new IncidentStatusHistory();
        history.incident = incident;
        history.fromStatus = from;
        history.toStatus = to;
        history.actorUser = actor;
        history.actorLabel = actorLabel;
        history.note = note;
        return history;
    }

    @PrePersist
    void stamp() {
        this.changedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Incident getIncident() {
        return incident;
    }

    public IncidentStatus getFromStatus() {
        return fromStatus;
    }

    public IncidentStatus getToStatus() {
        return toStatus;
    }

    public User getActorUser() {
        return actorUser;
    }

    public String getActorLabel() {
        return actorLabel;
    }

    public String getNote() {
        return note;
    }

    public Instant getChangedAt() {
        return changedAt;
    }
}
