package com.nestxchange.repository;

import com.nestxchange.entity.ListingInquiry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ListingInquiryRepository extends JpaRepository<ListingInquiry, Long> {

    List<ListingInquiry> findByListingIdOrderByCreatedAtDesc(Long listingId);

    List<ListingInquiry> findBySenderIdOrderByCreatedAtDesc(Long senderId);
}
