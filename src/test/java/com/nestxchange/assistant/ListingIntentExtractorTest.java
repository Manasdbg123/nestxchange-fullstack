package com.nestxchange.assistant;

import com.nestxchange.entity.ListingCategory;
import com.nestxchange.entity.ListingMode;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class ListingIntentExtractorTest {

    private final ListingIntentExtractor extractor = new ListingIntentExtractor();

    @Test
    void extractsCategoryModeAndPriceCeiling() {
        ListingIntent intent = extractor.extract("Looking for a 2 bedroom apartment to rent under 30k in Bengaluru");

        assertThat(intent.category()).isEqualTo(ListingCategory.PROPERTY);
        assertThat(intent.mode()).isEqualTo(ListingMode.RENT);
        assertThat(intent.priceMax()).isEqualByComparingTo("30000");
        assertThat(intent.location()).isEqualTo("Bengaluru");
    }

    @Test
    void buyMapsToSellModeNotBuy() {
        // "Buy" is what a browser types, but a listing is only ever created
        // with mode=SELL - see ListingIntentExtractor's javadoc.
        ListingIntent intent = extractor.extract("I want to buy a car in Mumbai");

        assertThat(intent.category()).isEqualTo(ListingCategory.VEHICLE);
        assertThat(intent.mode()).isEqualTo(ListingMode.SELL);
        assertThat(intent.location()).isEqualTo("Mumbai");
    }

    @Test
    void parsesLakhAndCroreUnits() {
        assertThat(extractor.extract("a flat under 45 lakh").priceMax()).isEqualByComparingTo("4500000");
        assertThat(extractor.extract("a house above 1.2 cr").priceMin()).isEqualByComparingTo("12000000");
    }

    @Test
    void normalisesBangaloreToBengaluru() {
        assertThat(extractor.extract("anything in bangalore").location()).isEqualTo("Bengaluru");
    }

    @Test
    void doesNotMatchPartialWords() {
        // "carpet" must not be read as "car".
        ListingIntent intent = extractor.extract("Does the apartment come with a nice carpet?");
        assertThat(intent.category()).isEqualTo(ListingCategory.PROPERTY);
    }

    @Test
    void genericMessageWithNoSignalsExtractsNothing() {
        ListingIntent intent = extractor.extract("How does this platform work?");
        assertThat(intent.isEmpty()).isTrue();
    }

    @Test
    void priceOnlyMessageIsNotEmpty() {
        ListingIntent intent = extractor.extract("Show me something under 50000");
        assertThat(intent.isEmpty()).isFalse();
        assertThat(intent.priceMax()).isEqualByComparingTo("50000");
    }

    @Test
    void minAndMaxCanBothBeExtracted() {
        ListingIntent intent = extractor.extract("Looking for a car above 200000 and under 500000");
        assertThat(intent.priceMin()).isEqualByComparingTo("200000");
        assertThat(intent.priceMax()).isEqualByComparingTo("500000");
    }
}
