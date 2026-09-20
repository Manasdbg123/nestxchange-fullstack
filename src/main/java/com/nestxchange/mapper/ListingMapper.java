package com.nestxchange.mapper;

import com.nestxchange.dto.response.CategorySchemaResponse;
import com.nestxchange.dto.response.ListingImageResponse;
import com.nestxchange.dto.response.ListingResponse;
import com.nestxchange.dto.response.ListingTransitionResponse;
import com.nestxchange.entity.Listing;
import com.nestxchange.entity.ListingImage;
import com.nestxchange.entity.ListingTransition;
import com.nestxchange.schema.CategorySchema;

public final class ListingMapper {

    private ListingMapper() {
    }

    public static ListingResponse toResponse(Listing listing) {
        return ListingResponse.builder()
                .id(listing.getId())
                .ownerId(listing.getOwnerId())
                .requestedBy(listing.getRequestedBy())
                .category(listing.getCategory())
                .mode(listing.getMode())
                .title(listing.getTitle())
                .description(listing.getDescription())
                .price(listing.getPrice())
                .location(listing.getLocation())
                .status(listing.getStatus())
                .verified(listing.isVerified())
                .attributes(listing.getAttributes())
                .createdAt(listing.getCreatedAt())
                .updatedAt(listing.getUpdatedAt())
                .build();
    }

    public static ListingImageResponse toResponse(ListingImage image) {
        return ListingImageResponse.builder()
                .id(image.getId())
                .imageUrl(image.getImageUrl())
                .isPrimary(image.isPrimary())
                .build();
    }

    public static ListingTransitionResponse toResponse(ListingTransition transition) {
        return ListingTransitionResponse.builder()
                .id(transition.getId())
                .listingId(transition.getListingId())
                .performedBy(transition.getPerformedBy())
                .fromStatus(transition.getFromStatus())
                .toStatus(transition.getToStatus())
                .event(transition.getEvent())
                .note(transition.getNote())
                .performedAt(transition.getPerformedAt())
                .build();
    }

    public static CategorySchemaResponse toResponse(CategorySchema schema) {
        return CategorySchemaResponse.builder()
                .category(schema.category())
                .fields(schema.fields().stream()
                        .map(field -> CategorySchemaResponse.Field.builder()
                                .key(field.key())
                                .label(field.label())
                                .type(field.type())
                                .required(field.required())
                                .filterable(field.filterable())
                                .rangeFilterable(field.rangeFilterable())
                                .build())
                        .toList())
                .build();
    }
}
