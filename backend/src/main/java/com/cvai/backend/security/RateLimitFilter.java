package com.cvai.backend.security;

import com.cvai.backend.util.RateLimitPolicy;
import com.cvai.backend.util.SlidingWindowRateLimiter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Protects the expensive / abusable endpoints (AI analysis, login, OTP e-mails and
 * OTP guessing, payment creation) with in-memory sliding-window limits.
 * Which rules apply is decided by {@link RateLimitPolicy}; this class only enforces them.
 *
 * Runs after {@link JwtAuthFilter} so that authenticated requests are limited per user,
 * anonymous ones per client IP. State is per JVM instance — fine for this single-container
 * deployment; move to Redis if the backend is ever scaled horizontally.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);

    private final SlidingWindowRateLimiter limiter = new SlidingWindowRateLimiter();
    private final RateLimitPolicy policy;
    private final boolean enabled;

    public RateLimitFilter(
            @Value("${app.ratelimit.enabled:true}") boolean enabled,
            @Value("${app.ratelimit.analyze-per-minute:5}") int analyzePerMinute,
            @Value("${app.ratelimit.analyze-per-hour:30}") int analyzePerHour,
            @Value("${app.ratelimit.login-per-minute:10}") int loginPerMinute,
            @Value("${app.ratelimit.otp-request-per-10min:5}") int otpRequestPer10Min,
            @Value("${app.ratelimit.otp-verify-per-10min:15}") int otpVerifyPer10Min,
            @Value("${app.ratelimit.payment-per-minute:10}") int paymentPerMinute) {
        this.enabled = enabled;
        this.policy = new RateLimitPolicy(new RateLimitPolicy.Limits(
                analyzePerMinute, analyzePerHour, loginPerMinute,
                otpRequestPer10Min, otpVerifyPer10Min, paymentPerMinute));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (!enabled) {
            chain.doFilter(request, response);
            return;
        }

        String path = request.getRequestURI().substring(request.getContextPath().length());
        List<RateLimitPolicy.Rule> rules = policy.rulesFor(request.getMethod(), path, currentUser(), clientIp(request));

        for (RateLimitPolicy.Rule rule : rules) {
            if (!limiter.tryAcquire(rule.key(), rule.limit(), rule.windowMs())) {
                long retryAfterSec = Math.max(1, (limiter.retryAfterMs(rule.key(), rule.windowMs()) + 999) / 1000);
                log.warn("Rate limit [{}] bị chặn: key={}, path={}, retryAfter={}s", rule.name(), rule.key(), path, retryAfterSec);
                reject(response, retryAfterSec);
                return;
            }
        }
        chain.doFilter(request, response);
    }

    private String currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            return null;
        }
        return auth.getName();
    }

    /** Cloudflare puts the real client in CF-Connecting-IP; otherwise first X-Forwarded-For hop; otherwise the socket peer. */
    static String clientIp(HttpServletRequest request) {
        String ip = request.getHeader("CF-Connecting-IP");
        if (ip == null || ip.isBlank()) {
            String xff = request.getHeader("X-Forwarded-For");
            if (xff != null && !xff.isBlank()) {
                ip = xff.split(",")[0];
            }
        }
        if (ip == null || ip.isBlank()) {
            ip = request.getRemoteAddr();
        }
        ip = ip == null ? "unknown" : ip.trim();
        return ip.length() > 64 ? ip.substring(0, 64) : ip;
    }

    private void reject(HttpServletResponse response, long retryAfterSec) throws IOException {
        String message = "Bạn thao tác quá nhanh. Vui lòng thử lại sau " + retryAfterSec + " giây.";
        response.setStatus(429);
        response.setHeader("Retry-After", String.valueOf(retryAfterSec));
        response.setContentType("application/json");
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        // Same shape as GlobalExceptionHandler: the frontend reads message / error / detail.
        response.getWriter().write("{\"status\":429,\"message\":\"" + message + "\",\"error\":\"" + message
                + "\",\"detail\":\"" + message + "\"}");
    }
}
