package com.womensafety.enums;

/** Priority bands produced by the severity scoring engine (presentation slide 9). */
public enum PriorityLevel {

    LOW("Low", "No immediate escalation required; monitor through the normal queue."),
    MEDIUM("Medium", "Review within the standard triage window."),
    HIGH("High", "Prioritise for review and responder assignment."),
    CRITICAL("Critical", "Immediate administrative review required.");

    private final String label;
    private final String description;

    PriorityLevel(String label, String description) {
        this.label = label;
        this.description = description;
    }

    public String getLabel() {
        return label;
    }

    public String getDescription() {
        return description;
    }

    /**
     * Maps a 0-100 severity score to a priority band using the thresholds from the
     * presentation: LOW below 30, MEDIUM 30-49, HIGH 50-69, CRITICAL 70 and above.
     */
    public static PriorityLevel fromScore(int score) {
        if (score >= 70) {
            return CRITICAL;
        }
        if (score >= 50) {
            return HIGH;
        }
        if (score >= 30) {
            return MEDIUM;
        }
        return LOW;
    }
}
