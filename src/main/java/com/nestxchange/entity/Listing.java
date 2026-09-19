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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * A single generic listing, covering both categories and every mode.
 *
 * <p>This is the one entity the whole platform is built around: there is no
 * separate {@code Property} or {@code Vehicle} table. Everything that varies
 * by category (bedrooms vs. mileage, amenities vs. transmission type) lives
 * in {@link #attributes}, a JSONB column whose valid keys per category are
 * defined by {@code CategorySchemaRegistry} - not by branching on
 * {@link #category} here or anywhere that reads this entity.
 */
@Entity
@Table(name = "listings", indexes = {
        @Index(name = "idx_listings_category", columnList = "category"),
        @Index(name = "idx_listings_mode", columnList = "mode"),
        @Index(name = "idx_listings_status", columnList = "status"),
        @Index(name = "idx_listings_price", columnList = "price"),
        @Index(name = "idx_listings_owner", columnList = "owner_id"),
        @Index(name = "idx_listings_created", columnList = "createdAt")
        // The GIN index on `attributes` is created in the Flyway migration -
        // JPA's @Index has no notion of a GIN/jsonb_path_ops index type.
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Listing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // A raw FK value rather than a @ManyToOne User: search and listing
    // reads don't need the owner loaded, and keeping it a plain column avoids
    // forcing a join (or a Flyway migration ordered after the users table)
    // just to record who posted a listing.
    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    // Set by ListingStateMachineService when REQUEST fires, cleared back to
    // null once the listing returns to AVAILABLE (it never does today, but a
    // future CANCEL transition should reset it). This is what lets CONFIRM,
    // PROCEED and CLOSE be restricted to "the owner or the party who actually
    // requested this listing" instead of any authenticated user.
    @Column(name = "requested_by")
    private Long requestedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ListingCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ListingMode mode;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(nullable = false, length = 160)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ListingStatus status;

    // Category-specific fields (bedrooms/sqft/amenities for PROPERTY,
    // mileage/make/model/year for VEHICLE, ...). Valid keys and types per
    // category are declared in CategorySchemaRegistry, which is what the
    // search endpoint and listing form validate against - this column itself
    // stays opaque to Java.
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> attributes = new HashMap<>();

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
