package com.cvai.backend.service;

import com.cvai.backend.dto.ai.AiAnalysisResult;
import com.cvai.backend.exception.ApiException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;

/**
 * Calls Google Gemini's generateContent REST API and asks it to return
 * strict JSON matching {@link AiAnalysisResult}.
 *
 * Two input modes:
 *  - Multimodal: the raw CV file (PDF or image) is sent as inline_data, so
 *    Gemini reads it directly — this works even for CVs exported as flattened
 *    images with no text layer (common with designed templates).
 *  - Text: plain extracted/pasted text, embedded straight into the prompt.
 */
@Service
@Slf4j
public class GeminiService {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    @Value("${app.gemini.api-key}")
    private String apiKey;

    @Value("${app.gemini.model}")
    private String model;

    @Value("${app.gemini.base-url}")
    private String baseUrl;

    public GeminiService(RestClient restClient, ObjectMapper objectMapper) {
        this.restClient = restClient;
        this.objectMapper = objectMapper;
    }

    /** Text-based input (pasted CV text, or extracted from DOCX/TXT). */
    public AiAnalysisResult analyzeCvText(String cvText, String targetJobTitle, String targetJobDescription, boolean includeGeneratedCv) {
        String prompt = buildPrompt(targetJobTitle, targetJobDescription, includeGeneratedCv)
                + "\n\nNội dung CV cần phân tích:\n---\n" + cvText + "\n---";

        List<Map<String, Object>> parts = List.of(Map.of("text", prompt));
        return callGemini(parts);
    }

    /** Multimodal input (PDF or image file) — Gemini reads the file directly. */
    public AiAnalysisResult analyzeCvFile(byte[] fileBytes, String mimeType, String targetJobTitle, String targetJobDescription, boolean includeGeneratedCv) {
        String prompt = buildPrompt(targetJobTitle, targetJobDescription, includeGeneratedCv)
                + "\n\nNội dung CV cần phân tích được đính kèm dưới dạng file. Hãy đọc kỹ toàn bộ nội dung trong file (kể cả khi file là ảnh/scan) trước khi phân tích.";

        String base64Data = Base64.getEncoder().encodeToString(fileBytes);
        List<Map<String, Object>> parts = new ArrayList<>();
        parts.add(Map.of("text", prompt));
        parts.add(Map.of("inline_data", Map.of("mime_type", mimeType, "data", base64Data)));

        return callGemini(parts);
    }

    private AiAnalysisResult callGemini(List<Map<String, Object>> parts) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Hệ thống AI chưa được cấu hình (thiếu GEMINI_API_KEY). Vui lòng liên hệ quản trị viên.");
        }

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of("parts", parts)),
                "generationConfig", Map.of(
                        "responseMimeType", "application/json",
                        "temperature", 0.4
                )
        );

        String url = baseUrl + "/models/" + model + ":generateContent?key=" + apiKey;

        JsonNode response = callWithRetry(url, requestBody, 3);

        String jsonText = extractResponseText(response);

        try {
            return objectMapper.readValue(jsonText, AiAnalysisResult.class);
        } catch (Exception e) {
            log.error("Không parse được JSON từ Gemini: {}\nRaw: {}", e.getMessage(), jsonText);
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Dịch vụ AI trả về dữ liệu không hợp lệ, vui lòng thử lại.");
        }
    }

    private String extractResponseText(JsonNode response) {
        JsonNode textNode = response
                .path("candidates").path(0)
                .path("content").path("parts").path(0)
                .path("text");
        if (textNode.isMissingNode() || textNode.asText().isBlank()) {
            JsonNode finishReason = response.path("candidates").path(0).path("finishReason");
            log.error("Gemini không trả về nội dung. finishReason={}, raw={}", finishReason, response);
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Dịch vụ AI không trả về kết quả phân tích. Vui lòng thử lại với file khác hoặc mô tả ngắn gọn hơn.");
        }
        return textNode.asText();
    }

    private String buildPrompt(String targetJobTitle, String targetJobDescription, boolean includeGeneratedCv) {
        String generatedCvInstruction = includeGeneratedCv
                ? """
                  "generated_cv": {
                    "full_name": string, "target_title": string,
                    "contact": {"email": string, "phone": string, "github": string, "linkedin": string, "location": string},
                    "summary": string,
                    "core_competencies": string[],
                    "technical_skills": { "<nhóm kỹ năng>": string[] },
                    "experience": [{"company": string, "position": string, "duration": string, "location": string, "achievements": string[]}],
                    "projects": [{"name": string, "role": string, "tech_stack": string[], "highlights": string[]}],
                    "education": [{"institution": string, "degree": string, "duration": string, "gpa": string, "honors": string}],
                    "certifications": string[],
                    "ai_enhancement_notes": string[]
                  }
                  """
                : "\"generated_cv\": null";

        return """
                Bạn là chuyên gia tuyển dụng và viết CV (ATS - Applicant Tracking System) cho sinh viên/ứng viên Việt Nam.
                Hãy phân tích CV được cung cấp so với vị trí công việc mục tiêu, và trả lời DUY NHẤT bằng một object JSON hợp lệ,
                không thêm markdown, không thêm giải thích, không có ```; theo đúng cấu trúc sau:

                {
                  "ats_score": number (0-100, đây chính là PHẦN TRĂM mức độ CV đáp ứng yêu cầu của vị trí ứng tuyển),
                  "assessment_summary": string (đánh giá tổng quan bằng tiếng Việt, 3-5 câu, có nhắc rõ con số phần trăm phù hợp),
                  "matched_skills": [{"name": string, "category": string, "status": "matched", "importance": "high"|"medium"|"low", "advice": string}],
                  "missing_skills": [{"name": string, "category": string, "status": "missing", "importance": "high"|"medium"|"low", "advice": string}],
                  "action_plan": [{"title": string, "description": string, "urgency": "high"|"medium"|"low", "learning_resources": string[], "youtube_search_query": string}],
                  %s
                }

                Với mỗi phần tử trong "action_plan": "youtube_search_query" là một CỤM TỪ KHÓA NGẮN (không phải link) để tìm video học kỹ năng đó trên YouTube,
                ví dụ "Spring Boot Security JWT tutorial" hoặc "học React Hooks cơ bản". KHÔNG tự bịa link YouTube cụ thể vì có thể không tồn tại.

                Vị trí công việc mục tiêu: %s
                Mô tả công việc mục tiêu (nếu có): %s
                """.formatted(
                generatedCvInstruction,
                blankToNone(targetJobTitle),
                blankToNone(targetJobDescription)
        );
    }

    private String blankToNone(String s) {
        return (s == null || s.isBlank()) ? "(không cung cấp)" : s;
    }

    /** Gemini's "high demand" 503 is transient — retry a few times with backoff before giving up. */
    private JsonNode callWithRetry(String url, Map<String, Object> requestBody, int maxAttempts) {
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return restClient.post()
                        .uri(url)
                        .body(requestBody)
                        .retrieve()
                        .body(JsonNode.class);
            } catch (HttpStatusCodeException e) {
                boolean retryable = e.getStatusCode() == HttpStatus.SERVICE_UNAVAILABLE
                        || e.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS;
                if (retryable && attempt < maxAttempts) {
                    long backoffMs = 1500L * attempt;
                    log.warn("Gemini quá tải tạm thời (lần {}/{}), thử lại sau {}ms", attempt, maxAttempts, backoffMs);
                    sleep(backoffMs);
                    continue;
                }
                log.error("Gọi Gemini API thất bại: {}", e.getMessage());
                throw new ApiException(HttpStatus.BAD_GATEWAY,
                        retryable
                                ? "Dịch vụ AI đang quá tải, đã thử lại " + maxAttempts + " lần nhưng vẫn thất bại. Vui lòng thử lại sau ít phút."
                                : "Không thể kết nối tới dịch vụ AI, vui lòng thử lại sau.");
            } catch (Exception e) {
                log.error("Gọi Gemini API thất bại: {}", e.getMessage());
                throw new ApiException(HttpStatus.BAD_GATEWAY, "Không thể kết nối tới dịch vụ AI, vui lòng thử lại sau.");
            }
        }
        // Unreachable, but keeps the compiler happy.
        throw new ApiException(HttpStatus.BAD_GATEWAY, "Không thể kết nối tới dịch vụ AI, vui lòng thử lại sau.");
    }

    private void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
        }
    }
}
