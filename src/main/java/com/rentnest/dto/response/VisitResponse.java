package com.rentnest.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * A visit request as the API exposes it.
 *
 * <p>The visit endpoints used to return the {@code VisitSchedule} JPA entity
 * directly. That serialised the whole {@code User} graph - including the BCrypt
 * password hash - and, with open-in-view disabled, tripped a lazy-loading
 * failure the moment Jackson touched the association.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VisitResponse {

    private Long id;
    private LocalDateTime visitDate;
    private String status;
    private LocalDateTime requestedAt;

    private PropertySummary property;

    /** The person requesting the visit. Only sent to that listing's owner. */
    private VisitorSummary visitor;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PropertySummary {
        private Long id;
        private String title;
        private String city;
        private String locality;
        private BigDecimal rentAmount;
        private String imageUrl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VisitorSummary {
        private Long id;
        private String name;
        private String email;
        private String phone;
    }
}
