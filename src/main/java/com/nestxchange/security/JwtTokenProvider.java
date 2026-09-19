package com.nestxchange.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Date;

/**
 * Issues and validates the HS512 JWTs used for stateless authentication.
 *
 * <p>The signing key is resolved once at startup rather than rebuilt on every
 * request, and the application refuses to boot with a key too weak for HS512 or
 * with the well-known development placeholder outside the {@code dev} profile.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtTokenProvider {

    /** HS512 requires at least 512 bits (64 bytes) of key material. */
    private static final int MIN_KEY_BYTES = 64;

    private static final String ISSUER = "nestxchange";
    private static final String DEV_PLACEHOLDER_MARKER = "dev-only-insecure-key";

    private final Environment environment;

    @Value("${app.jwt.secret:}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-milliseconds:86400000}")
    private long jwtExpirationInMs;

    private SecretKey signingKey;

    @PostConstruct
    void initialiseSigningKey() {
        if (!StringUtils.hasText(jwtSecret)) {
            throw new IllegalStateException(
                    "app.jwt.secret is not configured. Set the JWT_SECRET environment variable "
                            + "to at least 64 bytes of random data (openssl rand -base64 96).");
        }

        boolean devProfile = environment.matchesProfiles("dev");
        if (!devProfile && jwtSecret.contains(DEV_PLACEHOLDER_MARKER)) {
            throw new IllegalStateException(
                    "The development JWT placeholder cannot be used outside the dev profile. "
                            + "Set a real JWT_SECRET before starting this application.");
        }

        byte[] keyBytes = decodeSecret(jwtSecret);
        if (keyBytes.length < MIN_KEY_BYTES) {
            throw new IllegalStateException(String.format(
                    "app.jwt.secret provides only %d bytes of key material but HS512 requires %d. "
                            + "Generate a stronger secret with: openssl rand -base64 96",
                    keyBytes.length, MIN_KEY_BYTES));
        }

        this.signingKey = Keys.hmacShaKeyFor(keyBytes);

        if (devProfile && jwtSecret.contains(DEV_PLACEHOLDER_MARKER)) {
            log.warn("Using the built-in development JWT secret. Tokens signed with it are NOT secure.");
        }
    }

    /**
     * Accepts either a Base64-encoded secret or raw text, so an operator can paste
     * the output of {@code openssl rand -base64 96} straight into the environment.
     */
    private byte[] decodeSecret(String secret) {
        try {
            return Base64.getDecoder().decode(secret);
        } catch (IllegalArgumentException notBase64) {
            return secret.getBytes(StandardCharsets.UTF_8);
        }
    }

    public String generateToken(Authentication authentication) {
        return generateToken((UserPrincipal) authentication.getPrincipal());
    }

    public String generateToken(UserPrincipal userPrincipal) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationInMs);

        return Jwts.builder()
                .subject(Long.toString(userPrincipal.getId()))
                .issuer(ISSUER)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(signingKey, Jwts.SIG.HS512)
                .compact();
    }

    public long getExpirationInMs() {
        return jwtExpirationInMs;
    }

    public Long getUserIdFromJWT(String token) {
        return Long.parseLong(parse(token).getSubject());
    }

    public boolean validateToken(String authToken) {
        try {
            parse(authToken);
            return true;
        } catch (SignatureException | MalformedJwtException ex) {
            log.debug("Rejected JWT with an invalid signature or malformed structure");
        } catch (ExpiredJwtException ex) {
            log.debug("Rejected expired JWT");
        } catch (UnsupportedJwtException ex) {
            log.debug("Rejected unsupported JWT");
        } catch (JwtException | IllegalArgumentException ex) {
            log.debug("Rejected JWT: {}", ex.getClass().getSimpleName());
        }
        return false;
    }

    private Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .requireIssuer(ISSUER)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
