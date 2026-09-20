package com.nestxchange.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nestxchange.exception.ApiError;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Deque;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

/**
 * A simple in-memory sliding-window rate limit on the auth endpoints most
 * worth protecting: nothing previously stopped a script from hammering
 * /login (credential stuffing) or /register (fake account spam) as fast as
 * the network allowed.
 *
 * <p>In-memory rather than Redis-backed on purpose: this app runs as a
 * single instance, so there's no multi-node state to share, and a second
 * infrastructure dependency isn't worth it for a soft launch. If this ever
 * runs behind more than one instance, the counters stop being accurate
 * across nodes and a shared store would be needed instead.
 */
@Component
@RequiredArgsConstructor
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final Set<String> LIMITED_PATHS = Set.of(
            "/api/v1/auth/login",
            "/api/v1/auth/register",
            "/api/v1/auth/forgot-password",
            "/api/v1/auth/reset-password"
    );

    private final ObjectMapper objectMapper;

    @Value("${app.rate-limit.max-requests:10}")
    private int maxRequests;

    @Value("${app.rate-limit.window-seconds:300}")
    private long windowSeconds;

    // Keyed by "ip|path" so a burst on /login doesn't also block /register
    // from the same visitor, and vice versa.
    private final ConcurrentHashMap<String, Deque<Long>> requestLog = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        if (!LIMITED_PATHS.contains(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        String key = clientIp(request) + "|" + path;
        long now = System.currentTimeMillis();
        long windowStart = now - windowSeconds * 1000;

        Deque<Long> timestamps = requestLog.computeIfAbsent(key, ignored -> new ConcurrentLinkedDeque<>());
        boolean limited;
        synchronized (timestamps) {
            while (!timestamps.isEmpty() && timestamps.peekFirst() < windowStart) {
                timestamps.pollFirst();
            }
            limited = timestamps.size() >= maxRequests;
            if (!limited) {
                timestamps.addLast(now);
            }
            if (timestamps.isEmpty()) {
                requestLog.remove(key, timestamps);
            }
        }

        if (limited) {
            respondTooManyRequests(request, response);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void respondTooManyRequests(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        ApiError body = ApiError.of(HttpStatus.TOO_MANY_REQUESTS,
                "Too many attempts. Please wait a few minutes and try again.",
                request.getRequestURI());
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }

    /** Render (and most PaaS hosts) sit behind a proxy, so the real client IP is in this header, not getRemoteAddr(). */
    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
