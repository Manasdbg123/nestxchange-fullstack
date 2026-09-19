package com.nestxchange.statemachine;

import com.nestxchange.entity.ListingStatus;

/**
 * What a mode-specific handler decided should happen for a {@code PROCEED} or
 * {@code CLOSE} event: the resulting status, and an audit note describing the
 * side effect that got it there (e.g. "Rental period started",
 * "Payment confirmed and ownership transferred").
 */
public record TransitionOutcome(ListingStatus status, String note) {
}
