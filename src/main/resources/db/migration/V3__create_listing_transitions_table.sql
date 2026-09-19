-- Audit trail for ListingStateMachineService: one row per status change,
-- written for both generic transitions (REQUEST, CONFIRM) and the
-- mode-specific ones (PROCEED, CLOSE) that RentTransitionHandler /
-- SaleTransitionHandler decide.

CREATE TABLE listing_transitions (
    id           BIGSERIAL PRIMARY KEY,
    listing_id   BIGINT      NOT NULL,
    performed_by BIGINT      NOT NULL,
    from_status  VARCHAR(20) NOT NULL,
    to_status    VARCHAR(20) NOT NULL,
    event        VARCHAR(20) NOT NULL,
    note         VARCHAR(200) NOT NULL,
    performed_at TIMESTAMP   NOT NULL DEFAULT now()
);

CREATE INDEX idx_listing_transitions_listing ON listing_transitions (listing_id);
