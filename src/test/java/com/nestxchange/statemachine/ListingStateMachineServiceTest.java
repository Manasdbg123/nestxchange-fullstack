package com.nestxchange.statemachine;

import com.nestxchange.entity.Listing;
import com.nestxchange.entity.ListingCategory;
import com.nestxchange.entity.ListingMode;
import com.nestxchange.entity.ListingStatus;
import com.nestxchange.entity.ListingTransition;
import com.nestxchange.entity.ListingTransitionEvent;
import com.nestxchange.exception.InvalidListingTransitionException;
import com.nestxchange.exception.UnauthorizedAccessException;
import com.nestxchange.repository.ListingRepository;
import com.nestxchange.repository.ListingTransitionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

/**
 * Proves the state machine is genuinely shared: the same {@code fire} method,
 * exercised with no branching on category or mode, drives a RENT listing to
 * ACTIVE and a SELL listing to COMPLETED purely because different
 * {@link ListingTransitionHandler} beans are plugged in.
 */
@ExtendWith(MockitoExtension.class)
class ListingStateMachineServiceTest {

    @Mock
    private ListingRepository listingRepository;

    @Mock
    private ListingTransitionRepository transitionRepository;

    private ListingStateMachineService service;

    @BeforeEach
    void setUp() {
        service = new ListingStateMachineService(
                listingRepository, transitionRepository,
                List.of(new RentTransitionHandler(), new SaleTransitionHandler()));
    }

    private static final long OWNER_ID = 1L;
    private static final long REQUESTER_ID = 99L;
    private static final long STRANGER_ID = 7L;

    @Test
    void rentListingReachesActiveThenClosed() {
        Listing listing = listing(ListingMode.RENT, ListingStatus.AVAILABLE);
        stub(listing);

        service.fire(1L, ListingTransitionEvent.REQUEST, REQUESTER_ID);
        assertThat(listing.getStatus()).isEqualTo(ListingStatus.REQUESTED);
        assertThat(listing.getRequestedBy()).isEqualTo(REQUESTER_ID);

        service.fire(1L, ListingTransitionEvent.CONFIRM, OWNER_ID);
        assertThat(listing.getStatus()).isEqualTo(ListingStatus.CONFIRMED);

        // Either party may drive PROCEED/CLOSE - here the requester does.
        service.fire(1L, ListingTransitionEvent.PROCEED, REQUESTER_ID);
        assertThat(listing.getStatus()).isEqualTo(ListingStatus.ACTIVE);

        service.fire(1L, ListingTransitionEvent.CLOSE, REQUESTER_ID);
        assertThat(listing.getStatus()).isEqualTo(ListingStatus.CLOSED);
    }

    @ParameterizedTest
    @EnumSource(value = ListingMode.class, names = {"BUY", "SELL"})
    void saleListingReachesCompletedThenClosed(ListingMode mode) {
        Listing listing = listing(mode, ListingStatus.CONFIRMED);
        stub(listing);

        // No REQUEST happened in this fixture, so requestedBy is null - only
        // the owner is authorized here.
        service.fire(1L, ListingTransitionEvent.PROCEED, OWNER_ID);
        assertThat(listing.getStatus()).isEqualTo(ListingStatus.COMPLETED);

        service.fire(1L, ListingTransitionEvent.CLOSE, OWNER_ID);
        assertThat(listing.getStatus()).isEqualTo(ListingStatus.CLOSED);
    }

    @Test
    void firingAnEventFromTheWrongStatusIsRejected() {
        Listing listing = listing(ListingMode.RENT, ListingStatus.AVAILABLE);
        stub(listing);

        assertThatThrownBy(() -> service.fire(1L, ListingTransitionEvent.CONFIRM, OWNER_ID))
                .isInstanceOf(InvalidListingTransitionException.class);
    }

    @Test
    void everyTransitionIsAudited() {
        Listing listing = listing(ListingMode.RENT, ListingStatus.AVAILABLE);
        stub(listing);

        service.fire(1L, ListingTransitionEvent.REQUEST, REQUESTER_ID);

        ArgumentCaptor<ListingTransition> captor = ArgumentCaptor.forClass(ListingTransition.class);
        org.mockito.Mockito.verify(transitionRepository).save(captor.capture());
        ListingTransition audit = captor.getValue();
        assertThat(audit.getFromStatus()).isEqualTo(ListingStatus.AVAILABLE);
        assertThat(audit.getToStatus()).isEqualTo(ListingStatus.REQUESTED);
        assertThat(audit.getPerformedBy()).isEqualTo(REQUESTER_ID);
    }

    @Test
    void ownerCannotRequestTheirOwnListing() {
        Listing listing = listing(ListingMode.RENT, ListingStatus.AVAILABLE);
        stub(listing);

        assertThatThrownBy(() -> service.fire(1L, ListingTransitionEvent.REQUEST, OWNER_ID))
                .isInstanceOf(UnauthorizedAccessException.class);
    }

    @Test
    void onlyTheOwnerMayConfirmARequest() {
        Listing listing = listing(ListingMode.RENT, ListingStatus.REQUESTED);
        listing.setRequestedBy(REQUESTER_ID);
        stub(listing);

        assertThatThrownBy(() -> service.fire(1L, ListingTransitionEvent.CONFIRM, REQUESTER_ID))
                .isInstanceOf(UnauthorizedAccessException.class);
    }

    @Test
    void aThirdPartyMayNotProceedOrClose() {
        Listing listing = listing(ListingMode.RENT, ListingStatus.CONFIRMED);
        listing.setRequestedBy(REQUESTER_ID);
        stub(listing);

        assertThatThrownBy(() -> service.fire(1L, ListingTransitionEvent.PROCEED, STRANGER_ID))
                .isInstanceOf(UnauthorizedAccessException.class);
    }

    private void stub(Listing listing) {
        when(listingRepository.findById(eq(1L))).thenReturn(Optional.of(listing));
        lenient().when(listingRepository.save(any(Listing.class))).thenAnswer(inv -> inv.getArgument(0));
        lenient().when(transitionRepository.save(any(ListingTransition.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private Listing listing(ListingMode mode, ListingStatus status) {
        return Listing.builder()
                .id(1L)
                .ownerId(1L)
                .category(ListingCategory.PROPERTY)
                .mode(mode)
                .title("Test listing")
                .price(BigDecimal.TEN)
                .location("Bengaluru")
                .status(status)
                .build();
    }
}
