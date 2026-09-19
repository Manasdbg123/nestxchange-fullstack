package com.nestxchange.schema;

import com.nestxchange.entity.ListingCategory;
import com.nestxchange.exception.BusinessValidationException;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Validates a listing's {@code attributes} map against its category's
 * {@link CategorySchema} on create and update: every required field present,
 * every value the right JSON shape, no keys outside the schema. This is the
 * only place that checks category-specific data, and it does so by reading
 * the registry - not by switching on {@link ListingCategory}.
 */
@Component
public class ListingAttributeValidator {

    public void validate(ListingCategory category, Map<String, Object> attributes) {
        Map<String, Object> safeAttributes = attributes == null ? Map.of() : attributes;
        CategorySchema schema = CategorySchemaRegistry.forCategory(category);
        Set<String> knownKeys = schema.fields().stream().map(AttributeField::key).collect(Collectors.toSet());

        for (String key : safeAttributes.keySet()) {
            if (!knownKeys.contains(key)) {
                throw new BusinessValidationException(
                        "Unknown attribute '" + key + "' for category " + category);
            }
        }

        for (AttributeField field : schema.fields()) {
            Object value = safeAttributes.get(field.key());
            if (value == null) {
                if (field.required()) {
                    throw new BusinessValidationException(
                            "Missing required attribute '" + field.key() + "' for category " + category);
                }
                continue;
            }
            if (!matchesType(field.type(), value)) {
                throw new BusinessValidationException(
                        "Attribute '" + field.key() + "' must be a " + field.type());
            }
        }
    }

    private boolean matchesType(AttributeType type, Object value) {
        return switch (type) {
            case STRING -> value instanceof String;
            case INTEGER -> value instanceof Integer || value instanceof Long
                    || (value instanceof Number n && n.doubleValue() == Math.floor(n.doubleValue()));
            case DECIMAL -> value instanceof Number;
            case BOOLEAN -> value instanceof Boolean;
            case STRING_ARRAY -> value instanceof List<?> list && list.stream().allMatch(v -> v instanceof String);
        };
    }
}
