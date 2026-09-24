package com.cvai.backend.service;

import com.cvai.backend.dto.analysis.*;
import com.cvai.backend.dto.ai.AiAnalysisResult;
import com.cvai.backend.entity.CvAnalysis;
import com.cvai.backend.entity.Tier;
import com.cvai.backend.entity.User;
import com.cvai.backend.exception.ApiException;
import com.cvai.backend.repository.CvAnalysisRepository;
import com.cvai.backend.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CvAnalysisService {

    private final CvAnalysisRepository cvAnalysisRepository;
    private final UserRepository userRepository;
    private final CvTextExtractorService textExtractorService;
    private final GeminiService geminiService;
    private final ObjectMapper objectMapper;

    @Value("${app.quota.max-free-analyses}")
    private int maxFreeAnalyses;

    @Transactional
    public CvAnalysisResponse analyze(User user, String targetJobTitle, String targetJobDescription,
                                       MultipartFile file, String cvText) {

        enforceQuota(user);

        if ((file == null || file.isEmpty()) && (cvText == null || cvText.isBlank())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Vui lòng tải lên file CV hoặc dán nội dung CV.");
        }

        String extractedText = null;
        String originalFilename = null;
        String mimeType = null;
        byte[] fileBytes = null;
        Long fileSize = null;
        boolean isPlus = user.getTier() == Tier.PLUS;
        AiAnalysisResult aiResult;

        if (file != null && !file.isEmpty()) {
            originalFilename = file.getOriginalFilename();
            fileSize = file.getSize();
            try {
                fileBytes = file.getBytes();
            } catch (Exception e) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Không thể đọc file CV đã tải lên.");
            }

            if (textExtractorService.isMultimodalFile(originalFilename)) {
                // PDF / image: send the raw file straight to Gemini — works even for
                // CVs exported as flattened images with no text layer.
                mimeType = textExtractorService.resolveMimeType(originalFilename);
                aiResult = geminiService.analyzeCvFile(fileBytes, mimeType, targetJobTitle, targetJobDescription, isPlus);
            } else {
                // DOCX / TXT: genuinely have a text layer, extract and send as text.
                extractedText = textExtractorService.extractText(file);
                mimeType = file.getContentType();
                if (extractedText == null || extractedText.isBlank()) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "Không trích xuất được nội dung từ CV. Vui lòng kiểm tra lại file.");
                }
                aiResult = geminiService.analyzeCvText(extractedText, targetJobTitle, targetJobDescription, isPlus);
            }
        } else {
            extractedText = cvText;
            aiResult = geminiService.analyzeCvText(extractedText, targetJobTitle, targetJobDescription, isPlus);
        }

        attachYoutubeSearchUrls(aiResult.getActionPlan());

        CvAnalysis analysis = CvAnalysis.builder()
                .user(user)
                .targetJobTitle(targetJobTitle)
                .targetJobDescription(targetJobDescription)
                .originalFilename(originalFilename)
                .fileMimeType(mimeType)
                .fileSizeBytes(fileSize)
                .originalFileData(fileBytes)
                .extractedCvText(extractedText)
                .atsScore(aiResult.getAtsScore())
                .assessmentSummary(aiResult.getAssessmentSummary())
                .matchedSkillsJson(toJson(aiResult.getMatchedSkills()))
                .missingSkillsJson(toJson(aiResult.getMissingSkills()))
                .actionPlanJson(toJson(aiResult.getActionPlan()))
                .generatedCvJson(isPlus ? toJson(aiResult.getGeneratedCv()) : null)
                .build();

        analysis = cvAnalysisRepository.save(analysis);

        user.setCvQuotaUsed(user.getCvQuotaUsed() + 1);
        userRepository.save(user);

        return toResponse(analysis);
    }

    public List<CvAnalysisListItemDto> history(User user) {
        return cvAnalysisRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(a -> CvAnalysisListItemDto.builder()
                        .id(a.getId())
                        .originalFilename(a.getOriginalFilename())
                        .hasOriginalCv(a.hasOriginalCv())
                        .targetJobTitle(a.getTargetJobTitle())
                        .atsScore(a.getAtsScore())
                        .createdAt(a.getCreatedAt())
                        .build())
                .toList();
    }

    public CvAnalysisResponse getById(User user, Long id) {
        CvAnalysis analysis = cvAnalysisRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy báo cáo phân tích."));
        return toResponse(analysis);
    }

    @Transactional
    public void delete(User user, Long id) {
        CvAnalysis analysis = cvAnalysisRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy báo cáo phân tích."));
        cvAnalysisRepository.delete(analysis);
    }

    public CvAnalysis getOriginalForDownload(User user, Long id) {
        CvAnalysis analysis = cvAnalysisRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy báo cáo phân tích."));
        if (!analysis.hasOriginalCv()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Báo cáo này không có file CV gốc đính kèm.");
        }
        return analysis;
    }

    /** Used by admin (no user ownership check). */
    public CvAnalysis getOriginalForDownloadAsAdmin(Long id) {
        CvAnalysis analysis = cvAnalysisRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy báo cáo phân tích."));
        if (!analysis.hasOriginalCv()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Báo cáo này không có file CV gốc đính kèm.");
        }
        return analysis;
    }

    private void enforceQuota(User user) {
        if (user.getTier() == Tier.PLUS) {
            return;
        }
        if (user.getCvQuotaUsed() >= maxFreeAnalyses) {
            throw new ApiException(HttpStatus.FORBIDDEN,
                    "Bạn đã dùng hết " + maxFreeAnalyses + " lượt phân tích miễn phí. Vui lòng nâng cấp lên gói Plus.");
        }
    }

    private CvAnalysisResponse toResponse(CvAnalysis a) {
        return CvAnalysisResponse.builder()
                .id(a.getId())
                .targetJobTitle(a.getTargetJobTitle())
                .targetJobDescription(a.getTargetJobDescription())
                .originalFilename(a.getOriginalFilename())
                .hasOriginalCv(a.hasOriginalCv())
                .fileSizeBytes(a.getFileSizeBytes())
                .fileMimeType(a.getFileMimeType())
                .atsScore(a.getAtsScore())
                .assessmentSummary(a.getAssessmentSummary())
                .matchedSkills(orEmpty(fromJson(a.getMatchedSkillsJson(), new TypeReference<List<SkillItemDto>>() {})))
                .missingSkills(orEmpty(fromJson(a.getMissingSkillsJson(), new TypeReference<List<SkillItemDto>>() {})))
                .actionPlan(orEmpty(fromJson(a.getActionPlanJson(), new TypeReference<List<ActionPlanItemDto>>() {})))
                .generatedCvJson(fromJson(a.getGeneratedCvJson(), new TypeReference<GeneratedCvDto>() {}))
                .jobSearchUrls(buildJobSearchLinks(a.getTargetJobTitle()))
                .createdAt(a.getCreatedAt())
                .build();
    }

    private void attachYoutubeSearchUrls(List<ActionPlanItemDto> actionPlan) {
        if (actionPlan == null) return;
        for (ActionPlanItemDto item : actionPlan) {
            String query = item.getYoutubeSearchQuery();
            if (query == null || query.isBlank()) {
                // Gemini doesn't always fill this field for every item — fall back to
                // the item's own title so every card still gets a working link.
                query = item.getTitle();
            }
            if (query != null && !query.isBlank()) {
                item.setYoutubeSearchUrl("https://www.youtube.com/results?search_query="
                        + URLEncoder.encode(query, StandardCharsets.UTF_8));
            }
        }
    }

    /**
     * TopCV/VietnamWorks use category-slug URLs (not stable keyword params), so a
     * guessed query string can easily 404. Google's site-search always resolves;
     * LinkedIn Jobs has a real, stable keyword search URL so we link it directly.
     */
    private JobSearchLinksDto buildJobSearchLinks(String targetJobTitle) {
        String title = (targetJobTitle == null || targetJobTitle.isBlank()) ? "" : targetJobTitle.trim();
        if (title.isEmpty()) {
            return null;
        }
        String encoded = URLEncoder.encode(title, StandardCharsets.UTF_8);
        return JobSearchLinksDto.builder()
                .linkedin("https://www.linkedin.com/jobs/search/?keywords=" + encoded + "&location=Vietnam")
                .topcv("https://www.google.com/search?q=" + encoded + "+site%3Atopcv.vn")
                .vietnamworks("https://www.google.com/search?q=" + encoded + "+site%3Avietnamworks.com")
                .build();
    }

    private String toJson(Object obj) {
        if (obj == null) return null;
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return null;
        }
    }

    private <T> T fromJson(String json, TypeReference<T> typeRef) {
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(json, typeRef);
        } catch (Exception e) {
            return null;
        }
    }

    private <T> List<T> orEmpty(List<T> list) {
        return list == null ? Collections.emptyList() : list;
    }
}
