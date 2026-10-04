package com.cvai.backend.util;

import org.junit.jupiter.api.Test;

import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.*;

class TtlCacheTest {

    private final AtomicLong now = new AtomicLong(0);

    @Test
    void returnsValueBeforeExpiryAndEmptyAfter() {
        TtlCache<String, String> cache = new TtlCache<>(10, now::get);
        cache.put("a", "1", 1000);
        assertEquals("1", cache.get("a").orElse(null));
        now.set(999);
        assertTrue(cache.get("a").isPresent());
        now.set(1000);
        assertFalse(cache.get("a").isPresent());
    }

    @Test
    void missingKeyIsEmpty() {
        TtlCache<String, String> cache = new TtlCache<>(10, now::get);
        assertFalse(cache.get("nope").isPresent());
    }

    @Test
    void sizeCapIsEnforced() {
        TtlCache<Integer, String> cache = new TtlCache<>(3, now::get);
        for (int i = 0; i < 20; i++) cache.put(i, "v", 10_000);
        assertTrue(cache.size() <= 3);
        assertTrue(cache.get(19).isPresent());
    }

    @Test
    void expiredEntriesAreEvictedBeforeClearing() {
        TtlCache<Integer, String> cache = new TtlCache<>(2, now::get);
        cache.put(1, "a", 100);
        cache.put(2, "b", 10_000);
        now.set(500);
        cache.put(3, "c", 10_000);   // full: expired #1 is dropped, #2 survives
        assertTrue(cache.get(2).isPresent());
        assertTrue(cache.get(3).isPresent());
    }
}
