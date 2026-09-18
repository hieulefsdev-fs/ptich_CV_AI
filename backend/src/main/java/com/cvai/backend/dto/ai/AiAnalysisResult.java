package com.cvai.backend.dto.ai;

import com.cvai.backend.dto.analysis.ActionPlanItemDto;
import com.cvai.backend.dto.analysis.GeneratedCvDto;
import com.cvai.backend.dto.analysis.SkillItemDto;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

/** Shape we instruct the AI provider (Gemini) to return as its JSON response. */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class AiAnalysisResult {

    @JsonProperty("ats_score")
    private Integer atsScore;

    @JsonProperty("assessment_summary")
    private String assessmentSummary;

    @JsonProperty("matched_skills")
    private List<SkillItemDto> matchedSkills;

    @JsonProperty("missing_skills")
    private List<SkillItemDto> missingSkills;

    @JsonProperty("action_plan")
    private List<ActionPlanItemDto> actionPlan;

    @JsonProperty("generated_cv")
    private GeneratedCvDto generatedCv;
}
