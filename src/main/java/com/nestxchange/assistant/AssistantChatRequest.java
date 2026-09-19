package com.nestxchange.assistant;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * `history` is prior turns of the same conversation, supplied by the client -
 * this service is stateless and doesn't persist chat history server-side.
 * Capped at 20 turns so a client can't make every request unboundedly larger
 * (and unboundedly more expensive) by replaying an ever-growing transcript.
 */
public record AssistantChatRequest(
        @NotBlank(message = "Please enter a message")
        @Size(max = 1000, message = "Message must be 1000 characters or fewer")
        String message,

        @Size(max = 20, message = "Conversation history is too long")
        List<ChatMessage> history
) {
    public AssistantChatRequest {
        history = history == null ? List.of() : List.copyOf(history);
    }
}
