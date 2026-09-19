package com.nestxchange.statemachine;

import com.nestxchange.entity.Listing;
import com.nestxchange.entity.ListingMode;
import com.nestxchange.entity.ListingStatus;
import org.springframework.stereotype.Component;

/**
 * Sale-side behaviour, covering both BUY and SELL: a confirmed request is
 * completed once payment is settled, and closing it out is the ownership
 * transfer. Real payment settlement would build on this hook - for now it
 * marks the transition, which is what the audit trail in
 * {@code listing_transitions} exists for.
 */
@Component
public class SaleTransitionHandler implements ListingTransitionHandler {

    @Override
    public boolean supports(ListingMode mode) {
        return mode == ListingMode.BUY || mode == ListingMode.SELL;
    }

    @Override
    public TransitionOutcome proceed(Listing listing) {
        return new TransitionOutcome(ListingStatus.COMPLETED, "Payment confirmed");
    }

    @Override
    public TransitionOutcome close(Listing listing) {
        return new TransitionOutcome(ListingStatus.CLOSED, "Ownership transferred");
    }
}
