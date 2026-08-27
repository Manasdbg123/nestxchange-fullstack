package com.rentnest.service;

import com.rentnest.dto.request.RegisterRequest;
import com.rentnest.dto.response.AuthResponse;
import com.rentnest.entity.Role;
import com.rentnest.entity.User;
import com.rentnest.exception.BusinessValidationException;
import com.rentnest.repository.UserRepository;
import com.rentnest.security.JwtTokenProvider;
import com.rentnest.security.UserPrincipal;
import com.rentnest.service.impl.AuthServiceImpl;
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

    private AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(4); // low cost keeps the test fast
        authService = new AuthServiceImpl(authenticationManager, tokenProvider, userRepository, passwordEncoder);

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

    private RegisterRequest newRequest() {
        return RegisterRequest.builder()
                .name("Asha Menon")
                .email("asha@example.com")
                .password("Sup3rSecret")
                .accountType(RegisterRequest.AccountType.TENANT)
                .build();
    }
}
