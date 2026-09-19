package com.nestxchange.service;

import com.nestxchange.dto.request.PropertyCreateRequest;
import com.nestxchange.dto.request.PropertySearchCriteria;
import com.nestxchange.dto.request.PropertyUpdateRequest;
import com.nestxchange.dto.response.PaginatedResponse;
import com.nestxchange.dto.response.PropertyResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface PropertyService {

    PropertyResponse createProperty(PropertyCreateRequest request, List<MultipartFile> images, Long ownerId);

    /** Edits a listing. Fails unless {@code requesterId} owns it. */
    PropertyResponse updateProperty(Long propertyId, PropertyUpdateRequest request, Long requesterId);

    /** Removes a listing. Fails unless {@code requesterId} owns it. */
    void deleteProperty(Long propertyId, Long requesterId);

    PaginatedResponse<PropertyResponse> searchProperties(PropertySearchCriteria criteria, int page, int size);

    /**
     * @param requesterId the signed-in user, or {@code null} for an anonymous
     *                    visitor. Owner contact details are withheld unless the
     *                    requester owns the listing.
     */
    PropertyResponse getPropertyById(Long id, Long requesterId);

    boolean toggleFavorite(Long propertyId, Long userId);

    List<PropertyResponse> getUserFavorites(Long userId);

    List<PropertyResponse> getMyProperties(Long ownerId);

    /** Cities with live listings, most stocked first - drives the home page shortcuts. */
    List<String> getPopularCities(int limit);
}
