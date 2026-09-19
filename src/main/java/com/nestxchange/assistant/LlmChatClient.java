package com.nestxchange.assistant;

import java.util.List;

/** Abstraction over whichever OpenAI-compatible chat API is configured, so AssistantService never depends on Groq specifically. */
public interface LlmChatClient {

    /** @throws AssistantUnavailableException if the call couldn't be completed (no key configured, network failure, non-2xx response) */
    String chat(List<ChatMessage> messages);
}
