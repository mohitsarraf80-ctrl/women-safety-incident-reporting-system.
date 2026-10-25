package com.womensafety.scoring;

import com.womensafety.enums.IncidentType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.ZoneId;

/** Sexual assault: base score 80, the highest category in the presentation. */
@Component
public class SexualAssaultStrategy extends AbstractSeverityStrategy {

    public SexualAssaultStrategy(@Value("${app.privacy.display-time-zone:Asia/Kolkata}") String zone) {
        super(ZoneId.of(zone));
    }

    @Override
    public IncidentType supports() {
        return IncidentType.SEXUAL_ASSAULT;
    }
}
