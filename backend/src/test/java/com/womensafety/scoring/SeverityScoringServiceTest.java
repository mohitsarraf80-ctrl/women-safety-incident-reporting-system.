package com.womensafety.scoring;

import com.womensafety.enums.IncidentType;
import com.womensafety.enums.PriorityLevel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.ZoneId;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for the severity engine. These are pure JVM tests: no Spring context, no
 * database, which keeps the scoring rules quick to verify and easy to read.
 */
class SeverityScoringServiceTest {

    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");
    /** 14:30 IST - daytime. */
    private static final Instant DAY = Instant.parse("2026-01-15T09:00:00Z");
    /** 23:30 IST - inside the 22:00-05:00 night window. */
    private static final Instant NIGHT = Instant.parse("2026-01-15T18:00:00Z");
    /** 04:59 IST - still inside the window. */
    private static final Instant JUST_BEFORE_DAWN = Instant.parse("2026-01-15T23:29:00Z");
    /** 05:00 IST - window ends. */
    private static final Instant DAWN = Instant.parse("2026-01-15T23:30:00Z");

    private SeverityScoringService scoring;

    @BeforeEach
    void setUp() {
        List<SeverityStrategy> strategies = List.of(
                new VerbalHarassmentStrategy(IST.getId()),
                new CyberHarassmentStrategy(IST.getId()),
                new StalkingStrategy(IST.getId()),
                new AssaultStrategy(IST.getId()),
                new SexualAssaultStrategy(IST.getId()),
                new OtherIncidentStrategy(IST.getId()));
        scoring = new SeverityScoringService(strategies);
    }

    private SeverityResult score(IncidentType type, Instant when, boolean evidence, boolean sos, int repeats) {
        return scoring.score(new SeverityInput(type, when, evidence, sos, repeats));
    }

    @Test
    @DisplayName("Every category uses the base score documented in the presentation")
    void baseScoresMatchThePresentation() {
        assertThat(score(IncidentType.VERBAL_HARASSMENT, DAY, false, false, 0).score()).isEqualTo(20);
        assertThat(score(IncidentType.CYBER_HARASSMENT, DAY, false, false, 0).score()).isEqualTo(30);
        assertThat(score(IncidentType.STALKING, DAY, false, false, 0).score()).isEqualTo(35);
        assertThat(score(IncidentType.ASSAULT, DAY, false, false, 0).score()).isEqualTo(60);
        assertThat(score(IncidentType.SEXUAL_ASSAULT, DAY, false, false, 0).score()).isEqualTo(80);
        assertThat(score(IncidentType.OTHER, DAY, false, false, 0).score()).isEqualTo(20);
    }

    @Test
    @DisplayName("Night window is 22:00 inclusive to 05:00 exclusive")
    void nightBonusBoundaries() {
        assertThat(score(IncidentType.VERBAL_HARASSMENT, NIGHT, false, false, 0).nightBonus()).isEqualTo(15);
        assertThat(score(IncidentType.VERBAL_HARASSMENT, JUST_BEFORE_DAWN, false, false, 0).nightBonus())
                .isEqualTo(15);
        assertThat(score(IncidentType.VERBAL_HARASSMENT, DAWN, false, false, 0).nightBonus()).isZero();
        assertThat(score(IncidentType.VERBAL_HARASSMENT, DAY, false, false, 0).nightBonus()).isZero();
    }

    @Test
    @DisplayName("Repeat reports add 10 each and cap at 20")
    void repeatBonus() {
        assertThat(score(IncidentType.STALKING, DAY, false, false, 1).repeatBonus()).isEqualTo(10);
        assertThat(score(IncidentType.STALKING, DAY, false, false, 2).repeatBonus()).isEqualTo(20);
        assertThat(score(IncidentType.STALKING, DAY, false, false, 5).repeatBonus()).isEqualTo(20);
        assertThat(score(IncidentType.STALKING, DAY, false, false, 0).repeatBonus()).isZero();
    }

    @Test
    @DisplayName("Evidence adds 5 and SOS adds 20")
    void evidenceAndSosBonuses() {
        SeverityResult evidence = score(IncidentType.STALKING, DAY, true, false, 0);
        assertThat(evidence.evidenceBonus()).isEqualTo(5);
        assertThat(evidence.score()).isEqualTo(40);

        SeverityResult sos = score(IncidentType.OTHER, DAY, false, true, 0);
        assertThat(sos.sosBonus()).isEqualTo(20);
        assertThat(sos.score()).isEqualTo(40);
    }

    @Test
    @DisplayName("Total score never exceeds 100")
    void scoreIsCappedAtOneHundred() {
        SeverityResult result = score(IncidentType.SEXUAL_ASSAULT, NIGHT, true, true, 3);
        assertThat(result.score()).isEqualTo(100);
        assertThat(result.priority()).isEqualTo(PriorityLevel.CRITICAL);
    }

    @Test
    @DisplayName("Priority thresholds at 29/30/49/50/69/70 are exact")
    void priorityThresholds() {
        assertThat(PriorityLevel.fromScore(29)).isEqualTo(PriorityLevel.LOW);
        assertThat(PriorityLevel.fromScore(30)).isEqualTo(PriorityLevel.MEDIUM);
        assertThat(PriorityLevel.fromScore(49)).isEqualTo(PriorityLevel.MEDIUM);
        assertThat(PriorityLevel.fromScore(50)).isEqualTo(PriorityLevel.HIGH);
        assertThat(PriorityLevel.fromScore(69)).isEqualTo(PriorityLevel.HIGH);
        assertThat(PriorityLevel.fromScore(70)).isEqualTo(PriorityLevel.CRITICAL);
        assertThat(PriorityLevel.fromScore(100)).isEqualTo(PriorityLevel.CRITICAL);
    }

    @Test
    @DisplayName("A realistic combined case matches the documented formula")
    void combinedExample() {
        // Assault 60 + night 15 + one repeat 10 + evidence 5 = 90 (CRITICAL)
        SeverityResult result = score(IncidentType.ASSAULT, NIGHT, true, false, 1);
        assertThat(result.baseScore()).isEqualTo(60);
        assertThat(result.nightBonus()).isEqualTo(15);
        assertThat(result.repeatBonus()).isEqualTo(10);
        assertThat(result.evidenceBonus()).isEqualTo(5);
        assertThat(result.sosBonus()).isZero();
        assertThat(result.score()).isEqualTo(90);
        assertThat(result.priority()).isEqualTo(PriorityLevel.CRITICAL);
    }
}
