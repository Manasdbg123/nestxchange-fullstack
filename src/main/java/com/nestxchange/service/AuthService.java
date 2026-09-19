package com.nestxchange.service;

import com.nestxchange.dto.request.LoginRequest;
import com.nestxchange.dto.request.RegisterRequest;
import com.nestxchange.dto.response.AuthResponse;
import com.nestxchange.dto.response.UserResponse;

public interface AuthService {

    AuthResponse login(LoginRequest request);

    AuthResponse register(RegisterRequest request);

    /** Profile of the currently authenticated user, for session rehydration on page load. */
    UserResponse getCurrentUser(Long userId);
}
