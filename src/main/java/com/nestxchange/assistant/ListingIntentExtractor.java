package com.nestxchange.assistant;

import com.nestxchange.entity.ListingCategory;
import com.nestxchange.entity.ListingMode;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * The "R" in RAG: turns a free-text message into structured filters the
 * *real* unified search engine (ListingSearchService) can run - no vector
 * store, no embeddings, just deterministic keyword/regex extraction. This is
 * intentionally simple and testable rather than delegating extraction to the
 * LLM itself (which would mean an API call - and therefore cost - before we
 * even know whether the message needs a search at all).
 */
@Component
public class ListingIntentExtractor {

    private static final List<String> VEHICLE_WORDS =
            List.of("vehicle", "car", "cars", "bike", "bikes", "scooter", "suv", "sedan", "motorcycle");
    private static final List<String> PROPERTY_WORDS = List.of(
            "property", "properties", "home", "homes", "house", "houses", "apartment", "apartments",
            "flat", "flats", "villa", "villas", "room", "rooms", "pg");

    private static final List<String> RENT_WORDS = List.of("rent", "rental", "renting");
    private static final List<String> BUY_WORDS = List.of("buy", "buying", "purchase", "sale", "sell", "selling");

    private static final List<String> MAX_TRIGGERS = List.of("under", "below", "within", "up to", "max", "budget of");
    private static final List<String> MIN_TRIGGERS = List.of("above", "over", "starting from", "min");

    /** en-IN's short-scale-free number words - "20k", "45 lakh", "1.2 cr". */
    private static final Pattern AMOUNT_PATTERN =
            Pattern.compile("(\\d+(?:[.,]\\d+)?)\\s*(k|lakh|lakhs|l|cr|crore|crores)?", Pattern.CASE_INSENSITIVE);

    /** Kept in sync with the frontend's CITY_COORDINATES list - not exhaustive, just the common ones. */
    private static final Set<String> KNOWN_LOCATIONS = Set.of(
            "bengaluru", "bangalore", "mumbai", "pune", "delhi", "hyderabad",
            "chennai", "kolkata", "ahmedabad", "gurgaon", "noida");

    public ListingIntent extract(String message) {
        String lower = message.toLowerCase(Locale.ROOT);

        ListingCategory category = null;
        if (containsAny(lower, VEHICLE_WORDS)) {
            category = ListingCategory.VEHICLE;
        } else if (containsAny(lower, PROPERTY_WORDS)) {
            category = ListingCategory.PROPERTY;
        }

        // "Buy" is expressed to the search engine as mode=SELL - that's what a
        // seller's listing is actually posted as. See the frontend's
        // toBrowseModeValue for the same convention.
        ListingMode mode = null;
        if (containsAny(lower, RENT_WORDS)) {
            mode = ListingMode.RENT;
        } else if (containsAny(lower, BUY_WORDS)) {
            mode = ListingMode.SELL;
        }

        BigDecimal priceMax = extractAmountAfter(lower, MAX_TRIGGERS);
        BigDecimal priceMin = extractAmountAfter(lower, MIN_TRIGGERS);

        String location = KNOWN_LOCATIONS.stream()
                .filter(lower::contains)
                .findFirst()
                .map(ListingIntentExtractor::normaliseLocation)
                .orElse(null);

        return new ListingIntent(category, mode, priceMin, priceMax, location);
    }

    private boolean containsAny(String haystack, List<String> needles) {
        return needles.stream().anyMatch(needle -> containsWord(haystack, needle));
    }

    private boolean containsWord(String haystack, String needle) {
        // A plain String.contains would match "carpet" for "car" - require a
        // word boundary on both sides (needle may itself contain a space,
        // e.g. "budget of", so \b before/after still works correctly).
        return Pattern.compile("\\b" + Pattern.quote(needle) + "\\b").matcher(haystack).find();
    }

    private BigDecimal extractAmountAfter(String lower, List<String> triggers) {
        for (String trigger : triggers) {
            int index = lower.indexOf(trigger);
            if (index < 0) {
                continue;
            }
            Matcher matcher = AMOUNT_PATTERN.matcher(lower.substring(index + trigger.length()));
            if (matcher.find()) {
                return toAmount(matcher.group(1), matcher.group(2));
            }
        }
        return null;
    }

    private BigDecimal toAmount(String number, String unit) {
        BigDecimal amount = new BigDecimal(number.replace(",", ""));
        if (unit == null) {
            return amount;
        }
        return switch (unit.toLowerCase(Locale.ROOT)) {
            case "k" -> amount.multiply(BigDecimal.valueOf(1_000));
            case "l", "lakh", "lakhs" -> amount.multiply(BigDecimal.valueOf(100_000));
            case "cr", "crore", "crores" -> amount.multiply(BigDecimal.valueOf(10_000_000));
            default -> amount;
        };
    }

    private static String normaliseLocation(String matched) {
        return "bangalore".equals(matched) ? "Bengaluru" : capitalise(matched);
    }

    private static String capitalise(String value) {
        return value.substring(0, 1).toUpperCase(Locale.ROOT) + value.substring(1);
    }
}
