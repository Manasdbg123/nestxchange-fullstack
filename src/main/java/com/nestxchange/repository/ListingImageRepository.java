package com.nestxchange.repository;

import com.nestxchange.entity.ListingImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ListingImageRepository extends JpaRepository<ListingImage, Long> {

    List<ListingImage> findByListingIdOrderByPositionAsc(Long listingId);

    /** Batched for a page of search results - one query instead of one per listing. */
    List<ListingImage> findByListingIdInOrderByPositionAsc(List<Long> listingIds);

    long countByListingId(Long listingId);
}
