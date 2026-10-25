package com.womensafety.config;

import com.womensafety.entity.Incident;
import com.womensafety.entity.IncidentNote;
import com.womensafety.entity.IncidentStatusHistory;
import com.womensafety.entity.Responder;
import com.womensafety.entity.User;
import com.womensafety.enums.AlertType;
import com.womensafety.enums.IncidentStatus;
import com.womensafety.enums.IncidentType;
import com.womensafety.enums.NotificationChannel;
import com.womensafety.enums.RecipientCategory;
import com.womensafety.enums.ResponderAvailability;
import com.womensafety.enums.UserRole;
import com.womensafety.repository.IncidentNoteRepository;
import com.womensafety.repository.IncidentRepository;
import com.womensafety.repository.IncidentStatusHistoryRepository;
import com.womensafety.repository.ResponderRepository;
import com.womensafety.repository.UserRepository;
import com.womensafety.scoring.SeverityInput;
import com.womensafety.scoring.SeverityResult;
import com.womensafety.scoring.SeverityScoringService;
import com.womensafety.service.AlertService;
import com.womensafety.util.GridProjection;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Development-only seeder.
 *
 * <p>Creates a small, entirely fictional dataset: demo accounts, four responder profiles,
 * and incidents spread over the last three weeks so the dashboard, charts and hotspot map
 * have something to show. It runs only when {@code app.demo.seed-enabled=true} (the
 * {@code dev} profile) and is idempotent: if any user or incident already exists it does
 * nothing.</p>
 *
 * <p>No real victim data, no real police affiliation and no real contact details are used.
 * The tracking code for every seeded report is {@code DEMO-TRACK-2026} so the tracking
 * page can be demonstrated; this is safe only because the data is fictional.</p>
 */
@Component
@ConditionalOnProperty(prefix = "app.demo", name = "seed-enabled", havingValue = "true")
public class DemoDataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);
    private static final String DEMO_TRACKING_CODE = "DEMOTRACK2026";
    private static final List<IncidentStatus> LIFECYCLE = List.of(IncidentStatus.SUBMITTED,
            IncidentStatus.UNDER_REVIEW, IncidentStatus.ASSIGNED, IncidentStatus.IN_PROGRESS,
            IncidentStatus.RESOLVED, IncidentStatus.CLOSED);

    private final UserRepository userRepository;
    private final ResponderRepository responderRepository;
    private final IncidentRepository incidentRepository;
    private final IncidentStatusHistoryRepository historyRepository;
    private final IncidentNoteRepository noteRepository;
    private final SeverityScoringService scoringService;
    private final AlertService alertService;
    private final GridProjection gridProjection;
    private final PasswordEncoder passwordEncoder;
    private final String demoPassword;
    private final ZoneId zone = ZoneId.of("Asia/Kolkata");

    public DemoDataSeeder(UserRepository userRepository, ResponderRepository responderRepository,
                          IncidentRepository incidentRepository,
                          IncidentStatusHistoryRepository historyRepository,
                          IncidentNoteRepository noteRepository, SeverityScoringService scoringService,
                          AlertService alertService, GridProjection gridProjection,
                          PasswordEncoder passwordEncoder,
                          @Value("${app.demo.demo-password:Demo@12345}") String demoPassword) {
        this.userRepository = userRepository;
        this.responderRepository = responderRepository;
        this.incidentRepository = incidentRepository;
        this.historyRepository = historyRepository;
        this.noteRepository = noteRepository;
        this.scoringService = scoringService;
        this.alertService = alertService;
        this.gridProjection = gridProjection;
        this.passwordEncoder = passwordEncoder;
        this.demoPassword = demoPassword;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (userRepository.count() > 0 || incidentRepository.count() > 0) {
            log.info("Demo seeding skipped: the database already contains data.");
            return;
        }
        log.info("Seeding fictional demonstration data (dev profile)...");

        User admin = userRepository.save(User.create("Demo Administrator", "admin@demo.local",
                passwordEncoder.encode(demoPassword), UserRole.ADMIN));
        User citizen = userRepository.save(User.create("Demo Citizen", "citizen@demo.local",
                passwordEncoder.encode(demoPassword), UserRole.CITIZEN));
        User responderUserOne = userRepository.save(User.create("Ravi Kumar", "responder@demo.local",
                passwordEncoder.encode(demoPassword), UserRole.RESPONDER));
        User responderUserTwo = userRepository.save(User.create("Neha Verma", "responder2@demo.local",
                passwordEncoder.encode(demoPassword), UserRole.RESPONDER));

        Responder campusDesk = responderRepository.save(Responder.create("RSP-NIET01",
                "Campus Safety Desk", "NIET Campus Security (fictional demo unit)",
                "+91 00000 00001", responderUserOne));
        Responder ngoTeam = responderRepository.save(Responder.create("RSP-NGO002",
                "Sakhi Support Team", "Community NGO volunteer unit (fictional)",
                "+91 00000 00002", responderUserTwo));
        Responder metroUnit = responderRepository.save(Responder.create("RSP-MET003",
                "Metro Assistance Unit", "Station help desk (fictional demo unit)",
                "+91 00000 00003", null));
        Responder nightPatrol = responderRepository.save(Responder.create("RSP-PAT004",
                "Night Patrol Van", "Neighbourhood patrol (fictional demo unit)",
                "+91 00000 00004", null));
        makeAvailable(ngoTeam, nightPatrol);

        List<Seed> seeds = seedIncidents();
        Map<String, Integer> cellCounts = new HashMap<>();
        Instant now = Instant.now();
        int index = 0;
        String trackingHash = passwordEncoder.encode(DEMO_TRACKING_CODE);

        for (Seed seed : seeds) {
            ZonedDateTime local = now.atZone(zone).minusDays(seed.daysAgo())
                    .withHour(seed.hour()).withMinute(20 + (index % 30)).withSecond(0).withNano(0);
            Instant occurredAt = local.toInstant();
            Instant submittedAt = occurredAt.plus(Duration.ofMinutes(15 + (index % 45)));
            if (submittedAt.isAfter(now)) {
                submittedAt = now.minusSeconds(60L * (index + 1));
            }
            String cellKey = gridProjection.keyFor(seed.latitude(), seed.longitude());
            int previous = cellCounts.getOrDefault(cellKey, 0);
            cellCounts.merge(cellKey, 1, Integer::sum);

            SeverityResult severity = scoringService.score(new SeverityInput(seed.type(), occurredAt,
                    false, seed.sos(), previous));

            boolean anonymous = seed.reporterIndex() == null;
            User reporter = anonymous ? null : citizen;
            Incident incident = Incident.create("WS-SEED" + String.format("%03d", 100 + index),
                    trackingHash, seed.type(), seed.description(),
                    occurredAt, seed.zone(), seed.latitude(), seed.longitude(), cellKey, anonymous, reporter);
            incident.applySeverity(severity.score(), severity.priority(), severity.baseScore(),
                    severity.nightBonus(), severity.repeatBonus(), severity.evidenceBonus(),
                    severity.sosBonus());
            incident.requestImmediateAssistance(seed.sos());
            if (seed.sos()) {
                incident.markSos();
            }
            if (!anonymous) {
                incident.attachContactDetails("Demo Citizen", "citizen@demo.local", null);
            }
            incident.overrideTimestampsForDemo(submittedAt, occurredAt);
            incidentRepository.save(incident);

            historyRepository.save(IncidentStatusHistory.record(incident, null, IncidentStatus.SUBMITTED,
                    reporter, anonymous ? "Anonymous reporter" : "Demo Citizen",
                    "Report submitted. Priority " + severity.priority() + " (" + severity.score() + "/100)."));

            Responder responder = switch (index % 4) {
                case 0 -> campusDesk;
                case 1 -> ngoTeam;
                case 2 -> metroUnit;
                default -> nightPatrol;
            };
            applyLifecycle(incident, seed.status(), admin, responder, submittedAt);

            if (incidentRepository.findById(incident.getId()).isEmpty()) {
                throw new IllegalStateException("Seed incident vanished");
            }

            String alertText = "New " + incident.getPriority() + " " + incident.getIncidentType().getLabel()
                    + " report " + incident.getReportId() + " in " + incident.getZoneName() + ".";
            alertService.createAlert(incident, AlertType.NEW_INCIDENT, RecipientCategory.ADMIN,
                    NotificationChannel.IN_APP, "Administrator in-app feed", alertText, "new")
                    .ifPresent(alert -> alertService.deliverNow(alert.getId()));
            alertService.createAlert(incident, AlertType.NEW_INCIDENT, RecipientCategory.ADMIN,
                    NotificationChannel.EMAIL, "administrator-mailbox", alertText, "new")
                    .ifPresent(alert -> alertService.deliverNow(alert.getId()));
            if (seed.sos()) {
                alertService.createAlert(incident, AlertType.SOS_ACTIVATED, RecipientCategory.ADMIN,
                        NotificationChannel.IN_APP, "Administrator in-app feed",
                        "SOS " + incident.getReportId() + " activated near " + incident.getZoneName() + ".",
                        "sos").ifPresent(alert -> alertService.deliverNow(alert.getId()));
                alertService.createAlert(incident, AlertType.SOS_ACTIVATED, RecipientCategory.ADMIN,
                        NotificationChannel.SMS, "on-call-safety-desk",
                        "SOS " + incident.getReportId() + " activated.", "sos")
                        .ifPresent(alert -> alertService.deliverNow(alert.getId()));
            }

            if (index == 3 || index == 9) {
                noteRepository.save(IncidentNote.create(incident, admin,
                        "Demo internal note: campus security was asked to review CCTV coverage for this slot."));
            }
            index++;
        }

        log.info("Demo data ready: {} incidents, {} responders. Demo password: {}", index,
                responderRepository.count(), demoPassword);
    }

    private void makeAvailable(Responder... responders) {
        for (Responder responder : responders) {
            responder.changeAvailability(ResponderAvailability.AVAILABLE);
            responderRepository.save(responder);
        }
    }

    private void applyLifecycle(Incident incident, IncidentStatus target, User actor,
                                Responder responder, Instant submittedAt) {
        int targetIndex = LIFECYCLE.indexOf(target);
        if (targetIndex <= 0) {
            return;
        }
        IncidentStatus current = IncidentStatus.SUBMITTED;
        for (int step = 1; step <= targetIndex; step++) {
            IncidentStatus next = LIFECYCLE.get(step);
            String note = "";
            if (next == IncidentStatus.ASSIGNED) {
                incident.assignTo(responder);
                note = "Assigned to " + responder.getDisplayName() + " (" + responder.getBadgeCode() + ").";
            } else if (next == IncidentStatus.RESOLVED) {
                note = "Resolved after follow-up with the reporter. Demo resolution note.";
                incident.updateStatus(next, note);
                incident.overrideResolvedAtForDemo(submittedAt.plus(Duration.ofHours(18L + step * 3L)));
            } else {
                incident.updateStatus(next, null);
            }
            historyRepository.save(IncidentStatusHistory.record(incident, current, next, actor,
                    "Demo Administrator", note));
            current = next;
        }
        incidentRepository.save(incident);
    }

    /**
     * Fictional incidents. Coordinates cluster around a few Noida / Greater Noida landmarks
     * so that the hotspot algorithm has genuine clusters to detect.
     */
    private List<Seed> seedIncidents() {
        return List.of(
                // Cluster A - Sector 62 Metro Station area (7 reports)
                new Seed(IncidentType.STALKING, "A man followed me from the metro exit towards the auto stand and kept changing direction whenever I looked back. I waited near the ticket counter until he left.", "Sector 62 Metro Station", 28.6205, 77.3700, 1, 21, IncidentStatus.SUBMITTED, false, null),
                new Seed(IncidentType.VERBAL_HARASSMENT, "A group near the station stairs made repeated comments at women passing by. Station staff were not visible at that hour.", "Sector 62 Metro Station", 28.6207, 77.3702, 2, 20, IncidentStatus.UNDER_REVIEW, false, null),
                new Seed(IncidentType.CYBER_HARASSMENT, "Received repeated messages from an unknown account after posting about my commute. The account created new profiles after being blocked.", "Sector 62 Metro Station", 28.6203, 77.3698, 3, 23, IncidentStatus.ASSIGNED, false, 1),
                new Seed(IncidentType.STALKING, "Someone waited outside the station gate twice this week at the same time and tried to walk with me. I changed my route to reach the main road.", "Sector 62 Metro Station", 28.6206, 77.3701, 4, 19, IncidentStatus.IN_PROGRESS, false, null),
                new Seed(IncidentType.OTHER, "The lighting near the metro parking area was switched off and the area felt unsafe to walk through alone after 9 PM.", "Sector 62 Metro Station", 28.6204, 77.3699, 6, 21, IncidentStatus.SUBMITTED, false, null),
                new Seed(IncidentType.VERBAL_HARASSMENT, "Two men on a motorcycle slowed down next to me and passed remarks before driving away towards the flyover.", "Sector 62 Metro Station", 28.6208, 77.3703, 8, 22, IncidentStatus.RESOLVED, false, null),
                new Seed(IncidentType.OTHER, "SOS activated near the metro station after I felt followed. I reached a shop and the situation de-escalated.", "Sector 62 Metro Station", 28.6205, 77.3700, 1, 23, IncidentStatus.SUBMITTED, true, null),

                // Cluster B - Botanical Garden Metro area (6 reports)
                new Seed(IncidentType.STALKING, "While waiting for a cab outside the metro station, a person kept circling the pickup point and asked personal questions.", "Botanical Garden Metro", 28.5645, 77.3340, 2, 20, IncidentStatus.UNDER_REVIEW, false, null),
                new Seed(IncidentType.VERBAL_HARASSMENT, "A crowd near the auto stand passed comments at every woman who walked past. Nobody intervened.", "Botanical Garden Metro", 28.5647, 77.3342, 5, 19, IncidentStatus.SUBMITTED, false, null),
                new Seed(IncidentType.STALKING, "The same person was waiting outside my office shuttle stop on two evenings and followed the shuttle route.", "Botanical Garden Metro", 28.5644, 77.3338, 7, 18, IncidentStatus.IN_PROGRESS, false, null),
                new Seed(IncidentType.CYBER_HARASSMENT, "My phone number was posted in a public group with an inappropriate caption after a disagreement in an online class group.", "Botanical Garden Metro", 28.5646, 77.3341, 10, 21, IncidentStatus.RESOLVED, false, null),
                new Seed(IncidentType.OTHER, "Broken railing and no attendant at the foot-over-bridge stairs made the exit difficult to use safely at night.", "Botanical Garden Metro", 28.5643, 77.3339, 12, 20, IncidentStatus.SUBMITTED, false, null),
                new Seed(IncidentType.VERBAL_HARASSMENT, "A vendor near the exit repeatedly addressed me with an inappropriate nickname despite being asked to stop.", "Botanical Garden Metro", 28.5645, 77.3340, 14, 17, IncidentStatus.CLOSED, false, null),

                // Cluster C - Sector 18 Market (5 reports)
                new Seed(IncidentType.VERBAL_HARASSMENT, "Group of men outside the market entrance commenting on women walking past. It continued for about twenty minutes.", "Sector 18 Market", 28.5709, 77.3260, 3, 20, IncidentStatus.UNDER_REVIEW, false, null),
                new Seed(IncidentType.STALKING, "A person followed me through two lanes of the market and stopped when I entered a shop. The shop staff helped me wait.", "Sector 18 Market", 28.5711, 77.3262, 6, 21, IncidentStatus.ASSIGNED, false, 1),
                new Seed(IncidentType.OTHER, "The service lane behind the market is unlit and used by parked vehicles, making it unsafe to walk through after dark.", "Sector 18 Market", 28.5707, 77.3258, 9, 22, IncidentStatus.SUBMITTED, false, null),
                new Seed(IncidentType.ASSAULT, "A man grabbed my arm near the parking area when I refused to share my phone number. I pulled away and raised my voice; he left.", "Sector 18 Market", 28.5710, 77.3261, 11, 21, IncidentStatus.IN_PROGRESS, false, null),
                new Seed(IncidentType.VERBAL_HARASSMENT, "Repeated inappropriate comments from the same shopfront staff over several visits to the market.", "Sector 18 Market", 28.5708, 77.3259, 16, 18, IncidentStatus.RESOLVED, false, null),

                // Cluster D - NIET campus / Knowledge Park II (5 reports)
                new Seed(IncidentType.STALKING, "A person waited near the campus gate in the evening and followed students towards the bus stop. Reported to the campus desk.", "NIET Campus Gate 2", 28.4744, 77.5040, 1, 18, IncidentStatus.ASSIGNED, false, 1),
                new Seed(IncidentType.CYBER_HARASSMENT, "An anonymous account sent repeated threatening messages to a student group after an internal event.", "NIET Campus Gate 2", 28.4746, 77.5042, 4, 22, IncidentStatus.UNDER_REVIEW, false, null),
                new Seed(IncidentType.OTHER, "SOS activated while walking from the library to the hostel block. The path was empty and the emergency light was not working.", "NIET Campus Gate 2", 28.4743, 77.5039, 5, 23, IncidentStatus.RESOLVED, true, null),
                new Seed(IncidentType.VERBAL_HARASSMENT, "Inappropriate remarks from a visitor near the canteen parking area. Campus security was informed immediately.", "NIET Campus Gate 2", 28.4745, 77.5041, 8, 13, IncidentStatus.CLOSED, false, null),
                new Seed(IncidentType.STALKING, "Someone repeatedly waited outside the department building at closing time and asked for personal details.", "NIET Campus Gate 2", 28.4744, 77.5040, 13, 17, IncidentStatus.IN_PROGRESS, false, 1),

                // Scattered single reports
                new Seed(IncidentType.VERBAL_HARASSMENT, "Comments passed from a passing car while I was walking on the service road in the evening.", "Sector 15A Market", 28.5790, 77.3270, 0, 9, IncidentStatus.SUBMITTED, false, null),
                new Seed(IncidentType.ASSAULT, "A passenger pushed me while boarding the crowded bus after I asked him to wait his turn. The conductor intervened.", "Greater Noida Bus Stand", 28.4960, 77.5150, 15, 18, IncidentStatus.RESOLVED, false, null),
                new Seed(IncidentType.CYBER_HARASSMENT, "A fake profile using my photographs sent friend requests to my contacts with inappropriate messages.", "Alpha 1 Market", 28.4760, 77.5000, 0, 10, IncidentStatus.UNDER_REVIEW, false, null),
                new Seed(IncidentType.OTHER, "Stray dogs and poor lighting near the park gate make the walking track difficult to use after sunset.", "Sector 37 Park", 28.5720, 77.3400, 20, 20, IncidentStatus.SUBMITTED, false, null)
        );
    }

    /** One fictional report definition used by the seeder. */
    private record Seed(IncidentType type, String description, String zone, double latitude, double longitude,
                        int daysAgo, int hour, IncidentStatus status, boolean sos, Integer reporterIndex) {
    }
}
