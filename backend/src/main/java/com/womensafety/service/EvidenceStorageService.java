package com.womensafety.service;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

/**
 * Abstraction over evidence storage. The prototype stores files on the local filesystem
 * outside the served frontend directory; an S3-backed implementation can replace it
 * without touching the incident service.
 */
public interface EvidenceStorageService {

    StoredEvidence store(String reportId, MultipartFile file);

    Resource load(String storedFilename);

    void delete(String storedFilename);

    record StoredEvidence(
            String storedFilename,
            String originalFilename,
            String contentType,
            long sizeBytes,
            String sha256
    ) {
    }
}
