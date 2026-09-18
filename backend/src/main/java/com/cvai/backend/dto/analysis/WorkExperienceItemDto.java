package com.cvai.backend.dto.analysis;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkExperienceItemDto {
    private String company;
    private String position;
    private String duration;
    private String location;
    private List<String> achievements;
}
