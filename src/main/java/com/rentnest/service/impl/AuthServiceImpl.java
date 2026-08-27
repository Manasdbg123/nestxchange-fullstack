package com.rentnest.service.impl;

import com.rentnest.dto.request.LoginRequest;
import com.rentnest.dto.request.RegisterRequest;
import com.rentnest.dto.response.AuthResponse;
import com.rentnest.dto.response.UserResponse;
import com.rentnest.entity.User;
import com.rentnest.exception.BusinessValidationException;
import com.rentnest.exception.ResourceNotFoundException;
import com.rentnest.repository.UserRepository;
import com.rentnest.security.JwtTokenProvider;
import com.rentnest.security.UserPrincipal;
import com.rentnest.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normaliseEmail(request.getEmail()), request.getPassword()));

        // Note: the SecurityContext is deliberately NOT populated here. This is a
        // stateless API - the caller authenticates each request with the token
        // below, and mutating the context on a login call only risks leaking the
        // identity onto a pooled request thread.
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return toAuthResponse(principal.getUser(), tokenProvider.generateToken(principal));
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normaliseEmail(request.getEmail());

        if (userRepository.existsByEmail(email)) {
            throw new BusinessValidationException("An account with this email already exists. Try signing in instead.");
        }

        User user = User.builder()
                .name(request.getName().trim())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(hasText(request.getPhone()) ? request.getPhone().trim() : null)
                // resolveRole() can only ever yield TENANT or OWNER, so a crafted
                // request body cannot mint an ADMIN account.
                .role(request.resolveRole())
                .build();

        User saved = userRepository.save(user);
        log.info("Registered new {} account id={}", saved.getRole(), saved.getId());

        // Issue the token directly rather than replaying the password through the
        // authentication manager - one less place the plaintext password travels.
        return toAuthResponse(saved, tokenProvider.generateToken(new UserPrincipal(saved)));
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private AuthResponse toAuthResponse(User user, String token) {
        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .expiresInMs(tokenProvider.getExpirationInMs())
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }

    /** Emails are case-insensitive identifiers; storing them lowercased keeps the unique index honest. */
    private String normaliseEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
