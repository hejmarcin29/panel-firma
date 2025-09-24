-- Adds service_type column (previous manual attempt 0003_add_client_service_type.sql not picked up by journal)
ALTER TABLE clients ADD COLUMN service_type text NOT NULL DEFAULT 'with_installation';