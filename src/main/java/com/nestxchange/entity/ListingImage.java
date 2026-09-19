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
 * One photo attached to a {@link Listing}. A raw {@code listingId} FK rather
 * than a {@code @ManyToOne}, matching {@code Listing.ownerId} - reads of a
 * listing's images go through a dedicated repository query batched across a
 * page of search results, not a JPA association that would fetch eagerly or
 * N+1 per listing.
 */
@Entity
@Table(name = "listing_images", indexes = {
        @Index(name = "idx_listing_images_listing", columnList = "listing_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ListingImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "listing_id", nullable = false)
    private Long listingId;

    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    @Column(name = "is_primary", nullable = false)
    private boolean isPrimary;

    /** Display order within the listing; lower sorts first. */
    @Column(nullable = false)
    private int position;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
