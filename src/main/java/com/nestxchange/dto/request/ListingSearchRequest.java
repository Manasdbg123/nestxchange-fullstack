package com.nestxchange.dto.request;

import com.nestxchange.entity.ListingCategory;
import com.nestxchange.entity.ListingMode;
import lombok.Builder;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Every filter the unified search endpoint accepts: the universal ones
 * (category, mode, price range, location) plus a raw {@code attr.*} map that
 * only means something once paired with the {@code category} filter and
 * validated against that category's {@code CategorySchema}.
 */
@Builder
public record ListingSearchRequest(
        ListingCategory category,
        ListingMode mode,
        BigDecimal priceMin,
        BigDecimal priceMax,
        String location,
        Boolean verifiedOnly,
        Map<String, String> attributeFilters,
        int page,
        int size
) {
    private static final int DEFAULT_SIZE = 12;
    private static final int MAX_SIZE = 100;

    public ListingSearchRequest {
        attributeFilters = attributeFilters == null ? Map.of() : Map.copyOf(attributeFilters);
        page = Math.max(page, 0);
        size = size <= 0 ? DEFAULT_SIZE : Math.min(size, MAX_SIZE);
    }
}
