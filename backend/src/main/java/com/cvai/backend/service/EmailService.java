package com.cvai.backend.service;

import com.cvai.backend.util.HtmlEscaper;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.text.NumberFormat;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromAddress;

    @Value("${app.frontend.base-url}")
    private String frontendBaseUrl;

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

    /** Sent once, when a Free user spends their last free analysis. */
    @Async
    public void sendQuotaReachedEmail(String toEmail, String fullName, int maxFree) {
        String body = """
                <p>Xin chào <b>%s</b>,</p>
                <p>Bạn vừa dùng hết <b>%d lượt phân tích miễn phí</b> trên CV AI Analysis.</p>
                <p>Nâng cấp lên gói <b>Plus</b> để phân tích không giới hạn và nhận thêm <b>bản CV mẫu đã được AI tối ưu</b> cho từng vị trí ứng tuyển.</p>
                %s
                <p style="color:#666;font-size:13px">Các báo cáo đã tạo vẫn xem lại được bình thường trong mục Lịch sử.</p>
                """.formatted(HtmlEscaper.escape(fullName), maxFree, button("Xem gói Plus", frontendBaseUrl + "/pricing"));
        sendHtml(toEmail, "[CV AI] Bạn đã dùng hết lượt phân tích miễn phí", body);
    }

    /** Sent after a VNPay payment is confirmed and the account is upgraded. */
    @Async
    public void sendPaymentSuccessEmail(String toEmail, String fullName, long amountVnd, String txnRef) {
        String amount = NumberFormat.getInstance(Locale.forLanguageTag("vi-VN")).format(amountVnd);
        String body = """
                <p>Xin chào <b>%s</b>,</p>
                <p>Thanh toán của bạn đã được xác nhận. Tài khoản đã được nâng cấp lên <b>Plus</b>.</p>
                <table style="border-collapse:collapse;margin:12px 0">
                  <tr><td style="padding:4px 12px 4px 0;color:#666">Mã giao dịch</td><td><b>%s</b></td></tr>
                  <tr><td style="padding:4px 12px 4px 0;color:#666">Số tiền</td><td><b>%s đ</b></td></tr>
                </table>
                %s
                <p style="color:#666;font-size:13px">Giữ lại email này để đối chiếu khi cần hỗ trợ.</p>
                """.formatted(HtmlEscaper.escape(fullName), HtmlEscaper.escape(txnRef), amount,
                button("Bắt đầu phân tích CV", frontendBaseUrl + "/analyze"));
        sendHtml(toEmail, "[CV AI] Thanh toán thành công - đã nâng cấp Plus", body);
    }

    private void sendHtml(String toEmail, String subject, String innerHtml) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(wrap(innerHtml), true);
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Gửi email '{}' thất bại đến {}: {}", subject, toEmail, e.getMessage());
        }
    }

    private String wrap(String innerHtml) {
        return """
                <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px">
                  <h2 style="color:#4f46e5">CV AI Analysis</h2>
                  %s
                </div>
                """.formatted(innerHtml);
    }

    private String button(String label, String url) {
        return "<p><a href=\"" + HtmlEscaper.escape(url) + "\" style=\"display:inline-block;background:#4f46e5;color:#fff;"
                + "text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:bold\">"
                + HtmlEscaper.escape(label) + "</a></p>";
    }
}
