package com.nestxchange.schema;

import com.nestxchange.entity.ListingCategory;
import com.nestxchange.exception.BusinessValidationException;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ListingAttributeValidatorTest {

    private final ListingAttributeValidator validator = new ListingAttributeValidator();

    @Test
    void acceptsAValidPropertyPayload() {
        Map<String, Object> attributes = Map.of(
                "bedrooms", 3,
                "bathrooms", 2,
                "sqft", 1200,
                "propertyType", "APARTMENT",
                "amenities", List.of("pool", "gym"));

        assertThatCode(() -> validator.validate(ListingCategory.PROPERTY, attributes)).doesNotThrowAnyException();
    }

    @Test
    void acceptsAValidVehiclePayload() {
        Map<String, Object> attributes = Map.of(
                "make", "Honda",
                "model", "Civic",
                "year", 2021,
                "mileage", 45000);

        assertThatCode(() -> validator.validate(ListingCategory.VEHICLE, attributes)).doesNotThrowAnyException();
    }

    @Test
    void rejectsAMissingRequiredField() {
        Map<String, Object> attributes = Map.of("bedrooms", 3, "bathrooms", 2, "sqft", 1200);

        assertThatThrownBy(() -> validator.validate(ListingCategory.PROPERTY, attributes))
                .isInstanceOf(BusinessValidationException.class)
                .hasMessageContaining("propertyType");
    }

    @Test
    void rejectsAKeyForeignToTheCategory() {
        Map<String, Object> attributes = Map.of("mileage", 1000);

        assertThatThrownBy(() -> validator.validate(ListingCategory.PROPERTY, attributes))
                .isInstanceOf(BusinessValidationException.class)
                .hasMessageContaining("mileage");
    }

    @Test
    void rejectsAWrongTypedValue() {
        Map<String, Object> attributes = Map.of(
                "make", "Honda",
                "model", "Civic",
                "year", "not-a-number",
                "mileage", 45000);

        assertThatThrownBy(() -> validator.validate(ListingCategory.VEHICLE, attributes))
                .isInstanceOf(BusinessValidationException.class)
                .hasMessageContaining("year");
    }
}
