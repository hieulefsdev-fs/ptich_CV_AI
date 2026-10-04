package com.cvai.backend.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JobTitleNormalizerTest {

    @Test
    void stripsParenthesesAndKeepsCoreTitle() {
        assertEquals("Frontend Developer", JobTitleNormalizer.normalize("Frontend Developer (React / TypeScript)"));
        assertEquals("Backend Developer", JobTitleNormalizer.normalize("Backend Developer (Java Spring Boot / Node.js)"));
        assertEquals("Fullstack Developer", JobTitleNormalizer.normalize("Fullstack Developer (React & Java/Python)"));
    }

    @Test
    void slashesBecomeSpaces() {
        assertEquals("AI Machine Learning Engineer", JobTitleNormalizer.normalize("AI / Machine Learning Engineer"));
    }

    @Test
    void handlesNullBlankAndMessySpacing() {
        assertEquals("", JobTitleNormalizer.normalize(null));
        assertEquals("", JobTitleNormalizer.normalize("   "));
        assertEquals("Data Analyst", JobTitleNormalizer.normalize("  Data    Analyst  "));
    }

    @Test
    void titleThatIsOnlyParenthesesBecomesEmpty() {
        assertEquals("", JobTitleNormalizer.normalize("(anything)"));
    }

    @Test
    void longTitlesAreTruncated() {
        String t = "A".repeat(200);
        assertTrue(JobTitleNormalizer.normalize(t).length() <= 80);
    }

    @Test
    void cacheKeyIsCaseInsensitive() {
        assertEquals(JobTitleNormalizer.cacheKey("Backend Developer (Java)"), JobTitleNormalizer.cacheKey("backend developer"));
    }
}
