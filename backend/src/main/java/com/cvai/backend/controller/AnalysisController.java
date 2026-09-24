package com.cvai.backend.controller;

import com.cvai.backend.dto.analysis.CvAnalysisListItemDto;
import com.cvai.backend.dto.analysis.CvAnalysisResponse;
import com.cvai.backend.entity.CvAnalysis;
import com.cvai.backend.security.CustomUserDetails;
import com.cvai.backend.service.CvAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/analysis")
@RequiredArgsConstructor
public class AnalysisController {

    private final CvAnalysisService cvAnalysisService;

    @PostMapping(value = "/analyze", consumes = "multipart/form-data")
    public CvAnalysisResponse analyze(@AuthenticationPrincipal CustomUserDetails principal,
                                       @RequestParam(value = "target_job_title", required = false) String targetJobTitle,
                                       @RequestParam(value = "target_job_description", required = false) String targetJobDescription,
                                       @RequestParam(value = "file", required = false) MultipartFile file,
                                       @RequestParam(value = "cv_text", required = false) String cvText) {
        return cvAnalysisService.analyze(principal.getUser(), targetJobTitle, targetJobDescription, file, cvText);
    }

    @GetMapping("/history")
    public List<CvAnalysisListItemDto> history(@AuthenticationPrincipal CustomUserDetails principal) {
        return cvAnalysisService.history(principal.getUser());
    }

    @GetMapping("/{id}")
    public CvAnalysisResponse getById(@AuthenticationPrincipal CustomUserDetails principal, @PathVariable Long id) {
        return cvAnalysisService.getById(principal.getUser(), id);
    }

    @DeleteMapping("/{id}")
    public void delete(@AuthenticationPrincipal CustomUserDetails principal, @PathVariable Long id) {
        cvAnalysisService.delete(principal.getUser(), id);
    }

    /** Matches the path the main frontend (api/payment.ts's downloadOriginalCv) actually calls. */
    @GetMapping("/{id}/original-cv")
    public ResponseEntity<ByteArrayResource> downloadOriginal(@AuthenticationPrincipal CustomUserDetails principal,
                                                                @PathVariable Long id) {
        CvAnalysis analysis = cvAnalysisService.getOriginalForDownload(principal.getUser(), id);
        return CvFileController.buildDownloadResponse(analysis, id);
    }
}
