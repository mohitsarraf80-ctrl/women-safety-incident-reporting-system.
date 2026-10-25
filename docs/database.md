# Database design

MySQL 8 · InnoDB · utf8mb4 · managed by Flyway (`backend/src/main/resources/db/migration/V1__init_schema.sql`).

## 1. Tables

### `users`
| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | auto-increment |
| `display_name` | VARCHAR(120) | required |
| `email` | VARCHAR(160) | unique, lower-cased |
| `phone` | VARCHAR(30) | optional |
| `password_hash` | VARCHAR(100) | BCrypt |
| `role` | VARCHAR(20) | `CITIZEN`, `ADMIN`, `RESPONDER` |
| `status` | VARCHAR(20) | `ACTIVE`, `DISABLED` |
| `created_at`, `updated_at` | DATETIME(6) | UTC |

### `responders`
| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | |
| `badge_code` | VARCHAR(24) | unique, e.g. `RSP-NIET01` |
| `display_name`, `organisation` | VARCHAR | required |
| `contact_phone` | VARCHAR(30) | optional |
| `availability` | VARCHAR(20) | `AVAILABLE`, `BUSY`, `UNAVAILABLE` |
| `user_id` | BIGINT | nullable, unique FK → `users` (optional login) |

### `incidents`
The core table. Selected columns:

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | internal only |
| `report_id` | VARCHAR(20) | unique public identifier (`WS-XXXXXXXX`) |
| `tracking_code_hash` | VARCHAR(100) | BCrypt of the normalised code |
| `incident_type` | VARCHAR(40) | enum name |
| `description` | TEXT | required |
| `occurred_at`, `submitted_at` | DATETIME(6) | UTC |
| `latitude`, `longitude` | DOUBLE | nullable, always paired |
| `zone_name` | VARCHAR(160) | generalised location |
| `grid_cell` | VARCHAR(40) | `x:y` grid key |
| `severity_score` | INT | 0–100 |
| `priority` | VARCHAR(10) | `LOW` … `CRITICAL` |
| `status` | VARCHAR(20) | lifecycle |
| `anonymous` | BIT(1) | explicit anonymity flag |
| `reporter_user_id` | BIGINT | **NULL for anonymous reports** |
| `responder_id` | BIGINT | nullable |
| `contact_name`, `contact_email`, `contact_phone` | VARCHAR | only for identified reports |
| `base_score`, `night_bonus`, `repeat_bonus`, `evidence_bonus`, `sos_bonus` | INT | auditable breakdown |
| `escalated`, `escalation_reason` | BIT/VARCHAR | manual override |
| `resolution_note`, `resolved_at` | TEXT/DATETIME | resolution |
| `version` | BIGINT | optimistic locking |

Indexes: `status`, `priority`, `submitted_at`, `grid_cell`, `reporter_user_id`, `responder_id`; unique `report_id`.

### `evidence_metadata`
`stored_filename` (unique, server-generated), `original_filename`, `content_type`, `size_bytes`, `sha256`, `uploaded_at`, FK `incident_id` (cascade delete). The file itself lives outside the database and outside the web root.

### `incident_status_history`
Append-only: `from_status`, `to_status`, `actor_user_id`, `actor_label`, `note`, `changed_at`. Never updated.

### `incident_notes`
Internal administrative notes: `incident_id`, `author_user_id`, `body`, `created_at`. Never exposed publicly.

### `alerts`
`alert_type`, `recipient_category`, `recipient_ref`, `channel` (`IN_APP`, `SMS`, `EMAIL`), `message`, `status` (`PENDING`, `SENT`, `FAILED`, `SIMULATED`), `error_detail`, `attempts`, `deduplication_key` (unique), timestamps.

### `audit_logs`
Security-relevant actions only: actor id/e-mail, action, entity type/id, short details, IP, timestamp. Passwords, tokens and descriptions are never logged.

### `revoked_tokens`
`jti` (unique), `expires_at`, `revoked_at`. Enables server-side logout for stateless JWTs.

## 2. Relationships

- `users 1 — N incidents` (only for identified reports).
- `users 1 — 0..1 responders` (a responder profile may have a login).
- `responders 1 — N incidents` (assignment).
- `incidents 1 — N evidence_metadata / status_history / notes / alerts` (cascade delete on incident).
- `users 1 — N notes / history / audit` (actor references; nullable where an anonymous reporter acted).

## 3. Privacy rules encoded in the schema

1. An anonymous incident has `anonymous = 1`, `reporter_user_id = NULL` and no contact columns. There is no hidden identity column.
2. `tracking_code_hash` is a BCrypt hash; no plaintext tracking secret exists anywhere.
3. Public tracking reads only status fields; the repository query never selects the description for that endpoint.
4. Evidence is never reachable by guessing a filename: downloads require an authorised API call and the stored name is a random UUID.

## 4. Data retention (prototype policy)

This prototype has **no automated retention or deletion job**. For a real deployment:

- define a retention period per record type (e.g. incident 12–24 months, alerts 90 days, audit 12 months);
- provide a documented deletion workflow that also removes evidence files;
- keep anonymous reports unlinkable even after deletion;
- restrict database backups to the same privacy standard.

A `DELETE` of an incident cascades to its evidence metadata, history, notes and alerts, but the evidence file on disk must be deleted separately.

## 5. Migration policy

- Flyway is enabled in all profiles; `ddl-auto` is `validate` (production) and only tests use `create-drop`.
- Migrations are immutable. Changes require a new `V2__…sql` file.
- The dev seeder is idempotent and never runs in tests or production.
