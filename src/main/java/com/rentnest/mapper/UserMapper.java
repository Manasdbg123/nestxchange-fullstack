package com.rentnest.mapper;

import com.rentnest.dto.response.PropertyResponse.OwnerSummary;
import com.rentnest.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public OwnerSummary toOwnerSummary(User user) {
        return toOwnerSummary(user, false);
    }

    /**
     * @param includeContact whether to expose the owner's email. Anonymous
     *                       browsing must not, or the public listings endpoint
     *                       becomes a bulk email harvester.
     */
    public OwnerSummary toOwnerSummary(User user, boolean includeContact) {
        if (user == null) {
            return null;
        }

        return OwnerSummary.builder()
                .id(user.getId())
                .name(user.getName())
                .email(includeContact ? user.getEmail() : null)
                .build();
    }
}
