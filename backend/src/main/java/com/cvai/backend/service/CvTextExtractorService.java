package com.cvai.backend.service;

import com.cvai.backend.exception.ApiException;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;
import java.util.Set;

/**
 * Two ways a CV file reaches Gemini:
 *  - PDF / image files: sent as-is (multimodal) — Gemini reads the pixels directly,
 *    so it works even for CVs exported as flattened images with no text layer
 *    (very common with Canva-style designed templates).
 *  - DOCX / TXT: genuinely contain a text layer, so we extract it here and send
 *    plain text — cheaper and just as accurate for these formats.
 */
@Service
public class CvTextExtractorService {

    private static final Set<String> MULTIMODAL_EXTENSIONS = Set.of(".pdf", ".jpg", ".jpeg", ".png", ".webp");

    public boolean isMultimodalFile(String filename) {
        String lower = safeLower(filename);
        return MULTIMODAL_EXTENSIONS.stream().anyMatch(lower::endsWith);
    }

    public String resolveMimeType(String filename) {
        String lower = safeLower(filename);
        if (lower.endsWith(".pdf")) return "application/pdf";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".webp")) return "image/webp";
        throw new ApiException(HttpStatus.BAD_REQUEST, "Định dạng file không được hỗ trợ cho chế độ đọc trực tiếp.");
    }

    /** Only called for DOCX / TXT — formats with a real text layer. */
    public String extractText(MultipartFile file) {
        String filename = safeLower(file.getOriginalFilename());

        try (InputStream is = file.getInputStream()) {
            if (filename.endsWith(".docx")) {
                try (XWPFDocument document = new XWPFDocument(is);
                     XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
                    return extractor.getText();
                }
            } else if (filename.endsWith(".txt")) {
                return new String(is.readAllBytes());
            } else {
                throw new ApiException(HttpStatus.BAD_REQUEST,
                        "Định dạng file không được hỗ trợ. Vui lòng dùng PDF, JPG, PNG, DOCX hoặc TXT.");
            }
        } catch (IOException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Không thể đọc nội dung file CV đã tải lên.");
        }
    }

    private String safeLower(String filename) {
        return filename == null ? "" : filename.toLowerCase(Locale.ROOT);
    }
}
