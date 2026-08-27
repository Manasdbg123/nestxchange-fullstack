package com.rentnest.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {

    private String token;

    @Builder.Default
    private String type = "Bearer";

    /** Lets the client proactively refresh or sign out instead of waiting for a 401. */
    private long expiresInMs;

    private Long id;
    private String name;
    private String email;
    private String role;
}
