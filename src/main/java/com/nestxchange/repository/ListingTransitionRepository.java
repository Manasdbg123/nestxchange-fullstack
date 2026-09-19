package com.nestxchange.repository;

import com.nestxchange.entity.ListingTransition;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ListingTransitionRepository extends JpaRepository<ListingTransition, Long> {

    List<ListingTransition> findByListingIdOrderByPerformedAtAsc(Long listingId);
}
