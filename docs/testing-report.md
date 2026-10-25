# Testing report

**Project:** Women Safety Incident Reporting Platform
**Course:** OOTs in Java (CCSE0355) · NIET, Greater Noida
**Tested by:** ____________________  **Date:** __________

---

## 1. Summary

| Area | Result |
|---|---|
| Backend unit + integration tests (JUnit 5 / Mockito / MockMvc) | 31 / 31 passed |
| Frontend unit/component tests (Vitest + Testing Library) | 21 / 21 passed |
| API acceptance checks (live Spring Boot + MySQL) | 51 / 51 passed |
| Frontend type-check (`tsc --noEmit`, strict) | Passed |
| Frontend production build (Vite) | Passed |
| Database migration (`V1__init_schema.sql`) | Applied successfully to MySQL 8 |
| Demo seed data | 27 incidents, 4 responders, 4 accounts, 58 alert rows |

Environment used: Windows 11, JDK 25 runtime with `--release 17`, Spring Boot 3.5.16, MySQL 8.0.43, Node 24, npm 11, Chrome (manual UI checks).

---

## 2. Automated test inventory

| # | Class | Tests | Area |
|---|---|---:|---|
| 1 | `SeverityScoringServiceTest` | 7 | Base scores, night boundaries, repeat cap, evidence, SOS, 100 cap, thresholds |
| 2 | `HotspotDetectionServiceTest` | 6 | Cluster, empty, one cell, identical counts, invalid coords, map |
| 3 | `IncidentStatusTest` | 2 | Transition graph |
| 4 | `LocalEvidenceStorageServiceTest` | 3 | Magic bytes, traversal-safe names, size limit |
| 5 | `ReportIdGeneratorTest` | 2 | Uniqueness and character set |
| 6 | `RateLimitServiceTest` | 1 | Per-bucket enforcement |
| 7 | `PlatformIntegrationTest` | 10 | End-to-end API behaviour with H2 |
| 8 | `reportSchema.test.ts` | 8 | Report form validation (description, future date, coordinate pair, zone, email) |
| 9 | `format.test.ts` | 6 | Date/time, duration, byte and plural formatting |
| 10 | `Badge.test.tsx` | 4 | Priority/status/availability/simulated labels |
| 11 | `ProtectedRoute.test.tsx` | 3 | Unauthenticated redirect, role mismatch redirect, admin access |

### Coverage matrix (brief requirements)

| Requirement | Test(s) |
|---|---|
| Severity algorithm + thresholds | SeverityScoringServiceTest |
| Repeat-report bonus + self-exclusion | SeverityScoringServiceTest + integration (repeat count path) |
| Hotspot algorithm + edge cases | HotspotDetectionServiceTest |
| Anonymous report + no identity stored | PlatformIntegrationTest.anonymousReportPersistsAndTracks |
| Secure tracking + no leakage | anonymousReportPersistsAndTracks, wrongTrackingCodeIsRejected |
| RBAC (401/403) | citizenCannotAccessAdminEndpoints, responderIsolation |
| Status transitions + resolution note | administratorWorkflow |
| Evidence validation + bonus | evidenceUploadAddsBonus, LocalEvidenceStorageServiceTest |
| Logout invalidation | logoutRevokesToken |
| SOS persistence | sosCreatesIncidentAndAlert |
| Input validation | invalidReportIsRejected |
| Report ID uniqueness assumption | ReportIdGeneratorTest |

---

## 3. API acceptance checks (executed)

All 51 checks passed against a live backend and MySQL:

- admin / citizen / responder login and roles;
- multipart anonymous report with evidence → `201`, Report ID, tracking code, `evidenceAttached`, severity ≥ 50, 2 alerts;
- tracking with correct and incorrect credentials (generic 404);
- dashboard summary, priority filter, report-ID search, detail, breakdown, evidence metadata, history;
- responder directory and assignment (status → ASSIGNED);
- illegal transition → 409; valid transition → 200; short resolution note → 400; resolution → 200;
- escalation → CRITICAL; internal note;
- SOS creation, location captured, tracking code, status lookup;
- hotspot analysis + map cells;
- analytics overview, charts, response times, CSV export, CSV excludes descriptions;
- alerts list and SIMULATED labels;
- responder queue/profile; responder blocked from admin; citizen blocked from admin; citizen cannot read someone else's anonymous report;
- logout revokes the token; registration; invalid payload rejected.

---

## 4. Manual UI checklist

Use `docs/demo-script.md`. Mark each item.

| # | Check | Expected | Result |
|---|---|---|---|
| 1 | Landing page on 1440px, 768px, 390px | No overflow, nav usable, CTA visible | ☐ |
| 2 | Report form validation | Short description, future date, coordinate pair all rejected with field messages | ☐ |
| 3 | Anonymous submission | Confirmation with ID + code | ☐ |
| 4 | Copy buttons | Copy ID / code to clipboard | ☐ |
| 5 | Tracking page | Timeline renders, wrong code shows generic error | ☐ |
| 6 | SOS confirmation | Dialog explains simulation; cancel does nothing | ☐ |
| 7 | SOS with location denied | Report still created, `locationCaptured=false` | ☐ |
| 8 | Admin dashboard | Counts match the database; refresh works | ☐ |
| 9 | Incident filters | Search, type, priority, status, date range, sorting, pagination | ☐ |
| 10 | Incident detail | Breakdown, evidence download, history, notes | ☐ |
| 11 | Assign responder | Status becomes Assigned, history entry appears | ☐ |
| 12 | Status update | Invalid transitions rejected; resolution note required | ☐ |
| 13 | Escalation | Priority becomes CRITICAL, reason visible | ☐ |
| 14 | Alerts page | Channels and SIMULATED status visible; retry only for FAILED | ☐ |
| 15 | Hotspot map | Markers, legend, threshold, disclaimer | ☐ |
| 16 | Analytics | All charts render, CSV downloads, empty state at a narrow range | ☐ |
| 17 | Responder portal | Only assigned cases; cannot open others | ☐ |
| 18 | Citizen portal | My reports lists only account-linked reports | ☐ |
| 19 | Logout | Returns to login; protected URL redirects | ☐ |
| 20 | 404 page | Unknown route renders the not-found page | ☐ |

---

## 5. Security checks

| Check | Expected | Result |
|---|---|---|
| Citizen calls `/api/admin/**` | 403 | ☐ |
| Responder calls `/api/admin/**` | 403 | ☐ |
| No token on a protected route | 401 | ☐ |
| Token after logout | 401 | ☐ |
| Tracking with a wrong code | 404, no information leak | ☐ |
| Upload a `.png` containing an executable | 400, rejected by magic bytes | ☐ |
| Upload > 5 MB | 400 / 413 | ☐ |
| SQL injection in search | Parameterised, treated as text | ☐ |
| XSS payload in description | Rendered escaped (React) | ☐ |
| CSV export contains `=`-prefixed text | Escaped with a leading apostrophe | ☐ |

---

## 6. Defects found and fixed during development

| # | Defect | Fix |
|---|---|---|
| 1 | Responder profile endpoint returned 500 (lazy login account read outside the transaction) | Map the DTO inside a transactional service method |
| 2 | Anonymous evidence upload was blocked by Spring Security | Permit `POST /incidents/*/evidence`; credential check remains in the access policy |
| 3 | Mockito inline mock maker failed on JDK 21+ | Ship `mock-maker-subclass` via test resources |
| 4 | Hotspot unit test used coordinates that straddled a cell boundary | Use identical coordinates for cluster assertions |

---

## 7. How to reproduce

```powershell
# 1. Backend tests (isolated H2, does not touch MySQL)
cd backend
mvn test

# 2. API acceptance (backend + MySQL running, dev seed)
#    see docs/api.md for the requests; a Postman collection is provided

# 3. Frontend tests, type-check and production build
cd ..\frontend
npm install
npm test
npm run build

# 4. Manual flow
cd ..
.\scripts\start-backend.ps1 -DbPassword "<password>" -JwtSecret "<32+ chars>"
.\scripts\start-frontend.ps1
```

---

## 8. Sign-off

| Role | Name | Signature | Date |
|---|---|---|---|
| Student | | | |
| Faculty mentor | Mr. Suraj Maddeshiya | | |
