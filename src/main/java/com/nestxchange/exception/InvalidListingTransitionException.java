package com.nestxchange.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/** Thrown when a {@code ListingTransitionEvent} is fired from a status it doesn't apply to. */
@ResponseStatus(HttpStatus.CONFLICT)
public class InvalidListingTransitionException extends RuntimeException {

    public InvalidListingTransitionException(String message) {
        super(message);
    }
}
