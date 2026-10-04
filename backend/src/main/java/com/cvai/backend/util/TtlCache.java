package com.cvai.backend.util;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.LongSupplier;

/** Tiny thread-safe in-memory cache with a per-entry time-to-live and a size cap. */
public final class TtlCache<K, V> {

    private record Entry<V>(V value, long expiresAt) {}

    private final Map<K, Entry<V>> map = new ConcurrentHashMap<>();
    private final LongSupplier clock;
    private final int maxEntries;

    public TtlCache(int maxEntries) {
        this(maxEntries, System::currentTimeMillis);
    }

    public TtlCache(int maxEntries, LongSupplier clock) {
        this.maxEntries = maxEntries;
        this.clock = clock;
    }

    public Optional<V> get(K key) {
        Entry<V> e = map.get(key);
        if (e == null) return Optional.empty();
        if (clock.getAsLong() >= e.expiresAt()) {
            map.remove(key, e);
            return Optional.empty();
        }
        return Optional.of(e.value());
    }

    public void put(K key, V value, long ttlMs) {
        if (map.size() >= maxEntries) {
            long now = clock.getAsLong();
            map.entrySet().removeIf(en -> now >= en.getValue().expiresAt());
            if (map.size() >= maxEntries) {
                map.clear(); // extreme case: drop everything rather than grow forever
            }
        }
        map.put(key, new Entry<>(value, clock.getAsLong() + ttlMs));
    }

    int size() {
        return map.size();
    }
}
