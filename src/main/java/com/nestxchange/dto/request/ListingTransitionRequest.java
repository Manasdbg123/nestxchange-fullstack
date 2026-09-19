package com.nestxchange.dto.request;

import com.nestxchange.entity.ListingTransitionEvent;
import jakarta.validation.constraints.NotNull;

public record ListingTransitionRequest(@NotNull ListingTransitionEvent event) {
}
