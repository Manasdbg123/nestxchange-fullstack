package com.rentnest.controller.api.v1;

import com.rentnest.dto.request.VisitScheduleRequest;
import com.rentnest.dto.response.VisitResponse;
import com.rentnest.entity.VisitSchedule;
import com.rentnest.security.UserPrincipal;
import com.rentnest.service.VisitService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Visit scheduling.
 *
 * <p>These endpoints were previously gated on {@code hasRole('USER')} and
 * {@code hasRole('OWNER')}. That was the wrong axis: anyone can post a listing
 * regardless of the role they signed up with, so a TENANT who listed a flat
 * could never manage its viewings, while a new sign-up (role TENANT) could not
 * book one at all. Authorisation is by ownership of the listing in question,
 * checked in the service layer.
 */
@RestController
@RequestMapping("/api/v1/visits")
@RequiredArgsConstructor
@Tag(name = "Visits", description = "Request and manage property viewings")
public class VisitController {

    private final VisitService visitService;

    @PostMapping
    @Operation(summary = "Request a viewing of a listing")
    public ResponseEntity<VisitResponse> requestVisit(
            @Valid @RequestBody VisitScheduleRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        VisitResponse visit = visitService.scheduleVisit(request, currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(visit);
    }

    @GetMapping("/my-requests")
    @Operation(summary = "Viewings the caller has requested")
    public ResponseEntity<List<VisitResponse>> getUserVisits(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(visitService.getUserVisits(currentUser.getId()));
    }

    @GetMapping("/owner-requests")
    @Operation(summary = "Viewing requests raised against the caller's own listings")
    public ResponseEntity<List<VisitResponse>> getOwnerVisits(
            @RequestParam(defaultValue = "false") boolean pendingOnly,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(visitService.getOwnerVisits(currentUser.getId(), pendingOnly));
    }

    @PatchMapping("/{visitId}/status")
    @Operation(summary = "Accept or reject a viewing request for a listing you own")
    public ResponseEntity<VisitResponse> updateVisitStatus(
            @PathVariable Long visitId,
            @RequestParam VisitSchedule.VisitStatus status,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        return ResponseEntity.ok(visitService.updateVisitStatus(visitId, status, currentUser.getId()));
    }

    @DeleteMapping("/{visitId}")
    @Operation(summary = "Withdraw a pending request the caller raised")
    public ResponseEntity<Void> cancelVisit(
            @PathVariable Long visitId,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        visitService.cancelVisit(visitId, currentUser.getId());
        return ResponseEntity.noContent().build();
    }
}
