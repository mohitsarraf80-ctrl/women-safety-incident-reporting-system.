package com.womensafety.service;

import com.womensafety.dto.AdminDtos;
import com.womensafety.entity.Responder;
import com.womensafety.entity.User;
import com.womensafety.enums.IncidentStatus;
import com.womensafety.enums.ResponderAvailability;
import com.womensafety.enums.UserRole;
import com.womensafety.exception.ApiException;
import com.womensafety.exception.DuplicateResourceException;
import com.womensafety.exception.ResponderNotFoundException;
import com.womensafety.repository.IncidentRepository;
import com.womensafety.repository.ResponderRepository;
import com.womensafety.repository.UserRepository;
import com.womensafety.security.UserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Responder directory, availability and workload for administrators. */
@Service
public class ResponderService {

    private static final List<IncidentStatus> ACTIVE_STATUSES =
            List.of(IncidentStatus.ASSIGNED, IncidentStatus.IN_PROGRESS);

    private final ResponderRepository responderRepository;
    private final UserRepository userRepository;
    private final IncidentRepository incidentRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;
    private final com.womensafety.util.ReportIdGenerator idGenerator;

    public ResponderService(ResponderRepository responderRepository, UserRepository userRepository,
                            IncidentRepository incidentRepository, PasswordEncoder passwordEncoder,
                            AuditService auditService, com.womensafety.util.ReportIdGenerator idGenerator) {
        this.responderRepository = responderRepository;
        this.userRepository = userRepository;
        this.incidentRepository = incidentRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
        this.idGenerator = idGenerator;
    }

    @Transactional(readOnly = true)
    public List<AdminDtos.ResponderResponse> list() {
        return responderRepository.findAllWithUser().stream().map(this::toResponse).toList();
    }

    @Transactional
    public AdminDtos.ResponderResponse create(AdminDtos.ResponderCreateRequest request) {
        User loginUser = null;
        if (request.loginEmail() != null && !request.loginEmail().isBlank()) {
            if (request.loginPassword() == null || request.loginPassword().length() < 8) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "invalid-responder-account",
                        "A temporary password of at least 8 characters is required when a login email is supplied.") {
                };
            }
            if (userRepository.existsByEmailIgnoreCase(request.loginEmail())) {
                throw new DuplicateResourceException("An account with this email already exists.");
            }
            loginUser = User.create(request.displayName().trim(), request.loginEmail().trim(),
                    passwordEncoder.encode(request.loginPassword()), UserRole.RESPONDER);
            userRepository.save(loginUser);
        }

        String badge = uniqueBadge();
        Responder responder = Responder.create(badge, request.displayName().trim(),
                request.organisation().trim(), request.contactPhone(),
                loginUser);
        if (request.availability() != null) {
            responder.changeAvailability(request.availability());
        }
        responderRepository.save(responder);
        auditService.record("RESPONDER_CREATED", "Responder", badge,
                "Responder created for " + request.organisation());
        return toResponse(responder);
    }

    @Transactional
    public AdminDtos.ResponderResponse update(Long id, AdminDtos.ResponderUpdateRequest request) {
        Responder responder = responderRepository.findById(id)
                .orElseThrow(() -> new ResponderNotFoundException(id));
        responder.updateDetails(request.displayName().trim(), request.organisation().trim(),
                request.contactPhone());
        responder.changeAvailability(request.availability());
        responderRepository.save(responder);
        auditService.record("RESPONDER_UPDATED", "Responder", responder.getBadgeCode(),
                "Profile or availability updated");
        return toResponse(responder);
    }

    @Transactional(readOnly = true)
    public Responder requireForUser(UserPrincipal principal) {
        return responderRepository.findByUserId(principal.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "responder-profile-missing",
                        "This responder account has no responder profile. Ask an administrator to create one.") {
                });
    }

    @Transactional(readOnly = true)
    public AdminDtos.ResponderResponse profileForUser(UserPrincipal principal) {
        return toResponse(requireForUser(principal));
    }

    @Transactional(readOnly = true)
    public List<Responder> available() {
        return responderRepository.findByAvailability(ResponderAvailability.AVAILABLE);
    }

    private String uniqueBadge() {
        for (int attempt = 0; attempt < 10; attempt++) {
            String badge = idGenerator.newResponderBadge();
            if (!responderRepository.existsByBadgeCodeIgnoreCase(badge)) {
                return badge;
            }
        }
        throw new IllegalStateException("Could not allocate a responder badge code");
    }

    public AdminDtos.ResponderResponse toResponse(Responder responder) {
        long active = incidentRepository.countByResponderIdAndStatusIn(responder.getId(), ACTIVE_STATUSES);
        long total = incidentRepository.countByResponderId(responder.getId());
        return new AdminDtos.ResponderResponse(responder.getId(), responder.getBadgeCode(),
                responder.getDisplayName(), responder.getOrganisation(), responder.getContactPhone(),
                responder.getAvailability(),
                responder.getUser() == null ? null : responder.getUser().getEmail(),
                active, total, responder.getCreatedAt());
    }
}
