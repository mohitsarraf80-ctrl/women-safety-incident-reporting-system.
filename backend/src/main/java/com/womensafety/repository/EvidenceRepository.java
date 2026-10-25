package com.womensafety.repository;

import com.womensafety.entity.EvidenceMetadata;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EvidenceRepository extends JpaRepository<EvidenceMetadata, Long> {

    List<EvidenceMetadata> findByIncidentIdOrderByUploadedAtAsc(Long incidentId);

    Optional<EvidenceMetadata> findByIdAndIncidentId(Long id, Long incidentId);

    long countByIncidentId(Long incidentId);
}
