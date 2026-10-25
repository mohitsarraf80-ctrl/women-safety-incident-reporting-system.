package com.womensafety.scoring;

import com.womensafety.enums.IncidentType;

import java.time.Instant;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;

/**
 * Template-method base class holding the additive scoring rules from the project
 * presentation. Subclasses only supply the base score of their category, so a new
 * category can be added without touching this class (open/closed principle).
 */
public abstract class AbstractSeverityStrategy implements SeverityStrategy {

    /** Night window is 22:00 (inclusive) to 05:00 (exclusive) in the configured display zone. */
    public static final LocalTime NIGHT_START = LocalTime.of(22, 0);
    public static final LocalTime NIGHT_END = LocalTime.of(5, 0);
    public static final int NIGHT_BONUS = 15;
    public static final int REPEAT_BONUS_PER_REPORT = 10;
    public static final int MAX_REPEAT_BONUS = 20;
    public static final int EVIDENCE_BONUS = 5;
    public static final int SOS_BONUS = 20;
    public static final int MAX_SCORE = 100;

    private final ZoneId zoneId;

    protected AbstractSeverityStrategy(ZoneId zoneId) {
        this.zoneId = zoneId;
    }

    @Override
    public final SeverityResult score(SeverityInput input) {
        if (input.type() != supports()) {
            throw new IllegalArgumentException("Strategy " + supports() + " cannot score " + input.type());
        }
        int base = baseScore(input);
        int night = isNightTime(input.occurredAt()) ? NIGHT_BONUS : 0;
        int repeat = Math.min(MAX_REPEAT_BONUS, REPEAT_BONUS_PER_REPORT * input.previousReportsInZone());
        int evidence = input.evidenceAttached() ? EVIDENCE_BONUS : 0;
        int sos = input.sosTriggered() ? SOS_BONUS : 0;
        SeverityResult result = SeverityResult.of(base, night, repeat, evidence, sos);
        return new SeverityResult(result.score(), result.priority(), base, night, repeat, evidence, sos,
                explain(result));
    }

    /** Base score of this category. Defaults to the value documented on {@link IncidentType}. */
    protected int baseScore(SeverityInput input) {
        return supports().getBaseScore();
    }

    public boolean isNightTime(Instant occurredAt) {
        ZonedDateTime local = occurredAt.atZone(zoneId);
        LocalTime time = local.toLocalTime();
        return !time.isBefore(NIGHT_START) || time.isBefore(NIGHT_END);
    }

    private String explain(SeverityResult result) {
        StringBuilder sb = new StringBuilder();
        sb.append("Base ").append(result.baseScore()).append(" (")
                .append(supports().getLabel()).append(")");
        if (result.nightBonus() > 0) {
            sb.append(" + night ").append(result.nightBonus());
        }
        if (result.repeatBonus() > 0) {
            sb.append(" + repeat ").append(result.repeatBonus());
        }
        if (result.evidenceBonus() > 0) {
            sb.append(" + evidence ").append(result.evidenceBonus());
        }
        if (result.sosBonus() > 0) {
            sb.append(" + SOS ").append(result.sosBonus());
        }
        sb.append(" = ").append(result.score()).append(" (").append(result.priority()).append(")");
        return sb.toString();
    }
}
