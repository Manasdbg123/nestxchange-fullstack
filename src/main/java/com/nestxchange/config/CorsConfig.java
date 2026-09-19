package com.nestxchange.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * The single source of CORS policy for the application.
 *
 * <p>This previously coexisted with a second, differently-configured policy
 * inside {@code SecurityConfig}; the two disagreed on allowed headers, so which
 * one applied depended on filter ordering. There is now exactly one bean, and
 * {@code SecurityConfig} consumes it.
 *
 * <p>Origins come from {@code app.cors.allowed-origins} so that staging and
 * production hosts are deployment configuration rather than a code change.
 */
@Slf4j
@Configuration
public class CorsConfig {

    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String allowedOrigins;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toList();

        log.info("CORS enabled for origins: {}", origins);

        CorsConfiguration configuration = new CorsConfiguration();
        // Credentials are allowed, so origins must be listed explicitly -
        // a wildcard is rejected by the browser in that combination.
        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"));
        configuration.setExposedHeaders(List.of("Location"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
