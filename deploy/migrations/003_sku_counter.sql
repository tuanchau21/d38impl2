-- sku_counter: single-row counter for SKU generation (product-data-layout.md, database-high-level-design.md).
-- Safe to run on existing DB: creates table and seed row only if missing; does not modify existing data.

CREATE TABLE IF NOT EXISTS sku_counter (
    id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
    value INT UNSIGNED NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO sku_counter (id, value) VALUES (1, 1);
