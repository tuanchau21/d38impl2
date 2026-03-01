-- Admin login schema (admin-high-level-design.md §5.6).
-- Apply after initial schema.sql. Adds password_hash, name, role to users; creates sessions table.

-- Add columns to users (id, email, created_at, updated_at already exist).
-- If a column already exists, MySQL will error; skip that statement or run once.
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN name VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN role VARCHAR(64) NULL;

CREATE TABLE IF NOT EXISTS sessions (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at DATETIME(3) NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY uq_sessions_token (token),
    KEY idx_sessions_user (user_id),
    KEY idx_sessions_expires (expires_at),
    CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
