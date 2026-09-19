package com.nestxchange.service;

import com.nestxchange.dto.response.ListingInquiryResponse;
import com.nestxchange.entity.Listing;
import com.nestxchange.entity.ListingCategory;
import com.nestxchange.entity.ListingInquiry;
import com.nestxchange.entity.ListingMode;
import com.nestxchange.entity.ListingStatus;
import com.nestxchange.entity.User;
import com.nestxchange.exception.BusinessValidationException;
import com.nestxchange.exception.UnauthorizedAccessException;
import com.nestxchange.repository.ListingInquiryRepository;
import com.nestxchange.repository.ListingRepository;
import com.nestxchange.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ListingInquiryServiceTest {

    private static final long OWNER_ID = 1L;
    private static final long SENDER_ID = 2L;
    private static final long LISTING_ID = 10L;

    @Mock
    private ListingInquiryRepository listingInquiryRepository;

    @Mock
    private ListingRepository listingRepository;

    @Mock
    private UserRepository userRepository;

    private ListingInquiryService service;

    @BeforeEach
    void setUp() {
        service = new ListingInquiryService(listingInquiryRepository, listingRepository, userRepository);
        when(listingRepository.findById(LISTING_ID)).thenReturn(Optional.of(listing()));
        lenient().when(listingInquiryRepository.save(any(ListingInquiry.class))).thenAnswer(invocation -> {
            ListingInquiry inquiry = invocation.getArgument(0);
            inquiry.setId(500L);
            return inquiry;
        });
        lenient().when(userRepository.findById(SENDER_ID))
                .thenReturn(Optional.of(User.builder().id(SENDER_ID).name("Renter").email("renter@test.local").build()));
    }

    @Test
    void sendingAnInquiryRecordsTheSenderAndListing() {
        ListingInquiryResponse response = service.send(LISTING_ID, "Is this still available?", SENDER_ID);

        assertThat(response.getListingId()).isEqualTo(LISTING_ID);
        assertThat(response.getSenderId()).isEqualTo(SENDER_ID);
        assertThat(response.getSenderName()).isEqualTo("Renter");
        assertThat(response.getMessage()).isEqualTo("Is this still available?");
    }

    @Test
    void ownerCannotInquireAboutTheirOwnListing() {
        assertThatThrownBy(() -> service.send(LISTING_ID, "Hello?", OWNER_ID))
                .isInstanceOf(BusinessValidationException.class);
    }

    @Test
    void onlyTheOwnerCanViewInquiriesForAListing() {
        when(listingInquiryRepository.findByListingIdOrderByCreatedAtDesc(LISTING_ID)).thenReturn(List.of());

        assertThat(service.forListing(LISTING_ID, OWNER_ID)).isEmpty();
        assertThatThrownBy(() -> service.forListing(LISTING_ID, SENDER_ID))
                .isInstanceOf(UnauthorizedAccessException.class);
    }

    private Listing listing() {
        return Listing.builder()
                .id(LISTING_ID)
                .ownerId(OWNER_ID)
                .category(ListingCategory.PROPERTY)
                .mode(ListingMode.RENT)
                .title("Test listing")
                .price(BigDecimal.TEN)
                .location("Bengaluru")
                .status(ListingStatus.AVAILABLE)
                .build();
    }
}
