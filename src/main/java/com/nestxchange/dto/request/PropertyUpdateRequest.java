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
 * Payload for editing a listing you already own.
 *
 * <p>Owners previously had no way to correct a typo, drop the rent or mark a
 * property as rented - the API only ever supported create and read.
 *
 * <p>Images are managed through the dedicated image endpoints rather than here,
 * so an edit never silently discards uploaded photos.
 */
@Data
public class PropertyUpdateRequest {

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
    @Size(max = 80)
    private String city;

    @NotBlank(message = "Please enter the locality")
    @Size(max = 120)
    private String locality;

    @NotNull(message = "Please choose a property type")
    private Property.PropertyType type;

    @NotNull(message = "Please choose a furnishing status")
    private Property.FurnishingStatus furnishingStatus;

    @Min(0)
    @Max(20)
    private int rooms;

    @NotBlank(message = "Please enter a contact number")
    @Pattern(regexp = "^(\\+?91)?[6-9]\\d{9}$", message = "Please enter a valid 10-digit Indian mobile number")
    private String contactNumber;

    @NotNull(message = "Please choose when the property is available from")
    private LocalDate availableFrom;

    private Property.TenantPreference tenantPreference;

    @Size(max = 25, message = "Please select at most 25 amenities")
    private List<@NotBlank @Size(max = 40) String> amenities = new ArrayList<>();

    private boolean negotiable;

    /**
     * Owner-settable lifecycle state. Restricted to the values an owner may
     * legitimately choose - approval states stay under admin control.
     */
    private OwnerStatus status;

    public enum OwnerStatus {
        AVAILABLE(Property.PropertyStatus.AVAILABLE),
        RENTED(Property.PropertyStatus.RENTED),
        INACTIVE(Property.PropertyStatus.INACTIVE);

        private final Property.PropertyStatus status;

        OwnerStatus(Property.PropertyStatus status) {
            this.status = status;
        }

        public Property.PropertyStatus toStatus() {
            return status;
        }
    }
}
