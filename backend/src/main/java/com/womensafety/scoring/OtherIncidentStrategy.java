package com.womensafety.scoring;

import com.womensafety.enums.IncidentType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.ZoneId;

/**
 * "Other" category. The presentation does not define a base score, so the documented
 * prototype default of 20 (the lowest defined score) is used.
 */
@Component
public class OtherIncidentStrategy extends AbstractSeverityStrategy {

    public OtherIncidentStrategy(@Value("${app.privacy.display-time-zone:Asia/Kolkata}") String zone) {
        super(ZoneId.of(zone));
    }

    @Override
    public IncidentType supports() {
        return IncidentType.OTHER;
    }
}
