package com.cvai.backend.dto.analysis;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class CvAnalysisResponse {
    private Long id;
    private String targetJobTitle;
    private String targetJobDescription;
    private String originalFilename;
    private Boolean hasOriginalCv;
    private Long fileSizeBytes;
    private String fileMimeType;
    private Integer atsScore;
    private String assessmentSummary;
    private List<SkillItemDto> matchedSkills;
    private List<SkillItemDto> missingSkills;
    private List<ActionPlanItemDto> actionPlan;
    private GeneratedCvDto generatedCvJson;
    private JobSearchLinksDto jobSearchUrls;
    private List<JobListingDto> jobListings;
    private Instant createdAt;
}
