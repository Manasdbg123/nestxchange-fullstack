package com.nestxchange.service;

import com.nestxchange.dto.response.ListingImageResponse;
import com.nestxchange.entity.Listing;
import com.nestxchange.entity.ListingImage;
import com.nestxchange.exception.BusinessValidationException;
import com.nestxchange.exception.ResourceNotFoundException;
import com.nestxchange.exception.UnauthorizedAccessException;
import com.nestxchange.mapper.ListingMapper;
import com.nestxchange.repository.ListingImageRepository;
import com.nestxchange.repository.ListingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

/**
 * Photo management for the generic Listing engine. Every mutating method
 * here enforces ownership itself (not delegated to a controller-level
 * check), the same pattern {@code ListingService} uses.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ListingImageService {

    /** Generous enough for a real listing, small enough to stop one owner from parking gigabytes of photos. */
    private static final int MAX_IMAGES_PER_LISTING = 12;

    private final ListingRepository listingRepository;
    private final ListingImageRepository listingImageRepository;
    private final CloudinaryService cloudinaryService;

    @Transactional
    public List<ListingImageResponse> upload(Long listingId, List<MultipartFile> files, Long requesterId) {
        Listing listing = load(listingId);
        requireOwner(listing, requesterId);

        if (files == null || files.isEmpty()) {
            throw new BusinessValidationException("No images were provided");
        }

        long existingCount = listingImageRepository.countByListingId(listingId);
        if (existingCount + files.size() > MAX_IMAGES_PER_LISTING) {
            throw new BusinessValidationException(
                    "A listing can have at most " + MAX_IMAGES_PER_LISTING + " images");
        }

        boolean alreadyHasPrimary = listingImageRepository.findByListingIdOrderByPositionAsc(listingId).stream()
                .anyMatch(ListingImage::isPrimary);

        int position = (int) existingCount;
        for (MultipartFile file : files) {
            String url;
            try {
                url = cloudinaryService.uploadImage(file);
            } catch (IOException ex) {
                log.warn("Failed to upload image '{}' for listing {}", file.getOriginalFilename(), listingId, ex);
                throw new BusinessValidationException(
                        "Could not upload image '" + file.getOriginalFilename() + "'");
            }

            listingImageRepository.save(ListingImage.builder()
                    .listingId(listingId)
                    .imageUrl(url)
                    .isPrimary(!alreadyHasPrimary)
                    .position(position++)
                    .build());
            alreadyHasPrimary = true;
        }

        return list(listingId);
    }

    @Transactional
    public void delete(Long listingId, Long imageId, Long requesterId) {
        Listing listing = load(listingId);
        requireOwner(listing, requesterId);

        ListingImage image = listingImageRepository.findById(imageId)
                .filter(candidate -> candidate.getListingId().equals(listingId))
                .orElseThrow(() -> new ResourceNotFoundException("ListingImage", "id", imageId));

        boolean wasPrimary = image.isPrimary();
        listingImageRepository.delete(image);

        // Keep exactly one primary image whenever at least one remains -
        // otherwise every card/detail view silently loses its cover photo.
        if (wasPrimary) {
            listingImageRepository.findByListingIdOrderByPositionAsc(listingId).stream()
                    .findFirst()
                    .ifPresent(next -> {
                        next.setPrimary(true);
                        listingImageRepository.save(next);
                    });
        }
    }

    @Transactional
    public List<ListingImageResponse> setPrimary(Long listingId, Long imageId, Long requesterId) {
        Listing listing = load(listingId);
        requireOwner(listing, requesterId);

        List<ListingImage> images = listingImageRepository.findByListingIdOrderByPositionAsc(listingId);
        boolean found = images.stream().anyMatch(image -> image.getId().equals(imageId));
        if (!found) {
            throw new ResourceNotFoundException("ListingImage", "id", imageId);
        }

        for (ListingImage image : images) {
            boolean shouldBePrimary = image.getId().equals(imageId);
            if (image.isPrimary() != shouldBePrimary) {
                image.setPrimary(shouldBePrimary);
                listingImageRepository.save(image);
            }
        }

        return list(listingId);
    }

    @Transactional(readOnly = true)
    public List<ListingImageResponse> list(Long listingId) {
        return listingImageRepository.findByListingIdOrderByPositionAsc(listingId).stream()
                .map(ListingMapper::toResponse)
                .toList();
    }

    private Listing load(Long listingId) {
        return listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing", "id", listingId));
    }

    private void requireOwner(Listing listing, Long requesterId) {
        if (!listing.getOwnerId().equals(requesterId)) {
            throw new UnauthorizedAccessException("You do not own this listing");
        }
    }
}
