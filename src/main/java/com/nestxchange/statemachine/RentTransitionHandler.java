package com.nestxchange.statemachine;

import com.nestxchange.entity.Listing;
import com.nestxchange.entity.ListingMode;
import com.nestxchange.entity.ListingStatus;
import org.springframework.stereotype.Component;

/**
 * Rent-side behaviour: a confirmed request starts an active rental period;
 * closing it is the return/checkout. Real period tracking (due dates,
 * deposits, late fees) would build on this hook - for now it marks the
 * transition, which is what the audit trail in {@code listing_transitions}
 * exists for.
 */
@Component
public class RentTransitionHandler implements ListingTransitionHandler {

    @Override
    public boolean supports(ListingMode mode) {
        return mode == ListingMode.RENT;
    }

    @Override
    public TransitionOutcome proceed(Listing listing) {
        return new TransitionOutcome(ListingStatus.ACTIVE, "Rental period started");
    }

    @Override
    public TransitionOutcome close(Listing listing) {
        return new TransitionOutcome(ListingStatus.CLOSED, "Rental returned/checked out");
    }
}
