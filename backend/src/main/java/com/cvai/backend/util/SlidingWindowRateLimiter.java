package com.cvai.backend.util;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.LongSupplier;

/**
 * In-memory sliding-window rate limiter keyed by an arbitrary string
 * (user id, client IP, ...). No external dependencies.
 *
 * Each call to {@link #tryAcquire} records a hit and returns true only if the
 * number of hits for that key within the last {@code windowMs} stays at or
 * below {@code limit}. Rejected calls are NOT recorded, so a blocked client
 * is allowed again as soon as its oldest hit leaves the window.
 */
public final class SlidingWindowRateLimiter {

    private final ConcurrentHashMap<String, Deque<Long>> hits = new ConcurrentHashMap<>();
    private final LongSupplier clock;
    private final int maxKeys;

    public SlidingWindowRateLimiter() {
        this(System::currentTimeMillis, 50_000);
    }

    public SlidingWindowRateLimiter(LongSupplier clock, int maxKeys) {
        this.clock = clock;
        this.maxKeys = maxKeys;
    }

    public boolean tryAcquire(String key, int limit, long windowMs) {
        long now = clock.getAsLong();
        if (hits.size() > maxKeys) {
            purge(now, windowMs);
        }
        boolean[] allowed = {false};
        hits.compute(key, (k, deque) -> {
            Deque<Long> d = deque == null ? new ArrayDeque<>() : deque;
            while (!d.isEmpty() && now - d.peekFirst() >= windowMs) {
                d.pollFirst();
            }
            if (d.size() < limit) {
                d.addLast(now);
                allowed[0] = true;
            }
            return d;
        });
        return allowed[0];
    }

    /** Milliseconds until the oldest hit of this key leaves the window (0 if not limited). */
    public long retryAfterMs(String key, long windowMs) {
        long now = clock.getAsLong();
        long[] result = {0};
        // computeIfPresent holds the bin lock, so reading the deque here is race-free
        hits.computeIfPresent(key, (k, d) -> {
            Long oldest = d.peekFirst();
            if (oldest != null) {
                result[0] = Math.max(0, windowMs - (now - oldest));
            }
            return d;
        });
        return result[0];
    }

    private void purge(long now, long windowMs) {
        hits.entrySet().removeIf(e -> {
            Long last = e.getValue().peekLast();
            return last == null || now - last >= windowMs;
        });
    }

    int size() {
        return hits.size();
    }
}
