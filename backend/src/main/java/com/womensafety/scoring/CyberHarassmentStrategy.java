package com.womensafety.scoring;

import com.womensafety.enums.IncidentType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.ZoneId;

/** Cyber harassment: base score 30; frequently reported at night, so the night bonus applies normally. */
@Component
public class CyberHarassmentStrategy extends AbstractSeverityStrategy {

    public CyberHarassmentStrategy(@Value("${app.privacy.display-time-zone:Asia/Kolkata}") String zone) {
        super(ZoneId.of(zone));
    }

    @Override
    public IncidentType supports() {
        return IncidentType.CYBER_HARASSMENT;
    }
}
