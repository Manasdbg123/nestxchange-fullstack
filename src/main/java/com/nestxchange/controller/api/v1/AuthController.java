package com.nestxchange.controller.api.v1;

import com.nestxchange.dto.request.LoginRequest;
import com.nestxchange.dto.request.RegisterRequest;
import com.nestxchange.dto.response.AuthResponse;
import com.nestxchange.dto.response.UserResponse;
import com.nestxchange.security.UserPrincipal;
import com.nestxchange.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Sign-up, sign-in and session lookup")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Create a tenant or owner account and return a session token")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    @Operation(summary = "Exchange credentials for a session token")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    @Operation(summary = "Profile of the caller, used by the web client to rehydrate a session")
    public ResponseEntity<UserResponse> currentUser(@AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(authService.getCurrentUser(currentUser.getId()));
    }
}
