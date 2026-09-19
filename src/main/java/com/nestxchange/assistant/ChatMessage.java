package com.nestxchange.assistant;

/** One turn in a conversation, in the shape every OpenAI-compatible chat API expects. */
public record ChatMessage(String role, String content) {

    public static ChatMessage system(String content) {
        return new ChatMessage("system", content);
    }

    public static ChatMessage user(String content) {
        return new ChatMessage("user", content);
    }
}
