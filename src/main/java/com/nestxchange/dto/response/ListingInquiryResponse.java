package com.nestxchange.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ListingInquiryResponse {

    private Long id;
    private Long listingId;
    private String listingTitle;
    private Long senderId;
    private String senderName;
    private String senderEmail;
    private String message;
    private LocalDateTime createdAt;
}
