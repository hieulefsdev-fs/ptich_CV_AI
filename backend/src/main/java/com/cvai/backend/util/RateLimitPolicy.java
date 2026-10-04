package com.cvai.backend.util;

import java.util.ArrayList;
import java.util.List;

/**
 * Decides WHICH rate-limit rules apply to a request. Pure logic (no servlet types)
 * so it can be unit-tested; {@code RateLimitFilter} does the enforcing.
 *
 * Paths are relative to the context path (e.g. "/analysis/analyze", not "/api/v1/analysis/analyze").
 */
public final class RateLimitPolicy {

    public record Rule(String name, String key, int limit, long windowMs) {}

    public record Limits(int analyzePerMinute, int analyzePerHour, int loginPerMinute,
                         int otpRequestPer10Min, int otpVerifyPer10Min, int paymentPerMinute) {}

    private static final long MINUTE = 60_000L;
    private static final long TEN_MINUTES = 10 * MINUTE;
    private static final long HOUR = 60 * MINUTE;

    private final Limits limits;

    public RateLimitPolicy(Limits limits) {
        this.limits = limits;
    }

    /**
     * @param userKey identifier of the authenticated user, or null for anonymous requests
     * @param ip      client IP (already resolved behind Cloudflare/proxy)
     */
    public List<Rule> rulesFor(String method, String path, String userKey, String ip) {
        List<Rule> rules = new ArrayList<>();
        if (!"POST".equalsIgnoreCase(method) || path == null) {
            return rules;
        }
        String who = userKey != null ? "u:" + userKey : "ip:" + ip;

        switch (path) {
            case "/analysis/analyze" -> {
                rules.add(new Rule("analyze-minute", "analyze-m:" + who, limits.analyzePerMinute(), MINUTE));
                rules.add(new Rule("analyze-hour", "analyze-h:" + who, limits.analyzePerHour(), HOUR));
            }
            case "/auth/login" ->
                    rules.add(new Rule("login", "login:ip:" + ip, limits.loginPerMinute(), MINUTE));
            case "/auth/register", "/auth/forgot-password" ->
                    rules.add(new Rule("otp-request", "otp-req:ip:" + ip, limits.otpRequestPer10Min(), TEN_MINUTES));
            case "/auth/verify-registration-otp", "/auth/reset-password-otp", "/auth/reset-password" ->
                    rules.add(new Rule("otp-verify", "otp-ver:ip:" + ip, limits.otpVerifyPer10Min(), TEN_MINUTES));
            case "/payment/create-vnpay-url" ->
                    rules.add(new Rule("payment", "pay:" + who, limits.paymentPerMinute(), MINUTE));
            default -> { /* not rate limited */ }
        }
        return rules;
    }
}
