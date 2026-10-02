-- docker-compose.yml mounts this file into MariaDB's initialization directory.
-- The main MARIADB_* variables can create only one application user, so this
-- file adds the test database and account to the same local MariaDB server.
-- The test password is intentionally stable and test-only.
-- Keep the password in sync with DB_PASS in .env.test.example.
CREATE DATABASE IF NOT EXISTS redaction_test;
CREATE USER IF NOT EXISTS 'redaction_test'@'%' IDENTIFIED BY 'redaction';
ALTER USER 'redaction_test'@'%' IDENTIFIED BY 'redaction';
GRANT ALL PRIVILEGES ON redaction_test.* TO 'redaction_test'@'%';
FLUSH PRIVILEGES;
