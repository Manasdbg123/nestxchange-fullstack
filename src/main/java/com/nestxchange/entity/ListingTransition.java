package com.nestxchange.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * An audit row for one status change of one {@link Listing}, written by
 * {@code ListingStateMachineService}. This is what makes the shared state
 * machine's per-mode side effects (start of a rental period, payment
 * confirmation, ownership transfer, ...) concrete without a JSONB
 * {@code attributes} column - which is category data, not transaction
 * history - or a fake external payment/logistics integration.
 */
@Entity
@Table(name = "listing_transitions", indexes = {
        @Index(name = "idx_listing_transitions_listing", columnList = "listing_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ListingTransition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "listing_id", nullable = false)
    private Long listingId;

    @Column(name = "performed_by", nullable = false)
    private Long performedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ListingStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ListingStatus toStatus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ListingTransitionEvent event;

    @Column(nullable = false, length = 200)
    private String note;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime performedAt;
}
