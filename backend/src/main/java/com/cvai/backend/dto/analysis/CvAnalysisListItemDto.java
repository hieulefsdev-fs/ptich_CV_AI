package com.cvai.backend.dto.analysis;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class CvAnalysisListItemDto {
    private Long id;
    private String originalFilename;
    private Boolean hasOriginalCv;
    private String targetJobTitle;
    private Integer atsScore;
    private Instant createdAt;
}
