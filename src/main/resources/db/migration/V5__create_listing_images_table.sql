-- Photos for the generic Listing engine. Independent of the legacy
-- property_images table (which belongs to the separate Property model).

CREATE TABLE listing_images (
    id          BIGSERIAL PRIMARY KEY,
    listing_id  BIGINT       NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
    image_url   VARCHAR(500) NOT NULL,
    is_primary  BOOLEAN      NOT NULL DEFAULT false,
    position    INTEGER      NOT NULL DEFAULT 0,
    created_at  TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX idx_listing_images_listing ON listing_images (listing_id);
