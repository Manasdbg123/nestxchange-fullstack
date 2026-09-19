package com.nestxchange.statemachine;

import com.nestxchange.entity.Listing;
import com.nestxchange.entity.ListingMode;
import com.nestxchange.entity.ListingStatus;
import com.nestxchange.entity.ListingTransition;
import com.nestxchange.entity.ListingTransitionEvent;
import com.nestxchange.exception.InvalidListingTransitionException;
import com.nestxchange.exception.ResourceNotFoundException;
import com.nestxchange.exception.UnauthorizedAccessException;
import com.nestxchange.repository.ListingRepository;
import com.nestxchange.repository.ListingTransitionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Objects;

/**
 * The one state machine for every listing's lifecycle, whatever its category
 * or mode:
 *
 * <pre>
 * AVAILABLE --REQUEST--> REQUESTED --CONFIRM--> CONFIRMED --PROCEED--> ACTIVE / COMPLETED --CLOSE--> CLOSED
 * </pre>
 *
 * <p>{@code REQUEST} and {@code CONFIRM} are handled directly here since they
 * mean the same thing for every mode. {@code PROCEED} and {@code CLOSE}
 * delegate to whichever {@link ListingTransitionHandler} supports the
 * listing's mode ({@link RentTransitionHandler} or {@link SaleTransitionHandler}).
 * There is exactly one machine and one {@code fire} method - a second,
 * mode-specific state machine (e.g. a {@code RentalStateMachine}) would be
 * the same leak as {@code searchProperties()}/{@code searchVehicles()} in
 * the search layer.
 *
 * <p>Authorization: {@code REQUEST} may not be fired by the listing's owner
 * (you cannot request your own listing); {@code CONFIRM} may only be fired
 * by the owner; {@code PROCEED} and {@code CLOSE} may be fired by either the
 * owner or whoever's {@code REQUEST} was accepted, recorded on the listing
 * as {@code requestedBy}. Anyone else gets a 403, not just a 409.
 */
@Service
@RequiredArgsConstructor
public class ListingStateMachineService {

    private final ListingRepository listingRepository;
    private final ListingTransitionRepository transitionRepository;
    private final List<ListingTransitionHandler> handlers;

    @Transactional
    public Listing fire(Long listingId, ListingTransitionEvent event, Long performedBy) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing", "id", listingId));

        ListingStatus from = listing.getStatus();
        authorize(listing, event, performedBy);
        TransitionOutcome outcome = resolveOutcome(listing, event, from);

        listing.setStatus(outcome.status());
        if (event == ListingTransitionEvent.REQUEST) {
            listing.setRequestedBy(performedBy);
        }
        Listing saved = listingRepository.save(listing);

        transitionRepository.save(ListingTransition.builder()
                .listingId(listing.getId())
                .performedBy(performedBy)
                .fromStatus(from)
                .toStatus(outcome.status())
                .event(event)
                .note(outcome.note())
                .build());

        return saved;
    }

    private void authorize(Listing listing, ListingTransitionEvent event, Long performedBy) {
        boolean isOwner = Objects.equals(listing.getOwnerId(), performedBy);
        boolean isRequester = listing.getRequestedBy() != null && Objects.equals(listing.getRequestedBy(), performedBy);

        switch (event) {
            case REQUEST -> {
                if (isOwner) {
                    throw new UnauthorizedAccessException("You cannot request your own listing");
                }
            }
            case CONFIRM -> {
                if (!isOwner) {
                    throw new UnauthorizedAccessException("Only the owner can confirm a request");
                }
            }
            case PROCEED, CLOSE -> {
                if (!isOwner && !isRequester) {
                    throw new UnauthorizedAccessException(
                            "Only the owner or the party who requested this listing can do that");
                }
            }
        }
    }

    private TransitionOutcome resolveOutcome(Listing listing, ListingTransitionEvent event, ListingStatus from) {
        return switch (event) {
            case REQUEST -> genericTransition(from, ListingStatus.AVAILABLE, ListingStatus.REQUESTED, event,
                    "Requested by prospective " + (listing.getMode() == ListingMode.RENT ? "renter" : "buyer"));

            case CONFIRM -> genericTransition(from, ListingStatus.REQUESTED, ListingStatus.CONFIRMED, event,
                    "Request confirmed by owner");

            case PROCEED -> {
                requireStatus(from, ListingStatus.CONFIRMED, event);
                yield resolveHandler(listing.getMode()).proceed(listing);
            }

            case CLOSE -> {
                requireOneOf(from, event, ListingStatus.ACTIVE, ListingStatus.COMPLETED);
                yield resolveHandler(listing.getMode()).close(listing);
            }
        };
    }

    private TransitionOutcome genericTransition(ListingStatus from, ListingStatus expected, ListingStatus target,
                                                 ListingTransitionEvent event, String note) {
        requireStatus(from, expected, event);
        return new TransitionOutcome(target, note);
    }

    private void requireStatus(ListingStatus actual, ListingStatus expected, ListingTransitionEvent event) {
        if (actual != expected) {
            throw new InvalidListingTransitionException(
                    event + " requires status " + expected + " but listing is " + actual);
        }
    }

    private void requireOneOf(ListingStatus actual, ListingTransitionEvent event, ListingStatus... expected) {
        if (Arrays.stream(expected).noneMatch(s -> s == actual)) {
            throw new InvalidListingTransitionException(
                    event + " requires one of " + Arrays.toString(expected) + " but listing is " + actual);
        }
    }

    private ListingTransitionHandler resolveHandler(ListingMode mode) {
        return handlers.stream()
                .filter(handler -> handler.supports(mode))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No ListingTransitionHandler registered for mode " + mode));
    }
}
