package com.nestxchange.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ListingInquiryRequest(
        @NotBlank(message = "Please write a message")
        @Size(min = 5, max = 2000, message = "Message must be between 5 and 2000 characters")
        String message
) {
}
