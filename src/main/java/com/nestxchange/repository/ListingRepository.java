package com.nestxchange.repository;

import com.nestxchange.entity.Listing;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ListingRepository extends JpaRepository<Listing, Long> {

    List<Listing> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);
}
