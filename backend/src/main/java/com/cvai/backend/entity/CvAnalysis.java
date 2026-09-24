package com.cvai.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Entity
@Table(name = "cv_analyses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CvAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "target_job_title")
    private String targetJobTitle;

    @Column(name = "target_job_description", columnDefinition = "TEXT")
    private String targetJobDescription;

    @Column(name = "original_filename")
    private String originalFilename;

    @Column(name = "file_mime_type")
    private String fileMimeType;

    @Column(name = "file_size_bytes")
    private Long fileSizeBytes;

    @JdbcTypeCode(SqlTypes.VARBINARY)
    @Column(name = "original_file_data", columnDefinition = "bytea")
    private byte[] originalFileData;

    @Column(name = "extracted_cv_text", columnDefinition = "TEXT")
    private String extractedCvText;

    @Column(name = "ats_score")
    private Integer atsScore;

    @Column(name = "assessment_summary", columnDefinition = "TEXT")
    private String assessmentSummary;

    // JSON columns - stored as raw JSON strings, (de)serialized in the service layer
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "matched_skills_json", columnDefinition = "jsonb")
    private String matchedSkillsJson;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "missing_skills_json", columnDefinition = "jsonb")
    private String missingSkillsJson;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "action_plan_json", columnDefinition = "jsonb")
    private String actionPlanJson;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "generated_cv_json", columnDefinition = "jsonb")
    private String generatedCvJson;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public boolean hasOriginalCv() {
        return originalFileData != null && originalFileData.length > 0;
    }
}
