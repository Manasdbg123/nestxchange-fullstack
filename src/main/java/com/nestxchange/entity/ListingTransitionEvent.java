package com.nestxchange.entity;

/**
 * The four verbs that drive every {@link Listing} through its lifecycle,
 * regardless of category or mode. {@code REQUEST} and {@code CONFIRM} behave
 * identically for every mode; {@code PROCEED} and {@code CLOSE} are where a
 * mode-specific {@code ListingTransitionHandler} takes over - see
 * {@code ListingStateMachineService}.
 */
public enum ListingTransitionEvent {
    /** AVAILABLE -> REQUESTED: a prospective renter/buyer expresses interest. */
    REQUEST,
    /** REQUESTED -> CONFIRMED: the owner accepts the request. */
    CONFIRM,
    /** CONFIRMED -> ACTIVE (rent) or COMPLETED (buy/sell). Mode-specific. */
    PROCEED,
    /** ACTIVE -> CLOSED (rent) or COMPLETED -> CLOSED (buy/sell). Mode-specific. */
    CLOSE
}
