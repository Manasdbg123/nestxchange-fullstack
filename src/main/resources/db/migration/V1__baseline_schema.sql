-- Baseline schema for the tables that already existed under Hibernate
-- ddl-auto=update on MySQL. Written out explicitly now that Flyway (on
-- PostgreSQL) owns schema management, so `ddl-auto: validate` has something
-- to check entities against.

CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(80)  NOT NULL,
    email         VARCHAR(160) NOT NULL,
    password      VARCHAR(255) NOT NULL,
    phone         VARCHAR(20),
    role          VARCHAR(20)  NOT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_users_email ON users (email);

CREATE TABLE properties (
    id                 BIGSERIAL PRIMARY KEY,
    title              VARCHAR(120)  NOT NULL,
    description        TEXT,
    rent_amount        NUMERIC(12,2) NOT NULL,
    deposit_amount     NUMERIC(12,2) NOT NULL,
    square_footage     INTEGER       NOT NULL,
    city               VARCHAR(80)   NOT NULL,
    locality           VARCHAR(120)  NOT NULL,
    is_verified        BOOLEAN       NOT NULL DEFAULT false,
    contact_number     VARCHAR(20)   NOT NULL,
    available_from     DATE          NOT NULL,
    tenant_preference  VARCHAR(20)   NOT NULL,
    type               VARCHAR(20)   NOT NULL,
    status             VARCHAR(20)   NOT NULL,
    furnishing_status  VARCHAR(20)   NOT NULL,
    rooms              INTEGER       NOT NULL DEFAULT 0,
    negotiable         BOOLEAN       NOT NULL DEFAULT false,
    created_at         TIMESTAMP     NOT NULL DEFAULT now(),
    updated_at         TIMESTAMP     NOT NULL DEFAULT now(),
    owner_id           BIGINT        NOT NULL REFERENCES users (id)
);
CREATE INDEX idx_properties_city ON properties (city);
CREATE INDEX idx_properties_status ON properties (status);
CREATE INDEX idx_properties_type ON properties (type);
CREATE INDEX idx_properties_rent ON properties (rent_amount);
CREATE INDEX idx_properties_owner ON properties (owner_id);
CREATE INDEX idx_properties_created ON properties (created_at);

CREATE TABLE property_amenities (
    property_id BIGINT NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
    amenity     VARCHAR(40) NOT NULL
);
CREATE INDEX idx_property_amenities_property ON property_amenities (property_id);

CREATE TABLE property_images (
    id          BIGSERIAL PRIMARY KEY,
    property_id BIGINT      NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
    image_url   VARCHAR(255) NOT NULL,
    is_primary  BOOLEAN     NOT NULL DEFAULT false,
    created_at  TIMESTAMP   NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP   NOT NULL DEFAULT now()
);
CREATE INDEX idx_property_images_property ON property_images (property_id);

CREATE TABLE favorites (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    property_id BIGINT NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uq_favorites_user_property UNIQUE (user_id, property_id)
);

CREATE TABLE visit_schedules (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT    NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    property_id BIGINT    NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
    visit_date  TIMESTAMP NOT NULL,
    -- VisitSchedule.status has no explicit @Column(length=...), so Hibernate's
    -- default (255) applies - matched here rather than guessing a shorter length.
    status      VARCHAR(255) NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP NOT NULL DEFAULT now()
);
