package com.womensafety.service;

import com.womensafety.entity.Incident;
import com.womensafety.exception.UnauthorizedIncidentAccessException;
import com.womensafety.repository.ResponderRepository;
import com.womensafety.security.UserPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Central place for incident-level authorisation rules (IDOR protection). Keeping these
 * checks here means every service applies the same ownership and role logic.
 */
@Component
public class IncidentAccessPolicy {

    private final ResponderRepository responderRepository;
    private final PasswordEncoder passwordEncoder;

    public IncidentAccessPolicy(ResponderRepository responderRepository, PasswordEncoder passwordEncoder) {
        this.responderRepository = responderRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /** Administrators see everything; responders only see incidents assigned to them. */
    public void assertStaffCanView(Incident incident, UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedIncidentAccessException();
        }
        if (principal.isAdmin()) {
            return;
        }
        if (principal.isResponder() && incident.getResponder() != null) {
            boolean assigned = incident.getResponder().getUser() != null
                    && principal.getId().equals(incident.getResponder().getUser().getId());
            if (assigned) {
                return;
            }
        }
        throw new UnauthorizedIncidentAccessException();
    }

    public void assertReporterOwns(Incident incident, UserPrincipal principal) {
        if (principal == null || incident.getReporter() == null
                || !principal.getId().equals(incident.getReporter().getId())) {
            throw new UnauthorizedIncidentAccessException();
        }
    }

    public void assertCanAttachEvidence(Incident incident, UserPrincipal principal, String trackingCode) {
        if (principal != null && principal.isAdmin()) {
            return;
        }
        if (principal != null && incident.getReporter() != null
                && principal.getId().equals(incident.getReporter().getId())) {
            return;
        }
        if (trackingCode != null && !trackingCode.isBlank()
                && passwordEncoder.matches(IncidentService.normalizeTrackingCode(trackingCode),
                incident.getTrackingCodeHash())) {
            return;
        }
        throw new UnauthorizedIncidentAccessException();
    }

    public boolean isAssignedResponder(Incident incident, UserPrincipal principal) {
        if (principal == null || !principal.isResponder() || incident.getResponder() == null) {
            return false;
        }
        return incident.getResponder().getUser() != null
                && principal.getId().equals(incident.getResponder().getUser().getId());
    }
}
