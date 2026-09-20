package com.nestxchange.service;

import com.nestxchange.dto.request.ForgotPasswordRequest;
import com.nestxchange.dto.request.LoginRequest;
import com.nestxchange.dto.request.RegisterRequest;
import com.nestxchange.dto.request.ResetPasswordRequest;
import com.nestxchange.dto.response.AuthResponse;
import com.nestxchange.dto.response.UserResponse;

public interface AuthService {

    AuthResponse login(LoginRequest request);

    AuthResponse register(RegisterRequest request);

    /** Profile of the currently authenticated user, for session rehydration on page load. */
    UserResponse getCurrentUser(Long userId);

    /**
     * Always succeeds from the caller's point of view, whether or not the
     * email belongs to an account - a different response for "no such user"
     * turns this endpoint into an account-enumeration oracle.
     */
    void forgotPassword(ForgotPasswordRequest request);

    void resetPassword(ResetPasswordRequest request);
}
