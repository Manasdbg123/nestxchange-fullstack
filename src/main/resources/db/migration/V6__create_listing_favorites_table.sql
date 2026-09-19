-- Shortlist for the generic Listing engine, independent of the legacy
-- favorites table (which references properties, not listings).

CREATE TABLE listing_favorites (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT    NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    listing_id BIGINT    NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uq_listing_favorites_user_listing UNIQUE (user_id, listing_id)
);
