package com.nestxchange.dto.response;

import com.nestxchange.entity.ListingCategory;
import com.nestxchange.entity.ListingMode;
import com.nestxchange.entity.ListingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ListingResponse {

    private Long id;
    private Long ownerId;
    private Long requestedBy;
    private ListingCategory category;
    private ListingMode mode;
    private String title;
    private String description;
    private BigDecimal price;
    private String location;
    private ListingStatus status;
    private Map<String, Object> attributes;
    @Builder.Default
    private List<ListingImageResponse> images = List.of();
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
