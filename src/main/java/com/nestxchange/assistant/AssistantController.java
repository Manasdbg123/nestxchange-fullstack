package com.nestxchange.assistant;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Requires authentication (falls through to SecurityConfig's default
 * anyRequest().authenticated() - no explicit permitAll here), deliberately:
 * every call may spend LLM API credit, so this isn't opened to anonymous
 * traffic the way listing browsing is.
 */
@RestController
@RequestMapping("/api/v1/assistant")
@RequiredArgsConstructor
@Tag(name = "Assistant", description = "RAG-backed chat assistant grounded in live listing search results")
public class AssistantController {

    private final AssistantService assistantService;

    @PostMapping("/chat")
    @Operation(summary = "Ask the assistant a question; it retrieves matching listings and answers grounded in them")
    public ResponseEntity<AssistantChatResponse> chat(@Valid @RequestBody AssistantChatRequest request) {
        return ResponseEntity.ok(assistantService.chat(request));
    }
}
