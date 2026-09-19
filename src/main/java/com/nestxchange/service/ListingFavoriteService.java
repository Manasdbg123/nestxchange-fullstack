package com.nestxchange.service;

import com.nestxchange.dto.response.ListingResponse;
import com.nestxchange.entity.ListingFavorite;
import com.nestxchange.exception.ResourceNotFoundException;
import com.nestxchange.repository.ListingFavoriteRepository;
import com.nestxchange.repository.ListingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

/**
 * Shortlist toggling for the generic Listing engine - the equivalent of
 * {@code PropertyServiceImpl.toggleFavorite}, but for any category. Kept as
 * its own service (not folded into {@link ListingService}) the same way
 * favoriting is its own concern on the legacy Property side.
 */
@Service
@RequiredArgsConstructor
public class ListingFavoriteService {

    private final ListingFavoriteRepository listingFavoriteRepository;
    private final ListingRepository listingRepository;
    private final ListingService listingService;

    @Transactional
    public boolean toggle(Long listingId, Long userId) {
        requireListingExists(listingId);

        Optional<ListingFavorite> existing = listingFavoriteRepository.findByUserIdAndListingId(userId, listingId);
        if (existing.isPresent()) {
            listingFavoriteRepository.delete(existing.get());
            return false;
        }

        listingFavoriteRepository.save(ListingFavorite.builder()
                .userId(userId)
                .listingId(listingId)
                .build());
        return true;
    }

    @Transactional(readOnly = true)
    public List<ListingResponse> list(Long userId) {
        return listingFavoriteRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                // A favorited listing that was since deleted just drops off the
                // list rather than breaking it - the favorite row itself is
                // cleaned up by the FK's ON DELETE CASCADE.
                .map(favorite -> tryLoad(favorite.getListingId()))
                .filter(Objects::nonNull)
                .toList();
    }

    private ListingResponse tryLoad(Long listingId) {
        try {
            return listingService.getById(listingId);
        } catch (ResourceNotFoundException ex) {
            return null;
        }
    }

    private void requireListingExists(Long listingId) {
        if (!listingRepository.existsById(listingId)) {
            throw new ResourceNotFoundException("Listing", "id", listingId);
        }
    }
}
