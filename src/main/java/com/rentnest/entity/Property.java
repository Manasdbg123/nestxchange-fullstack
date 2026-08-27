package com.rentnest.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "properties", indexes = {
        // Search filters on these columns on every listing page; without indexes
        // each query degrades into a full table scan as listings accumulate.
        @Index(name = "idx_properties_city", columnList = "city"),
        @Index(name = "idx_properties_status", columnList = "status"),
        @Index(name = "idx_properties_type", columnList = "type"),
        @Index(name = "idx_properties_rent", columnList = "rentAmount"),
        @Index(name = "idx_properties_owner", columnList = "owner_id"),
        @Index(name = "idx_properties_created", columnList = "createdAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Property {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal rentAmount;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal depositAmount;

    @Column(nullable = false)
    private int squareFootage;

    @Column(nullable = false, length = 80)
    private String city;

    @Column(nullable = false, length = 120)
    private String locality;

    @Column(nullable = false)
    private boolean isVerified;

    @Column(nullable = false, length = 20)
    private String contactNumber;

    @Column(nullable = false)
    private LocalDate availableFrom;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TenantPreference tenantPreference;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PropertyType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PropertyStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FurnishingStatus furnishingStatus;

    private int rooms;

    // Eagerly fetched per row, so batch the loads: 50 listings would otherwise
    // trigger 50 extra round trips for amenity labels alone.
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "property_amenities", joinColumns = @JoinColumn(name = "property_id"))
    @Column(name = "amenity", length = 40)
    @BatchSize(size = 30)
    @Builder.Default
    private List<String> amenities = new ArrayList<>();

    @Column(nullable = false)
    @Builder.Default
    private boolean negotiable = false;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ToString.Exclude
    @BatchSize(size = 30)
    @Builder.Default
    @OneToMany(mappedBy = "property", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<PropertyImage> images = new ArrayList<>();

    /** Convenience for the search layer and the UI's "available now" filter. */
    public boolean isAvailableNow() {
        return availableFrom == null || !availableFrom.isAfter(LocalDate.now());
    }

    public enum PropertyType { APARTMENT, HOUSE, VILLA, STUDIO, ROOM, SHOP, COMMERCIAL, PG }

    public enum PropertyStatus { UNDER_REVIEW, ACTIVE, RENTED, INACTIVE, AVAILABLE }

    public enum FurnishingStatus { UNFURNISHED, SEMI_FURNISHED, FULLY_FURNISHED }

    public enum TenantPreference { ANY, FAMILY, BACHELOR, COMPANY }
}
