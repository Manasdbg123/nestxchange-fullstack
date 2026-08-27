package com.rentnest.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PropertyResponse {

    private Long id;
    private String title;
    private String description;
    private BigDecimal rentAmount;
    private BigDecimal depositAmount;
    private int squareFootage;
    private String city;
    private String locality;
    private String type;
    private String furnishingStatus;
    private int rooms;
    private String status;

    /**
     * Serialised as "verified".
     *
     * <p>Lombok names the getter {@code isVerified()} for a boolean field called
     * {@code isVerified}, so Jackson emitted the property as {@code isVerified}
     * while the web client read {@code verified} - the verified badge could
     * therefore never render. Pinning the JSON name settles it in one place.
     */
    @JsonProperty("verified")
    private boolean verified;

    private String contactNumber;
    private LocalDate availableFrom;
    private String tenantPreference;

    /** Was missing from this DTO entirely, so amenity chips never rendered. */
    @Builder.Default
    private List<String> amenities = List.of();

    /** Also missing, so the "Negotiable" badge never rendered. */
    private boolean negotiable;

    private LocalDateTime createdAt;
    private OwnerSummary owner;

    @Builder.Default
    private List<ImageResponse> images = List.of();

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class OwnerSummary {
        private Long id;
        private String name;
        /**
         * Only populated for the listing's own owner or an admin. Publishing every
         * owner's email address on an anonymous endpoint is a scraper's shopping list.
         */
        private String email;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class ImageResponse {
        private Long id;
        private String imageUrl;

        @JsonProperty("primary")
        private boolean primary;
    }
}
