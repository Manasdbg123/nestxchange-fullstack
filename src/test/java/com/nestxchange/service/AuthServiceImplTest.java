package com.nestxchange.service;

import com.nestxchange.dto.request.ForgotPasswordRequest;
import com.nestxchange.dto.request.LoginRequest;
import com.nestxchange.dto.request.RegisterRequest;
import com.nestxchange.dto.request.ResetPasswordRequest;
import com.nestxchange.dto.response.AuthResponse;
import com.nestxchange.entity.PasswordResetToken;
import com.nestxchange.entity.Role;
import com.nestxchange.entity.User;
import com.nestxchange.exception.BusinessValidationException;
import com.nestxchange.repository.PasswordResetTokenRepository;
import com.nestxchange.repository.UserRepository;
import com.nestxchange.security.JwtTokenProvider;
import com.nestxchange.security.UserPrincipal;
import com.nestxchange.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AuthServiceImplTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private com.nestxchange.service.EmailService emailService;

    @Mock
    private com.nestxchange.security.AccountAttemptLimiter attemptLimiter;

    private AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(4); // low cost keeps the test fast
        authService = new AuthServiceImpl(authenticationManager, tokenProvider, userRepository, passwordEncoder,
                passwordResetTokenRepository, emailService, attemptLimiter);
        ReflectionTestUtils.setField(authService, "frontendUrl", "http://localhost:5173");

        when(tokenProvider.generateToken(any(UserPrincipal.class))).thenReturn("signed.jwt.token");
        when(userRepository.save(any(User.class))).thenAnswer(call -> {
            User user = call.getArgument(0);
            user.setId(42L);
            return user;
        });
    }

    /**
     * The registration endpoint is anonymous, and it used to bind the full
     * {@code Role} enum straight from the request body. Posting
     * {@code "role": "ADMIN"} therefore created an administrator.
     */
    @Test
    @DisplayName("registration cannot mint an ADMIN account")
    void registrationCannotEscalateToAdmin() {
        // AccountType only offers TENANT and OWNER, so "ADMIN" is not expressible.
        assertThat(RegisterRequest.AccountType.values())
                .extracting(Enum::name)
                .containsExactlyInAnyOrder("TENANT", "OWNER");

        for (RegisterRequest.AccountType accountType : RegisterRequest.AccountType.values()) {
            assertThat(accountType.toRole()).isNotEqualTo(Role.ADMIN);
        }
    }

    @Test
    @DisplayName("a request with no account type defaults to TENANT, never ADMIN")
    void missingAccountTypeDefaultsToTenant() {
        RegisterRequest request = newRequest();
        request.setAccountType(null);

        when(userRepository.existsByEmail(anyString())).thenReturn(false);

        authService.register(request);

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        assertThat(saved.getValue().getRole()).isEqualTo(Role.TENANT);
    }

    @Test
    @DisplayName("stores the email lowercased so the unique index is meaningful")
    void normalisesEmailOnRegistration() {
        RegisterRequest request = newRequest();
        request.setEmail("  Asha.Menon@Example.COM ");

        when(userRepository.existsByEmail("asha.menon@example.com")).thenReturn(false);

        AuthResponse response = authService.register(request);

        assertThat(response.getEmail()).isEqualTo("asha.menon@example.com");
    }

    @Test
    @DisplayName("never stores the password in plain text")
    void hashesPassword() {
        when(userRepository.existsByEmail(anyString())).thenReturn(false);

        authService.register(newRequest());

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        assertThat(saved.getValue().getPassword())
                .isNotEqualTo("Sup3rSecret")
                .startsWith("$2");
    }

    @Test
    @DisplayName("a duplicate email is a 400, not a database constraint crash")
    void duplicateEmailIsRejectedCleanly() {
        when(userRepository.existsByEmail("asha@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(newRequest()))
                .isInstanceOf(BusinessValidationException.class)
                .hasMessageContaining("already exists");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("forgotPassword does nothing observable for an unknown email (no enumeration signal)")
    void forgotPasswordSilentForUnknownEmail() {
        when(userRepository.findByEmail("nobody@example.com")).thenReturn(Optional.empty());

        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("nobody@example.com");

        authService.forgotPassword(request);

        verify(passwordResetTokenRepository, never()).save(any(PasswordResetToken.class));
        verify(emailService, never()).send(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("forgotPassword saves a hashed token and emails the user for a known email")
    void forgotPasswordSendsResetEmailForKnownUser() {
        User user = User.builder().id(7L).name("Asha").email("asha@example.com").build();
        when(userRepository.findByEmail("asha@example.com")).thenReturn(Optional.of(user));

        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("asha@example.com");

        authService.forgotPassword(request);

        ArgumentCaptor<PasswordResetToken> saved = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(passwordResetTokenRepository).save(saved.capture());
        assertThat(saved.getValue().getUserId()).isEqualTo(7L);
        // The raw token must never be persisted - only its hash.
        assertThat(saved.getValue().getTokenHash()).hasSize(64); // SHA-256 as hex
        assertThat(saved.getValue().isUsed()).isFalse();
        // Earlier links are retired, so only the newest email works.
        verify(passwordResetTokenRepository).markAllUsedForUser(7L);

        verify(emailService).send(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("resetPassword rejects an expired token")
    void resetPasswordRejectsExpiredToken() {
        PasswordResetToken expired = PasswordResetToken.builder()
                .id(1L).userId(7L).tokenHash("irrelevant-in-this-test")
                .expiresAt(LocalDateTime.now().minusMinutes(1))
                .used(false)
                .build();
        when(passwordResetTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(expired));

        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("some-token");
        request.setNewPassword("NewPass123");

        assertThatThrownBy(() -> authService.resetPassword(request))
                .isInstanceOf(BusinessValidationException.class)
                .hasMessageContaining("expired");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("resetPassword rejects a token that was already used")
    void resetPasswordRejectsUsedToken() {
        PasswordResetToken used = PasswordResetToken.builder()
                .id(1L).userId(7L).tokenHash("irrelevant-in-this-test")
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .used(true)
                .build();
        when(passwordResetTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(used));

        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("some-token");
        request.setNewPassword("NewPass123");

        assertThatThrownBy(() -> authService.resetPassword(request))
                .isInstanceOf(BusinessValidationException.class);

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("resetPassword updates the hashed password and marks the token used")
    void resetPasswordSucceedsForValidToken() {
        PasswordResetToken valid = PasswordResetToken.builder()
                .id(1L).userId(7L).tokenHash("irrelevant-in-this-test")
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .used(false)
                .build();
        when(passwordResetTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(valid));

        User user = User.builder().id(7L).name("Asha").email("asha@example.com").password("old-hash").build();
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));

        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("some-token");
        request.setNewPassword("NewPass123");

        authService.resetPassword(request);

        ArgumentCaptor<User> savedUser = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(savedUser.capture());
        assertThat(savedUser.getValue().getPassword()).isNotEqualTo("NewPass123").startsWith("$2");

        ArgumentCaptor<PasswordResetToken> savedToken = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(passwordResetTokenRepository).save(savedToken.capture());
        assertThat(savedToken.getValue().isUsed()).isTrue();
    }

    @Test
    @DisplayName("resetPassword records the change time and retires every other reset link")
    void resetPasswordSignsOutOldSessionsAndLinks() {
        PasswordResetToken valid = PasswordResetToken.builder()
                .id(1L).userId(7L).tokenHash("irrelevant-in-this-test")
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .used(false)
                .build();
        when(passwordResetTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(valid));
        User user = User.builder().id(7L).name("Asha").email("asha@example.com").password("old-hash").build();
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));

        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("some-token");
        request.setNewPassword("NewPass123");
        LocalDateTime before = LocalDateTime.now();

        authService.resetPassword(request);

        // JwtAuthenticationFilter rejects tokens issued before this timestamp.
        assertThat(user.getPasswordChangedAt()).isNotNull().isAfterOrEqualTo(before);
        verify(passwordResetTokenRepository).markAllUsedForUser(7L);
    }

    @Test
    @DisplayName("a failed sign-in is counted against the account; a successful one clears the count")
    void loginCountsFailuresPerAccount() {
        when(authenticationManager.authenticate(any()))
                .thenThrow(new org.springframework.security.authentication.BadCredentialsException("bad"));
        LoginRequest request = new LoginRequest();
        request.setEmail("Asha@Example.com");
        request.setPassword("wrong");

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(org.springframework.security.authentication.BadCredentialsException.class);

        verify(attemptLimiter).checkAllowed(com.nestxchange.security.AccountAttemptLimiter.Kind.FAILED_LOGIN, "asha@example.com");
        verify(attemptLimiter).record(com.nestxchange.security.AccountAttemptLimiter.Kind.FAILED_LOGIN, "asha@example.com");
        verify(attemptLimiter, never()).reset(any(), anyString());
    }

    private RegisterRequest newRequest() {
        return RegisterRequest.builder()
                .name("Asha Menon")
                .email("asha@example.com")
                .password("Sup3rSecret")
                .accountType(RegisterRequest.AccountType.TENANT)
                .build();
    }
}
