package com.cvai.backend.util;

import com.cvai.backend.util.RateLimitPolicy.Rule;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class RateLimitPolicyTest {

    private final RateLimitPolicy policy = new RateLimitPolicy(new RateLimitPolicy.Limits(5, 30, 10, 5, 15, 10));

    @Test
    void analyzeIsLimitedPerUserPerMinuteAndPerHour() {
        List<Rule> rules = policy.rulesFor("POST", "/analysis/analyze", "a@x.com", "1.2.3.4");
        assertEquals(2, rules.size());
        assertEquals(5, rules.get(0).limit());
        assertEquals(60_000L, rules.get(0).windowMs());
        assertEquals(30, rules.get(1).limit());
        assertEquals(3_600_000L, rules.get(1).windowMs());
        assertTrue(rules.get(0).key().contains("u:a@x.com"));
    }

    @Test
    void anonymousFallsBackToIpKey() {
        List<Rule> rules = policy.rulesFor("POST", "/analysis/analyze", null, "1.2.3.4");
        assertTrue(rules.get(0).key().contains("ip:1.2.3.4"));
    }

    @Test
    void loginAndOtpEndpointsAreLimitedByIp() {
        assertEquals(10, policy.rulesFor("POST", "/auth/login", null, "9.9.9.9").get(0).limit());
        assertEquals(5, policy.rulesFor("POST", "/auth/register", null, "9.9.9.9").get(0).limit());
        assertEquals(5, policy.rulesFor("POST", "/auth/forgot-password", null, "9.9.9.9").get(0).limit());
        assertEquals(15, policy.rulesFor("POST", "/auth/verify-registration-otp", null, "9.9.9.9").get(0).limit());
        assertEquals(15, policy.rulesFor("POST", "/auth/reset-password-otp", null, "9.9.9.9").get(0).limit());
    }

    @Test
    void differentIpsGetDifferentKeys() {
        String k1 = policy.rulesFor("POST", "/auth/login", null, "1.1.1.1").get(0).key();
        String k2 = policy.rulesFor("POST", "/auth/login", null, "2.2.2.2").get(0).key();
        assertNotEquals(k1, k2);
    }

    @Test
    void readOnlyAndUnknownRequestsAreNotLimited() {
        assertTrue(policy.rulesFor("GET", "/analysis/analyze", "a@x.com", "1.1.1.1").isEmpty());
        assertTrue(policy.rulesFor("GET", "/analysis/history", "a@x.com", "1.1.1.1").isEmpty());
        assertTrue(policy.rulesFor("POST", "/something/else", "a@x.com", "1.1.1.1").isEmpty());
        assertTrue(policy.rulesFor("POST", null, "a@x.com", "1.1.1.1").isEmpty());
    }

    @Test
    void paymentIsLimitedPerUser() {
        Rule r = policy.rulesFor("POST", "/payment/create-vnpay-url", "a@x.com", "1.1.1.1").get(0);
        assertEquals(10, r.limit());
        assertTrue(r.key().contains("u:a@x.com"));
    }
}
