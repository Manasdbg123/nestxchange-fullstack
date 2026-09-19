package com.nestxchange.assistant;

import com.nestxchange.dto.response.ListingResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AssistantChatResponse {

    private String reply;

    /** Listings retrieval actually found, independent of what the model's prose says - render these as real cards. */
    @Builder.Default
    private List<ListingResponse> listings = List.of();
}
