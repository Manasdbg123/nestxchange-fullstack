package com.nestxchange.repository.specification;

import com.nestxchange.dto.request.PropertySearchCriteria;
import com.nestxchange.entity.Property;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Builds the listings query from {@link PropertySearchCriteria}.
 *
 * <p>The previous single JPQL string relied on {@code :param IS NULL OR ...} for
 * every filter, which cannot express "match any of these types" and forced an
 * exact, case-sensitive city comparison - searching "bengaluru" returned
 * nothing. Criteria predicates compose cleanly and only the clauses the caller
 * actually asked for reach the database.
 */
public final class PropertySpecifications {

    /** A bedroom filter value at or above this means "this many or more". */
    private static final int OPEN_ENDED_BEDROOMS = 5;

    private PropertySpecifications() {
    }

    public static Specification<Property> matching(PropertySearchCriteria criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Only listings an owner has actually published are browsable. The old
            // query filtered on nothing, so rented and deactivated listings kept
            // appearing in a method named "searchAvailableProperties".
            predicates.add(root.get("status").in(
                    Property.PropertyStatus.AVAILABLE, Property.PropertyStatus.ACTIVE));

            if (hasText(criteria.getKeyword())) {
                String pattern = likePattern(criteria.getKeyword());
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), pattern),
                        cb.like(cb.lower(root.get("locality")), pattern),
                        cb.like(cb.lower(root.get("city")), pattern)));
            }

            if (hasText(criteria.getCity())) {
                predicates.add(cb.equal(cb.lower(root.get("city")), criteria.getCity().trim().toLowerCase(Locale.ROOT)));
            }

            if (hasText(criteria.getLocality())) {
                predicates.add(cb.like(cb.lower(root.get("locality")), likePattern(criteria.getLocality())));
            }

            if (criteria.getMinRent() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("rentAmount"), criteria.getMinRent()));
            }

            if (criteria.getMaxRent() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("rentAmount"), criteria.getMaxRent()));
            }

            if (isNotEmpty(criteria.getTypes())) {
                predicates.add(root.get("type").in(criteria.getTypes()));
            }

            if (isNotEmpty(criteria.getBedrooms())) {
                predicates.add(bedroomPredicate(root, cb, criteria.getBedrooms()));
            }

            if (criteria.getFurnishing() != null) {
                predicates.add(cb.equal(root.get("furnishingStatus"), criteria.getFurnishing()));
            }

            if (criteria.getTenantPreference() != null) {
                // A listing open to ANY tenant also satisfies a specific preference.
                predicates.add(cb.or(
                        cb.equal(root.get("tenantPreference"), criteria.getTenantPreference()),
                        cb.equal(root.get("tenantPreference"), Property.TenantPreference.ANY)));
            }

            if (Boolean.TRUE.equals(criteria.getVerifiedOnly())) {
                predicates.add(cb.isTrue(root.get("isVerified")));
            }

            if (Boolean.TRUE.equals(criteria.getNegotiableOnly())) {
                predicates.add(cb.isTrue(root.get("negotiable")));
            }

            if (criteria.getAvailableBy() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("availableFrom"), criteria.getAvailableBy()));
            }

            if (criteria.getOwnerId() != null) {
                predicates.add(cb.equal(root.get("owner").get("id"), criteria.getOwnerId()));
            }

            // Spring Data issues a separate count query for the page total; joining
            // fetches into it is invalid, hence the guard.
            if (query != null && Long.class != query.getResultType()) {
                query.distinct(true);
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private static Predicate bedroomPredicate(jakarta.persistence.criteria.Root<Property> root,
                                              jakarta.persistence.criteria.CriteriaBuilder cb,
                                              List<Integer> bedrooms) {
        List<Predicate> options = new ArrayList<>();
        for (Integer bedroomCount : bedrooms) {
            if (bedroomCount == null) {
                continue;
            }
            if (bedroomCount >= OPEN_ENDED_BEDROOMS) {
                options.add(cb.greaterThanOrEqualTo(root.get("rooms"), OPEN_ENDED_BEDROOMS));
            } else {
                options.add(cb.equal(root.get("rooms"), bedroomCount));
            }
        }
        return options.isEmpty() ? cb.conjunction() : cb.or(options.toArray(new Predicate[0]));
    }

    private static String likePattern(String raw) {
        // Escape the SQL wildcards a user can type so a search for "50%" does not
        // silently become a match-everything pattern.
        String escaped = raw.trim().toLowerCase(Locale.ROOT)
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
        return "%" + escaped + "%";
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private static boolean isNotEmpty(List<?> values) {
        return values != null && !values.isEmpty();
    }
}
