# 5–7 minute demonstration script

**Goal:** show a working full-stack system, not slides. Keep the browser at 100% zoom, close unrelated tabs and pre-warm the app (open landing + admin login once) so the first request is not slowed by JIT/compile.

**Before you start**

```powershell
# terminal 1
cd backend
mvn spring-boot:run "-Dspring-boot.run.profiles=dev"

# terminal 2
cd frontend
npm run dev
```

- Confirm <http://localhost:8080/actuator/health> returns `UP`.
- Confirm <http://localhost:5173> loads.
- Keep a second browser profile (or incognito) ready for the admin login.
- Mention up front: *“SOS and SMS/e-mail delivery are simulated; everything else is a real API + MySQL record.”*

---

## 0:00 — Landing page (30 s)

1. Open <http://localhost:5173>.
2. Point out the hero, the **severity explainer** card and the four trust points.
3. Say: *“Reporting works without an account. Prioritisation is automatic and the score is computed on the server.”*
4. Click **Report an incident**.

## 0:30 — Anonymous report (90 s)

1. Choose **Stalking** (base 35).
2. Description: *“A man followed me from the metro exit towards the auto stand and kept changing direction whenever I looked back. I waited near the ticket counter until he left.”*
3. Date/time: choose **yesterday, 22:30** (night bonus).
4. Zone: **Sector 62 Metro Station**.
5. Optionally click **Use my location** — if permission is denied, say: *“Location is optional; the report still works.”*
6. Leave **Report anonymously** ticked. Point out: *“No name, phone or account is stored.”*
7. Submit.

**Explain while it saves:** the browser sends one multipart request; the backend validates, replaces any missing location with the zone, counts earlier reports in the same 500 m cell, computes `35 + 15 night + repeat + …`, caps at 100 and stores the report, evidence metadata and history in one transaction.

## 2:00 — Report ID and tracking (45 s)

1. On the confirmation page, point out the **Report ID**, the **one-time tracking code**, the priority and the prototype warning.
2. Say: *“Only a BCrypt hash of the tracking code is stored — the plaintext is shown once.”*
3. Click **Track this report**.
4. Show the status timeline and privacy note: *“No description, evidence or exact coordinates here.”*
5. Optional: change one character in the tracking code and show the identical `404` — no report enumeration.

## 2:45 — Administrator dashboard (60 s)

1. Open a private window and sign in as `admin@demo.local` / `Demo@12345`.
2. Dashboard shows: total, today, pending, critical, **active SOS**, **hotspots (30 days)**.
3. Say: *“These are live SQL aggregates; the dashboard auto-refreshes every 30 seconds.”*
4. Point at the **priority mix** and the **case pipeline**.

## 3:45 — Triage the new report (75 s)

1. **Incidents** → the queue is sorted by severity.
2. Search for the Report ID from step 2 (or open the newest HIGH case).
3. Detail page shows **severity breakdown** (`base + night + repeat + evidence + SOS`), location, history and alerts.
4. Click **Assign responder** → choose *Metro Assistance Unit* → confirm. The status becomes **Assigned** and history gains an entry.
5. Click **Update status** → **In progress** with a note.
6. Then **Update status** → **Resolved**; type a resolution note shorter than 10 characters first to show the rejection, then a proper note. Say: *“The backend enforces the lifecycle and the resolution rule; the UI cannot bypass it.”*
7. Optional: **Escalate to CRITICAL** on a low-score case to show that a human can always override the algorithm.

## 5:00 — SOS and alerts (45 s)

1. Go to **SOS** (public page).
2. Click the SOS button → confirmation dialog explains what will happen.
3. Keep “Share my location” ticked, activate.
4. Result shows **reference**, **Report ID**, **tracking code**, and **notification status `SIMULATED`**.
5. Say: *“An in-app alert is real and visible to the admin. No SMS, e-mail or police call was made — the label says SIMULATED because that is the truth.”*
6. In the admin window open **Alerts** and show the SOS alert, its channel and delivery status.

## 5:45 — Hotspot map (45 s)

1. Admin → **Hotspot map**.
2. Show the grid markers, the legend and the threshold (`mean + 1 SD`).
3. Say: *“Cells are ~500 m via a local projection centred on Noida. Only cells with reports enter the mean and standard deviation — this is documented.”*
4. Open the hotspot table and note the cluster at Sector 62.
5. Read the disclaimer: *“Reports, not verified crime data; not a prediction of danger.”*

## 6:30 — Java OOP and close (30 s)

Open the code (VS Code) and show three files:

- `SeverityScoringService` + `AbstractSeverityStrategy` → **abstraction, inheritance, polymorphism** (one strategy per category).
- `Notifier` + `InAppNotifier` / `MockSmsNotifier` → **interface + polymorphism**; simulated channels cannot report `SENT`.
- `Incident` entity → **encapsulation** (`applySeverity`, `assignTo`, `escalate`); `IncidentStatus` → a validated transition graph.
- Mention `HashMap` (grid counting), `PriorityQueue` (hotspot ranking), `@Async` (alert delivery), JUnit + MockMvc tests (31 passing).

Close with: *“Frontend, backend, MySQL, migrations, authentication, RBAC, algorithms and tests are all running locally. The only simulated parts are external notifications.”*

---

## What is simulated (say this clearly)

| Feature | Status |
|---|---|
| Incident record, Report ID, tracking code | **Real** (MySQL) |
| Severity score, priority, status history | **Real** (Java) |
| In-app alerts | **Real** (MySQL rows) |
| SOS record + coordinates | **Real** |
| SMS / e-mail delivery | **Simulated** (`SIMULATED`, never `SENT`) |
| Police / ambulance / NGO contact | **Not implemented** |
| Hotspot calculation | **Real**, from stored reports |
| Demo dataset | **Fictional** |

## Likely questions

- **Why not JPA inheritance for incident types?** A single table with an enum keeps filtering, pagination and migrations simple; the polymorphism requirement is met by the scoring strategies. Trade-off documented in `docs/architecture.md`.
- **Am I really anonymous?** Application-level yes: no identity column is populated and no account link is stored. Network-level no: logs or the network provider may hold metadata.
- **What if the score is wrong?** It is a triage aid; a human can review every case and escalate regardless of score.
- **What about duplicate alerts?** A unique deduplication key prevents duplicates; retries are bounded to three attempts.
- **Is the DB schema real?** Yes — Flyway `V1__init_schema.sql`, Hibernate `validate`, indexes and foreign keys included.

## Fallback if something is down

- Backend not starting → show `mvn test` results and the API collection in Postman.
- Map tiles blank → the grid markers and the hotspot table still work offline; explain that tiles come from OpenStreetMap.
- Demo data missing → submit a fresh report live; never claim seeded data exists when it does not.
