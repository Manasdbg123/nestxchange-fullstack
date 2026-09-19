package com.nestxchange.controller.api.v1;

import com.nestxchange.dto.response.ListingResponse;
import com.nestxchange.dto.response.PropertyResponse;
import com.nestxchange.entity.Listing;
import com.nestxchange.entity.ListingStatus;
import com.nestxchange.entity.ListingTransition;
import com.nestxchange.entity.ListingTransitionEvent;
import com.nestxchange.entity.Property;
import com.nestxchange.exception.ResourceNotFoundException;
import com.nestxchange.mapper.ListingMapper;
import com.nestxchange.mapper.PropertyMapper;
import com.nestxchange.repository.ListingRepository;
import com.nestxchange.repository.ListingTransitionRepository;
import com.nestxchange.repository.PropertyRepository;
import com.nestxchange.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
    private final ListingRepository listingRepository;
    private final ListingTransitionRepository listingTransitionRepository;

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

    /**
     * Force-closes a listing regardless of its current status - unlike
     * {@code ListingStateMachineService.fire}, which only allows CLOSE from
     * ACTIVE or COMPLETED. A moderation takedown needs to work from any state
     * (an abusive listing still sitting at AVAILABLE, say), so this bypasses
     * the machine's normal guard entirely rather than routing through it.
     */
    @PatchMapping("/listings/{listingId}/close")
    @Operation(summary = "Force-close a listing regardless of its current status (moderation takedown)")
    @Transactional
    public ResponseEntity<ListingResponse> closeListing(@PathVariable Long listingId,
                                                          @AuthenticationPrincipal UserPrincipal currentUser) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing", "id", listingId));

        ListingStatus from = listing.getStatus();
        listing.setStatus(ListingStatus.CLOSED);
        Listing saved = listingRepository.save(listing);

        listingTransitionRepository.save(ListingTransition.builder()
                .listingId(listingId)
                .performedBy(currentUser.getId())
                .fromStatus(from)
                .toStatus(ListingStatus.CLOSED)
                .event(ListingTransitionEvent.CLOSE)
                .note("Closed by admin moderation")
                .build());

        log.info("Admin closed listing id={} (was {})", listingId, from);
        return ResponseEntity.ok(ListingMapper.toResponse(saved));
    }
}
