package com.womensafety.enums;

/**
 * The incident categories supported by the platform. The base severity score of
 * every category is defined here so that the documented scoring table has exactly
 * one source of truth in the codebase.
 */
public enum IncidentType {

    VERBAL_HARASSMENT("Verbal harassment", 20),
    CYBER_HARASSMENT("Cyber harassment", 30),
    STALKING("Stalking", 35),
    ASSAULT("Assault", 60),
    SEXUAL_ASSAULT("Sexual assault", 80),
    /** The presentation does not define a score for OTHER; 20 is a documented prototype default. */
    OTHER("Other", 20);

    private final String label;
    private final int baseScore;

    IncidentType(String label, int baseScore) {
        this.label = label;
        this.baseScore = baseScore;
    }

    public String getLabel() {
        return label;
    }

    public int getBaseScore() {
        return baseScore;
    }
}
