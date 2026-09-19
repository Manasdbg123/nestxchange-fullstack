package com.nestxchange.repository;

import com.nestxchange.entity.Property;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface PropertyRepository extends JpaRepository<Property, Long>, JpaSpecificationExecutor<Property> {

    /**
     * Loads a listing with its owner already joined.
     *
     * <p>{@code spring.jpa.open-in-view} is off, so a lazy owner reference touched
     * during response mapping outside the transaction would fail. Fetching it up
     * front also removes one query per listing detail page.
     */
    @Query("SELECT p FROM Property p JOIN FETCH p.owner WHERE p.id = :id")
    Optional<Property> findByIdWithOwner(@Param("id") Long id);

    @Query("SELECT p FROM Property p JOIN FETCH p.owner WHERE p.owner.id = :ownerId ORDER BY p.createdAt DESC")
    List<Property> findOwnedBy(@Param("ownerId") Long ownerId);

    /** Cities that currently have something to show, most stocked first, for the home page links. */
    @Query("""
            SELECT p.city FROM Property p
            WHERE p.status IN :statuses
            GROUP BY p.city
            ORDER BY COUNT(p.id) DESC
            """)
    List<String> findCitiesByListingCount(@Param("statuses") Collection<Property.PropertyStatus> statuses,
                                          Pageable pageable);

    long countByStatusIn(Collection<Property.PropertyStatus> statuses);

    long countByOwnerId(Long ownerId);
}
