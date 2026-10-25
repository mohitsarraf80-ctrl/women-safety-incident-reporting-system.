package com.womensafety;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.womensafety.entity.Incident;
import com.womensafety.entity.User;
import com.womensafety.enums.IncidentStatus;
import com.womensafety.enums.UserRole;
import com.womensafety.repository.IncidentRepository;
import com.womensafety.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for the most safety-critical API flows: anonymous reporting,
 * credential-based tracking, authorisation boundaries, lifecycle validation and evidence.
 *
 * <p>Uses an isolated in-memory H2 database (MySQL compatibility mode) with Hibernate
 * schema generation, so the developer's MySQL database is never touched.</p>
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class PlatformIntegrationTest {

    private static final byte[] PNG = {
            (byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 13, 'I', 'H', 'D', 'R'
    };
    private static final String PASSWORD = "Demo@12345";

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private IncidentRepository incidentRepository;
    @Autowired
    private com.womensafety.repository.ResponderRepository responderRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    private String adminToken;
    private String citizenToken;

    @BeforeEach
    void setUp() throws Exception {
        if (userRepository.findByEmailIgnoreCase("admin@test.local").isEmpty()) {
            userRepository.save(User.create("Test Admin", "admin@test.local",
                    passwordEncoder.encode(PASSWORD), UserRole.ADMIN));
            userRepository.save(User.create("Test Citizen", "citizen@test.local",
                    passwordEncoder.encode(PASSWORD), UserRole.CITIZEN));
        }
        adminToken = login("admin@test.local");
        citizenToken = login("citizen@test.local");
    }

    private String login(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", email, "password", PASSWORD))))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }

    private JsonNode submitAnonymous() throws Exception {
        Map<String, Object> payload = Map.of(
                "type", "STALKING",
                "description", "A person followed me from the metro station towards the main road and would not leave.",
                "occurredAt", Instant.now().minus(2, ChronoUnit.HOURS).toString(),
                "zoneName", "Sector 62 Metro Station",
                "latitude", 28.6205,
                "longitude", 77.3700,
                "anonymous", true,
                "requiresImmediateAssistance", false);
        MvcResult result = mockMvc.perform(post("/api/incidents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.reportId").exists())
                .andExpect(jsonPath("$.trackingCode").exists())
                .andExpect(jsonPath("$.anonymous").value(true))
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    @Test
    @DisplayName("Registration returns a token and the account role is CITIZEN")
    void registrationCreatesCitizenAccount() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "displayName", "New Person",
                                "email", "new.person@test.local",
                                "password", "StrongPass123"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.user.role").value("CITIZEN"))
                .andReturn();
        String token = objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("new.person@test.local"));
    }

    @Test
    @DisplayName("Anonymous reports persist with no identity link and can be tracked with the code")
    void anonymousReportPersistsAndTracks() throws Exception {
        JsonNode created = submitAnonymous();
        String reportId = created.get("reportId").asText();
        String trackingCode = created.get("trackingCode").asText();

        Incident stored = incidentRepository.findByReportId(reportId).orElseThrow();
        assertThat(stored.isAnonymous()).isTrue();
        assertThat(stored.getReporter()).isNull();
        assertThat(stored.getTrackingCodeHash()).doesNotContain("DEMO");
        assertThat(stored.getStatus()).isEqualTo(IncidentStatus.SUBMITTED);
        assertThat(stored.getSeverityScore()).isGreaterThanOrEqualTo(35);

        MvcResult tracked = mockMvc.perform(post("/api/reports/track")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "reportId", reportId, "trackingCode", trackingCode))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reportId").value(reportId))
                .andExpect(jsonPath("$.status").value("SUBMITTED"))
                .andReturn();
        String body = tracked.getResponse().getContentAsString();
        assertThat(body).doesNotContain("followed me from the metro station");
        assertThat(body).doesNotContain("28.6205");
        assertThat(body).doesNotContain("77.37");
    }

    @Test
    @DisplayName("A wrong tracking code is rejected without revealing whether the report exists")
    void wrongTrackingCodeIsRejected() throws Exception {
        JsonNode created = submitAnonymous();
        mockMvc.perform(post("/api/reports/track")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "reportId", created.get("reportId").asText(),
                                "trackingCode", "AAAA-BBBB-CCCC-DDDD"))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("tracking-failed"));
    }

    @Test
    @DisplayName("Citizens are rejected by administrative endpoints on the backend")
    void citizenCannotAccessAdminEndpoints() throws Exception {
        mockMvc.perform(get("/api/admin/incidents").header("Authorization", "Bearer " + citizenToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/admin/dashboard/summary").header("Authorization", "Bearer " + citizenToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/admin/incidents"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Administrators can review, transition and resolve a case; illegal jumps are rejected")
    void administratorWorkflow() throws Exception {
        JsonNode created = submitAnonymous();
        String reportId = created.get("reportId").asText();
        Long id = incidentRepository.findByReportId(reportId).orElseThrow().getId();

        mockMvc.perform(get("/api/admin/incidents").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1));

        mockMvc.perform(patch("/api/admin/incidents/{id}/status", id)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "status", "UNDER_REVIEW", "note", "Picked up by the duty officer."))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UNDER_REVIEW"));

        // SUBMITTED -> RESOLVED skips the required review stages and must be refused.
        mockMvc.perform(patch("/api/admin/incidents/{id}/status", id)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "status", "RESOLVED", "note", "Skipping straight to resolved."))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("invalid-status-transition"));

        // A resolution note is mandatory before RESOLVED.
        mockMvc.perform(patch("/api/admin/incidents/{id}/status", id)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "status", "ASSIGNED", "note", "Assigning now."))))
                .andExpect(status().isOk());
        mockMvc.perform(patch("/api/admin/incidents/{id}/status", id)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "status", "IN_PROGRESS", "note", "Team dispatched."))))
                .andExpect(status().isOk());
        mockMvc.perform(patch("/api/admin/incidents/{id}/status", id)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "status", "RESOLVED", "note", "short"))))
                .andExpect(status().isBadRequest());

        MvcResult resolved = mockMvc.perform(patch("/api/admin/incidents/{id}/status", id)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "status", "RESOLVED",
                                "note", "Reporter contacted and safety desk followed up."))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"))
                .andReturn();
        JsonNode detail = objectMapper.readTree(resolved.getResponse().getContentAsString());
        assertThat(detail.get("history").size()).isGreaterThanOrEqualTo(4);
        assertThat(detail.get("alerts").size()).isGreaterThanOrEqualTo(2);
    }

    @Test
    @DisplayName("Evidence upload is validated, stored and adds the +5 bonus")
    void evidenceUploadAddsBonus() throws Exception {
        JsonNode created = submitAnonymous();
        String reportId = created.get("reportId").asText();
        String trackingCode = created.get("trackingCode").asText();
        int initialScore = created.get("severityScore").asInt();

        mockMvc.perform(multipart("/api/incidents/{reportId}/evidence", reportId)
                        .file(new MockMultipartFile("file", "photo.png", "image/png", PNG))
                        .header("X-Tracking-Code", trackingCode))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.contentType").value("image/png"))
                .andExpect(jsonPath("$.severityScore").value(Math.min(100, initialScore + 5)));

        Incident stored = incidentRepository.findByReportId(reportId).orElseThrow();
        assertThat(stored.getEvidenceBonus()).isEqualTo(5);

        mockMvc.perform(multipart("/api/incidents/{reportId}/evidence", reportId)
                        .file(new MockMultipartFile("file", "fake.png", "image/png", "not an image".getBytes())))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Invalid input is rejected with field-level details and nothing is persisted")
    void invalidReportIsRejected() throws Exception {
        Map<String, Object> payload = Map.of(
                "type", "STALKING",
                "description", "too short",
                "occurredAt", Instant.now().plus(3, ChronoUnit.DAYS).toString(),
                "anonymous", true);
        mockMvc.perform(post("/api/incidents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("validation-failed"))
                .andExpect(jsonPath("$.errors.description").exists())
                .andExpect(jsonPath("$.errors.occurredAt").exists());
        assertThat(incidentRepository.count()).isZero();
    }

    @Test
    @DisplayName("Logout revokes the token server-side")
    void logoutRevokesToken() throws Exception {
        mockMvc.perform(post("/api/auth/logout").header("Authorization", "Bearer " + citizenToken))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + citizenToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("SOS creates a persistent incident and an urgent alert")
    void sosCreatesIncidentAndAlert() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/sos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "latitude", 28.6205, "longitude", 77.3700,
                                "zoneName", "Sector 62 Metro Station"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.locationCaptured").value(true))
                .andExpect(jsonPath("$.notificationStatus").value("SIMULATED"))
                .andReturn();
        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        Incident incident = incidentRepository.findByReportId(body.get("reportId").asText()).orElseThrow();
        assertThat(incident.isSosTriggered()).isTrue();
        assertThat(incident.getSosBonus()).isEqualTo(20);
        assertThat(incident.isRequiresImmediateAssistance()).isTrue();
    }

    @Test
    @DisplayName("Responders only see cases assigned to them")
    void responderIsolation() throws Exception {
        JsonNode created = submitAnonymous();
        Long id = incidentRepository.findByReportId(created.get("reportId").asText()).orElseThrow().getId();

        User responderUser = userRepository.save(User.create("Resp One", "resp.one@test.local",
                passwordEncoder.encode(PASSWORD), UserRole.RESPONDER));
        responderRepository.save(com.womensafety.entity.Responder.create(
                "RSP-TEST01", "Resp One", "Test Unit", null, responderUser));

        String responderToken = login("resp.one@test.local");
        mockMvc.perform(get("/api/responder/incidents").header("Authorization", "Bearer " + responderToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));
        mockMvc.perform(get("/api/admin/incidents/{id}", id).header("Authorization", "Bearer " + responderToken))
                .andExpect(status().isForbidden());
    }
}
