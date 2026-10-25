package com.womensafety.entity;

import com.womensafety.enums.ResponderAvailability;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * A responder unit (campus security desk, NGO volunteer team, etc.). Responders are
 * deliberately NOT presented as police officers: the organisation field must be filled
 * with the real (for the prototype, fictional) affiliation.
 */
@Entity
@Table(name = "responders")
public class Responder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "badge_code", nullable = false, unique = true, length = 24)
    private String badgeCode;

    @Column(name = "display_name", nullable = false, length = 120)
    private String displayName;

    @Column(nullable = false, length = 160)
    private String organisation;

    @Column(name = "contact_phone", length = 30)
    private String contactPhone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ResponderAvailability availability = ResponderAvailability.AVAILABLE;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Responder() {
        // Required by JPA.
    }

    public static Responder create(String badgeCode, String displayName, String organisation,
                                   String contactPhone, User user) {
        Responder responder = new Responder();
        responder.badgeCode = badgeCode;
        responder.displayName = displayName;
        responder.organisation = organisation;
        responder.contactPhone = contactPhone;
        responder.user = user;
        responder.availability = ResponderAvailability.AVAILABLE;
        return responder;
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public void updateDetails(String displayName, String organisation, String contactPhone) {
        this.displayName = displayName;
        this.organisation = organisation;
        this.contactPhone = contactPhone;
    }

    public void changeAvailability(ResponderAvailability availability) {
        this.availability = availability;
    }

    public boolean isAvailable() {
        return availability == ResponderAvailability.AVAILABLE;
    }

    public Long getId() {
        return id;
    }

    public String getBadgeCode() {
        return badgeCode;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getOrganisation() {
        return organisation;
    }

    public String getContactPhone() {
        return contactPhone;
    }

    public ResponderAvailability getAvailability() {
        return availability;
    }

    public User getUser() {
        return user;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
