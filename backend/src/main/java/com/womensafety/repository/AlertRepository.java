package com.womensafety.repository;

import com.womensafety.entity.Alert;
import com.womensafety.enums.AlertStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AlertRepository extends JpaRepository<Alert, Long>, JpaSpecificationExecutor<Alert> {

    boolean existsByDeduplicationKey(String deduplicationKey);

    Optional<Alert> findByDeduplicationKey(String deduplicationKey);

    List<Alert> findByIncidentIdOrderByCreatedAtDesc(Long incidentId);

    Page<Alert> findByStatusOrderByCreatedAtDesc(AlertStatus status, Pageable pageable);

    long countByStatus(AlertStatus status);

    long countByStatusIn(List<AlertStatus> statuses);

    @Query("select a from Alert a where a.status = com.womensafety.enums.AlertStatus.FAILED and a.attempts < :maxAttempts order by a.createdAt asc")
    List<Alert> findRetryable(@Param("maxAttempts") int maxAttempts, Pageable pageable);
}
