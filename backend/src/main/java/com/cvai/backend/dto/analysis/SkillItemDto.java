package com.cvai.backend.dto.analysis;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SkillItemDto {
    private String name;
    private String category;
    private String status;
    private String importance;
    private String advice;
}
