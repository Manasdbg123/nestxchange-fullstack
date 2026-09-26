package com.nestxchange.security;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

import static com.nestxchange.security.AccountAttemptLimiter.Kind.FAILED_LOGIN;
import static com.nestxchange.security.AccountAttemptLimiter.Kind.RESET_REQUEST;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AccountAttemptLimiterTest {

    /** A clock the test can move forward. */
    private static final class MutableClock extends Clock {
        private Instant now = Instant.parse("2026-09-26T10:00:00Z");

        void advance(Duration d) { now = now.plus(d); }

        @Override public ZoneOffset getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(java.time.ZoneId zone) { return this; }
        @Override public Instant instant() { return now; }
    }

    private final MutableClock clock = new MutableClock();
    private final AccountAttemptLimiter limiter = new AccountAttemptLimiter(clock, 3, 2, 15);

    @Test
    void blocksAnAccountAfterTooManyFailedLogins() {
        for (int i = 0; i < 3; i++) {
            limiter.checkAllowed(FAILED_LOGIN, "asha@example.com");
            limiter.record(FAILED_LOGIN, "asha@example.com");
        }
        assertThatThrownBy(() -> limiter.checkAllowed(FAILED_LOGIN, "asha@example.com"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Too many attempts");
    }

    @Test
    void theLimitIsPerAccountSoOtherAccountsAreUnaffected() {
        for (int i = 0; i < 3; i++) limiter.record(FAILED_LOGIN, "asha@example.com");
        assertThatCode(() -> limiter.checkAllowed(FAILED_LOGIN, "ravi@example.com")).doesNotThrowAnyException();
    }

    @Test
    void attemptsExpireAfterTheWindow() {
        for (int i = 0; i < 3; i++) limiter.record(FAILED_LOGIN, "asha@example.com");
        clock.advance(Duration.ofMinutes(16));
        assertThatCode(() -> limiter.checkAllowed(FAILED_LOGIN, "asha@example.com")).doesNotThrowAnyException();
    }

    @Test
    void aSuccessfulSignInClearsTheFailures() {
        for (int i = 0; i < 3; i++) limiter.record(FAILED_LOGIN, "asha@example.com");
        limiter.reset(FAILED_LOGIN, "asha@example.com");
        assertThatCode(() -> limiter.checkAllowed(FAILED_LOGIN, "asha@example.com")).doesNotThrowAnyException();
    }

    @Test
    void resetRequestsHaveTheirOwnLimit() {
        limiter.record(RESET_REQUEST, "asha@example.com");
        limiter.record(RESET_REQUEST, "asha@example.com");
        assertThatThrownBy(() -> limiter.checkAllowed(RESET_REQUEST, "asha@example.com"))
                .isInstanceOf(ResponseStatusException.class);
        assertThatCode(() -> limiter.checkAllowed(FAILED_LOGIN, "asha@example.com")).doesNotThrowAnyException();
    }
}
