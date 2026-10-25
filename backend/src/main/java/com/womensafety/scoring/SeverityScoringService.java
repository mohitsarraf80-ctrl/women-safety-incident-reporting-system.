package com.womensafety.scoring;

import com.womensafety.enums.IncidentType;
import org.springframework.stereotype.Service;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/**
 * Facade over the per-category severity strategies. Spring injects every
 * {@link SeverityStrategy} bean, so registering a new incident category requires adding
 * one class and one enum constant - no conditional logic has to change here.
 */
@Service
public class SeverityScoringService {

    private final Map<IncidentType, SeverityStrategy> strategies = new EnumMap<>(IncidentType.class);

    public SeverityScoringService(List<SeverityStrategy> discoveredStrategies) {
        for (SeverityStrategy strategy : discoveredStrategies) {
            SeverityStrategy previous = strategies.put(strategy.supports(), strategy);
            if (previous != null) {
                throw new IllegalStateException("Duplicate severity strategy for " + strategy.supports());
            }
        }
        for (IncidentType type : IncidentType.values()) {
            if (!strategies.containsKey(type)) {
                throw new IllegalStateException("No severity strategy registered for " + type);
            }
        }
    }

    public SeverityResult score(SeverityInput input) {
        return strategies.get(input.type()).score(input);
    }

    public boolean isNightTime(java.time.Instant instant) {
        return ((AbstractSeverityStrategy) strategies.get(IncidentType.OTHER)).isNightTime(instant);
    }
}
