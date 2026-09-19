package com.nestxchange.controller.api.v1;

import com.nestxchange.dto.request.ListingCreateRequest;
import com.nestxchange.dto.request.ListingSearchRequest;
import com.nestxchange.dto.request.ListingTransitionRequest;
import com.nestxchange.dto.request.ListingUpdateRequest;
import com.nestxchange.dto.response.CategorySchemaResponse;
import com.nestxchange.dto.response.ListingResponse;
import com.nestxchange.dto.response.ListingTransitionResponse;
import com.nestxchange.dto.response.PaginatedResponse;
import com.nestxchange.entity.Listing;
import com.nestxchange.entity.ListingCategory;
import com.nestxchange.entity.ListingMode;
import com.nestxchange.mapper.ListingMapper;
import com.nestxchange.repository.ListingTransitionRepository;
import com.nestxchange.schema.CategorySchemaRegistry;
import com.nestxchange.search.ListingSearchService;
import com.nestxchange.security.UserPrincipal;
import com.nestxchange.service.ListingService;
import com.nestxchange.statemachine.ListingStateMachineService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * The category-agnostic listings API. There is deliberately one search
 * endpoint here for both PROPERTY and VEHICLE - see
 * {@link com.nestxchange.search.ListingQueryBuilder}.
 */
@RestController
@RequestMapping("/api/v1/listings")
@RequiredArgsConstructor
@Tag(name = "Listings", description = "Search property and vehicle listings through one unified engine")
public class ListingController {

    private static final String ATTR_PREFIX = "attr.";

    private final ListingSearchService listingSearchService;
    private final ListingStateMachineService listingStateMachineService;
    private final ListingTransitionRepository listingTransitionRepository;
    private final ListingService listingService;

    @GetMapping("/schemas")
    @Operation(summary = "Every category's attribute schema - what the dynamic listing form and search filters are built from")
    public ResponseEntity<List<CategorySchemaResponse>> schemas() {
        List<CategorySchemaResponse> response = CategorySchemaRegistry.all().values().stream()
                .map(ListingMapper::toResponse)
                .toList();
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @Operation(summary = "Post a new listing; category and mode fix which CategorySchema attributes are validated against")
    public ResponseEntity<ListingResponse> create(
            @Valid @RequestBody ListingCreateRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        return ResponseEntity.status(HttpStatus.CREATED).body(listingService.create(request, currentUser.getId()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "A single listing")
    public ResponseEntity<ListingResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(listingService.getById(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Edit a listing you own")
    public ResponseEntity<ListingResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody ListingUpdateRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        return ResponseEntity.ok(listingService.update(id, request, currentUser.getId()));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Remove a listing you own")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal currentUser) {
        listingService.delete(id, currentUser.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/my-listings")
    @Operation(summary = "Listings the caller has posted")
    public ResponseEntity<List<ListingResponse>> myListings(@AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(listingService.myListings(currentUser.getId()));
    }

    @GetMapping("/search")
    @Operation(summary = "Search listings across every category via universal + category-specific filters")
    public ResponseEntity<PaginatedResponse<ListingResponse>> search(
            @RequestParam(required = false) ListingCategory category,
            @RequestParam(required = false) ListingMode mode,
            @RequestParam(required = false) BigDecimal priceMin,
            @RequestParam(required = false) BigDecimal priceMax,
            @RequestParam(required = false) String location,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam Map<String, String> allParams) {

        ListingSearchRequest request = ListingSearchRequest.builder()
                .category(category)
                .mode(mode)
                .priceMin(priceMin)
                .priceMax(priceMax)
                .location(location)
                .attributeFilters(extractAttributeFilters(allParams))
                .page(page)
                .size(size)
                .build();

        return ResponseEntity.ok(listingSearchService.search(request));
    }

    // Fires the one state machine that governs both rent and sale listings -
    // see ListingStateMachineService. Coarse-grained authorization for now
    // (any authenticated user): per-actor rules (only the owner may CONFIRM,
    // the requester may not be the owner, etc.) need a concept of "who
    // requested this listing", which doesn't exist yet.
    @PostMapping("/{id}/transitions")
    @Operation(summary = "Advance a listing through AVAILABLE -> REQUESTED -> CONFIRMED -> ACTIVE/COMPLETED -> CLOSED")
    public ResponseEntity<ListingResponse> transition(
            @PathVariable Long id,
            @Valid @RequestBody ListingTransitionRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        Listing updated = listingStateMachineService.fire(id, request.event(), currentUser.getId());
        return ResponseEntity.ok(ListingMapper.toResponse(updated));
    }

    @GetMapping("/{id}/transitions")
    @Operation(summary = "Transition history for a listing")
    public ResponseEntity<List<ListingTransitionResponse>> transitionHistory(@PathVariable Long id) {
        List<ListingTransitionResponse> history = listingTransitionRepository
                .findByListingIdOrderByPerformedAtAsc(id).stream()
                .map(ListingMapper::toResponse)
                .toList();
        return ResponseEntity.ok(history);
    }

    /** Pulls out every {@code attr.<field>} query param, stripping the prefix. */
    private Map<String, String> extractAttributeFilters(Map<String, String> allParams) {
        Map<String, String> attributeFilters = new LinkedHashMap<>();
        for (Map.Entry<String, String> entry : allParams.entrySet()) {
            if (entry.getKey().startsWith(ATTR_PREFIX)) {
                attributeFilters.put(entry.getKey().substring(ATTR_PREFIX.length()), entry.getValue());
            }
        }
        return attributeFilters;
    }
}
