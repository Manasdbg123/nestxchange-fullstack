-- The category-agnostic core of NestXchange: one table for every listing,
-- regardless of category (PROPERTY, VEHICLE, ...) or mode (RENT, BUY, SELL).
-- Category-specific fields live in `attributes` (JSONB); the GIN index below
-- is what keeps filtering on those fields fast without per-category tables
-- or per-category columns.

CREATE TABLE listings (
    id          BIGSERIAL PRIMARY KEY,
    owner_id    BIGINT        NOT NULL,
    category    VARCHAR(20)   NOT NULL,
    mode        VARCHAR(20)   NOT NULL,
    title       VARCHAR(120)  NOT NULL,
    description TEXT,
    price       NUMERIC(12,2) NOT NULL,
    location    VARCHAR(160)  NOT NULL,
    status      VARCHAR(20)   NOT NULL,
    attributes  JSONB         NOT NULL DEFAULT '{}'::jsonb,
    created_at  TIMESTAMP     NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP     NOT NULL DEFAULT now()
);

CREATE INDEX idx_listings_category ON listings (category);
CREATE INDEX idx_listings_mode ON listings (mode);
CREATE INDEX idx_listings_status ON listings (status);
CREATE INDEX idx_listings_price ON listings (price);
CREATE INDEX idx_listings_owner ON listings (owner_id);
CREATE INDEX idx_listings_created ON listings (created_at);

-- jsonb_path_ops is narrower than the default operator class (it only
-- supports @> containment, not ?/?&/?| key-existence lookups) but is smaller
-- and faster, and containment is all the search endpoint's attribute filters
-- need.
CREATE INDEX idx_listings_attributes_gin ON listings USING GIN (attributes jsonb_path_ops);
