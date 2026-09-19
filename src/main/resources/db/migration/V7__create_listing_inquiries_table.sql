-- Contact-the-owner messages for the generic Listing engine. Independent of
-- visit_schedules (the legacy Property-only "schedule a viewing" workflow).

CREATE TABLE listing_inquiries (
    id          BIGSERIAL PRIMARY KEY,
    listing_id  BIGINT    NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
    sender_id   BIGINT    NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    message     TEXT      NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_listing_inquiries_listing ON listing_inquiries (listing_id);
CREATE INDEX idx_listing_inquiries_sender ON listing_inquiries (sender_id);
