-- Tokens issued before this moment are rejected by JwtAuthenticationFilter, so a
-- password reset signs out every session that knew the old password.
ALTER TABLE users ADD COLUMN password_changed_at TIMESTAMP;
