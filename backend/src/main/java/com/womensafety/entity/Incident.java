package com.womensafety.entity;

import com.womensafety.enums.IncidentStatus;
import com.womensafety.enums.IncidentType;
import com.womensafety.enums.PriorityLevel;
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
import jakarta.persistence.Version;

import java.time.Instant;

/**
 * Persisted incident. The original design used an {@code Incident} class hierarchy
 * (Harassment, Assault, ...). For JPA a single table with an {@link IncidentType} enum is
 * far more maintainable, so the inheritance/polymorphism requirement is demonstrated in
 * {@code com.womensafety.scoring} instead (strategies) and documented in the README.
 */
@Entity
@Table(name = "incidents", indexes = {
        @Index(name = "idx_incidents_status", columnList = "status"),
        @Index(name = "idx_incidents_priority", columnList = "priority"),
        @Index(name = "idx_incidents_submitted_at", columnList = "submitted_at"),
        @Index(name = "idx_incidents_grid_cell", columnList = "grid_cell")
})
public class Incident {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "report_id", nullable = false, unique = true, length = 20)
    private String reportId;

    /**
     * BCrypt hash of the tracking code shown to the reporter once. The plaintext code is
     * never stored, so a database leak does not expose a tracking credential.
     */
    @Column(name = "tracking_code_hash", nullable = false, length = 100)
    private String trackingCodeHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "incident_type", nullable = false, length = 40)
    private IncidentType incidentType;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;

    @Column(name = "submitted_at", nullable = false)
    private Instant submittedAt;

    @Column
    private Double latitude;

    @Column
    private Double longitude;

    @Column(name = "zone_name", length = 160)
    private String zoneName;

    @Column(name = "grid_cell", length = 40)
    private String gridCell;

    @Column(name = "severity_score", nullable = false)
    private int severityScore;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private PriorityLevel priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private IncidentStatus status = IncidentStatus.SUBMITTED;

    @Column(nullable = false)
    private boolean anonymous;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_user_id")
    private User reporter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responder_id")
    private Responder responder;

    @Column(name = "requires_immediate_assistance", nullable = false)
    private boolean requiresImmediateAssistance;

    @Column(name = "sos_triggered", nullable = false)
    private boolean sosTriggered;

    @Column(name = "contact_name", length = 120)
    private String contactName;

    @Column(name = "contact_email", length = 160)
    private String contactEmail;

    @Column(name = "contact_phone", length = 30)
    private String contactPhone;

    @Column(name = "base_score", nullable = false)
    private int baseScore;

    @Column(name = "night_bonus", nullable = false)
    private int nightBonus;

    @Column(name = "repeat_bonus", nullable = false)
    private int repeatBonus;

    @Column(name = "evidence_bonus", nullable = false)
    private int evidenceBonus;

    @Column(name = "sos_bonus", nullable = false)
    private int sosBonus;

    @Column(nullable = false)
    private boolean escalated;

    @Column(name = "escalation_reason", length = 500)
    private String escalationReason;

    @Column(name = "resolution_note", columnDefinition = "TEXT")
    private String resolutionNote;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(nullable = false)
    private Long version;

    protected Incident() {
        // Required by JPA.
    }

    public static Incident create(String reportId, String trackingCodeHash, IncidentType type, String description,
                                  Instant occurredAt, String zoneName, Double latitude, Double longitude,
                                  String gridCell, boolean anonymous, User reporter) {
        Incident incident = new Incident();
        incident.reportId = reportId;
        incident.trackingCodeHash = trackingCodeHash;
        incident.incidentType = type;
        incident.description = description;
        incident.occurredAt = occurredAt;
        incident.zoneName = zoneName;
        incident.latitude = latitude;
        incident.longitude = longitude;
        incident.gridCell = gridCell;
        incident.anonymous = anonymous;
        incident.reporter = anonymous ? null : reporter;
        incident.status = IncidentStatus.SUBMITTED;
        incident.submittedAt = Instant.now();
        incident.updatedAt = incident.submittedAt;
        return incident;
    }

    @PrePersist
    void touch() {
        Instant now = Instant.now();
        if (submittedAt == null) {
            submittedAt = now;
        }
        updatedAt = now;
    }

    public void applySeverity(int score, PriorityLevel priority, int base, int night, int repeat,
                              int evidence, int sos) {
        this.severityScore = score;
        this.priority = priority;
        this.baseScore = base;
        this.nightBonus = night;
        this.repeatBonus = repeat;
        this.evidenceBonus = evidence;
        this.sosBonus = sos;
        touchUpdated();
    }

    public void attachContactDetails(String name, String email, String phone) {
        if (!anonymous) {
            this.contactName = name;
            this.contactEmail = email;
            this.contactPhone = phone;
        }
    }

    public void markSos() {
        this.sosTriggered = true;
        this.requiresImmediateAssistance = true;
    }

    public void requestImmediateAssistance(boolean requested) {
        this.requiresImmediateAssistance = requested;
    }

    /**
     * Demo-data helper: lets the development seeder place fictional incidents across the
     * last few weeks so the analytics charts and hotspot map have a realistic spread.
     * Never called by production code paths.
     */
    public void overrideTimestampsForDemo(Instant submittedAt, Instant occurredAt) {
        this.submittedAt = submittedAt;
        this.updatedAt = submittedAt;
        if (occurredAt != null) {
            this.occurredAt = occurredAt;
        }
    }

    /** Demo-data helper: gives seeded resolved cases a realistic resolution timestamp. */
    public void overrideResolvedAtForDemo(Instant resolvedAt) {
        this.resolvedAt = resolvedAt;
        this.updatedAt = resolvedAt.isAfter(Instant.now()) ? Instant.now() : resolvedAt;
    }

    public void updateStatus(IncidentStatus newStatus, String note) {
        this.status = newStatus;
        this.updatedAt = Instant.now();
        if (newStatus == IncidentStatus.RESOLVED) {
            this.resolvedAt = Instant.now();
            this.resolutionNote = note;
        }
    }

    public void assignTo(Responder responder) {
        this.responder = responder;
        this.updatedAt = Instant.now();
        if (this.status == IncidentStatus.SUBMITTED || this.status == IncidentStatus.UNDER_REVIEW) {
            this.status = IncidentStatus.ASSIGNED;
        }
    }

    public void escalate(String reason) {
        this.escalated = true;
        this.escalationReason = reason;
        this.priority = PriorityLevel.CRITICAL;
        this.updatedAt = Instant.now();
    }

    public void addEvidenceBonus() {
        this.evidenceBonus = 5;
        this.severityScore = Math.min(100, this.severityScore + 5);
        recomputePriority();
        touchUpdated();
    }

    public void refreshSeverityScore(int score, PriorityLevel priority) {
        this.severityScore = score;
        this.priority = priority;
        touchUpdated();
    }

    private void recomputePriority() {
        this.priority = PriorityLevel.fromScore(this.severityScore);
    }

    private void touchUpdated() {
        this.updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getReportId() {
        return reportId;
    }

    public String getTrackingCodeHash() {
        return trackingCodeHash;
    }

    public IncidentType getIncidentType() {
        return incidentType;
    }

    public String getDescription() {
        return description;
    }

    public Instant getOccurredAt() {
        return occurredAt;
    }

    public Instant getSubmittedAt() {
        return submittedAt;
    }

    public Double getLatitude() {
        return latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public String getZoneName() {
        return zoneName;
    }

    public String getGridCell() {
        return gridCell;
    }

    public int getSeverityScore() {
        return severityScore;
    }

    public PriorityLevel getPriority() {
        return priority;
    }

    public IncidentStatus getStatus() {
        return status;
    }

    public boolean isAnonymous() {
        return anonymous;
    }

    public User getReporter() {
        return reporter;
    }

    public Responder getResponder() {
        return responder;
    }

    public boolean isRequiresImmediateAssistance() {
        return requiresImmediateAssistance;
    }

    public boolean isSosTriggered() {
        return sosTriggered;
    }

    public String getContactName() {
        return contactName;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public String getContactPhone() {
        return contactPhone;
    }

    public int getBaseScore() {
        return baseScore;
    }

    public int getNightBonus() {
        return nightBonus;
    }

    public int getRepeatBonus() {
        return repeatBonus;
    }

    public int getEvidenceBonus() {
        return evidenceBonus;
    }

    public int getSosBonus() {
        return sosBonus;
    }

    public boolean isEscalated() {
        return escalated;
    }

    public String getEscalationReason() {
        return escalationReason;
    }

    public String getResolutionNote() {
        return resolutionNote;
    }

    public Instant getResolvedAt() {
        return resolvedAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public Long getVersion() {
        return version;
    }
}
