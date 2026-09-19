package com.nestxchange.dto.response;

import com.nestxchange.entity.ListingCategory;
import com.nestxchange.schema.AttributeType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CategorySchemaResponse {

    private ListingCategory category;
    private List<Field> fields;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Field {
        private String key;
        private String label;
        private AttributeType type;
        private boolean required;
        private boolean filterable;
        private boolean rangeFilterable;
    }
}
