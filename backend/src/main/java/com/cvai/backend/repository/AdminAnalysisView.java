package com.cvai.backend.repository;

import java.time.Instant;

/**
 * Read-only projection for the admin analyses list. It deliberately leaves out
 * the CV file itself (original_file_data), which can be hundreds of KB per row.
 */
public interface AdminAnalysisView {
    Long getId();

    String getUserEmail();

    String getTargetJobTitle();

    Integer getAtsScore();

    String getOriginalFilename();

    /** Set only when a file was uploaded (null for pasted text), so it tells us whether a CV file exists. */
    Long getFileSizeBytes();

    Instant getCreatedAt();
}
