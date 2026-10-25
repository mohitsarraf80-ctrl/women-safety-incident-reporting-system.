package com.womensafety.scoring;

import com.womensafety.enums.PriorityLevel;

/**
 * Immutable outcome of a severity calculation, including the contribution of every
 * factor so the admin UI can display an auditable breakdown.
 */
public record SeverityResult(
        int score,
        PriorityLevel priority,
        int baseScore,
        int nightBonus,
        int repeatBonus,
        int evidenceBonus,
        int sosBonus,
        String explanation
) {
    public static SeverityResult of(int base, int night, int repeat, int evidence, int sos) {
        int total = Math.min(100, base + night + repeat + evidence + sos);
        return new SeverityResult(total, PriorityLevel.fromScore(total), base, night, repeat, evidence, sos, "");
    }
}
