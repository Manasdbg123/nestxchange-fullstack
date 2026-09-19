package com.nestxchange.service.impl;

import com.nestxchange.dto.request.PropertyCreateRequest;
import com.nestxchange.dto.request.PropertySearchCriteria;
import com.nestxchange.dto.request.PropertyUpdateRequest;
import com.nestxchange.dto.response.PaginatedResponse;
import com.nestxchange.dto.response.PropertyResponse;
import com.nestxchange.entity.Favorite;
import com.nestxchange.entity.Property;
import com.nestxchange.entity.PropertyImage;
import com.nestxchange.entity.Role;
import com.nestxchange.entity.User;
import com.nestxchange.exception.BusinessValidationException;
import com.nestxchange.exception.ResourceNotFoundException;
import com.nestxchange.exception.UnauthorizedAccessException;
import com.nestxchange.mapper.PropertyMapper;
import com.nestxchange.repository.FavoriteRepository;
import com.nestxchange.repository.PropertyRepository;
import com.nestxchange.repository.UserRepository;
import com.nestxchange.repository.specification.PropertySpecifications;
import com.nestxchange.service.CloudinaryService;
import com.nestxchange.service.PropertyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class PropertyServiceImpl implements PropertyService {

    /** Guards against a client asking for 10,000 rows in one request. */
    private static final int MAX_PAGE_SIZE = 60;
    private static final int DEFAULT_PAGE_SIZE = 12;
    private static final int MAX_IMAGES_PER_LISTING = 12;

    private static final Set<Property.PropertyStatus> LIVE_STATUSES =
            Set.of(Property.PropertyStatus.AVAILABLE, Property.PropertyStatus.ACTIVE);

    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final FavoriteRepository favoriteRepository;
    private final CloudinaryService cloudinaryService;
    private final PropertyMapper propertyMapper;

    @Override
    @Transactional
    public PropertyResponse createProperty(PropertyCreateRequest request, List<MultipartFile> images, Long ownerId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", ownerId));

        Property property = Property.builder()
                .title(request.getTitle().trim())
                .description(request.getDescription().trim())
                .rentAmount(request.getRentAmount())
                .depositAmount(request.getDepositAmount())
                .squareFootage(request.getSquareFootage())
                .city(normalisePlaceName(request.getCity()))
                .locality(normalisePlaceName(request.getLocality()))
                .type(request.getType())
                .furnishingStatus(request.getFurnishingStatus())
                .rooms(request.getRooms())
                .status(Property.PropertyStatus.AVAILABLE)
                .isVerified(false)
                .contactNumber(normalisePhone(request.getContactNumber()))
                .availableFrom(request.getAvailableFrom())
                .tenantPreference(Objects.requireNonNullElse(request.getTenantPreference(), Property.TenantPreference.ANY))
                .amenities(cleanAmenities(request.getAmenities()))
                .negotiable(request.isNegotiable())
                .owner(owner)
                .build();

        attachImages(property, images);

        Property saved = propertyRepository.save(property);
        log.info("Created listing id={} by owner id={}", saved.getId(), ownerId);

        return propertyMapper.toPropertyResponse(saved, true);
    }

    @Override
    @Transactional
    public PropertyResponse updateProperty(Long propertyId, PropertyUpdateRequest request, Long requesterId) {
        Property property = loadOwned(propertyId, requesterId);

        property.setTitle(request.getTitle().trim());
        property.setDescription(request.getDescription().trim());
        property.setRentAmount(request.getRentAmount());
        property.setDepositAmount(request.getDepositAmount());
        property.setSquareFootage(request.getSquareFootage());
        property.setCity(normalisePlaceName(request.getCity()));
        property.setLocality(normalisePlaceName(request.getLocality()));
        property.setType(request.getType());
        property.setFurnishingStatus(request.getFurnishingStatus());
        property.setRooms(request.getRooms());
        property.setContactNumber(normalisePhone(request.getContactNumber()));
        property.setAvailableFrom(request.getAvailableFrom());
        property.setTenantPreference(
                Objects.requireNonNullElse(request.getTenantPreference(), Property.TenantPreference.ANY));
        property.setAmenities(cleanAmenities(request.getAmenities()));
        property.setNegotiable(request.isNegotiable());

        if (request.getStatus() != null) {
            // The wire enum only offers AVAILABLE / RENTED / INACTIVE, so an owner
            // cannot promote their own listing past moderation.
            property.setStatus(request.getStatus().toStatus());
        }

        Property saved = propertyRepository.save(property);
        log.info("Updated listing id={} by owner id={}", saved.getId(), requesterId);

        return propertyMapper.toPropertyResponse(saved, true);
    }

    @Override
    @Transactional
    public void deleteProperty(Long propertyId, Long requesterId) {
        Property property = loadOwned(propertyId, requesterId);
        propertyRepository.delete(property);
        log.info("Deleted listing id={} by user id={}", propertyId, requesterId);
    }

    @Override
    @Transactional(readOnly = true)
    public PaginatedResponse<PropertyResponse> searchProperties(PropertySearchCriteria criteria, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), clampPageSize(size), sortFor(criteria.getSortBy()));

        Page<Property> results = propertyRepository.findAll(PropertySpecifications.matching(criteria), pageable);

        List<PropertyResponse> content = results.getContent().stream()
                .map(propertyMapper::toPropertyResponse)
                .toList();

        return PaginatedResponse.<PropertyResponse>builder()
                .content(content)
                .pageNo(results.getNumber())
                .pageSize(results.getSize())
                .totalElements(results.getTotalElements())
                .totalPages(results.getTotalPages())
                .last(results.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PropertyResponse getPropertyById(Long id, Long requesterId) {
        Property property = propertyRepository.findByIdWithOwner(id)
                .orElseThrow(() -> new ResourceNotFoundException("Property", "id", id));

        boolean isOwner = requesterId != null && property.getOwner().getId().equals(requesterId);
        return propertyMapper.toPropertyResponse(property, isOwner);
    }

    @Override
    @Transactional
    public boolean toggleFavorite(Long propertyId, Long userId) {
        Optional<Favorite> existing = favoriteRepository.findByUserIdAndPropertyId(userId, propertyId);
        if (existing.isPresent()) {
            favoriteRepository.delete(existing.get());
            return false;
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Property", "id", propertyId));

        favoriteRepository.save(Favorite.builder().user(user).property(property).build());
        return true;
    }

    @Override
    @Transactional(readOnly = true)
    public List<PropertyResponse> getUserFavorites(Long userId) {
        return favoriteRepository.findByUserId(userId).stream()
                .map(Favorite::getProperty)
                .filter(Objects::nonNull)
                .map(propertyMapper::toPropertyResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PropertyResponse> getMyProperties(Long ownerId) {
        return propertyRepository.findOwnedBy(ownerId).stream()
                // The caller owns every listing here, so contact details are theirs to see.
                .map(property -> propertyMapper.toPropertyResponse(property, true))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getPopularCities(int limit) {
        return propertyRepository.findCitiesByListingCount(
                LIVE_STATUSES, PageRequest.of(0, Math.max(1, Math.min(limit, 24))));
    }

    // ------------------------------------------------------------------
    // helpers
    // ------------------------------------------------------------------

    /**
     * Loads a listing only if the requester owns it, or is an admin.
     *
     * <p>Every mutating path funnels through here so an authorisation check can
     * never be forgotten on a new endpoint.
     */
    private Property loadOwned(Long propertyId, Long requesterId) {
        Property property = propertyRepository.findByIdWithOwner(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Property", "id", propertyId));

        if (property.getOwner().getId().equals(requesterId)) {
            return property;
        }

        boolean isAdmin = userRepository.findById(requesterId)
                .map(user -> user.getRole() == Role.ADMIN)
                .orElse(false);

        if (!isAdmin) {
            log.warn("Blocked attempt by user id={} to modify listing id={} owned by id={}",
                    requesterId, propertyId, property.getOwner().getId());
            throw new UnauthorizedAccessException("This listing belongs to another account.");
        }

        return property;
    }

    private void attachImages(Property property, List<MultipartFile> images) {
        if (images == null || images.isEmpty()) {
            return;
        }

        List<MultipartFile> usable = images.stream()
                .filter(file -> file != null && !file.isEmpty())
                .toList();

        if (usable.isEmpty()) {
            return;
        }
        if (usable.size() > MAX_IMAGES_PER_LISTING) {
            throw new BusinessValidationException(
                    "Please upload at most " + MAX_IMAGES_PER_LISTING + " photos per listing.");
        }

        boolean isFirst = property.getImages().isEmpty();
        for (MultipartFile file : usable) {
            assertLooksLikeImage(file);
            try {
                String imageUrl = cloudinaryService.uploadImage(file);
                property.getImages().add(PropertyImage.builder()
                        .property(property)
                        .imageUrl(imageUrl)
                        .isPrimary(isFirst)
                        .build());
                isFirst = false;
            } catch (IOException | RuntimeException e) {
                // The old code wrapped this in a bare RuntimeException, which the
                // catch-all handler turned into an opaque 500. This is a client
                // problem and reads as one.
                log.warn("Image upload failed for listing '{}'", property.getTitle(), e);
                throw new BusinessValidationException(
                        "We could not upload one of your photos. Please try again with a different file.");
            }
        }
    }

    private void assertLooksLikeImage(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
            throw new BusinessValidationException("Only image files can be uploaded as property photos.");
        }
    }

    private Sort sortFor(PropertySearchCriteria.SortOption sortBy) {
        PropertySearchCriteria.SortOption option =
                Objects.requireNonNullElse(sortBy, PropertySearchCriteria.SortOption.NEWEST);

        return switch (option) {
            case PRICE_ASC -> Sort.by(Sort.Direction.ASC, "rentAmount").and(Sort.by(Sort.Direction.DESC, "id"));
            case PRICE_DESC -> Sort.by(Sort.Direction.DESC, "rentAmount").and(Sort.by(Sort.Direction.DESC, "id"));
            case AREA_DESC -> Sort.by(Sort.Direction.DESC, "squareFootage").and(Sort.by(Sort.Direction.DESC, "id"));
            // Tie-break on id: without it, listings created in the same second can
            // swap places between pages and appear twice or not at all.
            case NEWEST -> Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by(Sort.Direction.DESC, "id"));
        };
    }

    private int clampPageSize(int size) {
        if (size <= 0) {
            return DEFAULT_PAGE_SIZE;
        }
        return Math.min(size, MAX_PAGE_SIZE);
    }

    /** De-duplicates and trims amenity labels so "Gym", "gym " and "Gym" collapse to one chip. */
    private List<String> cleanAmenities(List<String> amenities) {
        if (amenities == null || amenities.isEmpty()) {
            return new ArrayList<>();
        }

        Set<String> seen = new LinkedHashSet<>();
        List<String> cleaned = new ArrayList<>();
        for (String amenity : amenities) {
            if (amenity == null || amenity.isBlank()) {
                continue;
            }
            String trimmed = amenity.trim();
            if (seen.add(trimmed.toLowerCase(Locale.ROOT))) {
                cleaned.add(trimmed);
            }
        }
        return cleaned;
    }

    /** Title-cases city and locality so "koramangala" and "KORAMANGALA" group together in filters. */
    private String normalisePlaceName(String raw) {
        String trimmed = raw.trim().replaceAll("\\s+", " ");
        StringBuilder result = new StringBuilder(trimmed.length());
        boolean startOfWord = true;
        for (char c : trimmed.toCharArray()) {
            result.append(startOfWord ? Character.toUpperCase(c) : Character.toLowerCase(c));
            startOfWord = !Character.isLetterOrDigit(c);
        }
        return result.toString();
    }

    /** Stores the bare 10-digit number so "+919876543210" and "9876543210" compare equal. */
    private String normalisePhone(String raw) {
        String digits = raw.replaceAll("\\D", "");
        return digits.length() > 10 ? digits.substring(digits.length() - 10) : digits;
    }
}
