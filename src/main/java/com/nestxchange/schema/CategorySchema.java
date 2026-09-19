package com.nestxchange.schema;

import com.nestxchange.entity.ListingCategory;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** The full set of {@link AttributeField}s valid for one {@link ListingCategory}. */
public final class CategorySchema {

    private final ListingCategory category;
    private final Map<String, AttributeField> fieldsByKey;

    public CategorySchema(ListingCategory category, List<AttributeField> fields) {
        this.category = category;
        Map<String, AttributeField> byKey = new LinkedHashMap<>();
        for (AttributeField field : fields) {
            byKey.put(field.key(), field);
        }
        this.fieldsByKey = Map.copyOf(byKey);
    }

    public ListingCategory category() {
        return category;
    }

    public List<AttributeField> fields() {
        return List.copyOf(fieldsByKey.values());
    }

    public Optional<AttributeField> field(String key) {
        return Optional.ofNullable(fieldsByKey.get(key));
    }

    public boolean isFilterable(String key) {
        return field(key).map(AttributeField::filterable).orElse(false);
    }

    public boolean isRangeFilterable(String key) {
        return field(key).map(AttributeField::rangeFilterable).orElse(false);
    }
}
