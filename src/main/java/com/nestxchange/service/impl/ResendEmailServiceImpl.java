package com.nestxchange.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nestxchange.service.EmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import com.nestxchange.config.AsyncConfig;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

/**
 * Sends email through Resend's HTTP API - one POST request, so the JDK's own
 * HttpClient is used rather than pulling in a vendor SDK, the same choice
 * made for Groq's chat-completions call.
 *
 * <p>With no {@code app.email.api-key} configured (local dev, or before the
 * key is set up), this logs the email instead of sending it. That mirrors
 * CloudinaryServiceImpl's local-disk fallback: a missing third-party
 * credential degrades the feature instead of breaking the request that
 * needed it - a password-reset request must still succeed with a 200 even if
 * no email actually goes out, since erroring here reveals whether an email
 * address is registered.
 */
@Service
@Slf4j
public class ResendEmailServiceImpl implements EmailService {

    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(15);

    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(REQUEST_TIMEOUT).build();
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String fromAddress;

    public ResendEmailServiceImpl(
            ObjectMapper objectMapper,
            @Value("${app.email.api-key:}") String apiKey,
            @Value("${app.email.from:NestXchange <onboarding@resend.dev>}") String fromAddress) {
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.fromAddress = fromAddress;
    }

    /**
     * Runs on the mail executor, never on the request thread. Besides not making
     * the user wait on Resend, this keeps "forgot password" equally fast whether or
     * not the account exists - a slower answer for real accounts would reveal
     * which emails are registered.
     */
    @Override
    @Async(AsyncConfig.MAIL_EXECUTOR)
    public void send(String toEmail, String subject, String htmlBody) {
        if (!StringUtils.hasText(apiKey)) {
            log.warn("No RESEND_API_KEY configured - logging email instead of sending. To: {} Subject: {}\n{}",
                    toEmail, subject, htmlBody);
            return;
        }

        try {
            Map<String, Object> requestBody = Map.of(
                    "from", fromAddress,
                    "to", java.util.List.of(toEmail),
                    "subject", subject,
                    "html", htmlBody);

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.resend.com/emails"))
                    .timeout(REQUEST_TIMEOUT)
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(requestBody)))
                    .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() / 100 != 2) {
                log.error("Resend email send failed: HTTP {} - {}", response.statusCode(), truncate(response.body()));
            }
        } catch (java.io.IOException ex) {
            // Never propagate: a failed email must not fail (or leak information
            // through the error of) the request that triggered it.
            log.error("Failed to send email to {}", toEmail, ex);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            log.error("Email send to {} was interrupted", toEmail, ex);
        } catch (RuntimeException ex) {
            log.error("Unexpected failure sending email to {}", toEmail, ex);
        }
    }

    private String truncate(String value) {
        return value == null ? "" : value.substring(0, Math.min(500, value.length()));
    }
}
