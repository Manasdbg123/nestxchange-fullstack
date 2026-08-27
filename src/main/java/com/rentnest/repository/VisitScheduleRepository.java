package com.rentnest.repository;

import com.rentnest.entity.VisitSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface VisitScheduleRepository extends JpaRepository<VisitSchedule, Long> {

    // These queries join the property and its owner up front. With open-in-view
    // disabled, mapping a lazily-loaded association after the transaction closes
    // fails, and fetching them here also avoids an N+1 per visit row.

    @Query("""
            SELECT v FROM VisitSchedule v
            JOIN FETCH v.property p
            JOIN FETCH p.owner
            WHERE v.user.id = :userId
            """)
    List<VisitSchedule> findByUserIdWithProperty(@Param("userId") Long userId);

    @Query("""
            SELECT v FROM VisitSchedule v
            JOIN FETCH v.property p
            JOIN FETCH p.owner
            JOIN FETCH v.user
            WHERE p.owner.id = :ownerId AND v.status = 'PENDING'
            """)
    List<VisitSchedule> findPendingVisitsForOwner(@Param("ownerId") Long ownerId);

    @Query("""
            SELECT v FROM VisitSchedule v
            JOIN FETCH v.property p
            JOIN FETCH p.owner
            JOIN FETCH v.user
            WHERE p.owner.id = :ownerId
            """)
    List<VisitSchedule> findAllVisitsForOwner(@Param("ownerId") Long ownerId);

    List<VisitSchedule> findByPropertyId(Long propertyId);

    boolean existsByUserIdAndPropertyIdAndStatus(Long userId, Long propertyId, VisitSchedule.VisitStatus status);

    /** Feeds the nightly sweep that expires requests an owner never answered. */
    List<VisitSchedule> findByStatusAndCreatedAtBefore(VisitSchedule.VisitStatus status, LocalDateTime date);
}
