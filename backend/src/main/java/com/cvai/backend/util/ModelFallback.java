package com.cvai.backend.util;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

/**
 * Runs a call against an ordered list of AI models: retries transient failures
 * with an increasing back-off, then falls through to the next model. Pure Java
 * (no Spring/HTTP types) so the policy can be unit-tested in isolation.
 */
public final class ModelFallback {

    private ModelFallback() {}

    /** Why a single attempt failed, as classified by the HTTP adapter. */
    public static final class CallFailure extends Exception {
        private final boolean retryable;       // 429 / 5xx / network: worth retrying the same model
        private final boolean modelUnavailable; // 404: this model is gone, go straight to the next one

        public CallFailure(String message, boolean retryable, boolean modelUnavailable, Throwable cause) {
            super(message, cause);
            this.retryable = retryable;
            this.modelUnavailable = modelUnavailable;
        }

        public boolean isRetryable() { return retryable; }
        public boolean isModelUnavailable() { return modelUnavailable; }
        /** 400/401/403 etc.: a different model will not help, stop immediately. */
        public boolean isFatal() { return !retryable && !modelUnavailable; }
    }

    @FunctionalInterface
    public interface Call<T> {
        T run(String model) throws CallFailure;
    }

    @FunctionalInterface
    public interface Sleeper {
        void sleep(long ms);
    }

    public interface Listener {
        void onRetry(String model, int attempt, int maxAttempts, long backoffMs, CallFailure cause);
        void onFallback(String fromModel, String toModel, CallFailure cause);
    }

    /** "primary" followed by the comma-separated fallbacks, trimmed, de-duplicated, order kept. */
    public static List<String> chain(String primary, String fallbackCsv) {
        LinkedHashSet<String> set = new LinkedHashSet<>();
        if (primary != null && !primary.isBlank()) set.add(primary.trim());
        if (fallbackCsv != null) {
            for (String m : fallbackCsv.split(",")) {
                if (!m.isBlank()) set.add(m.trim());
            }
        }
        return new ArrayList<>(set);
    }

    public static <T> T execute(List<String> models, int primaryAttempts, int fallbackAttempts,
                                long baseBackoffMs, Sleeper sleeper, Listener listener,
                                Call<T> call) throws CallFailure {
        if (models.isEmpty()) {
            throw new CallFailure("No AI model configured", false, false, null);
        }
        CallFailure last = null;
        for (int i = 0; i < models.size(); i++) {
            String model = models.get(i);
            int maxAttempts = Math.max(1, i == 0 ? primaryAttempts : fallbackAttempts);
            boolean moveOn = false;
            for (int attempt = 1; attempt <= maxAttempts && !moveOn; attempt++) {
                try {
                    return call.run(model);
                } catch (CallFailure f) {
                    last = f;
                    if (f.isFatal()) {
                        throw f;
                    }
                    if (f.isModelUnavailable()) {
                        moveOn = true;
                    } else if (attempt < maxAttempts) {
                        long backoff = baseBackoffMs * attempt;
                        if (listener != null) listener.onRetry(model, attempt, maxAttempts, backoff, f);
                        sleeper.sleep(backoff);
                    } else {
                        moveOn = true;
                    }
                }
            }
            if (moveOn && i + 1 < models.size() && listener != null) {
                listener.onFallback(model, models.get(i + 1), last);
            }
        }
        throw last;
    }
}
