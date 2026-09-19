package com.nestxchange.search;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nestxchange.dto.request.ListingSearchRequest;
import com.nestxchange.entity.ListingCategory;
import com.nestxchange.entity.ListingMode;
import com.nestxchange.exception.BusinessValidationException;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * These can't be run against a live Postgres in this environment, so they
 * assert on the generated SQL shape and parameter list instead - still
 * enough to catch a parameter-count/placeholder mismatch or an exception
 * that should have been a clean 400 instead of leaking out unchecked.
 */
class ListingQueryBuilderTest {

    private final ListingQueryBuilder builder = new ListingQueryBuilder(new ObjectMapper());

    @Test
    void universalFiltersProduceOnePlaceholderPerParam() {
        ListingSearchRequest request = ListingSearchRequest.builder()
                .category(ListingCategory.PROPERTY)
                .mode(ListingMode.RENT)
                .priceMin(new BigDecimal("1000"))
                .priceMax(new BigDecimal("5000"))
                .location("Bengaluru")
                .page(0)
                .size(12)
                .build();

        ListingQueryBuilder.Built built = builder.build(request);

        long placeholderCount = built.whereClause().chars().filter(c -> c == '?').count();
        assertThat(placeholderCount).isEqualTo(built.params().size());
        assertThat(built.params()).containsExactly(
                "PROPERTY", "RENT", new BigDecimal("1000"), new BigDecimal("5000"), "%bengaluru%");
    }

    @Test
    void exactMatchAttributeFiltersFoldIntoOneContainmentPredicate() {
        ListingSearchRequest request = ListingSearchRequest.builder()
                .category(ListingCategory.VEHICLE)
                .attributeFilters(Map.of("make", "Honda", "model", "Civic"))
                .page(0).size(12)
                .build();

        ListingQueryBuilder.Built built = builder.build(request);

        assertThat(built.whereClause()).contains("attributes @> ?::jsonb");
        // Exactly one containment predicate regardless of how many exact-match
        // filters were supplied - that's the whole point of folding them.
        assertThat(built.whereClause().split("@>", -1)).hasSize(2);
        long placeholderCount = built.whereClause().chars().filter(c -> c == '?').count();
        assertThat(placeholderCount).isEqualTo(built.params().size());
    }

    @Test
    void rangeFiltersProduceTwoPlaceholdersEach() {
        ListingSearchRequest request = ListingSearchRequest.builder()
                .category(ListingCategory.VEHICLE)
                .attributeFilters(Map.of("mileage_min", "10000", "mileage_max", "50000"))
                .page(0).size(12)
                .build();

        ListingQueryBuilder.Built built = builder.build(request);

        assertThat(built.whereClause()).contains("(attributes->>?)::numeric >=");
        assertThat(built.whereClause()).contains("(attributes->>?)::numeric <=");
        long placeholderCount = built.whereClause().chars().filter(c -> c == '?').count();
        assertThat(placeholderCount).isEqualTo(built.params().size());
        assertThat(built.params()).contains("mileage", "mileage");
    }

    @Test
    void attributeFiltersWithoutACategoryAreRejected() {
        ListingSearchRequest request = ListingSearchRequest.builder()
                .attributeFilters(Map.of("mileage", "50000"))
                .page(0).size(12)
                .build();

        assertThatThrownBy(() -> builder.build(request)).isInstanceOf(BusinessValidationException.class);
    }

    @Test
    void unknownAttributeKeyIsRejected() {
        ListingSearchRequest request = ListingSearchRequest.builder()
                .category(ListingCategory.PROPERTY)
                .attributeFilters(Map.of("mileage", "50000"))
                .page(0).size(12)
                .build();

        assertThatThrownBy(() -> builder.build(request)).isInstanceOf(BusinessValidationException.class);
    }

    @Test
    void rangeSuffixOnANonRangeFieldIsRejected() {
        ListingSearchRequest request = ListingSearchRequest.builder()
                .category(ListingCategory.VEHICLE)
                .attributeFilters(Map.of("make_min", "Honda"))
                .page(0).size(12)
                .build();

        assertThatThrownBy(() -> builder.build(request)).isInstanceOf(BusinessValidationException.class);
    }

    @Test
    void nonNumericValueOnANumericFieldIsRejectedNotThrownAsAServerError() {
        ListingSearchRequest request = ListingSearchRequest.builder()
                .category(ListingCategory.VEHICLE)
                .attributeFilters(Map.of("mileage_min", "not-a-number"))
                .page(0).size(12)
                .build();

        assertThatThrownBy(() -> builder.build(request)).isInstanceOf(BusinessValidationException.class);
    }

    /**
     * Regression test: BigDecimal.longValueExact() throws an unchecked
     * ArithmeticException for a non-integral value, which used to escape
     * uncaught and surface as a 500 instead of a 400.
     */
    @Test
    void fractionalValueOnAnIntegerFieldIsRejectedCleanly() {
        ListingSearchRequest request = ListingSearchRequest.builder()
                .category(ListingCategory.PROPERTY)
                .attributeFilters(Map.of("bedrooms", "3.5"))
                .page(0).size(12)
                .build();

        assertThatThrownBy(() -> builder.build(request)).isInstanceOf(BusinessValidationException.class);
    }

    @Test
    void wholeNumberDecimalStringOnAnIntegerFieldIsAccepted() {
        ListingSearchRequest request = ListingSearchRequest.builder()
                .category(ListingCategory.PROPERTY)
                .attributeFilters(Map.of("bedrooms", "3.0"))
                .page(0).size(12)
                .build();

        assertThatCode(() -> builder.build(request)).doesNotThrowAnyException();
    }

    @Test
    void blankAttributeValueIsIgnoredRatherThanProducingAnEmptyPredicate() {
        ListingSearchRequest request = ListingSearchRequest.builder()
                .category(ListingCategory.VEHICLE)
                .attributeFilters(Map.of("make", ""))
                .page(0).size(12)
                .build();

        ListingQueryBuilder.Built built = builder.build(request);
        assertThat(built.whereClause()).doesNotContain("@>");
        // Only the category filter itself contributes a param; the blank
        // "make" value must not add a containment predicate.
        assertThat(built.params()).containsExactly("VEHICLE");
    }
}
