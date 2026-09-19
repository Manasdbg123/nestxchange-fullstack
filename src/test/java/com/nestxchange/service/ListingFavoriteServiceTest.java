package com.nestxchange.service;

import com.nestxchange.dto.response.ListingResponse;
import com.nestxchange.entity.ListingFavorite;
import com.nestxchange.exception.ResourceNotFoundException;
import com.nestxchange.repository.ListingFavoriteRepository;
import com.nestxchange.repository.ListingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ListingFavoriteServiceTest {

    private static final long USER_ID = 1L;
    private static final long LISTING_ID = 10L;

    @Mock
    private ListingFavoriteRepository listingFavoriteRepository;

    @Mock
    private ListingRepository listingRepository;

    @Mock
    private ListingService listingService;

    private ListingFavoriteService service;

    @BeforeEach
    void setUp() {
        service = new ListingFavoriteService(listingFavoriteRepository, listingRepository, listingService);
        lenient().when(listingRepository.existsById(LISTING_ID)).thenReturn(true);
    }

    @Test
    void togglingAnUnfavoritedListingFavoritesIt() {
        when(listingFavoriteRepository.findByUserIdAndListingId(USER_ID, LISTING_ID)).thenReturn(Optional.empty());

        boolean result = service.toggle(LISTING_ID, USER_ID);

        assertThat(result).isTrue();
        verify(listingFavoriteRepository).save(org.mockito.ArgumentMatchers.any(ListingFavorite.class));
    }

    @Test
    void togglingAnAlreadyFavoritedListingRemovesIt() {
        ListingFavorite existing = ListingFavorite.builder().id(1L).userId(USER_ID).listingId(LISTING_ID).build();
        when(listingFavoriteRepository.findByUserIdAndListingId(USER_ID, LISTING_ID)).thenReturn(Optional.of(existing));

        boolean result = service.toggle(LISTING_ID, USER_ID);

        assertThat(result).isFalse();
        verify(listingFavoriteRepository).delete(existing);
    }

    @Test
    void togglingANonexistentListingIsRejected() {
        when(listingRepository.existsById(LISTING_ID)).thenReturn(false);

        assertThatThrownBy(() -> service.toggle(LISTING_ID, USER_ID))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void listSkipsFavoritesWhoseListingWasSinceDeleted() {
        ListingFavorite stale = ListingFavorite.builder().id(1L).userId(USER_ID).listingId(LISTING_ID).build();
        when(listingFavoriteRepository.findByUserIdOrderByCreatedAtDesc(USER_ID)).thenReturn(List.of(stale));
        when(listingService.getById(LISTING_ID)).thenThrow(new ResourceNotFoundException("Listing", "id", LISTING_ID));

        List<ListingResponse> result = service.list(USER_ID);

        assertThat(result).isEmpty();
    }
}
