package com.cvai.backend.dto.analysis;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Always-working job search links for the target position — built server-side
 * from the job title, never guessed by the AI (which tends to hallucinate
 * dead links for specific postings).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobSearchLinksDto {
    private String linkedin;
    private String topcv;
    private String vietnamworks;
}
