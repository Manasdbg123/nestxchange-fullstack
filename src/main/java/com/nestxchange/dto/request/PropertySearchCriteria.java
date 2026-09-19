package com.nestxchange.dto.request;

import com.nestxchange.entity.Property;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Every filter the listings page can apply.
 *
 * <p>BHK, property type, verified-only and availability used to be applied in
 * the browser over whichever page of results happened to be loaded. That made
 * the result count wrong, hid matching listings that sat on later pages, and
 * forced the client to request an oversized page to compensate. They are all
 * server-side filters now, so paging and counts agree with each other.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PropertySearchCriteria {

    /** Free text matched against title, locality and city. */
    private String keyword;

    private String city;
    private String locality;

    private BigDecimal minRent;
    private BigDecimal maxRent;

    /** Empty means "any type". Multiple values let the UI group ROOM+PG or SHOP+COMMERCIAL. */
    private List<Property.PropertyType> types;

    /** Empty means "any size". A value of 5 is treated as "5 or more". */
    private List<Integer> bedrooms;

    private Property.FurnishingStatus furnishing;
    private Property.TenantPreference tenantPreference;

    private Boolean verifiedOnly;
    private Boolean negotiableOnly;

    /** Keeps listings whose availability date falls on or before this day. */
    private LocalDate availableBy;

    private Long ownerId;

    @Builder.Default
    private SortOption sortBy = SortOption.NEWEST;

    public enum SortOption {
        NEWEST,
        PRICE_ASC,
        PRICE_DESC,
        AREA_DESC;

        /** Tolerates the legacy lower-case values the web client used to send. */
        public static SortOption from(String raw) {
            if (raw == null || raw.isBlank()) {
                return NEWEST;
            }
            return switch (raw.trim().toLowerCase()) {
                case "price_asc", "priceasc", "price-low" -> PRICE_ASC;
                case "price_desc", "pricedesc", "price-high" -> PRICE_DESC;
                case "area_desc", "areadesc", "area" -> AREA_DESC;
                default -> NEWEST;
            };
        }
    }
}
