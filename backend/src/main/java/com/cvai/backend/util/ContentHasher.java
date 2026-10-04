package com.cvai.backend.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Locale;

/** SHA-256 helpers used to recognise "the same CV analysed against the same job again". */
public final class ContentHasher {

    private ContentHasher() {}

    public static String sha256Hex(byte[] data) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(data));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    public static String sha256Hex(String text) {
        return sha256Hex(text == null ? new byte[0] : text.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Cache key for one analysis request: the CV content (file bytes or pasted text),
     * the target job title and the optional job description, all normalised so that
     * trivial differences (case, surrounding spaces) don't defeat the cache.
     */
    public static String analysisKey(String contentHashHex, String jobTitle, String jobDescription) {
        String title = JobTitleNormalizer.cacheKey(jobTitle);
        String jd = jobDescription == null ? "" : jobDescription.trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
        return sha256Hex(contentHashHex + "|" + title + "|" + jd);
    }
}
