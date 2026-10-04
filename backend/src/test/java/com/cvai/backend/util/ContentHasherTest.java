package com.cvai.backend.util;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

class ContentHasherTest {

    @Test
    void sha256MatchesKnownVector() {
        assertEquals("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
                ContentHasher.sha256Hex("abc".getBytes(StandardCharsets.UTF_8)));
        assertEquals(ContentHasher.sha256Hex("abc"), ContentHasher.sha256Hex("abc".getBytes(StandardCharsets.UTF_8)));
    }

    @Test
    void nullTextHashesLikeEmpty() {
        assertEquals(ContentHasher.sha256Hex(""), ContentHasher.sha256Hex((String) null));
    }

    @Test
    void sameRequestWithTrivialDifferencesGivesSameKey() {
        String h = ContentHasher.sha256Hex("cv-bytes");
        assertEquals(
                ContentHasher.analysisKey(h, "Backend Developer", "Java  Spring"),
                ContentHasher.analysisKey(h, "  backend developer ", " java spring "));
    }

    @Test
    void differentJobOrCvGivesDifferentKey() {
        String h1 = ContentHasher.sha256Hex("cv-1");
        String h2 = ContentHasher.sha256Hex("cv-2");
        assertNotEquals(ContentHasher.analysisKey(h1, "Backend", ""), ContentHasher.analysisKey(h1, "Frontend", ""));
        assertNotEquals(ContentHasher.analysisKey(h1, "Backend", ""), ContentHasher.analysisKey(h2, "Backend", ""));
    }
}
