package com.nestxchange.config;

import com.nestxchange.security.CustomUserDetailsService;
import com.nestxchange.security.JwtAccessDeniedHandler;
import com.nestxchange.security.JwtAuthenticationEntryPoint;
import com.nestxchange.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomUserDetailsService customUserDetailsService;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JwtAuthenticationEntryPoint authenticationEntryPoint;
    private final JwtAccessDeniedHandler accessDeniedHandler;
    private final CorsConfigurationSource corsConfigurationSource;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                // Safe to disable: the API is stateless and authenticates with a
                // bearer token that a cross-site form post cannot attach.
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(handling -> handling
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler))
                .headers(headers -> headers
                        .frameOptions(frame -> frame.deny())
                        .referrerPolicy(referrer -> referrer.policy(
                                org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter
                                        .ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN)))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // Documentation, health probe and the error forward.
                        .requestMatchers(
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/actuator/health",
                                "/error").permitAll()

                        // Anonymous sign-up and sign-in.
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/register", "/api/v1/auth/login").permitAll()

                        // These MUST be declared before the public GET rule below.
                        // Previously a blanket `GET /api/v1/properties/**` permitAll
                        // also matched /favorites and /my-properties, so anonymous
                        // callers reached controller methods that dereference the
                        // authenticated principal and crashed with a 500.
                        .requestMatchers(
                                "/api/v1/properties/favorites",
                                "/api/v1/properties/my-properties").authenticated()

                        // Public browsing: the search listing and a single listing
                        // by numeric id. Everything else under /properties requires
                        // a session (favouriting, posting, editing, deleting).
                        .requestMatchers(HttpMethod.GET,
                                "/api/v1/properties",
                                "/api/v1/properties/cities",
                                "/api/v1/properties/{id:[0-9]+}").permitAll()

                        // Unified listing browsing is public, same as property search.
                        // /my-listings isn't numeric so it never matches the {id} pattern
                        // below; it still falls through to the anyRequest().authenticated()
                        // rule, same as /favorites and /my-properties above.
                        .requestMatchers(HttpMethod.GET,
                                "/api/v1/listings/search",
                                "/api/v1/listings/schemas",
                                "/api/v1/listings/{id:[0-9]+}").permitAll()

                        .anyRequest().authenticated())
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(customUserDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        // Without this, a failed lookup surfaces as UsernameNotFoundException,
        // which tells an attacker which email addresses are registered.
        authProvider.setHideUserNotFoundExceptions(true);
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
}
