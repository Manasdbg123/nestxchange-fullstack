package com.rentnest.dto.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class VisitScheduleRequest {

    @NotNull(message = "Property ID is required")
    private Long propertyId;

    @NotNull(message = "Visit date and time are required")
    @Future(message = "Visit date must be in the future")
    private LocalDateTime visitDate;
}