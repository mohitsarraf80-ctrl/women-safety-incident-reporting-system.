package com.womensafety.service;

import com.womensafety.exception.InvalidEvidenceException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LocalEvidenceStorageServiceTest {

    private static final byte[] PNG = {
            (byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 13, 'I', 'H', 'D', 'R'
    };

    @TempDir
    Path tempDir;

    @Test
    @DisplayName("A real PNG signature is accepted and stored with a generated name")
    void storesValidPng() {
        LocalEvidenceStorageService storage = new LocalEvidenceStorageService(tempDir.toString());
        MockMultipartFile file = new MockMultipartFile("file", "../../evil.png", "image/png", PNG);
        var stored = storage.store("WS-TEST1234", file);
        assertThat(stored.storedFilename()).endsWith(".png").doesNotContain("..");
        assertThat(stored.originalFilename()).isEqualTo("evil.png");
        assertThat(stored.contentType()).isEqualTo("image/png");
        assertThat(Files.exists(tempDir.resolve(stored.storedFilename()))).isTrue();
        assertThat(stored.sha256()).hasSize(64);
    }

    @Test
    @DisplayName("A disguised executable is rejected even if the client claims image/png")
    void rejectsFakeImage() {
        LocalEvidenceStorageService storage = new LocalEvidenceStorageService(tempDir.toString());
        byte[] executable = "MZ\u0090\u0000not-an-image".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "photo.png", "image/png", executable);
        assertThatThrownBy(() -> storage.store("WS-TEST1234", file))
                .isInstanceOf(InvalidEvidenceException.class);
    }

    @Test
    @DisplayName("Oversized uploads are rejected before hitting the disk")
    void rejectsOversizedFile() {
        LocalEvidenceStorageService storage = new LocalEvidenceStorageService(tempDir.toString());
        byte[] big = new byte[6 * 1024 * 1024];
        System.arraycopy(PNG, 0, big, 0, PNG.length);
        MockMultipartFile file = new MockMultipartFile("file", "big.png", "image/png", big);
        assertThatThrownBy(() -> storage.store("WS-TEST1234", file))
                .isInstanceOf(InvalidEvidenceException.class)
                .hasMessageContaining("5 MB");
    }
}
