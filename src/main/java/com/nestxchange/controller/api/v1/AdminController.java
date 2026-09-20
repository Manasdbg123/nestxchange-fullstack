package com.nestxchange.controller.api.v1;

import com.nestxchange.dto.response.ListingResponse;
import com.nestxchange.entity.Listing;
import com.nestxchange.entity.ListingStatus;
import com.nestxchange.entity.ListingTransition;
import com.nestxchange.entity.ListingTransitionEvent;
import com.nestxchange.exception.ResourceNotFoundException;
import com.nestxchange.mapper.ListingMapper;
import com.nestxchange.repository.ListingRepository;
import com.nestxchange.repository.ListingTransitionRepository;
import com.nestxchange.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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

    private final ListingRepository listingRepository;
    private final ListingTransitionRepository listingTransitionRepository;

    /**
     * Sets the verified badge on a listing, of either category. Nothing else
     * can set it - it isn't part of the public create/update payload - so a
     * listing can't self-declare itself verified.
     */
    @PatchMapping("/listings/{listingId}/verification")
    @Operation(summary = "Grant or revoke the verified badge on a listing")
    @Transactional
    public ResponseEntity<ListingResponse> setVerification(@PathVariable Long listingId,
                                                             @RequestParam boolean verified) {
        Listing listing = load(listingId);
        listing.setVerified(verified);
        log.info("Admin set verified={} on listing id={}", verified, listingId);
        return ResponseEntity.ok(ListingMapper.toResponse(listingRepository.save(listing)));
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
        Listing listing = load(listingId);

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

    private Listing load(Long listingId) {
        return listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing", "id", listingId));
    }
}
