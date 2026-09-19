package com.nestxchange.entity;

/**
 * Lifecycle state shared by every listing regardless of category or mode.
 *
 * <p>The path is {@code AVAILABLE -> REQUESTED -> CONFIRMED -> } then either
 * {@code ACTIVE -> CLOSED} for a rental (an in-progress rental period, closed
 * on return) or {@code COMPLETED -> CLOSED} for a sale (payment settled,
 * closed once ownership transfer is done). Which branch applies is decided by
 * the listing's {@link ListingMode}, not by a second status enum - see the
 * (forthcoming) state machine service.
 */
public enum ListingStatus {
    AVAILABLE,
    REQUESTED,
    CONFIRMED,
    ACTIVE,
    COMPLETED,
    CLOSED
}
