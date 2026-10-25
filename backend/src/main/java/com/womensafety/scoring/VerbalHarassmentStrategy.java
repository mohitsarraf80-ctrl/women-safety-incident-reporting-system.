package com.womensafety.scoring;

import com.womensafety.enums.IncidentType;
import org.springframework.stereotype.Component;

import java.time.ZoneId;

/** Verbal harassment: base score 20. */
@Component
public class VerbalHarassmentStrategy extends AbstractSeverityStrategy {

    public VerbalHarassmentStrategy(@org.springframework.beans.factory.annotation.Value("${app.privacy.display-time-zone:Asia/Kolkata}") String zone) {
        super(ZoneId.of(zone));
    }

    @Override
    public IncidentType supports() {
        return IncidentType.VERBAL_HARASSMENT;
    }
}
