package com.nestxchange.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
 * A free-text message from a prospective renter/buyer to a listing's owner -
 * a lighter-weight "tell me more" than firing the state machine's
 * {@code REQUEST} event. Unlike REQUEST (exclusive - one active requester,
 * moves the listing out of AVAILABLE), any number of people can inquire
 * about a listing at any status; it changes nothing about the listing
 * itself, only creates a record the owner can read and reply to off-platform.
 */
@Entity
@Table(name = "listing_inquiries", indexes = {
        @Index(name = "idx_listing_inquiries_listing", columnList = "listing_id"),
        @Index(name = "idx_listing_inquiries_sender", columnList = "sender_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ListingInquiry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "listing_id", nullable = false)
    private Long listingId;

    @Column(name = "sender_id", nullable = false)
    private Long senderId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
