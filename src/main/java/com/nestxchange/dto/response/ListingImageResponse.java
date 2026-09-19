package com.nestxchange.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ListingImageResponse {

    private Long id;
    private String imageUrl;
    private boolean isPrimary;
}
