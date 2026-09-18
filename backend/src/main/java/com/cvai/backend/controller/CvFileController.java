package com.cvai.backend.controller;

import com.cvai.backend.entity.CvAnalysis;
import com.cvai.backend.entity.Role;
import com.cvai.backend.security.CustomUserDetails;
import com.cvai.backend.service.CvAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/cv")
@RequiredArgsConstructor
public class CvFileController {

    private final CvAnalysisService cvAnalysisService;

    @GetMapping("/original-cv/{analysisId}")
    public ResponseEntity<ByteArrayResource> downloadOriginal(@AuthenticationPrincipal CustomUserDetails principal,
                                                                @PathVariable Long analysisId) {
        boolean isAdmin = principal.getUser().getRole() == Role.ADMIN;
        CvAnalysis analysis = isAdmin
                ? cvAnalysisService.getOriginalForDownloadAsAdmin(analysisId)
                : cvAnalysisService.getOriginalForDownload(principal.getUser(), analysisId);

        ByteArrayResource resource = new ByteArrayResource(analysis.getOriginalFileData());
        String filename = analysis.getOriginalFilename() != null ? analysis.getOriginalFilename()
                : "original_cv_" + analysisId;
        MediaType mediaType = analysis.getFileMimeType() != null
                ? MediaType.parseMediaType(analysis.getFileMimeType())
                : MediaType.APPLICATION_OCTET_STREAM;

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentLength(analysis.getOriginalFileData().length)
                .body(resource);
    }
}
