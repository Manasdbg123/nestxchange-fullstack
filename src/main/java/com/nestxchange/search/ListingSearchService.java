package com.nestxchange.search;

import com.nestxchange.dto.request.ListingSearchRequest;
import com.nestxchange.dto.response.ListingImageResponse;
import com.nestxchange.dto.response.ListingResponse;
import com.nestxchange.dto.response.PaginatedResponse;
import com.nestxchange.entity.Listing;
import com.nestxchange.entity.ListingImage;
import com.nestxchange.mapper.ListingMapper;
import com.nestxchange.repository.ListingImageRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * The one search path for every listing, whatever its category. See
 * {@link ListingQueryBuilder} for why this doesn't (and shouldn't) have a
 * per-category twin.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ListingSearchService {

    private final EntityManager entityManager;
    private final ListingQueryBuilder queryBuilder;
    private final ListingImageRepository listingImageRepository;

    @SuppressWarnings("unchecked")
    public PaginatedResponse<ListingResponse> search(ListingSearchRequest request) {
        ListingQueryBuilder.Built built = queryBuilder.build(request);

        Query dataQuery = entityManager.createNativeQuery(
                "SELECT * FROM listings" + built.whereClause() + " ORDER BY created_at DESC LIMIT ? OFFSET ?",
                Listing.class);
        bindParams(dataQuery, built.params());
        int paramCount = built.params().size();
        dataQuery.setParameter(paramCount + 1, request.size());
        dataQuery.setParameter(paramCount + 2, request.page() * request.size());

        Query countQuery = entityManager.createNativeQuery("SELECT count(*) FROM listings" + built.whereClause());
        bindParams(countQuery, built.params());
        long totalElements = ((Number) countQuery.getSingleResult()).longValue();

        List<Listing> listings = dataQuery.getResultList();
        List<ListingResponse> content = listings.stream().map(ListingMapper::toResponse).toList();
        attachImages(content);

        int totalPages = request.size() == 0 ? 0 : (int) Math.ceil((double) totalElements / request.size());

        return PaginatedResponse.<ListingResponse>builder()
                .content(content)
                .pageNo(request.page())
                .pageSize(request.size())
                .totalElements(totalElements)
                .totalPages(totalPages)
                .last(request.page() + 1 >= totalPages)
                .build();
    }

    private void bindParams(Query query, List<Object> params) {
        for (int i = 0; i < params.size(); i++) {
            query.setParameter(i + 1, params.get(i));
        }
    }

    /** One batched query for the whole page's images, instead of one query per listing. */
    private void attachImages(List<ListingResponse> content) {
        if (content.isEmpty()) {
            return;
        }
        List<Long> ids = content.stream().map(ListingResponse::getId).toList();
        Map<Long, List<ListingImageResponse>> imagesByListing = listingImageRepository
                .findByListingIdInOrderByPositionAsc(ids).stream()
                .collect(Collectors.groupingBy(
                        ListingImage::getListingId,
                        LinkedHashMap::new,
                        Collectors.mapping(ListingMapper::toResponse, Collectors.toList())));

        content.forEach(response -> response.setImages(imagesByListing.getOrDefault(response.getId(), List.of())));
    }
}
