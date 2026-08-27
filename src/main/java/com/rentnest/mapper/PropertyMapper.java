package com.rentnest.mapper;

import com.rentnest.dto.response.PropertyResponse;
import com.rentnest.entity.Property;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Objects;

/**
 * Turns a {@link Property} into its API representation.
 *
 * <p>This is now the only mapping path. {@code PropertyServiceImpl} used to
 * carry a private near-duplicate of it, and the two had drifted: the private
 * copy dereferenced enums without null checks and the shared one silently
 * dropped rent, deposit, area and amenities.
 */
@Component
@RequiredArgsConstructor
public class PropertyMapper {

    private final UserMapper userMapper;

    /** Anonymous view: no owner email. */
    public PropertyResponse toPropertyResponse(Property property) {
        return toPropertyResponse(property, false);
    }

    /**
     * @param includeOwnerContact whether the caller is entitled to the owner's
     *                            email address - true only for the listing's own
     *                            owner or an admin.
     */
    public PropertyResponse toPropertyResponse(Property property, boolean includeOwnerContact) {
        if (property == null) {
            return null;
        }

        List<PropertyResponse.ImageResponse> images = property.getImages() == null ? List.of()
                : property.getImages().stream()
                .filter(Objects::nonNull)
                .map(image -> PropertyResponse.ImageResponse.builder()
                        .id(image.getId())
                        .imageUrl(image.getImageUrl())
                        .primary(image.isPrimary())
                        .build())
                // Cover image first, so the client never has to hunt for it.
                .sorted((a, b) -> Boolean.compare(b.isPrimary(), a.isPrimary()))
                .toList();

        return PropertyResponse.builder()
                .id(property.getId())
                .title(property.getTitle())
                .description(property.getDescription())
                .rentAmount(property.getRentAmount())
                .depositAmount(property.getDepositAmount())
                .squareFootage(property.getSquareFootage())
                .city(property.getCity())
                .locality(property.getLocality())
                // Enum columns are non-null in the schema, but a row written before
                // that constraint existed would otherwise take the whole page down.
                .type(nameOf(property.getType()))
                .furnishingStatus(nameOf(property.getFurnishingStatus()))
                .status(nameOf(property.getStatus()))
                .tenantPreference(nameOf(property.getTenantPreference()))
                .rooms(property.getRooms())
                .verified(property.isVerified())
                .contactNumber(property.getContactNumber())
                .availableFrom(property.getAvailableFrom())
                .amenities(property.getAmenities() == null ? List.of() : List.copyOf(property.getAmenities()))
                .negotiable(property.isNegotiable())
                .createdAt(property.getCreatedAt())
                .owner(userMapper.toOwnerSummary(property.getOwner(), includeOwnerContact))
                .images(images)
                .build();
    }

    private String nameOf(Enum<?> value) {
        return value == null ? null : value.name();
    }
}
