package com.nestxchange.repository;

import com.nestxchange.entity.ListingFavorite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ListingFavoriteRepository extends JpaRepository<ListingFavorite, Long> {

    Optional<ListingFavorite> findByUserIdAndListingId(Long userId, Long listingId);

    List<ListingFavorite> findByUserIdOrderByCreatedAtDesc(Long userId);
}
