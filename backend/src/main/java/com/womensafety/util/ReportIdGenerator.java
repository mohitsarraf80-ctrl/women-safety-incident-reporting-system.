package com.womensafety.util;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;

/**
 * Generates unpredictable public identifiers:
 * <ul>
 *   <li>Report ID - short, human-friendly, ~40 bits of entropy (WS-XXXXXXXX).</li>
 *   <li>Tracking code - ~60 bits, grouped for manual entry.</li>
 *   <li>SOS reference - ~50 bits.</li>
 * </ul>
 * Crockford-style alphabet without ambiguous characters (0/O, 1/I/L).
 */
@Component
public class ReportIdGenerator {

    private static final char[] ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ".toCharArray();
    private static final SecureRandom RANDOM = new SecureRandom();

    public String newReportId() {
        return "WS-" + randomToken(8);
    }

    public String newTrackingCode() {
        String raw = randomToken(16);
        return raw.substring(0, 4) + "-" + raw.substring(4, 8) + "-"
                + raw.substring(8, 12) + "-" + raw.substring(12, 16);
    }

    public String newSosReference() {
        return "SOS-" + randomToken(10);
    }

    public String newResponderBadge() {
        return "RSP-" + randomToken(6);
    }

    private String randomToken(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(ALPHABET[RANDOM.nextInt(ALPHABET.length)]);
        }
        return sb.toString();
    }
}
