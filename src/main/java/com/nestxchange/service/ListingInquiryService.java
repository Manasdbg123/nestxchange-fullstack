package com.nestxchange.service;

import com.nestxchange.dto.response.ListingInquiryResponse;
import com.nestxchange.entity.Listing;
import com.nestxchange.entity.ListingInquiry;
import com.nestxchange.entity.User;
import com.nestxchange.exception.BusinessValidationException;
import com.nestxchange.exception.ResourceNotFoundException;
import com.nestxchange.exception.UnauthorizedAccessException;
import com.nestxchange.repository.ListingInquiryRepository;
import com.nestxchange.repository.ListingRepository;
import com.nestxchange.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Contact-the-owner messages for the generic Listing engine. See
 * {@link ListingInquiry} for how this differs from firing the state
 * machine's {@code REQUEST} event.
 */
@Service
@RequiredArgsConstructor
public class ListingInquiryService {

    private final ListingInquiryRepository listingInquiryRepository;
    private final ListingRepository listingRepository;
    private final UserRepository userRepository;

    @Transactional
    public ListingInquiryResponse send(Long listingId, String message, Long senderId) {
        Listing listing = loadListing(listingId);
        if (listing.getOwnerId().equals(senderId)) {
            throw new BusinessValidationException("You cannot send an inquiry about your own listing");
        }

        ListingInquiry inquiry = listingInquiryRepository.save(ListingInquiry.builder()
                .listingId(listingId)
                .senderId(senderId)
                .message(message)
                .build());

        return toResponse(inquiry, listing);
    }

    /** Inquiries received on one of your own listings. */
    @Transactional(readOnly = true)
    public List<ListingInquiryResponse> forListing(Long listingId, Long requesterId) {
        Listing listing = loadListing(listingId);
        if (!listing.getOwnerId().equals(requesterId)) {
            throw new UnauthorizedAccessException("Only the owner can view inquiries for this listing");
        }

        return listingInquiryRepository.findByListingIdOrderByCreatedAtDesc(listingId).stream()
                .map(inquiry -> toResponse(inquiry, listing))
                .toList();
    }

    /** Inquiries the caller has sent, across every listing. */
    @Transactional(readOnly = true)
    public List<ListingInquiryResponse> sentBy(Long senderId) {
        return listingInquiryRepository.findBySenderIdOrderByCreatedAtDesc(senderId).stream()
                .map(inquiry -> toResponse(inquiry, loadListing(inquiry.getListingId())))
                .toList();
    }

    private ListingInquiryResponse toResponse(ListingInquiry inquiry, Listing listing) {
        User sender = userRepository.findById(inquiry.getSenderId()).orElse(null);

        return ListingInquiryResponse.builder()
                .id(inquiry.getId())
                .listingId(inquiry.getListingId())
                .listingTitle(listing.getTitle())
                .senderId(inquiry.getSenderId())
                .senderName(sender != null ? sender.getName() : "Unknown")
                .senderEmail(sender != null ? sender.getEmail() : null)
                .message(inquiry.getMessage())
                .createdAt(inquiry.getCreatedAt())
                .build();
    }

    private Listing loadListing(Long listingId) {
        return listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing", "id", listingId));
    }
}
