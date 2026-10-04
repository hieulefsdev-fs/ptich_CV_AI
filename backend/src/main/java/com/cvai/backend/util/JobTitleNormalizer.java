package com.cvai.backend.util;

import java.util.Locale;

/**
 * Turns a free-form target job title such as
 * "Backend Developer (Java Spring Boot / Node.js)" into a short query that job
 * search engines handle well ("Backend Developer"). Compound titles with
 * parentheses and slashes often return zero results when sent verbatim.
 */
public final class JobTitleNormalizer {

    private JobTitleNormalizer() {}

    public static String normalize(String title) {
        if (title == null) return "";
        String t = title.trim();
        // drop anything inside (), [] or {}
        t = t.replaceAll("\\([^)]*\\)|\\[[^]]*]|\\{[^}]*}", " ");
        // separators become spaces
        t = t.replaceAll("[/&|,;:+]", " ");
        // collapse whitespace
        t = t.replaceAll("\\s+", " ").trim();
        if (t.length() > 80) {
            t = t.substring(0, 80).trim();
        }
        return t;
    }

    /** Lower-cased, accent-preserving cache key for a normalized title. */
    public static String cacheKey(String title) {
        return normalize(title).toLowerCase(Locale.ROOT);
    }
}
