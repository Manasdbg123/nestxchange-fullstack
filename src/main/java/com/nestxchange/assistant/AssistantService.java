package com.nestxchange.assistant;

import com.nestxchange.dto.request.ListingSearchRequest;
import com.nestxchange.dto.response.ListingResponse;
import com.nestxchange.search.ListingSearchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Orchestrates the whole RAG loop for one message:
 *
 * <pre>
 * message -&gt; ListingIntentExtractor (retrieval query)
 *         -&gt; ListingSearchService (the *real* unified search engine - retrieval)
 *         -&gt; system prompt grounded in those results
 *         -&gt; LlmChatClient (generation)
 * </pre>
 *
 * The listings returned alongside the reply come straight from retrieval,
 * not from parsing the model's prose - so the frontend always has real,
 * clickable results even if the model's wording is vague, and a generation
 * failure (see the catch below) still leaves the retrieval half useful.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AssistantService {

    private static final int MAX_RETRIEVED_LISTINGS = 5;

    private static final String SYSTEM_PROMPT = """
            You are the NestXchange assistant, embedded in a marketplace where people rent, buy or \
            sell property and vehicles. Be concise (2-4 sentences unless asked for more) and friendly.

            If listings are provided below, ground your answer in them specifically - reference them \
            by title, price and location, and don't invent listings that aren't listed. If none are \
            provided, you can still explain how the platform works: browsing lives at /properties and \
            /vehicles, visitors can save favorites and send an inquiry message to an owner, and renting \
            or buying something goes through a request the owner confirms. Never claim a listing is \
            currently available if it isn't in the provided context - say you don't have that \
            information instead.""";

    private final ListingIntentExtractor intentExtractor;
    private final ListingSearchService listingSearchService;
    private final LlmChatClient llmChatClient;

    public AssistantChatResponse chat(AssistantChatRequest request) {
        ListingIntent intent = intentExtractor.extract(request.message());
        List<ListingResponse> retrieved = retrieve(intent);

        List<ChatMessage> conversation = new ArrayList<>();
        conversation.add(ChatMessage.system(buildSystemPrompt(retrieved)));
        conversation.addAll(request.history());
        conversation.add(ChatMessage.user(request.message()));

        String reply;
        try {
            reply = llmChatClient.chat(conversation);
        } catch (AssistantUnavailableException ex) {
            log.warn("Falling back to a templated reply: {}", ex.getMessage());
            reply = fallbackReply(retrieved);
        }

        return AssistantChatResponse.builder()
                .reply(reply)
                .listings(retrieved)
                .build();
    }

    private List<ListingResponse> retrieve(ListingIntent intent) {
        if (intent.isEmpty()) {
            return List.of();
        }

        ListingSearchRequest searchRequest = ListingSearchRequest.builder()
                .category(intent.category())
                .mode(intent.mode())
                .priceMin(intent.priceMin())
                .priceMax(intent.priceMax())
                .location(intent.location())
                .page(0)
                .size(MAX_RETRIEVED_LISTINGS)
                .build();

        return listingSearchService.search(searchRequest).getContent();
    }

    private String buildSystemPrompt(List<ListingResponse> retrieved) {
        if (retrieved.isEmpty()) {
            return SYSTEM_PROMPT;
        }

        String context = retrieved.stream()
                .map(listing -> "- \"%s\" (%s, %s) - %s, in %s".formatted(
                        listing.getTitle(), listing.getCategory(), listing.getMode(),
                        listing.getPrice(), listing.getLocation()))
                .collect(Collectors.joining("\n"));

        return SYSTEM_PROMPT + "\n\nListings currently matching this request:\n" + context;
    }

    private String fallbackReply(List<ListingResponse> retrieved) {
        if (retrieved.isEmpty()) {
            return "Sorry, I'm having trouble responding right now. Please try again shortly.";
        }
        return "I'm having trouble generating a full reply right now, but here's what matched your search:";
    }
}
