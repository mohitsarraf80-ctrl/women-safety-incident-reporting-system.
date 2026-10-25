package com.womensafety.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class ReportIdGeneratorTest {

    private final ReportIdGenerator generator = new ReportIdGenerator();

    @Test
    @DisplayName("Report IDs are unique, prefixed and unguessable in shape")
    void reportIdsAreUnique() {
        Set<String> ids = new HashSet<>();
        for (int i = 0; i < 500; i++) {
            String id = generator.newReportId();
            assertThat(id).startsWith("WS-").hasSize(11);
            assertThat(id.substring(3)).matches("[2-9A-HJKMNP-TV-Z]{8}");
            ids.add(id);
        }
        assertThat(ids).hasSize(500);
    }

    @Test
    @DisplayName("Tracking codes are grouped and unambiguous")
    void trackingCodesAreGrouped() {
        String code = generator.newTrackingCode();
        assertThat(code).matches("[2-9A-HJKMNP-TV-Z]{4}(-[2-9A-HJKMNP-TV-Z]{4}){3}");
        assertThat(code).doesNotContain("0").doesNotContain("O").doesNotContain("1").doesNotContain("I");
    }
}
