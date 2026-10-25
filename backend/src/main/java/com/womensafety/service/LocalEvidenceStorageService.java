package com.womensafety.service;

import com.womensafety.exception.InvalidEvidenceException;
import com.womensafety.exception.StorageException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Local filesystem evidence storage with content-based validation.
 *
 * <p>Security decisions:</p>
 * <ul>
 *   <li>The client-provided content type and extension are never trusted; the file is
 *       identified by its magic bytes.</li>
 *   <li>Only JPEG, PNG, WEBP and PDF are accepted, with a 5 MB hard limit.</li>
 *   <li>The stored filename is generated server-side (UUID + canonical extension), which
 *       removes path traversal and executable-upload risks.</li>
 *   <li>Files are written outside the static frontend directory and are only served via an
 *       authorised endpoint.</li>
 * </ul>
 */
@Service
public class LocalEvidenceStorageService implements EvidenceStorageService {

    private static final Logger log = LoggerFactory.getLogger(LocalEvidenceStorageService.class);
    private static final long MAX_BYTES = 5L * 1024 * 1024;

    private static final Map<String, String> ALLOWED = Map.of(
            "image/jpeg", "jpg",
            "image/png", "png",
            "image/webp", "webp",
            "application/pdf", "pdf"
    );

    private final Path baseDirectory;

    public LocalEvidenceStorageService(@Value("${app.storage.evidence-dir:./data/evidence}") String directory) {
        this.baseDirectory = Path.of(directory).toAbsolutePath().normalize();
        try {
            Files.createDirectories(baseDirectory);
        } catch (IOException ex) {
            throw new IllegalStateException("Cannot create evidence directory " + baseDirectory, ex);
        }
        log.info("Evidence storage directory: {}", baseDirectory);
    }

    @Override
    public StoredEvidence store(String reportId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidEvidenceException("The uploaded file is empty.");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new InvalidEvidenceException("Evidence files must be 5 MB or smaller.");
        }
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException ex) {
            throw new StorageException("The uploaded file could not be read.");
        }
        if (bytes.length > MAX_BYTES) {
            throw new InvalidEvidenceException("Evidence files must be 5 MB or smaller.");
        }
        String detected = detectContentType(bytes);
        if (detected == null) {
            throw new InvalidEvidenceException("Only JPEG, PNG, WEBP images or PDF documents are accepted.");
        }
        String extension = ALLOWED.get(detected);
        String storedFilename = UUID.randomUUID().toString().replace("-", "") + "." + extension;
        Path target = baseDirectory.resolve(storedFilename).normalize();
        if (!target.startsWith(baseDirectory)) {
            throw new StorageException("Invalid storage path.");
        }
        try (InputStream in = file.getInputStream()) {
            Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new StorageException("The evidence file could not be saved.");
        }
        return new StoredEvidence(storedFilename, sanitize(file.getOriginalFilename()),
                detected, bytes.length, sha256(bytes));
    }

    @Override
    public Resource load(String storedFilename) {
        Path target = baseDirectory.resolve(storedFilename).normalize();
        if (!target.startsWith(baseDirectory) || !Files.isRegularFile(target)) {
            throw new StorageException("Evidence file is not available.");
        }
        return new FileSystemResource(target);
    }

    @Override
    public void delete(String storedFilename) {
        try {
            Files.deleteIfExists(baseDirectory.resolve(storedFilename).normalize());
        } catch (IOException ex) {
            log.warn("Could not delete evidence file {}: {}", storedFilename, ex.getMessage());
        }
    }

    private String detectContentType(byte[] bytes) {
        if (bytes.length >= 3 && (bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xD8 && (bytes[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }
        if (bytes.length >= 8 && (bytes[0] & 0xFF) == 0x89 && bytes[1] == 'P' && bytes[2] == 'N' && bytes[3] == 'G'
                && (bytes[4] & 0xFF) == 0x0D && (bytes[5] & 0xFF) == 0x0A && (bytes[6] & 0xFF) == 0x1A
                && (bytes[7] & 0xFF) == 0x0A) {
            return "image/png";
        }
        if (bytes.length >= 12 && bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
                && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P') {
            return "image/webp";
        }
        if (bytes.length >= 5 && bytes[0] == '%' && bytes[1] == 'P' && bytes[2] == 'D' && bytes[3] == 'F'
                && bytes[4] == '-') {
            return "application/pdf";
        }
        return null;
    }

    private String sanitize(String originalFilename) {
        if (originalFilename == null || originalFilename.isBlank()) {
            return "evidence";
        }
        String name = originalFilename.replace('\\', '/');
        int slash = name.lastIndexOf('/');
        if (slash >= 0) {
            name = name.substring(slash + 1);
        }
        name = name.replaceAll("[\\p{Cntrl}]", "").trim();
        if (name.isEmpty()) {
            return "evidence";
        }
        return name.length() > 255 ? name.substring(0, 255) : name;
    }

    private String sha256(byte[] bytes) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(bytes)).toUpperCase(Locale.ROOT);
        } catch (NoSuchAlgorithmException ex) {
            throw new StorageException("SHA-256 is not available on this JVM.");
        }
    }
}
