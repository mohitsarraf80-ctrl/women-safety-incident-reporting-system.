package com.womensafety.scoring;

import com.womensafety.enums.IncidentType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.ZoneId;

/** Assault: base score 60. */
@Component
public class AssaultStrategy extends AbstractSeverityStrategy {

    public AssaultStrategy(@Value("${app.privacy.display-time-zone:Asia/Kolkata}") String zone) {
        super(ZoneId.of(zone));
    }

    @Override
    public IncidentType supports() {
        return IncidentType.ASSAULT;
    }
}
