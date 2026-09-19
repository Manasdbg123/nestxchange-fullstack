package com.nestxchange.dto.response;

import com.nestxchange.entity.ListingStatus;
import com.nestxchange.entity.ListingTransitionEvent;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ListingTransitionResponse {

    private Long id;
    private Long listingId;
    private Long performedBy;
    private ListingStatus fromStatus;
    private ListingStatus toStatus;
    private ListingTransitionEvent event;
    private String note;
    private LocalDateTime performedAt;
}
