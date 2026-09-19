package com.nestxchange.statemachine;

import com.nestxchange.entity.Listing;
import com.nestxchange.entity.ListingMode;

/**
 * Mode-specific behaviour plugged into the one {@code ListingStateMachineService}.
 *
 * <p>{@code REQUEST} and {@code CONFIRM} need no handler - they behave the
 * same for every mode, so the state machine applies them directly. Only the
 * two points where rent and sale genuinely diverge - what "in progress" and
 * "done" mean - go through a handler. Adding a third mode with its own
 * behaviour (e.g. an AUCTION mode) means adding one more implementation of
 * this interface, not touching the state machine itself.
 */
public interface ListingTransitionHandler {

    boolean supports(ListingMode mode);

    /** CONFIRMED -> ACTIVE (rent) or COMPLETED (buy/sell). */
    TransitionOutcome proceed(Listing listing);

    /** ACTIVE -> CLOSED (rent) or COMPLETED -> CLOSED (buy/sell). */
    TransitionOutcome close(Listing listing);
}
