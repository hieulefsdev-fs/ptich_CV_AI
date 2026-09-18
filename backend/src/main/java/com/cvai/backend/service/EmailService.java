package com.cvai.backend.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromAddress;

    @Async
    public void sendOtpEmail(String toEmail, String otpCode, String purposeLabel) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(toEmail);
            helper.setSubject("[CV AI] Mã xác thực " + purposeLabel);
            helper.setText(buildOtpHtml(otpCode, purposeLabel), true);
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Gửi email OTP thất bại đến {}: {}", toEmail, e.getMessage());
        }
    }

    private String buildOtpHtml(String otpCode, String purposeLabel) {
        return """
                <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px">
                  <h2 style="color:#4f46e5">CV AI Analysis</h2>
                  <p>Mã xác thực %s của bạn là:</p>
                  <div style="font-size:32px;font-weight:bold;letter-spacing:6px;color:#111;background:#f5f5f7;padding:16px;text-align:center;border-radius:8px">%s</div>
                  <p style="color:#666;font-size:13px;margin-top:16px">Mã có hiệu lực trong ít phút. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
                </div>
                """.formatted(purposeLabel, otpCode);
    }
}
