-- Rollback for 001_initial.up.sql. Execute only against the Frankenstein-Labs business database.
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS operations;
DROP TABLE IF EXISTS workspace_links;
DROP TABLE IF EXISTS project_members;
DROP TABLE IF EXISTS projects;
DELETE FROM schema_migrations WHERE version = 1;
