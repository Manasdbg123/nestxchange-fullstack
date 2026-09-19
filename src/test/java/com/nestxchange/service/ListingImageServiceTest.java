package com.nestxchange.service;

import com.nestxchange.entity.Listing;
import com.nestxchange.entity.ListingCategory;
import com.nestxchange.entity.ListingImage;
import com.nestxchange.entity.ListingMode;
import com.nestxchange.entity.ListingStatus;
import com.nestxchange.exception.BusinessValidationException;
import com.nestxchange.exception.UnauthorizedAccessException;
import com.nestxchange.repository.ListingImageRepository;
import com.nestxchange.repository.ListingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ListingImageServiceTest {

    private static final long OWNER_ID = 1L;
    private static final long STRANGER_ID = 2L;
    private static final long LISTING_ID = 10L;

    @Mock
    private ListingRepository listingRepository;

    @Mock
    private ListingImageRepository listingImageRepository;

    @Mock
    private CloudinaryService cloudinaryService;

    private ListingImageService service;
    private AtomicLong imageIdSequence;

    @BeforeEach
    void setUp() throws Exception {
        service = new ListingImageService(listingRepository, listingImageRepository, cloudinaryService);
        imageIdSequence = new AtomicLong(100);

        Listing listing = listing();
        when(listingRepository.findById(LISTING_ID)).thenReturn(Optional.of(listing));
        lenient().when(cloudinaryService.uploadImage(any())).thenReturn("https://cdn.example/image.jpg");
        lenient().when(listingImageRepository.save(any(ListingImage.class))).thenAnswer(invocation -> {
            ListingImage image = invocation.getArgument(0);
            if (image.getId() == null) {
                image.setId(imageIdSequence.incrementAndGet());
            }
            return image;
        });
    }

    @Test
    void theFirstUploadedImageBecomesPrimary() {
        // findByListingIdOrderByPositionAsc is called twice by upload(): once
        // to check for an existing primary, once at the end to build the
        // return value - a static stub can't reflect the save() that happens
        // in between, so the primary flag is asserted on the saved entity.
        when(listingImageRepository.findByListingIdOrderByPositionAsc(LISTING_ID)).thenReturn(List.of());
        when(listingImageRepository.countByListingId(LISTING_ID)).thenReturn(0L);

        service.upload(LISTING_ID, List.of(fakeImage()), OWNER_ID);

        var captor = org.mockito.ArgumentCaptor.forClass(ListingImage.class);
        verify(listingImageRepository).save(captor.capture());
        assertThat(captor.getValue().isPrimary()).isTrue();
    }

    @Test
    void onlyTheFirstOfSeveralNewUploadsBecomesPrimaryWhenNoneExisted() {
        when(listingImageRepository.findByListingIdOrderByPositionAsc(LISTING_ID)).thenReturn(List.of());
        when(listingImageRepository.countByListingId(LISTING_ID)).thenReturn(0L);

        service.upload(LISTING_ID, List.of(fakeImage(), fakeImage(), fakeImage()), OWNER_ID);

        var captor = org.mockito.ArgumentCaptor.forClass(ListingImage.class);
        verify(listingImageRepository, org.mockito.Mockito.times(3)).save(captor.capture());
        List<ListingImage> saved = captor.getAllValues();
        assertThat(saved.get(0).isPrimary()).isTrue();
        assertThat(saved.get(1).isPrimary()).isFalse();
        assertThat(saved.get(2).isPrimary()).isFalse();
    }

    @Test
    void uploadingWhenAPrimaryAlreadyExistsDoesNotAddASecondOne() {
        ListingImage existingPrimary = ListingImage.builder().id(1L).listingId(LISTING_ID).isPrimary(true).position(0).build();
        when(listingImageRepository.findByListingIdOrderByPositionAsc(LISTING_ID)).thenReturn(List.of(existingPrimary));
        when(listingImageRepository.countByListingId(LISTING_ID)).thenReturn(1L);

        service.upload(LISTING_ID, List.of(fakeImage()), OWNER_ID);

        var captor = org.mockito.ArgumentCaptor.forClass(ListingImage.class);
        verify(listingImageRepository).save(captor.capture());
        assertThat(captor.getValue().isPrimary()).isFalse();
    }

    @Test
    void deletingThePrimaryImagePromotesTheNextOne() {
        ListingImage primary = ListingImage.builder().id(1L).listingId(LISTING_ID).isPrimary(true).position(0).build();
        ListingImage next = ListingImage.builder().id(2L).listingId(LISTING_ID).isPrimary(false).position(1).build();

        when(listingImageRepository.findById(1L)).thenReturn(Optional.of(primary));
        when(listingImageRepository.findByListingIdOrderByPositionAsc(LISTING_ID)).thenReturn(List.of(next));

        service.delete(LISTING_ID, 1L, OWNER_ID);

        assertThat(next.isPrimary()).isTrue();
        verify(listingImageRepository).save(next);
        verify(listingImageRepository).delete(primary);
    }

    @Test
    void nonOwnerCannotUploadImages() {
        assertThatThrownBy(() -> service.upload(LISTING_ID, List.of(fakeImage()), STRANGER_ID))
                .isInstanceOf(UnauthorizedAccessException.class);
    }

    @Test
    void nonOwnerCannotDeleteImages() {
        assertThatThrownBy(() -> service.delete(LISTING_ID, 1L, STRANGER_ID))
                .isInstanceOf(UnauthorizedAccessException.class);
    }

    @Test
    void tooManyImagesAreRejected() {
        when(listingImageRepository.countByListingId(LISTING_ID)).thenReturn(11L);

        assertThatThrownBy(() -> service.upload(LISTING_ID, List.of(fakeImage(), fakeImage()), OWNER_ID))
                .isInstanceOf(BusinessValidationException.class);
    }

    private MultipartFile fakeImage() {
        return new MockMultipartFile("images", "photo.jpg", "image/jpeg", new byte[]{1, 2, 3});
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
