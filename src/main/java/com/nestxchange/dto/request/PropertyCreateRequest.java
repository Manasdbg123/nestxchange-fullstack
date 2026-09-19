package com.nestxchange.dto.request;

import com.nestxchange.entity.Property;
import com.nestxchange.validation.ValidRentAmount;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Payload for posting a listing.
 *
 * <p>The controller already annotated this {@code @Valid}, but the class carried
 * no constraints at all - so a listing with a blank title and a negative rent
 * was accepted and only failed later at the database.
 */
@Data
public class PropertyCreateRequest {

    @NotBlank(message = "Please give your listing a title")
    @Size(min = 10, max = 120, message = "Title must be between 10 and 120 characters")
    private String title;

    @NotBlank(message = "Please describe the property")
    @Size(min = 30, max = 4000, message = "Description must be between 30 and 4000 characters")
    private String description;

    @NotNull(message = "Please enter the monthly rent")
    @ValidRentAmount
    private BigDecimal rentAmount;

    @NotNull(message = "Please enter the security deposit")
    @DecimalMin(value = "0", message = "Deposit cannot be negative")
    private BigDecimal depositAmount;

    @Min(value = 50, message = "Area must be at least 50 sq.ft")
    @Max(value = 100000, message = "Area must be under 100,000 sq.ft")
    private int squareFootage;

    @NotBlank(message = "Please enter the city")
    @Size(max = 80, message = "City name is too long")
    private String city;

    @NotBlank(message = "Please enter the locality")
    @Size(max = 120, message = "Locality name is too long")
    private String locality;

    @NotNull(message = "Please choose a property type")
    private Property.PropertyType type;

    @NotNull(message = "Please choose a furnishing status")
    private Property.FurnishingStatus furnishingStatus;

    @Min(value = 0, message = "Rooms cannot be negative")
    @Max(value = 20, message = "Please contact us directly for listings above 20 rooms")
    private int rooms;

    @NotBlank(message = "Please enter a contact number")
    @Pattern(regexp = "^(\\+?91)?[6-9]\\d{9}$", message = "Please enter a valid 10-digit Indian mobile number")
    private String contactNumber;

    @NotNull(message = "Please choose when the property is available from")
    private LocalDate availableFrom;

    private Property.TenantPreference tenantPreference;

    /** Free-text amenity labels. Was absent, so owners could never record amenities. */
    @Size(max = 25, message = "Please select at most 25 amenities")
    private List<@NotBlank @Size(max = 40) String> amenities = new ArrayList<>();

    /** Also absent previously, so every listing was stored as non-negotiable. */
    private boolean negotiable;
}
