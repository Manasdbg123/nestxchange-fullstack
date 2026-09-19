package com.nestxchange.schema;

import com.nestxchange.entity.ListingCategory;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/**
 * The single source of truth for what attributes each {@link ListingCategory}
 * accepts. The search endpoint, the create/update listing validation, and the
 * frontend's dynamic form all read from here instead of hardcoding
 * category-specific field lists - that's what lets one search method and one
 * {@code <ListingForm>} component serve every category.
 *
 * <p>Adding a category or a field means adding an entry below, nothing else.
 * If you find yourself writing {@code if (category == ListingCategory.X)}
 * anywhere outside this file, the field probably belongs here instead.
 */
public final class CategorySchemaRegistry {

    private static final Map<ListingCategory, CategorySchema> SCHEMAS = new EnumMap<>(ListingCategory.class);

    static {
        register(new CategorySchema(ListingCategory.PROPERTY, List.of(
                AttributeField.range("bedrooms", "Bedrooms", AttributeType.INTEGER, true),
                AttributeField.range("bathrooms", "Bathrooms", AttributeType.INTEGER, true),
                AttributeField.range("sqft", "Area (sqft)", AttributeType.INTEGER, true),
                AttributeField.of("propertyType", "Property type", AttributeType.STRING, true, true),
                AttributeField.of("furnishing", "Furnishing", AttributeType.STRING, false, true),
                AttributeField.of("amenities", "Amenities", AttributeType.STRING_ARRAY, false, true)
        )));

        register(new CategorySchema(ListingCategory.VEHICLE, List.of(
                AttributeField.of("make", "Make", AttributeType.STRING, true, true),
                AttributeField.of("model", "Model", AttributeType.STRING, true, true),
                AttributeField.range("year", "Year", AttributeType.INTEGER, true),
                AttributeField.range("mileage", "Mileage", AttributeType.INTEGER, true),
                AttributeField.of("fuelType", "Fuel type", AttributeType.STRING, false, true),
                AttributeField.of("transmission", "Transmission", AttributeType.STRING, false, true)
        )));
    }

    private CategorySchemaRegistry() {
    }

    private static void register(CategorySchema schema) {
        SCHEMAS.put(schema.category(), schema);
    }

    public static CategorySchema forCategory(ListingCategory category) {
        CategorySchema schema = SCHEMAS.get(category);
        if (schema == null) {
            throw new IllegalArgumentException("No CategorySchema registered for category: " + category);
        }
        return schema;
    }

    public static Map<ListingCategory, CategorySchema> all() {
        return Map.copyOf(SCHEMAS);
    }
}
