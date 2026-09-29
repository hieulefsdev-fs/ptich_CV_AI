package com.cvai.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * Looks up ONE real, specific YouTube video for a search phrase using the
 * official YouTube Data API v3 — returns a direct /watch?v=... link instead
 * of a search-results page.
 */
@Service
@Slf4j
public class YoutubeSearchService {

    private final RestClient restClient;

    @Value("${app.youtube.api-key}")
    private String apiKey;

    private static final String SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";
    private static final String FALLBACK_SEARCH_URL = "https://www.youtube.com/results?search_query=";

    public YoutubeSearchService(RestClient restClient) {
        this.restClient = restClient;
    }

    /**
     * Returns a direct video watch URL if a real match is found via the API;
     * otherwise falls back to a plain YouTube search-results URL so the
     * button never breaks (missing/invalid key, quota exceeded, no results...).
     */
    public String findVideoUrlOrSearchFallback(String query) {
        String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);
        String fallback = FALLBACK_SEARCH_URL + encodedQuery;

        if (apiKey == null || apiKey.isBlank()) {
            return fallback;
        }

        try {
            String url = SEARCH_URL + "?part=snippet&type=video&maxResults=1&relevanceLanguage=vi"
                    + "&q=" + encodedQuery + "&key=" + apiKey;

            JsonNode response = restClient.get().uri(url).retrieve().body(JsonNode.class);
            JsonNode videoId = response.path("items").path(0).path("id").path("videoId");

            if (videoId.isMissingNode() || videoId.asText().isBlank()) {
                return fallback;
            }
            return "https://www.youtube.com/watch?v=" + videoId.asText();
        } catch (Exception e) {
            log.warn("YouTube Data API lookup thất bại cho '{}': {} — dùng link tìm kiếm dự phòng.", query, e.getMessage());
            return fallback;
        }
    }
}
