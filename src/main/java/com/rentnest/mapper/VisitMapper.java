package com.rentnest.mapper;

import com.rentnest.dto.response.VisitResponse;
import com.rentnest.entity.Property;
import com.rentnest.entity.PropertyImage;
import com.rentnest.entity.User;
import com.rentnest.entity.VisitSchedule;
import org.springframework.stereotype.Component;

@Component
public class VisitMapper {

    /**
     * @param includeVisitor whether to attach the requester's contact details.
     *                       True only when the recipient is the listing's owner.
     */
    public VisitResponse toResponse(VisitSchedule visit, boolean includeVisitor) {
        if (visit == null) {
            return null;
        }

        return VisitResponse.builder()
                .id(visit.getId())
                .visitDate(visit.getVisitDate())
                .status(visit.getStatus() == null ? null : visit.getStatus().name())
                .requestedAt(visit.getCreatedAt())
                .property(toPropertySummary(visit.getProperty()))
                .visitor(includeVisitor ? toVisitorSummary(visit.getUser()) : null)
                .build();
    }

    private VisitResponse.PropertySummary toPropertySummary(Property property) {
        if (property == null) {
            return null;
        }

        return VisitResponse.PropertySummary.builder()
                .id(property.getId())
                .title(property.getTitle())
                .city(property.getCity())
                .locality(property.getLocality())
                .rentAmount(property.getRentAmount())
                .imageUrl(coverImageUrl(property))
                .build();
    }

    private String coverImageUrl(Property property) {
        if (property.getImages() == null || property.getImages().isEmpty()) {
            return null;
        }
        return property.getImages().stream()
                .filter(PropertyImage::isPrimary)
                .findFirst()
                .orElse(property.getImages().get(0))
                .getImageUrl();
    }

    private VisitResponse.VisitorSummary toVisitorSummary(User user) {
        if (user == null) {
            return null;
        }

        return VisitResponse.VisitorSummary.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .build();
    }
}
