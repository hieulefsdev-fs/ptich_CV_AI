package com.cvai.backend.dto.analysis;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectItemDto {
    private String name;
    private String role;

    @JsonProperty("tech_stack")
    private List<String> techStack;

    private List<String> highlights;
}
