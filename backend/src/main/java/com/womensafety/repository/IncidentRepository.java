package com.womensafety.repository;

import com.womensafety.entity.Incident;
import com.womensafety.enums.IncidentStatus;
import com.womensafety.enums.IncidentType;
import com.womensafety.enums.PriorityLevel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface IncidentRepository extends JpaRepository<Incident, Long>, JpaSpecificationExecutor<Incident> {

    Optional<Incident> findByReportId(String reportId);

    boolean existsByReportId(String reportId);

    List<Incident> findByReporterIdOrderBySubmittedAtDesc(Long reporterId);

    Page<Incident> findByResponderIdOrderBySubmittedAtDesc(Long responderId, Pageable pageable);

    long countByStatus(IncidentStatus status);

    long countByStatusIn(List<IncidentStatus> statuses);

    long countByPriority(PriorityLevel priority);

    long countBySubmittedAtAfter(Instant from);

    long countBySosTriggeredTrueAndStatusNotIn(List<IncidentStatus> statuses);

    long countByResponderIdAndStatusIn(Long responderId, List<IncidentStatus> statuses);

    long countByResponderId(Long responderId);

    @Query("select i from Incident i where i.submittedAt >= :from and i.latitude is not null and i.longitude is not null")
    List<Incident> findGeolocatedSince(@Param("from") Instant from);

    /**
     * Earlier reports in the same grid cell used for the repeat-report bonus. The
     * incident currently being scored is excluded explicitly.
     */
    @Query("""
            select count(i) from Incident i
            where i.gridCell = :gridCell
              and i.id <> :excludeId
              and i.submittedAt >= :from
              and i.status <> com.womensafety.enums.IncidentStatus.CLOSED
            """)
    long countRecentReportsInCell(@Param("gridCell") String gridCell,
                                  @Param("excludeId") Long excludeId,
                                  @Param("from") Instant from);

    @Query("""
            select count(i) from Incident i
            where i.gridCell is null and lower(i.zoneName) = lower(:zoneName)
              and i.id <> :excludeId
              and i.submittedAt >= :from
              and i.status <> com.womensafety.enums.IncidentStatus.CLOSED
            """)
    long countRecentReportsInZoneName(@Param("zoneName") String zoneName,
                                      @Param("excludeId") Long excludeId,
                                      @Param("from") Instant from);

    @Query("select i.incidentType, count(i) from Incident i where i.submittedAt >= :from and i.submittedAt <= :to group by i.incidentType")
    List<Object[]> countByTypeBetween(@Param("from") Instant from, @Param("to") Instant to);

    @Query("select i.priority, count(i) from Incident i where i.submittedAt >= :from and i.submittedAt <= :to group by i.priority")
    List<Object[]> countByPriorityBetween(@Param("from") Instant from, @Param("to") Instant to);

    @Query("select i.status, count(i) from Incident i where i.submittedAt >= :from and i.submittedAt <= :to group by i.status")
    List<Object[]> countByStatusBetween(@Param("from") Instant from, @Param("to") Instant to);

    @Query("select i from Incident i where i.resolvedAt is not null and i.submittedAt >= :from and i.submittedAt <= :to")
    List<Incident> findResolvedBetween(@Param("from") Instant from, @Param("to") Instant to);

    @Query("select i from Incident i where i.sosTriggered = true and i.submittedAt >= :from and i.submittedAt <= :to")
    List<Incident> findSosBetween(@Param("from") Instant from, @Param("to") Instant to);

    @Query("select i from Incident i where i.submittedAt >= :from and i.submittedAt <= :to order by i.submittedAt asc")
    List<Incident> findAllBetween(@Param("from") Instant from, @Param("to") Instant to);

    long countByIncidentType(IncidentType type);
}
