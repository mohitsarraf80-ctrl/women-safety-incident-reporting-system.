package com.womensafety.service;

import com.womensafety.dto.AdminDtos;
import com.womensafety.entity.Alert;
import com.womensafety.entity.Incident;
import com.womensafety.enums.AlertStatus;
import com.womensafety.enums.AlertType;
import com.womensafety.enums.NotificationChannel;
import com.womensafety.enums.RecipientCategory;
import com.womensafety.exception.ApiException;
import com.womensafety.notification.NotificationMessage;
import com.womensafety.notification.Notifier;
import com.womensafety.repository.AlertRepository;
import jakarta.persistence.criteria.Predicate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Creates persistent alert records and delivers them through the configured channels.
 * In-app alerts are real records; SMS/e-mail are simulated in the prototype and always
 * stored as SIMULATED.
 */
@Service
public class AlertService {

    private static final Logger log = LoggerFactory.getLogger(AlertService.class);

    private final AlertRepository alertRepository;
    private final IncidentMapper mapper;
    private final Map<NotificationChannel, Notifier> notifiers = new EnumMap<>(NotificationChannel.class);

    public AlertService(AlertRepository alertRepository, IncidentMapper mapper,
                        List<Notifier> discoveredNotifiers) {
        this.alertRepository = alertRepository;
        this.mapper = mapper;
        for (Notifier notifier : discoveredNotifiers) {
            notifiers.put(notifier.channel(), notifier);
        }
        for (NotificationChannel channel : NotificationChannel.values()) {
            if (!notifiers.containsKey(channel)) {
                throw new IllegalStateException("No notifier registered for channel " + channel);
            }
        }
    }

    /**
     * Creates an alert exactly once per (incident, type, channel, reference). Duplicate
     * protection relies on the unique deduplication key, which also guards against two
     * concurrent submissions racing each other.
     */
    @Transactional
    public Optional<Alert> createAlert(Incident incident, AlertType type, RecipientCategory category,
                                       NotificationChannel channel, String recipientRef, String message,
                                       String deduplicationSuffix) {
        String key = "incident:" + incident.getId() + ":" + type + ":" + channel + ":"
                + (deduplicationSuffix == null ? "" : deduplicationSuffix);
        if (alertRepository.existsByDeduplicationKey(key)) {
            return Optional.empty();
        }
        Alert alert = Alert.create(incident, type, category, channel, recipientRef,
                truncate(message), truncate(key));
        return Optional.of(alertRepository.save(alert));
    }

    /** Raises the standard alert set for a newly submitted incident. */
    @Transactional
    public int raiseIncidentCreated(Incident incident) {
        String message = "New " + incident.getPriority() + " " + incident.getIncidentType().getLabel()
                + " report " + incident.getReportId()
                + (incident.getZoneName() == null ? "" : " in " + incident.getZoneName()) + ".";
        int created = 0;
        Optional<Alert> inApp = createAlert(incident, AlertType.NEW_INCIDENT, RecipientCategory.ADMIN,
                NotificationChannel.IN_APP, "Administrator in-app feed", message, "new");
        if (inApp.isPresent()) {
            created++;
            deliverAsync(inApp.get().getId());
        }
        Optional<Alert> email = createAlert(incident, AlertType.NEW_INCIDENT, RecipientCategory.ADMIN,
                NotificationChannel.EMAIL, "administrator-mailbox", message, "new");
        if (email.isPresent()) {
            created++;
            deliverAsync(email.get().getId());
        }
        return created;
    }

    @Transactional
    public int raiseSos(Incident incident) {
        String message = "SOS " + incident.getReportId() + " activated"
                + (incident.getZoneName() == null ? "" : " near " + incident.getZoneName())
                + ". Location " + (incident.getLatitude() != null ? "captured" : "not available") + ".";
        int created = 0;
        Optional<Alert> inApp = createAlert(incident, AlertType.SOS_ACTIVATED, RecipientCategory.ADMIN,
                NotificationChannel.IN_APP, "Administrator in-app feed", message, "sos");
        if (inApp.isPresent()) {
            created++;
            deliverAsync(inApp.get().getId());
        }
        Optional<Alert> sms = createAlert(incident, AlertType.SOS_ACTIVATED, RecipientCategory.ADMIN,
                NotificationChannel.SMS, "on-call-safety-desk", message, "sos");
        if (sms.isPresent()) {
            created++;
            deliverAsync(sms.get().getId());
        }
        return created;
    }

    @Transactional
    public void raiseStatusChanged(Incident incident, String detail) {
        String message = "Report " + incident.getReportId() + " is now " + incident.getStatus() + ".";
        createAlert(incident, AlertType.STATUS_CHANGED, RecipientCategory.CITIZEN,
                NotificationChannel.IN_APP, incident.getReportId(), message + " " + detail,
                "status-" + incident.getStatus());
    }

    @Transactional
    public void raiseAssignment(Incident incident) {
        if (incident.getResponder() == null) {
            return;
        }
        String message = "Report " + incident.getReportId() + " assigned to "
                + incident.getResponder().getDisplayName() + ".";
        createAlert(incident, AlertType.RESPONDER_ASSIGNED, RecipientCategory.RESPONDER,
                NotificationChannel.IN_APP, incident.getResponder().getDisplayName(), message,
                "responder-" + incident.getResponder().getId());
    }

    @Transactional
    public void raiseEscalated(Incident incident) {
        String message = "Report " + incident.getReportId() + " was escalated to CRITICAL by an administrator.";
        createAlert(incident, AlertType.ESCALATED, RecipientCategory.ADMIN,
                NotificationChannel.IN_APP, "Administrator in-app feed", message, "escalated");
    }

    /**
     * Runs on the alert thread pool. Because the alert row is committed before this call,
     * a delivery failure can be recorded without losing the incident.
     */
    @Async("alertExecutor")
    public void deliverAsync(Long alertId) {
        try {
            deliverNow(alertId);
        } catch (RuntimeException ex) {
            log.warn("Alert {} delivery failed: {}", alertId, ex.getMessage());
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void deliverNow(Long alertId) {
        Alert alert = alertRepository.findById(alertId).orElse(null);
        if (alert == null || alert.getStatus() != AlertStatus.PENDING) {
            return;
        }
        Notifier notifier = notifiers.get(alert.getChannel());
        NotificationMessage message = new NotificationMessage(alert.getAlertType(),
                alert.getRecipientCategory(), alert.getChannel(), alert.getRecipientRef(),
                "Women Safety Platform alert", alert.getMessage());
        try {
            NotificationMessage.DeliveryOutcome outcome = notifier.deliver(message);
            switch (outcome.status()) {
                case SENT -> alert.markSent();
                case SIMULATED -> alert.markSimulated();
                default -> alert.markFailed(outcome.detail());
            }
        } catch (RuntimeException ex) {
            alert.markFailed(ex.getMessage());
        }
        alertRepository.save(alert);
    }

    @Transactional
    public int retryFailedAlerts(int maxAttempts) {
        List<Alert> retryable = alertRepository.findRetryable(maxAttempts,
                org.springframework.data.domain.PageRequest.of(0, 20));
        for (Alert alert : retryable) {
            alert.resetForRetry();
            alertRepository.save(alert);
            deliverAsync(alert.getId());
        }
        return retryable.size();
    }

    private String truncate(String value) {
        if (value == null) {
            return "";
        }
        return value.length() > 500 ? value.substring(0, 500) : value;
    }

    public List<Alert> forIncident(Long incidentId) {
        return alertRepository.findByIncidentIdOrderByCreatedAtDesc(incidentId);
    }

    @Transactional(readOnly = true)
    public AdminDtos.PageResponse<AdminDtos.AlertResponse> search(AlertStatus status, NotificationChannel channel,
                                                                  int page, int size) {
        Specification<Alert> specification = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (channel != null) {
                predicates.add(cb.equal(root.get("channel"), channel));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        Page<Alert> result = alertRepository.findAll(specification,
                PageRequest.of(Math.max(0, page), size <= 0 ? 20 : Math.min(size, 100),
                        Sort.by(Sort.Order.desc("createdAt"))));
        return AdminDtos.PageResponse.of(result.map(mapper::alertResponse));
    }

    @Transactional(readOnly = true)
    public AdminDtos.AlertResponse get(Long id) {
        Alert alert = alertRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "alert-not-found",
                        "No alert exists with id " + id + ".") {
                });
        return mapper.alertResponse(alert);
    }

    @Transactional
    public AdminDtos.AlertResponse retry(Long id) {
        Alert alert = alertRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "alert-not-found",
                        "No alert exists with id " + id + ".") {
                });
        if (alert.getStatus() != AlertStatus.FAILED) {
            throw new ApiException(HttpStatus.CONFLICT, "alert-not-retryable",
                    "Only failed alerts can be retried.") {
            };
        }
        alert.resetForRetry();
        alertRepository.save(alert);
        deliverAsync(alert.getId());
        return mapper.alertResponse(alert);
    }
}
