package com.womensafety.scoring;

import com.womensafety.enums.IncidentType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.ZoneId;

/** Stalking: base score 35. */
@Component
public class StalkingStrategy extends AbstractSeverityStrategy {

    public StalkingStrategy(@Value("${app.privacy.display-time-zone:Asia/Kolkata}") String zone) {
        super(ZoneId.of(zone));
    }

    @Override
    public IncidentType supports() {
        return IncidentType.STALKING;
    }
}
