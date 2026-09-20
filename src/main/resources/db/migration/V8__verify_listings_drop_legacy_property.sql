-- The "verified" badge the marketing copy has always promised only ever
-- existed on the legacy `properties` table - no listing created through the
-- generic engine (PROPERTY or VEHICLE) could ever be verified. This makes
-- the badge real for both categories, and removes the now-fully-superseded
-- legacy Property stack: everything it did (search, images, favorites,
-- "request a visit") has an equivalent on `listings` that covers both
-- categories - see ListingFavorite (replaces favorites/property_id),
-- ListingStateMachineService's REQUEST/CONFIRM/PROCEED/CLOSE (replaces
-- visit_schedules), and ListingImage (replaces property_images).

ALTER TABLE listings ADD COLUMN verified BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX idx_listings_verified ON listings (verified);

DROP TABLE visit_schedules;
DROP TABLE favorites;
DROP TABLE property_images;
DROP TABLE property_amenities;
DROP TABLE properties;
