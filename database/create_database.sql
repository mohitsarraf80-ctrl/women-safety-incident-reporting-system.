-- Creates the database and the least-privilege application user for local development.
-- Run once as a MySQL administrator, for example:
--   mysql -u root -p < database/create_database.sql
--
-- Change the password below before using this outside a college demo machine,
-- and put the same value in backend/.env as DB_PASSWORD.

CREATE DATABASE IF NOT EXISTS women_safety
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'ws_user'@'localhost'
  IDENTIFIED BY 'change-me';
CREATE USER IF NOT EXISTS 'ws_user'@'127.0.0.1'
  IDENTIFIED BY 'change-me';

GRANT ALL PRIVILEGES ON women_safety.* TO 'ws_user'@'localhost';
GRANT ALL PRIVILEGES ON women_safety.* TO 'ws_user'@'127.0.0.1';
FLUSH PRIVILEGES;

-- Flyway creates the tables (users, incidents, alerts, responders, ...) on first start.
