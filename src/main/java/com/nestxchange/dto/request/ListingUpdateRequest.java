package com.nestxchange.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

/**
 * Payload for editing a listing you own. Deliberately has no {@code status}
 * field - status only ever changes through {@code ListingStateMachineService},
 * never by direct edit.
 */
@Data
public class ListingUpdateRequest {

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
