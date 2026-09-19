package com.nestxchange.schema;

/**
 * The JSON shape an {@link AttributeField}'s value takes inside
 * {@code Listing.attributes}, and therefore how it can legally be filtered.
 */
public enum AttributeType {
    STRING,
    INTEGER,
    DECIMAL,
    BOOLEAN,
    /** A JSON array of strings, e.g. property amenities. Filtered by containment only. */
    STRING_ARRAY
}
