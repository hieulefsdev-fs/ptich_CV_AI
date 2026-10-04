package com.cvai.backend.service;

import com.cvai.backend.dto.analysis.JobListingDto;
import com.cvai.backend.util.JobTitleNormalizer;
import com.cvai.backend.util.TtlCache;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Looks up REAL, specific job postings (title, employer, direct apply link)
 * via JSearch (RapidAPI) — an aggregator over Google for Jobs covering
 * LinkedIn, Indeed, Glassdoor and others. Free tier: 200 requests/month.
 *
 * Quota-friendly by design:
 *  - the free-form title is first normalised ("Backend Developer (Java / Node)" -> "Backend Developer"),
 *    because compound titles often return zero results when sent verbatim;
 *  - results are cached per normalised title (12h when found, 1h when empty), so ten students
 *    targeting "Backend Developer" cost one API call, not ten;
 *  - at most two calls per cache miss (country-filtered first, then a plain "... in Vietnam" query).
 *
 * If no key is configured or the call fails, returns an empty list so the caller can fall back
 * to plain search links — this never breaks the main CV analysis flow.
 */
@Service
@Slf4j
public class JobSearchService {

    private static final String SEARCH_URL = "https://jsearch.p.rapidapi.com/search-v2";
    private static final int MAX_RESULTS = 3;
    private static final long TTL_FOUND_MS = 12L * 60 * 60 * 1000;
    private static final long TTL_EMPTY_MS = 60L * 60 * 1000;

    private final RestClient restClient;
    private final TtlCache<String, List<JobListingDto>> cache = new TtlCache<>(500);

    @Value("${app.jsearch.api-key}")
    private String apiKey;

    @Value("${app.jsearch.host}")
    private String host;

    public JobSearchService(RestClient restClient) {
        this.restClient = restClient;
    }

    public List<JobListingDto> findRealJobListings(String jobTitle) {
        if (apiKey == null || apiKey.isBlank()) {
            return new ArrayList<>();
        }
        String query = JobTitleNormalizer.normalize(jobTitle);
        if (query.isEmpty()) {
            return new ArrayList<>();
        }

        String cacheKey = JobTitleNormalizer.cacheKey(jobTitle);
        var cached = cache.get(cacheKey);
        if (cached.isPresent()) {
            return new ArrayList<>(cached.get());
        }

        try {
            List<JobListingDto> results = search(query, "&country=vn");
            if (results.isEmpty()) {
                results = search(query + " in Vietnam", "");
            }
            cache.put(cacheKey, results, results.isEmpty() ? TTL_EMPTY_MS : TTL_FOUND_MS);
            return new ArrayList<>(results);
        } catch (Exception e) {
            // Failures are deliberately NOT cached, so the next request can try again.
            log.warn("JSearch API lookup thất bại cho '{}': {} — bỏ qua, dùng link tìm kiếm dự phòng.", query, e.getMessage());
            return new ArrayList<>();
        }
    }

    private List<JobListingDto> search(String query, String extraParams) {
        String url = SEARCH_URL + "?query=" + URLEncoder.encode(query, StandardCharsets.UTF_8)
                + "&num_pages=1" + extraParams;

        JsonNode response = restClient.get()
                .uri(url)
                .header("X-RapidAPI-Key", apiKey)
                .header("X-RapidAPI-Host", host)
                .retrieve()
                .body(JsonNode.class);

        List<JobListingDto> results = new ArrayList<>();
        Set<String> seenUrls = new LinkedHashSet<>();
        JsonNode jobs = extractJobs(response);
        for (JsonNode job : jobs) {
            String applyLink = job.path("job_apply_link").asText(null);
            String title = job.path("job_title").asText(null);
            if (applyLink == null || !applyLink.startsWith("http") || title == null || title.isBlank()) {
                continue;
            }
            if (!seenUrls.add(applyLink)) {
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

        if (results.isEmpty()) {
            String raw = response == null ? "null" : response.toString();
            log.warn("JSearch trả về 0 tin phù hợp cho '{}'. status={}, raw={}",
                    query,
                    response == null ? "" : response.path("status").asText(""),
                    raw.length() > 500 ? raw.substring(0, 500) + "…" : raw);
        }
        return results;
    }

    /** search-v2 nests the list under data.jobs; the older /search returned data as a plain array. */
    private JsonNode extractJobs(JsonNode response) {
        if (response == null) return com.fasterxml.jackson.databind.node.MissingNode.getInstance();
        JsonNode data = response.path("data");
        if (data.isArray()) return data;
        return data.path("jobs");
    }
}
