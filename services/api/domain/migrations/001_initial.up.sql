-- Frankenstein-Labs business database only.
-- This migration must run against FRANKENSTEIN_DATABASE_URL, never CODER_PG_CONNECTION_URL.

CREATE TABLE IF NOT EXISTS schema_migrations (
  version bigint PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY,
  owner_user_id text NOT NULL,
  name varchar(120) NOT NULL,
  slug varchar(80) NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_members (
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

CREATE TABLE IF NOT EXISTS workspace_links (
  id uuid PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  coder_workspace_id uuid NOT NULL UNIQUE,
  coder_template_id uuid,
  created_by_user_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);

CREATE TABLE IF NOT EXISTS operations (
  id uuid PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  workspace_link_id uuid REFERENCES workspace_links(id) ON DELETE SET NULL,
  actor_user_id text NOT NULL,
  action varchar(80) NOT NULL,
  status text NOT NULL CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'canceled')),
  coder_workspace_build_id uuid,
  coder_provisioner_job_id uuid,
  error_code varchar(120),
  error_message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  actor_user_id text NOT NULL,
  type varchar(80) NOT NULL,
  operation_id uuid REFERENCES operations(id) ON DELETE SET NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS project_members_user_idx ON project_members(user_id);
CREATE INDEX IF NOT EXISTS workspace_links_project_idx ON workspace_links(project_id);
CREATE INDEX IF NOT EXISTS operations_project_created_idx ON operations(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS operations_coder_job_idx ON operations(coder_provisioner_job_id);
CREATE INDEX IF NOT EXISTS activities_project_created_idx ON activities(project_id, created_at DESC);

INSERT INTO schema_migrations (version) VALUES (1) ON CONFLICT (version) DO NOTHING;
