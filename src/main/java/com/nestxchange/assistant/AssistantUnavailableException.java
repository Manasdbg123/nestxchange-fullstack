package com.nestxchange.assistant;

/**
 * Never allowed to reach a client as an HTTP error - {@link AssistantService}
 * always catches this and degrades to a plain-text apology (plus whatever
 * listings retrieval already found), so a Groq outage or a missing API key
 * still produces a normal 200 chat response rather than a broken UI.
 */
public class AssistantUnavailableException extends RuntimeException {

    public AssistantUnavailableException(String message) {
        super(message);
    }

    public AssistantUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
