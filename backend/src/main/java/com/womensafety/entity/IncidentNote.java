package com.womensafety.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

/** Internal administrative note attached to an incident. Never exposed publicly. */
@Entity
@Table(name = "incident_notes", indexes = {
        @Index(name = "idx_notes_incident", columnList = "incident_id, created_at")
})
public class IncidentNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "incident_id", nullable = false)
    private Incident incident;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_user_id", nullable = false)
    private User author;

    @Column(nullable = false, length = 2000)
    private String body;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected IncidentNote() {
        // Required by JPA.
    }

    public static IncidentNote create(Incident incident, User author, String body) {
        IncidentNote note = new IncidentNote();
        note.incident = incident;
        note.author = author;
        note.body = body;
        return note;
    }

    @PrePersist
    void stamp() {
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Incident getIncident() {
        return incident;
    }

    public User getAuthor() {
        return author;
    }

    public String getBody() {
        return body;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
