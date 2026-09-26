package com.nestxchange.service.impl;

import com.nestxchange.dto.request.ForgotPasswordRequest;
import com.nestxchange.dto.request.LoginRequest;
import com.nestxchange.dto.request.RegisterRequest;
import com.nestxchange.dto.request.ResetPasswordRequest;
import com.nestxchange.dto.response.AuthResponse;
import com.nestxchange.dto.response.UserResponse;
import com.nestxchange.entity.PasswordResetToken;
import com.nestxchange.entity.User;
import com.nestxchange.exception.BusinessValidationException;
import com.nestxchange.exception.ResourceNotFoundException;
import com.nestxchange.repository.PasswordResetTokenRepository;
import com.nestxchange.repository.UserRepository;
import com.nestxchange.security.AccountAttemptLimiter;
import com.nestxchange.security.JwtTokenProvider;
import com.nestxchange.security.UserPrincipal;
import com.nestxchange.service.AuthService;
import com.nestxchange.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final int TOKEN_BYTES = 32;
    private static final long TOKEN_VALID_MINUTES = 30;

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;
    private final AccountAttemptLimiter attemptLimiter;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public AuthResponse login(LoginRequest request) {
        String email = normaliseEmail(request.getEmail());
        attemptLimiter.checkAllowed(AccountAttemptLimiter.Kind.FAILED_LOGIN, email);

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.getPassword()));
        } catch (AuthenticationException ex) {
            attemptLimiter.record(AccountAttemptLimiter.Kind.FAILED_LOGIN, email);
            throw ex;
        }
        attemptLimiter.reset(AccountAttemptLimiter.Kind.FAILED_LOGIN, email);

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

    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        String email = normaliseEmail(request.getEmail());
        // Counted before the lookup, so the limit behaves the same for unknown
        // addresses and can't be used to tell them apart.
        attemptLimiter.checkAllowed(AccountAttemptLimiter.Kind.RESET_REQUEST, email);
        attemptLimiter.record(AccountAttemptLimiter.Kind.RESET_REQUEST, email);
        Optional<User> user = userRepository.findByEmail(email);

        // A different outcome for "no such user" would let a caller enumerate
        // registered emails one guess at a time, so this returns exactly the
        // same way whether or not the account exists - the branch below only
        // decides whether an email actually goes out.
        if (user.isEmpty()) {
            log.info("Password reset requested for unknown email");
            return;
        }

        // Only the newest link works: requesting another retires the earlier ones.
        passwordResetTokenRepository.markAllUsedForUser(user.get().getId());

        String rawToken = generateToken();
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .userId(user.get().getId())
                .tokenHash(hashToken(rawToken))
                .expiresAt(LocalDateTime.now().plusMinutes(TOKEN_VALID_MINUTES))
                .build();
        passwordResetTokenRepository.save(resetToken);

        String resetLink = frontendUrl + "/reset-password?token=" + rawToken;
        String html = "<p>Someone requested a password reset for your NestXchange account.</p>"
                + "<p><a href=\"" + resetLink + "\">Click here to choose a new password</a>. "
                + "This link expires in " + TOKEN_VALID_MINUTES + " minutes.</p>"
                + "<p>If you didn't request this, you can safely ignore this email.</p>";

        emailService.send(user.get().getEmail(), "Reset your NestXchange password", html);
        log.info("Password reset email queued for user id={}", user.get().getId());
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String tokenHash = hashToken(request.getToken());
        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new BusinessValidationException("This reset link is invalid or has already been used."));

        if (resetToken.isUsed() || resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessValidationException("This reset link is invalid or has expired. Please request a new one.");
        }

        User user = userRepository.findById(resetToken.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", resetToken.getUserId()));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        // Signs out every existing session: JwtAuthenticationFilter rejects tokens
        // issued before this moment, including any held by whoever knew the old password.
        user.setPasswordChangedAt(LocalDateTime.now());
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);
        // Any other link still in the user's inbox dies with this one.
        passwordResetTokenRepository.markAllUsedForUser(resetToken.getUserId());

        log.info("Password reset completed for user id={}", user.getId());
    }

    private String generateToken() {
        byte[] bytes = new byte[TOKEN_BYTES];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException ex) {
            // SHA-256 is guaranteed to be available on every JVM (JLS/JCA
            // standard algorithm), so this can only mean a broken runtime.
            throw new IllegalStateException("SHA-256 is not available", ex);
        }
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
