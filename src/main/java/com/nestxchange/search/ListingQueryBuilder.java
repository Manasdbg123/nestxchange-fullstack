package com.nestxchange.search;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nestxchange.dto.request.ListingSearchRequest;
import com.nestxchange.exception.BusinessValidationException;
import com.nestxchange.schema.AttributeField;
import com.nestxchange.schema.AttributeType;
import com.nestxchange.schema.CategorySchema;
import com.nestxchange.schema.CategorySchemaRegistry;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Translates a {@link ListingSearchRequest} into one parameterised SQL WHERE
 * clause that works identically for every {@link com.nestxchange.entity.ListingCategory}.
 *
 * <p>This is the piece the whole "unified search" requirement hinges on: there
 * is exactly one method here, not {@code searchProperties()} plus
 * {@code searchVehicles()}. Category-specific behaviour comes entirely from
 * looking up the request's category in {@link CategorySchemaRegistry} - if a
 * change here ever needs an {@code if (category == PROPERTY)} branch, that is
 * a sign a field belongs in the registry instead.
 *
 * <p>Exact-match attribute filters are combined into one JSONB containment
 * predicate ({@code attributes @> '{...}'::jsonb}), which can use the GIN
 * index on the column. Range filters ({@code _min}/{@code _max}) cast the
 * extracted value with {@code ->>} and can't use that index, but by the time
 * they run, the category/mode/status/price predicates have usually narrowed
 * the row set enough that it doesn't matter.
 */
@Component
public class ListingQueryBuilder {

    private static final String RANGE_MIN_SUFFIX = "_min";
    private static final String RANGE_MAX_SUFFIX = "_max";

    private final ObjectMapper objectMapper;

    public ListingQueryBuilder(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public record Built(String whereClause, List<Object> params) {
    }

    public Built build(ListingSearchRequest request) {
        StringBuilder where = new StringBuilder(" WHERE 1=1");
        List<Object> params = new ArrayList<>();

        if (request.category() != null) {
            where.append(" AND category = ?");
            params.add(request.category().name());
        }

        if (request.mode() != null) {
            where.append(" AND mode = ?");
            params.add(request.mode().name());
        }

        if (request.priceMin() != null) {
            where.append(" AND price >= ?");
            params.add(request.priceMin());
        }

        if (request.priceMax() != null) {
            where.append(" AND price <= ?");
            params.add(request.priceMax());
        }

        if (hasText(request.location())) {
            where.append(" AND location ILIKE ?");
            params.add("%" + escapeLike(request.location().trim()) + "%");
        }

        appendAttributeFilters(request, where, params);

        return new Built(where.toString(), params);
    }

    private void appendAttributeFilters(ListingSearchRequest request, StringBuilder where, List<Object> params) {
        Map<String, String> filters = request.attributeFilters();
        if (filters.isEmpty()) {
            return;
        }
        if (request.category() == null) {
            throw new BusinessValidationException("category is required when filtering by attr.* fields");
        }

        CategorySchema schema = CategorySchemaRegistry.forCategory(request.category());
        // Exact-match filters are folded into a single containment predicate
        // so they can share one GIN-index lookup instead of N separate scans.
        Map<String, Object> containment = new LinkedHashMap<>();

        for (Map.Entry<String, String> entry : filters.entrySet()) {
            String rawKey = entry.getKey();
            String rawValue = entry.getValue();
            if (!hasText(rawValue)) {
                continue;
            }

            RangeBound bound = RangeBound.of(rawKey);
            String fieldKey = bound.baseKey();
            AttributeField field = schema.field(fieldKey)
                    .orElseThrow(() -> new BusinessValidationException(
                            "Unknown attribute filter '" + fieldKey + "' for category " + request.category()));

            if (bound.isRange()) {
                if (!field.rangeFilterable()) {
                    throw new BusinessValidationException(
                            "Attribute '" + fieldKey + "' does not support range filtering");
                }
                appendRangePredicate(where, params, field, bound, rawValue);
            } else {
                if (!field.filterable()) {
                    throw new BusinessValidationException(
                            "Attribute '" + fieldKey + "' is not filterable");
                }
                containment.put(fieldKey, coerceForContainment(field, rawValue));
            }
        }

        if (!containment.isEmpty()) {
            where.append(" AND attributes @> ?::jsonb");
            params.add(toJson(containment));
        }
    }

    private void appendRangePredicate(StringBuilder where, List<Object> params, AttributeField field,
                                       RangeBound bound, String rawValue) {
        BigDecimal numeric = parseNumeric(field, rawValue);
        String operator = bound.isMin() ? ">=" : "<=";
        where.append(" AND (attributes->>?)::numeric ").append(operator).append(" ?");
        params.add(field.key());
        params.add(numeric);
    }

    private Object coerceForContainment(AttributeField field, String rawValue) {
        return switch (field.type()) {
            case INTEGER -> parseWholeNumber(field, rawValue);
            case DECIMAL -> parseNumeric(field, rawValue);
            case BOOLEAN -> Boolean.parseBoolean(rawValue);
            case STRING -> rawValue;
            // Containment on an array field means "the array contains this one value".
            case STRING_ARRAY -> List.of(rawValue);
        };
    }

    /**
     * {@code BigDecimal.longValueExact()} throws an unchecked {@code ArithmeticException}
     * for a non-integral value (e.g. "3.5"), which the global handler would
     * otherwise turn into a 500 instead of the 400 a bad filter value deserves.
     */
    private long parseWholeNumber(AttributeField field, String rawValue) {
        BigDecimal numeric = parseNumeric(field, rawValue);
        if (numeric.stripTrailingZeros().scale() > 0) {
            throw new BusinessValidationException(
                    "Attribute '" + field.key() + "' expects a whole number, got '" + rawValue + "'");
        }
        return numeric.longValueExact();
    }

    private BigDecimal parseNumeric(AttributeField field, String rawValue) {
        try {
            return new BigDecimal(rawValue);
        } catch (NumberFormatException ex) {
            throw new BusinessValidationException(
                    "Attribute '" + field.key() + "' expects a numeric value, got '" + rawValue + "'");
        }
    }

    private String toJson(Map<String, Object> value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to serialise attribute filter to JSON", ex);
        }
    }

    private String escapeLike(String raw) {
        return raw.toLowerCase(Locale.ROOT)
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private record RangeBound(String baseKey, boolean isMin, boolean isMax) {
        static RangeBound of(String rawKey) {
            if (rawKey.endsWith(RANGE_MIN_SUFFIX)) {
                return new RangeBound(rawKey.substring(0, rawKey.length() - RANGE_MIN_SUFFIX.length()), true, false);
            }
            if (rawKey.endsWith(RANGE_MAX_SUFFIX)) {
                return new RangeBound(rawKey.substring(0, rawKey.length() - RANGE_MAX_SUFFIX.length()), false, true);
            }
            return new RangeBound(rawKey, false, false);
        }

        boolean isRange() {
            return isMin || isMax;
        }
    }
}
