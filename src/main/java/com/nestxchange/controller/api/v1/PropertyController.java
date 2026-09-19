package com.nestxchange.controller.api.v1;

import com.nestxchange.dto.request.PropertyCreateRequest;
import com.nestxchange.dto.request.PropertySearchCriteria;
import com.nestxchange.dto.request.PropertyUpdateRequest;
import com.nestxchange.dto.response.PaginatedResponse;
import com.nestxchange.dto.response.PropertyResponse;
import com.nestxchange.entity.Property;
import com.nestxchange.security.UserPrincipal;
import com.nestxchange.service.PropertyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/properties")
@RequiredArgsConstructor
@Tag(name = "Properties", description = "Browse, post and manage rental listings")
public class PropertyController {

    private final PropertyService propertyService;

    @PostMapping(consumes = {"multipart/form-data"})
    @Operation(summary = "Post a new listing with optional photos")
    public ResponseEntity<PropertyResponse> createProperty(
            @Valid @ModelAttribute PropertyCreateRequest request,
            @RequestParam(value = "images", required = false) List<MultipartFile> images,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        PropertyResponse created = propertyService.createProperty(request, images, currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Edit a listing you own")
    public ResponseEntity<PropertyResponse> updateProperty(
            @PathVariable Long id,
            @Valid @RequestBody PropertyUpdateRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        return ResponseEntity.ok(propertyService.updateProperty(id, request, currentUser.getId()));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Remove a listing you own")
    public ResponseEntity<Void> deleteProperty(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        propertyService.deleteProperty(id, currentUser.getId());
        return ResponseEntity.noContent().build();
    }

    /**
     * Public search.
     *
     * <p>Every filter the UI offers is handled here. Previously BHK, property
     * type, verified-only and availability were dropped on the floor by the API
     * and re-applied in the browser, which made the result count and pagination
     * disagree with what was actually shown.
     */
    @GetMapping
    @Operation(summary = "Search live listings")
    public ResponseEntity<PaginatedResponse<PropertyResponse>> searchProperties(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String locality,
            @RequestParam(required = false) BigDecimal minRent,
            @RequestParam(required = false) BigDecimal maxRent,
            @RequestParam(required = false) List<Property.PropertyType> type,
            @RequestParam(required = false) List<Integer> bhk,
            @RequestParam(required = false) Property.FurnishingStatus furnishing,
            @RequestParam(required = false) Property.TenantPreference tenant,
            @RequestParam(required = false) Boolean verifiedOnly,
            @RequestParam(required = false) Boolean negotiableOnly,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate availableBy,
            @RequestParam(required = false, defaultValue = "newest") String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {

        PropertySearchCriteria criteria = PropertySearchCriteria.builder()
                .keyword(keyword)
                .city(city)
                .locality(locality)
                .minRent(minRent)
                .maxRent(maxRent)
                .types(type)
                .bedrooms(bhk)
                .furnishing(furnishing)
                .tenantPreference(tenant)
                .verifiedOnly(verifiedOnly)
                .negotiableOnly(negotiableOnly)
                .availableBy(availableBy)
                .sortBy(PropertySearchCriteria.SortOption.from(sortBy))
                .build();

        return ResponseEntity.ok(propertyService.searchProperties(criteria, page, size));
    }

    @GetMapping("/cities")
    @Operation(summary = "Cities with live listings, most stocked first")
    public ResponseEntity<List<String>> popularCities(@RequestParam(defaultValue = "8") int limit) {
        return ResponseEntity.ok(propertyService.getPopularCities(limit));
    }

    // Declared before the {id} mapping so these literal paths are never captured
    // as a path variable, and secured as authenticated in SecurityConfig.
    @GetMapping("/favorites")
    @Operation(summary = "Listings the caller has shortlisted")
    public ResponseEntity<List<PropertyResponse>> getUserFavorites(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(propertyService.getUserFavorites(currentUser.getId()));
    }

    @GetMapping("/my-properties")
    @Operation(summary = "Listings the caller has posted")
    public ResponseEntity<List<PropertyResponse>> getMyProperties(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(propertyService.getMyProperties(currentUser.getId()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "A single listing. Public - owner email is withheld from anonymous callers.")
    public ResponseEntity<PropertyResponse> getPropertyById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        Long requesterId = currentUser == null ? null : currentUser.getId();
        return ResponseEntity.ok(propertyService.getPropertyById(id, requesterId));
    }

    @PostMapping("/{id}/favorite")
    @Operation(summary = "Add or remove a listing from the caller's shortlist")
    public ResponseEntity<Map<String, Boolean>> toggleFavorite(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        boolean favorited = propertyService.toggleFavorite(id, currentUser.getId());
        // An object rather than a bare `true`/`false` body, so the response can
        // gain fields later without breaking existing clients.
        return ResponseEntity.ok(Map.of("favorited", favorited));
    }
}
