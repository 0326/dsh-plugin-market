-- DS Plugin Market initial schema (v1.0)
-- Matches docs/TECHNICAL_DESIGN.md §13.

CREATE TABLE repositories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  github_id INTEGER NOT NULL UNIQUE,
  owner TEXT NOT NULL,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL UNIQUE,
  html_url TEXT NOT NULL,
  description TEXT,
  default_branch TEXT,
  default_branch_sha TEXT,
  stars INTEGER NOT NULL DEFAULT 0,
  forks INTEGER NOT NULL DEFAULT 0,
  license_spdx TEXT,
  archived INTEGER NOT NULL DEFAULT 0,
  github_created_at TEXT,
  github_updated_at TEXT,
  github_pushed_at TEXT,
  etag TEXT,
  discovered_at TEXT NOT NULL,
  last_checked_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE plugins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  repository_id INTEGER NOT NULL UNIQUE,
  package_name TEXT,
  package_version TEXT,
  plugin_name TEXT,
  description TEXT,
  verification_status TEXT NOT NULL DEFAULT 'CANDIDATE',
  compatibility_status TEXT NOT NULL DEFAULT 'UNKNOWN',
  security_status TEXT NOT NULL DEFAULT 'UNKNOWN',
  maintenance_status TEXT NOT NULL DEFAULT 'UNKNOWN',
  risk_level TEXT NOT NULL DEFAULT 'UNKNOWN',
  latest_scan_id INTEGER,
  featured INTEGER NOT NULL DEFAULT 0,
  metadata_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(repository_id) REFERENCES repositories(id)
);

CREATE TABLE scans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  repository_id INTEGER NOT NULL,
  commit_sha TEXT NOT NULL,
  scanner_version TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  error_code TEXT,
  error_message TEXT,
  UNIQUE(repository_id, commit_sha, scanner_version)
);

CREATE TABLE scan_findings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scan_id INTEGER NOT NULL,
  category TEXT NOT NULL,
  code TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT,
  file_path TEXT,
  evidence_json TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY(scan_id) REFERENCES scans(id)
);

CREATE TABLE discovery_state (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  query TEXT NOT NULL,
  window_start TEXT,
  window_end TEXT,
  page INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending',
  last_run_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_repositories_full_name ON repositories(full_name);
CREATE INDEX idx_plugins_verification ON plugins(verification_status);
CREATE INDEX idx_plugins_compatibility ON plugins(compatibility_status);
CREATE INDEX idx_scan_findings_scan_id ON scan_findings(scan_id);
