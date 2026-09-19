-- Tracks who requested a listing, so ListingStateMachineService can restrict
-- CONFIRM/PROCEED/CLOSE to the owner or that specific requester instead of
-- any authenticated user.

ALTER TABLE listings ADD COLUMN requested_by BIGINT;
