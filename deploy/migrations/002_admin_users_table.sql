-- Admin users table and sessions FK (admin-high-level-design.md §5.6).
-- Apply when users has no password_hash (placeholder only) and admin login uses admin_users.
-- Run after schema.sql or after 001; fixes "Unknown column 'password_hash'" by using admin_users.

-- Admin staff: login credentials and role.
CREATE TABLE IF NOT EXISTS admin_users (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NULL,
    role VARCHAR(64) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE KEY uq_admin_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Point sessions to admin_users. Run only if sessions still references users (fk_sessions_user).
-- If you get "check that column/key exists" or "Duplicate foreign key", schema is already updated; skip.
DELETE FROM sessions;
ALTER TABLE sessions DROP FOREIGN KEY fk_sessions_user;
ALTER TABLE sessions ADD CONSTRAINT fk_sessions_admin_user FOREIGN KEY (user_id) REFERENCES admin_users (id) ON DELETE CASCADE;
