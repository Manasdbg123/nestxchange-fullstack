package com.rentnest.service;

import com.rentnest.dto.request.LoginRequest;
import com.rentnest.dto.request.RegisterRequest;
import com.rentnest.dto.response.AuthResponse;
import com.rentnest.dto.response.UserResponse;

public interface AuthService {

    AuthResponse login(LoginRequest request);

    AuthResponse register(RegisterRequest request);

    /** Profile of the currently authenticated user, for session rehydration on page load. */
    UserResponse getCurrentUser(Long userId);
}
