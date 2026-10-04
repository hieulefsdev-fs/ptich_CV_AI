package com.cvai.backend.util;

import com.cvai.backend.util.ModelFallback.CallFailure;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ModelFallbackTest {

    private static CallFailure transientFail() { return new CallFailure("503", true, false, null); }
    private static CallFailure gone()          { return new CallFailure("404", false, true, null); }
    private static CallFailure fatal()         { return new CallFailure("403", false, false, null); }

    private final List<Long> sleeps = new ArrayList<>();
    private final List<String> calls = new ArrayList<>();
    private final List<String> events = new ArrayList<>();

    private final ModelFallback.Listener listener = new ModelFallback.Listener() {
        public void onRetry(String m, int a, int max, long b, CallFailure c) { events.add("retry:" + m + ":" + a); }
        public void onFallback(String from, String to, CallFailure c) { events.add("fallback:" + from + "->" + to); }
    };

    @Test
    void chainParsesTrimsAndDeduplicates() {
        assertEquals(List.of("a", "b", "c"), ModelFallback.chain("a", " b , c ,a, ,"));
        assertEquals(List.of("a"), ModelFallback.chain(" a ", null));
        assertEquals(List.of("b"), ModelFallback.chain("", "b"));
        assertTrue(ModelFallback.chain(null, null).isEmpty());
    }

    @Test
    void succeedsOnFirstTryWithoutSleeping() throws Exception {
        String r = ModelFallback.execute(List.of("m1", "m2"), 3, 2, 1500, sleeps::add, listener,
                m -> { calls.add(m); return "ok-" + m; });
        assertEquals("ok-m1", r);
        assertTrue(sleeps.isEmpty());
    }

    @Test
    void retriesTransientFailureWithIncreasingBackoff() throws Exception {
        int[] n = {0};
        String r = ModelFallback.execute(List.of("m1", "m2"), 3, 2, 1500, sleeps::add, listener, m -> {
            calls.add(m);
            if (++n[0] < 3) throw transientFail();
            return "ok";
        });
        assertEquals("ok", r);
        assertEquals(List.of("m1", "m1", "m1"), calls);
        assertEquals(List.of(1500L, 3000L), sleeps);
    }

    @Test
    void fallsThroughToNextModelAfterAttemptsExhausted() throws Exception {
        String r = ModelFallback.execute(List.of("m1", "m2"), 2, 2, 100, sleeps::add, listener, m -> {
            calls.add(m);
            if (m.equals("m1")) throw transientFail();
            return "from-" + m;
        });
        assertEquals("from-m2", r);
        assertEquals(List.of("m1", "m1", "m2"), calls);
        assertTrue(events.contains("fallback:m1->m2"));
    }

    @Test
    void modelThatIsGoneSkipsStraightToNext() throws Exception {
        String r = ModelFallback.execute(List.of("old", "new"), 3, 2, 100, sleeps::add, listener, m -> {
            calls.add(m);
            if (m.equals("old")) throw gone();
            return "ok";
        });
        assertEquals("ok", r);
        assertEquals(List.of("old", "new"), calls);
        assertTrue(sleeps.isEmpty());
    }

    @Test
    void fatalErrorStopsImmediatelyWithoutTryingOtherModels() {
        CallFailure f = assertThrows(CallFailure.class, () ->
                ModelFallback.execute(List.of("m1", "m2"), 3, 2, 100, sleeps::add, listener, m -> {
                    calls.add(m);
                    throw fatal();
                }));
        assertTrue(f.isFatal());
        assertEquals(List.of("m1"), calls);
    }

    @Test
    void throwsLastFailureWhenEverythingFails() {
        CallFailure f = assertThrows(CallFailure.class, () ->
                ModelFallback.execute(List.of("m1", "m2"), 2, 2, 100, sleeps::add, listener, m -> {
                    calls.add(m);
                    throw transientFail();
                }));
        assertTrue(f.isRetryable());
        assertEquals(List.of("m1", "m1", "m2", "m2"), calls);
    }

    @Test
    void emptyModelListFailsClearly() {
        assertThrows(CallFailure.class, () ->
                ModelFallback.execute(List.of(), 3, 2, 100, sleeps::add, listener, m -> "x"));
    }
}
