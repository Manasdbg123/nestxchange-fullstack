package com.nestxchange.assistant;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * Talks to Groq's chat-completions endpoint, which is OpenAI-compatible -
 * this is the only class that knows that URL shape, so swapping to OpenAI
 * itself (or any other OpenAI-compatible provider) later is a config change,
 * not a rewrite. Uses the JDK's own HttpClient rather than pulling in a
 * vendor SDK for what is, at bottom, one POST request.
 */
@Component
@Slf4j
public class GroqChatClient implements LlmChatClient {

    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(20);

    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(REQUEST_TIMEOUT).build();
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String baseUrl;
    private final String model;

    public GroqChatClient(
            ObjectMapper objectMapper,
            @Value("${app.assistant.api-key:}") String apiKey,
            @Value("${app.assistant.base-url}") String baseUrl,
            @Value("${app.assistant.model}") String model) {
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.model = model;
    }

    @Override
    public String chat(List<ChatMessage> messages) {
        if (!StringUtils.hasText(apiKey)) {
            throw new AssistantUnavailableException("No assistant API key is configured");
        }

        try {
            Map<String, Object> requestBody = Map.of(
                    "model", model,
                    "messages", messages.stream()
                            .map(m -> Map.of("role", m.role(), "content", m.content()))
                            .toList(),
                    "temperature", 0.3,
                    "max_tokens", 500);

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/chat/completions"))
                    .timeout(REQUEST_TIMEOUT)
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(requestBody)))
                    .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() / 100 != 2) {
                log.warn("Assistant LLM call failed: HTTP {} - {}", response.statusCode(), truncate(response.body()));
                throw new AssistantUnavailableException("The assistant service returned an error");
            }

            JsonNode root = objectMapper.readTree(response.body());
            String content = root.at("/choices/0/message/content").asText(null);
            if (content == null) {
                throw new AssistantUnavailableException("The assistant returned an unexpected response shape");
            }
            return content;
        } catch (IOException ex) {
            throw new AssistantUnavailableException("Could not reach the assistant service", ex);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new AssistantUnavailableException("The assistant request was interrupted", ex);
        }
    }

    private String truncate(String value) {
        return value == null ? "" : value.substring(0, Math.min(500, value.length()));
    }
}
