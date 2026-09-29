package com.cvai.backend.service;

import com.cvai.backend.dto.analysis.JobListingDto;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Looks up REAL, specific job postings (title, employer, direct apply link)
 * via JSearch (RapidAPI) — an aggregator over Google for Jobs covering
 * LinkedIn, Indeed, Glassdoor and others. Free tier: 200 requests/month.
 *
 * If no key is configured or the call fails, returns an empty list so the
 * caller can fall back to plain search links instead — this never breaks
 * the main CV analysis flow.
 */
@Service
@Slf4j
public class JobSearchService {

    private final RestClient restClient;

    @Value("${app.jsearch.api-key}")
    private String apiKey;

    @Value("${app.jsearch.host}")
    private String host;

    private static final String SEARCH_URL = "https://jsearch.p.rapidapi.com/search-v2";
    private static final int MAX_RESULTS = 3;

    public JobSearchService(RestClient restClient) {
        this.restClient = restClient;
    }

    public List<JobListingDto> findRealJobListings(String jobTitle) {
        List<JobListingDto> results = new ArrayList<>();
        if (apiKey == null || apiKey.isBlank() || jobTitle == null || jobTitle.isBlank()) {
            return results;
        }

        try {
            String query = URLEncoder.encode(jobTitle, StandardCharsets.UTF_8);
            String url = SEARCH_URL + "?query=" + query + "&num_pages=1&country=vn";

            JsonNode response = restClient.get()
                    .uri(url)
                    .header("X-RapidAPI-Key", apiKey)
                    .header("X-RapidAPI-Host", host)
                    .retrieve()
                    .body(JsonNode.class);

            JsonNode jobs = response.path("data").path("jobs");
            if (jobs.isArray()) {
                for (JsonNode job : jobs) {
                    String applyLink = job.path("job_apply_link").asText(null);
                    String title = job.path("job_title").asText(null);
                    if (applyLink == null || applyLink.isBlank() || title == null || title.isBlank()) {
                        continue;
                    }
                    results.add(JobListingDto.builder()
                            .title(title)
                            .company(job.path("employer_name").asText(""))
                            .url(applyLink)
                            .source(job.path("job_publisher").asText(""))
                            .build());
                    if (results.size() >= MAX_RESULTS) break;
                }
            }

            if (results.isEmpty()) {
                log.warn("JSearch trả về 0 tin phù hợp cho '{}'. status={}, jobs.size={}, raw={}",
                        jobTitle, response.path("status").asText(""), jobs.size(), response);
            }
        } catch (Exception e) {
            log.warn("JSearch API lookup thất bại cho '{}': {} — bỏ qua, dùng link tìm kiếm dự phòng.", jobTitle, e.getMessage());
            return new ArrayList<>();
        }
        return results;
    }
}
