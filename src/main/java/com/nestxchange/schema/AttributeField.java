package com.nestxchange.schema;

/**
 * One category-specific field: its JSON key inside {@code Listing.attributes},
 * its type, and what kind of filtering the search endpoint allows on it.
 *
 * <p>{@code rangeFilterable} only makes sense for numeric types and enables
 * {@code attr.<key>_min} / {@code attr.<key>_max} query params in addition to
 * exact-match {@code attr.<key>}. Non-numeric fields ignore the flag.
 *
 * @param key             the JSON key inside {@code attributes}, e.g. "bedrooms"
 * @param label           human-readable label for the dynamic listing form
 * @param type            the value's JSON shape
 * @param required        whether the listing form must collect this field
 * @param filterable      whether the search endpoint accepts {@code attr.<key>}
 * @param rangeFilterable  whether the search endpoint also accepts min/max range params
 */
public record AttributeField(
        String key,
        String label,
        AttributeType type,
        boolean required,
        boolean filterable,
        boolean rangeFilterable
) {

    public static AttributeField of(String key, String label, AttributeType type, boolean required, boolean filterable) {
        return new AttributeField(key, label, type, required, filterable, false);
    }

    public static AttributeField range(String key, String label, AttributeType type, boolean required) {
        return new AttributeField(key, label, type, required, true, true);
    }
}
