package com.rentnest.controller.api.v1;

import com.rentnest.dto.response.PropertyResponse;
import com.rentnest.entity.Property;
import com.rentnest.exception.ResourceNotFoundException;
import com.rentnest.mapper.PropertyMapper;
import com.rentnest.repository.PropertyRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Moderation endpoints.
 *
 * <p>The class-level {@code @PreAuthorize} means a new method added here is
 * admin-only by default; the previous per-method annotation would have left any
 * forgotten method wide open to every signed-in user.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin", description = "Listing moderation. Requires the ADMIN role.")
public class AdminController {

    private final PropertyRepository propertyRepository;
    private final PropertyMapper propertyMapper;

    @GetMapping("/properties/pending")
    @Operation(summary = "Listings awaiting moderation")
    @Transactional(readOnly = true)
    public ResponseEntity<List<PropertyResponse>> pendingProperties() {
        List<PropertyResponse> pending = propertyRepository
                .findAll((root, query, cb) -> cb.equal(root.get("status"), Property.PropertyStatus.UNDER_REVIEW))
                .stream()
                .map(property -> propertyMapper.toPropertyResponse(property, true))
                .toList();

        return ResponseEntity.ok(pending);
    }

    @PatchMapping("/properties/{propertyId}/approve")
    @Operation(summary = "Publish a listing that was held for review")
    @Transactional
    public ResponseEntity<PropertyResponse> approveProperty(@PathVariable Long propertyId) {
        Property property = load(propertyId);
        property.setStatus(Property.PropertyStatus.AVAILABLE);
        log.info("Admin approved listing id={}", propertyId);
        return ResponseEntity.ok(propertyMapper.toPropertyResponse(propertyRepository.save(property), true));
    }

    /**
     * Sets the verified badge.
     *
     * <p>Nothing could previously set {@code isVerified} after creation, so the
     * badge the UI renders was permanently false for every user-posted listing.
     */
    @PatchMapping("/properties/{propertyId}/verification")
    @Operation(summary = "Grant or revoke the verified badge on a listing")
    @Transactional
    public ResponseEntity<PropertyResponse> setVerification(@PathVariable Long propertyId,
                                                            @RequestParam boolean verified) {
        Property property = load(propertyId);
        property.setVerified(verified);
        log.info("Admin set verified={} on listing id={}", verified, propertyId);
        return ResponseEntity.ok(propertyMapper.toPropertyResponse(propertyRepository.save(property), true));
    }

    @PatchMapping("/properties/{propertyId}/deactivate")
    @Operation(summary = "Take a listing off the public site")
    @Transactional
    public ResponseEntity<PropertyResponse> deactivateProperty(@PathVariable Long propertyId) {
        Property property = load(propertyId);
        property.setStatus(Property.PropertyStatus.INACTIVE);
        log.info("Admin deactivated listing id={}", propertyId);
        return ResponseEntity.ok(propertyMapper.toPropertyResponse(propertyRepository.save(property), true));
    }

    private Property load(Long propertyId) {
        return propertyRepository.findByIdWithOwner(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Property", "id", propertyId));
    }
}
