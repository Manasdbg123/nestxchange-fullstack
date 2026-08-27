package com.rentnest.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rentnest.exception.ApiError;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Returns a JSON 401 for unauthenticated requests to protected endpoints.
 *
 * <p>Without this, Spring Security's default entry point answers with an empty
 * 403, which the browser client cannot distinguish from a genuine permission
 * failure - so an expired session looked identical to "you are not allowed".
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException {

        ApiError body = ApiError.of(
                HttpStatus.UNAUTHORIZED,
                "Authentication required. Please sign in and try again.",
                request.getRequestURI());

        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), body);
    }
}
