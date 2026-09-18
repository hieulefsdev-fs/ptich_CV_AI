package com.cvai.backend.dto.analysis;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EducationItemDto {
    private String institution;
    private String degree;
    private String duration;
    private String gpa;
    private String honors;
}
