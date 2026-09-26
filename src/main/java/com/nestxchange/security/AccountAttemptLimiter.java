package com.nestxchange.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

/**
 * Limits attempts per account, alongside RateLimitingFilter's per-client limit.
 *
 * The per-client limit keys on the client IP, which behind a proxy comes from
 * X-Forwarded-For - a header a script can rotate on every request. Counting per
 * target email closes that gap: however many addresses an attacker claims, one
 * account still gets a bounded number of password guesses and reset emails.
 *
 * In-memory, like the per-client limiter: right for a single instance. A second
 * instance would need a shared store (Redis) for the counts.
 */
@Component
public class AccountAttemptLimiter {

    public enum Kind { FAILED_LOGIN, RESET_REQUEST }

    private final Map<String, Deque<Long>> attempts = new ConcurrentHashMap<>();
    private final Clock clock;
    private final int maxFailedLogins;
    private final int maxResetRequests;
    private final long windowMillis;

    @Autowired
    public AccountAttemptLimiter(
            @Value("${app.account-limit.max-failed-logins:10}") int maxFailedLogins,
            @Value("${app.account-limit.max-reset-requests:5}") int maxResetRequests,
            @Value("${app.account-limit.window-minutes:15}") long windowMinutes) {
        this(Clock.systemUTC(), maxFailedLogins, maxResetRequests, windowMinutes);
    }

    AccountAttemptLimiter(Clock clock, int maxFailedLogins, int maxResetRequests, long windowMinutes) {
        this.clock = clock;
        this.maxFailedLogins = maxFailedLogins;
        this.maxResetRequests = maxResetRequests;
        this.windowMillis = windowMinutes * 60_000;
    }

    /** Throws 429 if this account has used up its attempts of this kind. */
    public void checkAllowed(Kind kind, String email) {
        Deque<Long> recent = prune(key(kind, email));
        if (recent != null && recent.size() >= limit(kind)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Too many attempts for this account. Please wait a few minutes and try again.");
        }
    }

    public void record(Kind kind, String email) {
        attempts.computeIfAbsent(key(kind, email), ignored -> new ConcurrentLinkedDeque<>())
                .addLast(clock.millis());
    }

    /** A successful sign-in clears the failure count, so a typo streak doesn't linger. */
    public void reset(Kind kind, String email) {
        attempts.remove(key(kind, email));
    }

    private Deque<Long> prune(String key) {
        Deque<Long> recent = attempts.get(key);
        if (recent == null) return null;
        long cutoff = clock.millis() - windowMillis;
        while (!recent.isEmpty() && recent.peekFirst() < cutoff) {
            recent.pollFirst();
        }
        if (recent.isEmpty()) attempts.remove(key, recent);
        return recent;
    }

    private int limit(Kind kind) {
        return kind == Kind.FAILED_LOGIN ? maxFailedLogins : maxResetRequests;
    }

    private static String key(Kind kind, String email) {
        return kind + "|" + email;
    }
}
