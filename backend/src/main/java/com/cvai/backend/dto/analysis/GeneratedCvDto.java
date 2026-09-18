package com.cvai.backend.dto.analysis;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Matches frontend's GeneratedCVData (Plus-tier "sample CV" export).
 * All fields use snake_case on the wire.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeneratedCvDto {

    @JsonProperty("full_name")
    private String fullName;

    @JsonProperty("target_title")
    private String targetTitle;

    private ContactDto contact;

    private String summary;

    @JsonProperty("core_competencies")
    private List<String> coreCompetencies;

    @JsonProperty("technical_skills")
    private Map<String, List<String>> technicalSkills;

    private List<WorkExperienceItemDto> experience;

    private List<ProjectItemDto> projects;

    private List<EducationItemDto> education;

    private List<String> certifications;

    @JsonProperty("ai_enhancement_notes")
    private List<String> aiEnhancementNotes;
}
