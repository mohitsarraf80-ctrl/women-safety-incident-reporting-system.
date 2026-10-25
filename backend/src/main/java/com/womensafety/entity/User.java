package com.womensafety.entity;

import com.womensafety.enums.AccountStatus;
import com.womensafety.enums.UserRole;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * A platform account. Encapsulation: every field is private and can only be changed
 * through controlled methods ({@link #changePasswordHash}, {@link #disable()} ...).
 */
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "display_name", nullable = false, length = 120)
    private String displayName;

    @Column(nullable = false, unique = true, length = 160)
    private String email;

    @Column(length = 30)
    private String phone;

    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserRole role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AccountStatus status = AccountStatus.ACTIVE;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected User() {
        // Required by JPA.
    }

    public static User create(String displayName, String email, String passwordHash, UserRole role) {
        User user = new User();
        user.displayName = displayName;
        user.email = email.toLowerCase();
        user.passwordHash = passwordHash;
        user.role = role;
        user.status = AccountStatus.ACTIVE;
        return user;
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

    public void changePasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public void updateProfile(String displayName, String phone) {
        this.displayName = displayName;
        this.phone = phone;
    }

    public void disable() {
        this.status = AccountStatus.DISABLED;
    }

    public void enable() {
        this.status = AccountStatus.ACTIVE;
    }

    public boolean isActive() {
        return status == AccountStatus.ACTIVE;
    }

    public boolean isAdmin() {
        return role == UserRole.ADMIN;
    }

    public boolean isResponder() {
        return role == UserRole.RESPONDER;
    }

    public boolean isCitizen() {
        return role == UserRole.CITIZEN;
    }

    public Long getId() {
        return id;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getEmail() {
        return email;
    }

    public String getPhone() {
        return phone;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public UserRole getRole() {
        return role;
    }

    public AccountStatus getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
