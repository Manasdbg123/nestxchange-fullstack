package com.nestxchange.entity;

/**
 * The kind of thing a {@link Listing} represents. Adding a third category
 * (e.g. EQUIPMENT) means adding a value here and a matching entry in
 * {@code CategorySchemaRegistry} - never a new table or a new search method.
 */
public enum ListingCategory {
    PROPERTY,
    VEHICLE
}
