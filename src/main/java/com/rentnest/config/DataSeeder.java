package com.rentnest.config;

import com.rentnest.entity.Property;
import com.rentnest.entity.PropertyImage;
import com.rentnest.entity.Role;
import com.rentnest.entity.User;
import com.rentnest.repository.PropertyRepository;
import com.rentnest.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * Populates a development database with browsable sample listings.
 *
 * <p>Three things changed here. It is now gated on both the {@code dev} profile
 * and {@code app.seed.enabled}, so it cannot run against a production database
 * by accident. The demo account password comes from configuration rather than
 * being hardcoded as {@code password123}. And the random generator is seeded
 * with a fixed value, so every developer and every CI run sees the same
 * catalogue - previously each restart produced different listings, which made
 * screenshots and bug reports impossible to reproduce.
 */
@Slf4j
@Component
@Profile("dev")
@ConditionalOnProperty(prefix = "app.seed", name = "enabled", havingValue = "true")
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private static final long DETERMINISTIC_SEED = 20240517L;
    private static final int TARGET_LISTINGS = 48;

    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.admin-email:admin@rentnest.local}")
    private String seedEmail;

    @Value("${app.seed.admin-password:}")
    private String seedPassword;

    @Override
    public void run(String... args) {
        if (!StringUtils.hasText(seedPassword)) {
            log.warn("Seeding is enabled but app.seed.admin-password is blank. Skipping - "
                    + "set SEED_ADMIN_PASSWORD to create the demo account.");
            return;
        }

        if (propertyRepository.count() >= TARGET_LISTINGS) {
            log.info("Database already holds {} listings; skipping seed.", propertyRepository.count());
            return;
        }

        User demoOwner = findOrCreateDemoOwner();

        Random random = new Random(DETERMINISTIC_SEED);
        List<Property> batch = new ArrayList<>(TARGET_LISTINGS);
        for (int i = 0; i < TARGET_LISTINGS; i++) {
            batch.add(buildListing(random, demoOwner));
        }

        propertyRepository.saveAll(batch);
        log.info("Seeded {} sample listings owned by {}", batch.size(), demoOwner.getEmail());
    }

    private User findOrCreateDemoOwner() {
        return userRepository.findByEmail(seedEmail).orElseGet(() -> {
            User owner = User.builder()
                    .name("RentNest Demo Owner")
                    .email(seedEmail)
                    .password(passwordEncoder.encode(seedPassword))
                    .phone("9876543210")
                    .role(Role.OWNER)
                    .build();
            log.info("Created demo owner account {}", seedEmail);
            return userRepository.save(owner);
        });
    }

    private Property buildListing(Random random, User owner) {
        int cityIndex = random.nextInt(CITIES.length);
        String city = CITIES[cityIndex];
        String locality = LOCALITIES[cityIndex][random.nextInt(LOCALITIES[cityIndex].length)];

        Property.PropertyType type = PROPERTY_TYPES[random.nextInt(PROPERTY_TYPES.length)];
        boolean isCommercial = type == Property.PropertyType.SHOP || type == Property.PropertyType.COMMERCIAL;
        boolean isSingleRoom = type == Property.PropertyType.ROOM || type == Property.PropertyType.PG;

        int rooms = isCommercial ? 0 : (isSingleRoom ? 1 : random.nextInt(4) + 1);

        BigDecimal rent = roundToHundred(
                isCommercial ? 40_000 + random.nextInt(150_000)
                        : isSingleRoom ? 5_000 + random.nextInt(15_000)
                        : 15_000 + random.nextInt(85_000));

        // One listing in six is priced well below its band, so the "great value"
        // treatment on the listings page has something to highlight.
        if (random.nextInt(6) == 0) {
            rent = roundToHundred(rent.multiply(new BigDecimal("0.6")).intValue());
        }

        BigDecimal deposit = roundToHundred(rent.multiply(BigDecimal.valueOf(random.nextInt(3) + 2)).intValue());
        int squareFootage = (rooms == 0 ? 1 : rooms) * (350 + random.nextInt(250));

        String title = buildTitle(type, rooms, locality, isCommercial, isSingleRoom);

        Property property = Property.builder()
                .title(title)
                .description(buildDescription(type, locality, city))
                .rentAmount(rent)
                .depositAmount(deposit)
                .squareFootage(squareFootage)
                .city(city)
                .locality(locality)
                .type(type)
                .furnishingStatus(FURNISHINGS[random.nextInt(FURNISHINGS.length)])
                .rooms(rooms)
                .status(Property.PropertyStatus.AVAILABLE)
                .isVerified(random.nextInt(10) < 6)
                .contactNumber("9876543210")
                .availableFrom(LocalDate.now().plusDays(random.nextInt(30)))
                .tenantPreference(TENANT_PREFERENCES[random.nextInt(TENANT_PREFERENCES.length)])
                .amenities(pickAmenities(random))
                .negotiable(random.nextBoolean())
                .owner(owner)
                .build();

        String[] imagePool = isCommercial ? SHOP_IMAGES : isSingleRoom ? ROOM_IMAGES : APARTMENT_IMAGES;
        int imageCount = 1 + random.nextInt(imagePool.length);
        for (int i = 0; i < imageCount; i++) {
            property.getImages().add(PropertyImage.builder()
                    .property(property)
                    .imageUrl(imagePool[i % imagePool.length])
                    .isPrimary(i == 0)
                    .build());
        }

        return property;
    }

    private String buildTitle(Property.PropertyType type, int rooms, String locality,
                              boolean isCommercial, boolean isSingleRoom) {
        if (isCommercial) {
            return "Prime " + friendly(type) + " space on rent in " + locality;
        }
        if (isSingleRoom) {
            return "Well-kept " + friendly(type) + " with all amenities in " + locality;
        }
        return rooms + " BHK " + friendly(type) + " for rent in " + locality;
    }

    private String buildDescription(Property.PropertyType type, String locality, String city) {
        return "A well-maintained " + friendly(type).toLowerCase() + " in " + locality + ", " + city
                + ". Close to schools, supermarkets and public transport, with a responsive owner "
                + "and no brokerage payable. Sample listing generated for local development.";
    }

    private String friendly(Property.PropertyType type) {
        String name = type.name().toLowerCase().replace('_', ' ');
        return Character.toUpperCase(name.charAt(0)) + name.substring(1);
    }

    private List<String> pickAmenities(Random random) {
        List<String> pool = new ArrayList<>(List.of(AMENITY_POOL));
        List<String> chosen = new ArrayList<>();
        int count = 3 + random.nextInt(5);
        for (int i = 0; i < count && !pool.isEmpty(); i++) {
            chosen.add(pool.remove(random.nextInt(pool.size())));
        }
        return chosen;
    }

    /** Keeps seeded rents compatible with the multiple-of-100 rule the API enforces. */
    private BigDecimal roundToHundred(int amount) {
        return BigDecimal.valueOf(amount)
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
    }

    private static final String[] CITIES = {"Bengaluru", "Mumbai", "Pune", "Delhi", "Hyderabad"};

    private static final String[][] LOCALITIES = {
            {"Koramangala", "Indiranagar", "HSR Layout", "Whitefield", "Marathahalli", "Jayanagar"},
            {"Andheri West", "Bandra", "Juhu", "Powai", "Worli", "Chembur"},
            {"Koregaon Park", "Viman Nagar", "Kalyani Nagar", "Hinjewadi", "Baner"},
            {"Hauz Khas", "Vasant Kunj", "Lajpat Nagar", "Saket", "Karol Bagh"},
            {"Banjara Hills", "Jubilee Hills", "HITEC City", "Gachibowli", "Kondapur"}
    };

    private static final Property.PropertyType[] PROPERTY_TYPES = Property.PropertyType.values();
    private static final Property.FurnishingStatus[] FURNISHINGS = Property.FurnishingStatus.values();
    private static final Property.TenantPreference[] TENANT_PREFERENCES = Property.TenantPreference.values();

    private static final String[] AMENITY_POOL = {
            "Gym", "Swimming Pool", "Lift", "Power Backup", "Gated Security", "Club House",
            "Children's Play Area", "Reserved Parking", "Visitor Parking", "Intercom", "Piped Gas", "Wi-Fi"
    };

    // Every URL below is checked to resolve. Three of the originals had rotted
    // to 404s upstream, which left blank grey boxes on the listings page.
    private static final String[] APARTMENT_IMAGES = {
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80"
    };

    private static final String[] SHOP_IMAGES = {
            "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1555529733-0e670560f7e1?auto=format&fit=crop&w=1200&q=80"
    };

    private static final String[] ROOM_IMAGES = {
            "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80"
    };
}
