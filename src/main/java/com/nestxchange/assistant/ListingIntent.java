package com.nestxchange.assistant;

import com.nestxchange.entity.ListingCategory;
import com.nestxchange.entity.ListingMode;

import java.math.BigDecimal;

/** What {@link ListingIntentExtractor} could deterministically pull out of a free-text message. */
public record ListingIntent(
        ListingCategory category,
        ListingMode mode,
        BigDecimal priceMin,
        BigDecimal priceMax,
        String location
) {
    public boolean isEmpty() {
        return category == null && mode == null && priceMin == null && priceMax == null && location == null;
    }
}
