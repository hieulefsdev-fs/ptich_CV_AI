package com.cvai.backend.util;

import org.junit.jupiter.api.Test;

import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.*;

class SlidingWindowRateLimiterTest {

    private final AtomicLong now = new AtomicLong(1_000_000);
    private final SlidingWindowRateLimiter limiter = new SlidingWindowRateLimiter(now::get, 1000);

    @Test
    void allowsUpToLimitThenBlocks() {
        assertTrue(limiter.tryAcquire("u1", 3, 1000));
        assertTrue(limiter.tryAcquire("u1", 3, 1000));
        assertTrue(limiter.tryAcquire("u1", 3, 1000));
        assertFalse(limiter.tryAcquire("u1", 3, 1000));
    }

    @Test
    void allowsAgainAfterWindowPasses() {
        for (int i = 0; i < 3; i++) limiter.tryAcquire("u1", 3, 1000);
        assertFalse(limiter.tryAcquire("u1", 3, 1000));
        now.addAndGet(1000);
        assertTrue(limiter.tryAcquire("u1", 3, 1000));
    }

    @Test
    void keysAreIndependent() {
        for (int i = 0; i < 3; i++) limiter.tryAcquire("u1", 3, 1000);
        assertFalse(limiter.tryAcquire("u1", 3, 1000));
        assertTrue(limiter.tryAcquire("u2", 3, 1000));
    }

    @Test
    void rejectedCallsAreNotRecorded() {
        limiter.tryAcquire("u1", 1, 1000);          // t=0 accepted
        now.addAndGet(500);
        assertFalse(limiter.tryAcquire("u1", 1, 1000)); // t=500 rejected, must not extend the block
        now.addAndGet(500);                          // t=1000: first hit expired
        assertTrue(limiter.tryAcquire("u1", 1, 1000));
    }

    @Test
    void retryAfterReportsRemainingWait() {
        limiter.tryAcquire("u1", 1, 1000);
        now.addAndGet(300);
        assertEquals(700, limiter.retryAfterMs("u1", 1000));
        assertEquals(0, limiter.retryAfterMs("unknown", 1000));
    }

    @Test
    void oldKeysArePurgedWhenMapGrowsTooLarge() {
        SlidingWindowRateLimiter small = new SlidingWindowRateLimiter(now::get, 5);
        for (int i = 0; i < 6; i++) small.tryAcquire("k" + i, 1, 1000);
        now.addAndGet(5000);
        small.tryAcquire("fresh", 1, 1000);
        assertTrue(small.size() < 6);
    }
}
