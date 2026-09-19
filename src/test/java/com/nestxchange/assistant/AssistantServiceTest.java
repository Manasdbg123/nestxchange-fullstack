package com.nestxchange.assistant;

import com.nestxchange.dto.response.ListingResponse;
import com.nestxchange.dto.response.PaginatedResponse;
import com.nestxchange.entity.ListingCategory;
import com.nestxchange.search.ListingSearchService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@link LlmChatClient} is mocked throughout - this suite never makes a real
 * network call, so it costs nothing to run regardless of how many times CI
 * executes it.
 */
@ExtendWith(MockitoExtension.class)
class AssistantServiceTest {

    @Mock
    private ListingSearchService listingSearchService;

    @Mock
    private LlmChatClient llmChatClient;

    private AssistantService service;

    @BeforeEach
    void setUp() {
        service = new AssistantService(new ListingIntentExtractor(), listingSearchService, llmChatClient);
    }

    @Test
    void aMessageWithSearchableIntentRetrievesListingsAndGroundsThePrompt() {
        ListingResponse listing = ListingResponse.builder()
                .id(1L).category(ListingCategory.PROPERTY).title("2BHK near tech park")
                .price(new BigDecimal("30000")).location("Bengaluru").build();
        when(listingSearchService.search(any())).thenReturn(
                PaginatedResponse.<ListingResponse>builder().content(List.of(listing)).build());
        when(llmChatClient.chat(any())).thenReturn("Here's a great match!");

        AssistantChatResponse response = service.chat(new AssistantChatRequest("2 bedroom apartment to rent in Bengaluru", null));

        assertThat(response.getListings()).containsExactly(listing);
        assertThat(response.getReply()).isEqualTo("Here's a great match!");

        ArgumentCaptor<List<ChatMessage>> captor = ArgumentCaptor.forClass(List.class);
        verify(llmChatClient).chat(captor.capture());
        assertThat(captor.getValue().get(0).role()).isEqualTo("system");
        assertThat(captor.getValue().get(0).content()).contains("2BHK near tech park");
    }

    @Test
    void aGenericMessageSkipsRetrievalEntirely() {
        when(llmChatClient.chat(any())).thenReturn("You can browse at /properties and /vehicles.");

        AssistantChatResponse response = service.chat(new AssistantChatRequest("How does this platform work?", null));

        assertThat(response.getListings()).isEmpty();
        verify(listingSearchService, org.mockito.Mockito.never()).search(any());
    }

    @Test
    void whenTheLlmFailsItFallsBackToATemplatedReplyRatherThanErroring() {
        ListingResponse listing = ListingResponse.builder()
                .id(1L).category(ListingCategory.VEHICLE).title("Honda Civic")
                .price(new BigDecimal("1400000")).location("Mumbai").build();
        when(listingSearchService.search(any())).thenReturn(
                PaginatedResponse.<ListingResponse>builder().content(List.of(listing)).build());
        when(llmChatClient.chat(any())).thenThrow(new AssistantUnavailableException("boom"));

        AssistantChatResponse response = service.chat(new AssistantChatRequest("car to buy in Mumbai", null));

        assertThat(response.getListings()).containsExactly(listing);
        assertThat(response.getReply()).isNotBlank();
    }

    @Test
    void conversationHistoryIsPassedThroughInOrder() {
        lenient().when(llmChatClient.chat(any())).thenReturn("ok");
        List<ChatMessage> history = List.of(ChatMessage.user("hi"), new ChatMessage("assistant", "hello!"));

        service.chat(new AssistantChatRequest("How does this platform work?", history));

        ArgumentCaptor<List<ChatMessage>> captor = ArgumentCaptor.forClass(List.class);
        verify(llmChatClient).chat(captor.capture());
        List<ChatMessage> sent = captor.getValue();
        // [system, ...history, latest user message]
        assertThat(sent).hasSize(4);
        assertThat(sent.get(1)).isEqualTo(history.get(0));
        assertThat(sent.get(2)).isEqualTo(history.get(1));
        assertThat(sent.get(3).content()).isEqualTo("How does this platform work?");
    }
}
