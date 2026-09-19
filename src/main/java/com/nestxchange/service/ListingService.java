package com.nestxchange.service;

import com.nestxchange.dto.request.ListingCreateRequest;
import com.nestxchange.dto.request.ListingUpdateRequest;
import com.nestxchange.dto.response.ListingImageResponse;
import com.nestxchange.dto.response.ListingResponse;
import com.nestxchange.entity.Listing;
import com.nestxchange.entity.ListingStatus;
import com.nestxchange.exception.ResourceNotFoundException;
import com.nestxchange.exception.UnauthorizedAccessException;
import com.nestxchange.mapper.ListingMapper;
import com.nestxchange.repository.ListingImageRepository;
import com.nestxchange.repository.ListingRepository;
import com.nestxchange.schema.ListingAttributeValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Plain CRUD for listings. Category-specific validation is delegated to
 * {@link ListingAttributeValidator}; lifecycle status changes are delegated
 * to {@code ListingStateMachineService} - this class only ever writes
 * {@link ListingStatus#AVAILABLE} once, at creation. Photo management is
 * delegated to {@link ListingImageService}; this class only reads images
 * back in, to attach to the response.
 */
@Service
@RequiredArgsConstructor
public class ListingService {

    private final ListingRepository listingRepository;
    private final ListingImageRepository listingImageRepository;
    private final ListingAttributeValidator attributeValidator;

    @Transactional
    public ListingResponse create(ListingCreateRequest request, Long ownerId) {
        Map<String, Object> attributes = attributesOrEmpty(request.getAttributes());
        attributeValidator.validate(request.getCategory(), attributes);

        Listing listing = Listing.builder()
                .ownerId(ownerId)
                .category(request.getCategory())
                .mode(request.getMode())
                .title(request.getTitle())
                .description(request.getDescription())
                .price(request.getPrice())
                .location(request.getLocation())
                .status(ListingStatus.AVAILABLE)
                .attributes(attributes)
                .build();

        return withImages(listingRepository.save(listing));
    }

    @Transactional(readOnly = true)
    public ListingResponse getById(Long id) {
        return withImages(load(id));
    }

    @Transactional
    public ListingResponse update(Long id, ListingUpdateRequest request, Long requesterId) {
        Listing listing = load(id);
        requireOwner(listing, requesterId);
        Map<String, Object> attributes = attributesOrEmpty(request.getAttributes());
        attributeValidator.validate(listing.getCategory(), attributes);

        listing.setTitle(request.getTitle());
        listing.setDescription(request.getDescription());
        listing.setPrice(request.getPrice());
        listing.setLocation(request.getLocation());
        listing.setAttributes(attributes);

        return withImages(listingRepository.save(listing));
    }

    @Transactional
    public void delete(Long id, Long requesterId) {
        Listing listing = load(id);
        requireOwner(listing, requesterId);
        listingRepository.delete(listing);
    }

    @Transactional(readOnly = true)
    public List<ListingResponse> myListings(Long ownerId) {
        return listingRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId).stream()
                .map(this::withImages)
                .toList();
    }

    private Listing load(Long id) {
        return listingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Listing", "id", id));
    }

    private void requireOwner(Listing listing, Long requesterId) {
        if (!listing.getOwnerId().equals(requesterId)) {
            throw new UnauthorizedAccessException("You do not own this listing");
        }
    }

    private ListingResponse withImages(Listing listing) {
        ListingResponse response = ListingMapper.toResponse(listing);
        List<ListingImageResponse> images = listingImageRepository.findByListingIdOrderByPositionAsc(listing.getId())
                .stream()
                .map(ListingMapper::toResponse)
                .toList();
        response.setImages(images);
        return response;
    }

    /**
     * A defensive copy, decoupled from the request DTO. Also guards against
     * a client sending an explicit {@code "attributes": null} in the JSON
     * body, which would otherwise NPE here and in the validator.
     */
    private Map<String, Object> attributesOrEmpty(Map<String, Object> attributes) {
        return attributes == null ? new HashMap<>() : new HashMap<>(attributes);
    }
}
