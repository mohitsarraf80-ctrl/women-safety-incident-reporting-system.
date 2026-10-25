-- Women Safety Incident Reporting Platform
-- V1: initial relational schema (MySQL 8.x)
--
-- Design notes
--  * Anonymous incidents never store a reporter reference, a name or contact details.
--  * Anonymous tracking credentials are stored as BCrypt hashes only.
--  * Severity components are persisted so the admin detail view can show a breakdown.
--  * Status history and audit rows are append-only.

CREATE TABLE users (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    display_name  VARCHAR(120) NOT NULL,
    email         VARCHAR(160) NOT NULL,
    phone         VARCHAR(30)  NULL,
    password_hash VARCHAR(100) NOT NULL,
    role          VARCHAR(20)  NOT NULL,
    status        VARCHAR(20)  NOT NULL,
    created_at    DATETIME(6)  NOT NULL,
    updated_at    DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_users_email UNIQUE (email)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE responders (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    badge_code     VARCHAR(24)  NOT NULL,
    display_name   VARCHAR(120) NOT NULL,
    organisation   VARCHAR(160) NOT NULL,
    contact_phone  VARCHAR(30)  NULL,
    availability   VARCHAR(20)  NOT NULL,
    user_id        BIGINT       NULL,
    created_at     DATETIME(6)  NOT NULL,
    updated_at     DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_responders_badge UNIQUE (badge_code),
    CONSTRAINT uk_responders_user UNIQUE (user_id),
    CONSTRAINT fk_responders_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE incidents (
    id                          BIGINT       NOT NULL AUTO_INCREMENT,
    report_id                   VARCHAR(20)  NOT NULL,
    tracking_code_hash          VARCHAR(100) NOT NULL,
    incident_type               VARCHAR(40)  NOT NULL,
    description                 TEXT         NOT NULL,
    occurred_at                 DATETIME(6)  NOT NULL,
    submitted_at                DATETIME(6)  NOT NULL,
    latitude                    DOUBLE       NULL,
    longitude                   DOUBLE       NULL,
    zone_name                   VARCHAR(160) NULL,
    grid_cell                   VARCHAR(40)  NULL,
    severity_score              INT          NOT NULL,
    priority                    VARCHAR(10)  NOT NULL,
    status                      VARCHAR(20)  NOT NULL,
    anonymous                   BIT(1)       NOT NULL,
    reporter_user_id            BIGINT       NULL,
    responder_id                BIGINT       NULL,
    requires_immediate_assistance BIT(1)     NOT NULL DEFAULT b'0',
    sos_triggered               BIT(1)       NOT NULL DEFAULT b'0',
    contact_name                VARCHAR(120) NULL,
    contact_email               VARCHAR(160) NULL,
    contact_phone               VARCHAR(30)  NULL,
    base_score                  INT          NOT NULL,
    night_bonus                 INT          NOT NULL,
    repeat_bonus                INT          NOT NULL,
    evidence_bonus              INT          NOT NULL,
    sos_bonus                   INT          NOT NULL,
    escalated                   BIT(1)       NOT NULL DEFAULT b'0',
    escalation_reason           VARCHAR(500) NULL,
    resolution_note             TEXT         NULL,
    resolved_at                 DATETIME(6)  NULL,
    updated_at                  DATETIME(6)  NOT NULL,
    version                     BIGINT       NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT uk_incidents_report_id UNIQUE (report_id),
    CONSTRAINT fk_incidents_reporter FOREIGN KEY (reporter_user_id) REFERENCES users (id),
    CONSTRAINT fk_incidents_responder FOREIGN KEY (responder_id) REFERENCES responders (id),
    INDEX idx_incidents_status (status),
    INDEX idx_incidents_priority (priority),
    INDEX idx_incidents_submitted_at (submitted_at),
    INDEX idx_incidents_grid_cell (grid_cell),
    INDEX idx_incidents_reporter (reporter_user_id),
    INDEX idx_incidents_responder (responder_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE evidence_metadata (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    incident_id       BIGINT       NOT NULL,
    stored_filename   VARCHAR(160) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    content_type      VARCHAR(100) NOT NULL,
    size_bytes        BIGINT       NOT NULL,
    sha256            VARCHAR(64)  NOT NULL,
    uploaded_at       DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_evidence_stored_filename UNIQUE (stored_filename),
    CONSTRAINT fk_evidence_incident FOREIGN KEY (incident_id) REFERENCES incidents (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE incident_status_history (
    id            BIGINT        NOT NULL AUTO_INCREMENT,
    incident_id   BIGINT        NOT NULL,
    from_status   VARCHAR(20)   NULL,
    to_status     VARCHAR(20)   NOT NULL,
    actor_user_id BIGINT        NULL,
    actor_label   VARCHAR(160)  NOT NULL,
    note          VARCHAR(1000) NULL,
    changed_at    DATETIME(6)   NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_history_incident FOREIGN KEY (incident_id) REFERENCES incidents (id) ON DELETE CASCADE,
    CONSTRAINT fk_history_actor FOREIGN KEY (actor_user_id) REFERENCES users (id),
    INDEX idx_history_incident (incident_id, changed_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE incident_notes (
    id             BIGINT        NOT NULL AUTO_INCREMENT,
    incident_id    BIGINT        NOT NULL,
    author_user_id BIGINT        NOT NULL,
    body           VARCHAR(2000) NOT NULL,
    created_at     DATETIME(6)   NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_notes_incident FOREIGN KEY (incident_id) REFERENCES incidents (id) ON DELETE CASCADE,
    CONSTRAINT fk_notes_author FOREIGN KEY (author_user_id) REFERENCES users (id),
    INDEX idx_notes_incident (incident_id, created_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE alerts (
    id                 BIGINT       NOT NULL AUTO_INCREMENT,
    incident_id        BIGINT       NOT NULL,
    alert_type         VARCHAR(40)  NOT NULL,
    recipient_category VARCHAR(30)  NOT NULL,
    recipient_ref      VARCHAR(160) NOT NULL,
    channel            VARCHAR(20)  NOT NULL,
    message            VARCHAR(500) NOT NULL,
    status             VARCHAR(20)  NOT NULL,
    error_detail       VARCHAR(500) NULL,
    attempts           INT          NOT NULL DEFAULT 0,
    deduplication_key  VARCHAR(120) NOT NULL,
    created_at         DATETIME(6)  NOT NULL,
    sent_at            DATETIME(6)  NULL,
    updated_at         DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_alerts_dedup UNIQUE (deduplication_key),
    CONSTRAINT fk_alerts_incident FOREIGN KEY (incident_id) REFERENCES incidents (id) ON DELETE CASCADE,
    INDEX idx_alerts_status (status),
    INDEX idx_alerts_created_at (created_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE audit_logs (
    id            BIGINT        NOT NULL AUTO_INCREMENT,
    actor_user_id BIGINT        NULL,
    actor_email   VARCHAR(160)  NULL,
    action        VARCHAR(60)   NOT NULL,
    entity_type   VARCHAR(40)   NOT NULL,
    entity_id     VARCHAR(60)   NULL,
    details       VARCHAR(1000) NULL,
    ip_address    VARCHAR(60)   NULL,
    created_at    DATETIME(6)   NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_audit_actor FOREIGN KEY (actor_user_id) REFERENCES users (id),
    INDEX idx_audit_created_at (created_at),
    INDEX idx_audit_action (action)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE revoked_tokens (
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    jti        VARCHAR(64) NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    revoked_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_revoked_tokens_jti UNIQUE (jti),
    INDEX idx_revoked_tokens_expires (expires_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
