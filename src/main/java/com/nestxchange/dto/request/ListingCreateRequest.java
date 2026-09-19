package com.nestxchange.dto.request;

import com.nestxchange.entity.ListingCategory;
import com.nestxchange.entity.ListingMode;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

/**
 * Payload for posting a new listing. {@code category} and {@code mode} are
 * fixed at creation - editing them would mean the category-specific data in
 * {@code attributes} no longer matches its schema, so they're absent from
 * {@link ListingUpdateRequest}.
 *
 * <p>{@code attributes} carries every category-specific field. Its keys and
 * value types are checked against {@code CategorySchemaRegistry} in the
 * service layer, not here - a static bean-validation annotation can't express
 * "valid fields depend on the category field".
 */
@Data
public class ListingCreateRequest {

    @NotNull(message = "Please choose a category")
    private ListingCategory category;

    @NotNull(message = "Please choose whether you're renting, buying or selling")
    private ListingMode mode;

    @NotBlank(message = "Please give your listing a title")
    @Size(min = 10, max = 120, message = "Title must be between 10 and 120 characters")
    private String title;

    @NotBlank(message = "Please describe the listing")
    @Size(min = 30, max = 4000, message = "Description must be between 30 and 4000 characters")
    private String description;

    @NotNull(message = "Please enter a price")
    @DecimalMin(value = "0.01", message = "Price must be greater than zero")
    private BigDecimal price;

    @NotBlank(message = "Please enter a location")
    @Size(max = 160, message = "Location is too long")
    private String location;

    private Map<String, Object> attributes = new HashMap<>();
}
