package com.nestxchange.service;

import com.nestxchange.dto.request.PropertyCreateRequest;
import com.nestxchange.dto.request.PropertyUpdateRequest;
import com.nestxchange.dto.response.PropertyResponse;
import com.nestxchange.entity.Property;
import com.nestxchange.entity.Role;
import com.nestxchange.entity.User;
import com.nestxchange.exception.UnauthorizedAccessException;
import com.nestxchange.mapper.PropertyMapper;
import com.nestxchange.mapper.UserMapper;
import com.nestxchange.repository.FavoriteRepository;
import com.nestxchange.repository.PropertyRepository;
import com.nestxchange.repository.UserRepository;
import com.nestxchange.service.impl.PropertyServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link PropertyServiceImpl}.
 *
 * <p>The previous version of this class could not pass: it injected a mocked
 * {@code PropertyMapper} that the implementation never consulted (it mapped
 * responses with a private method) and it omitted the required
 * {@code FavoriteRepository} collaborator entirely.
 */
@ExtendWith(MockitoExtension.class)
class PropertyServiceImplTest {

    @Mock
    private PropertyRepository propertyRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private FavoriteRepository favoriteRepository;

    @Mock
    private CloudinaryService cloudinaryService;

    private PropertyServiceImpl propertyService;

    private User owner;
    private User otherUser;

    @BeforeEach
    void setUp() {
        // The real mapper, not a mock: response shape is part of the contract
        // these tests exist to protect.
        PropertyMapper propertyMapper = new PropertyMapper(new UserMapper());
        propertyService = new PropertyServiceImpl(
                propertyRepository, userRepository, favoriteRepository, cloudinaryService, propertyMapper);

        owner = User.builder().id(1L).name("Asha Menon").email("asha@example.com").role(Role.OWNER).build();
        otherUser = User.builder().id(2L).name("Rahul Iyer").email("rahul@example.com").role(Role.TENANT).build();
    }

    @Nested
    @DisplayName("createProperty")
    class CreateProperty {

        @Test
        @DisplayName("persists the listing and returns it with amenities and negotiable intact")
        void persistsListingWithAllFields() {
            PropertyCreateRequest request = validCreateRequest();
            request.setAmenities(new ArrayList<>(List.of("Gym", " gym ", "Lift")));
            request.setNegotiable(true);

            when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
            when(propertyRepository.save(any(Property.class))).thenAnswer(call -> call.getArgument(0));

            PropertyResponse response = propertyService.createProperty(request, null, 1L);

            // Regression guard: amenities and negotiable were absent from the
            // response DTO, so the UI could never render them.
            assertThat(response.getAmenities()).containsExactly("Gym", "Lift");
            assertThat(response.isNegotiable()).isTrue();
            assertThat(response.getRentAmount()).isEqualByComparingTo("25000");
        }

        @Test
        @DisplayName("normalises city, locality and phone number before storing")
        void normalisesUserSuppliedText() {
            PropertyCreateRequest request = validCreateRequest();
            request.setCity("  bengaluru  ");
            request.setLocality("koramangala");
            request.setContactNumber("+919876543210");

            when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
            when(propertyRepository.save(any(Property.class))).thenAnswer(call -> call.getArgument(0));

            propertyService.createProperty(request, null, 1L);

            ArgumentCaptor<Property> saved = ArgumentCaptor.forClass(Property.class);
            verify(propertyRepository).save(saved.capture());

            assertThat(saved.getValue().getCity()).isEqualTo("Bengaluru");
            assertThat(saved.getValue().getLocality()).isEqualTo("Koramangala");
            assertThat(saved.getValue().getContactNumber()).isEqualTo("9876543210");
        }

        @Test
        @DisplayName("never trusts a client-supplied verified flag")
        void newListingsStartUnverified() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
            when(propertyRepository.save(any(Property.class))).thenAnswer(call -> call.getArgument(0));

            PropertyResponse response = propertyService.createProperty(validCreateRequest(), null, 1L);

            assertThat(response.isVerified()).isFalse();
        }
    }

    @Nested
    @DisplayName("updateProperty")
    class UpdateProperty {

        @Test
        @DisplayName("rejects an edit from someone who does not own the listing")
        void rejectsEditByNonOwner() {
            Property listing = existingListing();
            when(propertyRepository.findByIdWithOwner(100L)).thenReturn(Optional.of(listing));
            when(userRepository.findById(2L)).thenReturn(Optional.of(otherUser));

            assertThatThrownBy(() -> propertyService.updateProperty(100L, validUpdateRequest(), 2L))
                    .isInstanceOf(UnauthorizedAccessException.class);

            verify(propertyRepository, never()).save(any(Property.class));
        }

        @Test
        @DisplayName("allows the owner to edit and to mark the listing rented")
        void ownerCanEditAndMarkRented() {
            Property listing = existingListing();
            PropertyUpdateRequest request = validUpdateRequest();
            request.setStatus(PropertyUpdateRequest.OwnerStatus.RENTED);

            when(propertyRepository.findByIdWithOwner(100L)).thenReturn(Optional.of(listing));
            when(propertyRepository.save(any(Property.class))).thenAnswer(call -> call.getArgument(0));

            PropertyResponse response = propertyService.updateProperty(100L, request, 1L);

            assertThat(response.getStatus()).isEqualTo("RENTED");
            assertThat(response.getTitle()).isEqualTo(request.getTitle());
        }
    }

    @Nested
    @DisplayName("getPropertyById")
    class GetPropertyById {

        @Test
        @DisplayName("withholds the owner's email from an anonymous visitor")
        void hidesOwnerEmailFromAnonymousCallers() {
            when(propertyRepository.findByIdWithOwner(100L)).thenReturn(Optional.of(existingListing()));

            PropertyResponse response = propertyService.getPropertyById(100L, null);

            assertThat(response.getOwner().getName()).isEqualTo("Asha Menon");
            assertThat(response.getOwner().getEmail()).isNull();
        }

        @Test
        @DisplayName("includes the owner's email when the owner is the one asking")
        void showsOwnerEmailToOwner() {
            when(propertyRepository.findByIdWithOwner(100L)).thenReturn(Optional.of(existingListing()));

            PropertyResponse response = propertyService.getPropertyById(100L, 1L);

            assertThat(response.getOwner().getEmail()).isEqualTo("asha@example.com");
        }
    }

    // ------------------------------------------------------------------
    // fixtures
    // ------------------------------------------------------------------

    private PropertyCreateRequest validCreateRequest() {
        PropertyCreateRequest request = new PropertyCreateRequest();
        request.setTitle("Bright 3 BHK apartment near the park");
        request.setDescription("A spacious, well-lit apartment with covered parking and a balcony.");
        request.setRentAmount(new BigDecimal("25000"));
        request.setDepositAmount(new BigDecimal("50000"));
        request.setSquareFootage(1200);
        request.setCity("Bengaluru");
        request.setLocality("Whitefield");
        request.setType(Property.PropertyType.APARTMENT);
        request.setFurnishingStatus(Property.FurnishingStatus.FULLY_FURNISHED);
        request.setRooms(3);
        request.setContactNumber("9876543210");
        request.setAvailableFrom(LocalDate.now().plusDays(7));
        return request;
    }

    private PropertyUpdateRequest validUpdateRequest() {
        PropertyUpdateRequest request = new PropertyUpdateRequest();
        request.setTitle("Bright 3 BHK apartment, newly painted");
        request.setDescription("A spacious, well-lit apartment with covered parking and a balcony.");
        request.setRentAmount(new BigDecimal("24000"));
        request.setDepositAmount(new BigDecimal("48000"));
        request.setSquareFootage(1200);
        request.setCity("Bengaluru");
        request.setLocality("Whitefield");
        request.setType(Property.PropertyType.APARTMENT);
        request.setFurnishingStatus(Property.FurnishingStatus.FULLY_FURNISHED);
        request.setRooms(3);
        request.setContactNumber("9876543210");
        request.setAvailableFrom(LocalDate.now().plusDays(7));
        return request;
    }

    private Property existingListing() {
        return Property.builder()
                .id(100L)
                .title("Bright 3 BHK apartment near the park")
                .description("A spacious, well-lit apartment.")
                .rentAmount(new BigDecimal("25000"))
                .depositAmount(new BigDecimal("50000"))
                .squareFootage(1200)
                .city("Bengaluru")
                .locality("Whitefield")
                .type(Property.PropertyType.APARTMENT)
                .furnishingStatus(Property.FurnishingStatus.FULLY_FURNISHED)
                .tenantPreference(Property.TenantPreference.ANY)
                .status(Property.PropertyStatus.AVAILABLE)
                .rooms(3)
                .contactNumber("9876543210")
                .availableFrom(LocalDate.now())
                .owner(owner)
                .images(new ArrayList<>())
                .amenities(new ArrayList<>(List.of("Lift")))
                .build();
    }
}
