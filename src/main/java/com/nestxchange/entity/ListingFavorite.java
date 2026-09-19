package com.nestxchange.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * A user's shortlist entry for a {@link Listing} - the generic-engine
 * equivalent of the legacy {@code Favorite} entity, which only covers
 * {@code Property}. Raw FK columns, matching every other generic-engine
 * entity this session (no {@code @ManyToOne}).
 */
@Entity
@Table(name = "listing_favorites", uniqueConstraints = {
        @UniqueConstraint(name = "uq_listing_favorites_user_listing", columnNames = {"user_id", "listing_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ListingFavorite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "listing_id", nullable = false)
    private Long listingId;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
