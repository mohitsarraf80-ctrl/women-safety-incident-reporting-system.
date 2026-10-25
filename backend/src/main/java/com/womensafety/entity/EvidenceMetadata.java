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

/** Metadata row for one uploaded evidence file. The file itself lives outside the web root. */
@Entity
@Table(name = "evidence_metadata", indexes = {
        @Index(name = "idx_evidence_incident", columnList = "incident_id")
})
public class EvidenceMetadata {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "incident_id", nullable = false)
    private Incident incident;

    @Column(name = "stored_filename", nullable = false, unique = true, length = 160)
    private String storedFilename;

    @Column(name = "original_filename", nullable = false, length = 255)
    private String originalFilename;

    @Column(name = "content_type", nullable = false, length = 100)
    private String contentType;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Column(nullable = false, length = 64)
    private String sha256;

    @Column(name = "uploaded_at", nullable = false)
    private Instant uploadedAt;

    protected EvidenceMetadata() {
        // Required by JPA.
    }

    public static EvidenceMetadata create(Incident incident, String storedFilename, String originalFilename,
                                          String contentType, long sizeBytes, String sha256) {
        EvidenceMetadata metadata = new EvidenceMetadata();
        metadata.incident = incident;
        metadata.storedFilename = storedFilename;
        metadata.originalFilename = originalFilename;
        metadata.contentType = contentType;
        metadata.sizeBytes = sizeBytes;
        metadata.sha256 = sha256;
        return metadata;
    }

    @PrePersist
    void stamp() {
        this.uploadedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Incident getIncident() {
        return incident;
    }

    public String getStoredFilename() {
        return storedFilename;
    }

    public String getOriginalFilename() {
        return originalFilename;
    }

    public String getContentType() {
        return contentType;
    }

    public long getSizeBytes() {
        return sizeBytes;
    }

    public String getSha256() {
        return sha256;
    }

    public Instant getUploadedAt() {
        return uploadedAt;
    }
}
