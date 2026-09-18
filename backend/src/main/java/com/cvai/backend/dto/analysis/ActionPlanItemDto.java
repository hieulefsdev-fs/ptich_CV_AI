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
public class ActionPlanItemDto {
    private String title;
    private String description;
    private String urgency;

    @JsonProperty("learning_resources")
    private List<String> learningResources;

    /** Short keyword phrase from Gemini, e.g. "Spring Boot Security JWT tutorial". */
    @JsonProperty("youtube_search_query")
    private String youtubeSearchQuery;

    /** Real, always-working YouTube search URL built server-side from the keyword above. */
    @JsonProperty("youtube_search_url")
    private String youtubeSearchUrl;
}
