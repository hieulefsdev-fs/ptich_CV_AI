package com.cvai.backend.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalysisSummaryDto {
    private Long id;
    private String userEmail;
    private String targetJobTitle;
    private Integer atsScore;
    private String originalFilename;
    private Boolean hasOriginalCv;
    private Instant createdAt;
}
