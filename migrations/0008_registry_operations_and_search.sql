-- Shared-account operating model: keep the registry observable and searchable
-- without turning routine browsing into a full-table D1 scan.

CREATE TABLE pipeline_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  detail_json TEXT,
  error_message TEXT
);

CREATE INDEX idx_pipeline_runs_kind_started_at
  ON pipeline_runs(kind, started_at DESC);

CREATE TABLE scan_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  repository_id INTEGER,
  reason TEXT NOT NULL,
  queue_attempt INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  error_message TEXT,
  created_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY(repository_id) REFERENCES repositories(id)
);

CREATE INDEX idx_scan_attempts_repository_created_at
  ON scan_attempts(repository_id, created_at DESC);

-- A compact daily fact table. It is the prerequisite for a real trending
-- ranking and a user-facing change feed; it is intentionally not populated
-- by public reads.
CREATE TABLE plugin_metrics_daily (
  metric_date TEXT NOT NULL,
  repository_id INTEGER NOT NULL,
  stars INTEGER NOT NULL,
  forks INTEGER NOT NULL,
  verification_status TEXT NOT NULL,
  compatibility_status TEXT NOT NULL,
  security_status TEXT NOT NULL,
  maintenance_status TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  PRIMARY KEY(metric_date, repository_id),
  FOREIGN KEY(repository_id) REFERENCES repositories(id)
);

CREATE INDEX idx_plugin_metrics_repository_date
  ON plugin_metrics_daily(repository_id, metric_date DESC);

CREATE TABLE plugin_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  repository_id INTEGER NOT NULL,
  scan_id INTEGER,
  event_type TEXT NOT NULL,
  previous_value TEXT,
  next_value TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY(repository_id) REFERENCES repositories(id),
  FOREIGN KEY(scan_id) REFERENCES scans(id)
);

CREATE INDEX idx_plugin_events_created_at
  ON plugin_events(created_at DESC);
CREATE INDEX idx_plugin_events_repository_created_at
  ON plugin_events(repository_id, created_at DESC);

-- Populated by the daily metric job. Public category browsing then costs a
-- single small lookup rather than repeatedly walking JSON arrays.
CREATE TABLE registry_category_stats (
  capability TEXT PRIMARY KEY,
  plugin_count INTEGER NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT OR REPLACE INTO registry_category_stats (capability, plugin_count, updated_at)
SELECT je.value, COUNT(*), datetime('now')
FROM plugins p, json_each(COALESCE(p.capabilities_json, '[]')) AS je
WHERE p.verification_status IN ('DETECTED', 'FORMAT_VERIFIED')
GROUP BY je.value;

-- FTS5 trigram keeps arbitrary plugin-name and description searches from
-- devolving into leading-wildcard table scans. The table is maintained only
-- when registry facts change, never during a public request.
CREATE VIRTUAL TABLE plugin_search USING fts5(
  full_name,
  package_name,
  description,
  capabilities,
  plugin_types,
  tokenize = 'trigram'
);

INSERT INTO plugin_search(rowid, full_name, package_name, description, capabilities, plugin_types)
SELECT p.id, r.full_name, p.package_name, COALESCE(p.description, r.description, ''),
  COALESCE(p.capabilities_json, '[]'), COALESCE(p.plugin_types_json, '[]')
FROM plugins p JOIN repositories r ON r.id = p.repository_id;

CREATE TRIGGER plugin_search_after_plugins_insert
AFTER INSERT ON plugins BEGIN
  INSERT INTO plugin_search(rowid, full_name, package_name, description, capabilities, plugin_types)
  SELECT NEW.id, r.full_name, NEW.package_name, COALESCE(NEW.description, r.description, ''),
    COALESCE(NEW.capabilities_json, '[]'), COALESCE(NEW.plugin_types_json, '[]')
  FROM repositories r WHERE r.id = NEW.repository_id;
END;

CREATE TRIGGER plugin_search_after_plugins_update
AFTER UPDATE OF package_name, description, capabilities_json, plugin_types_json ON plugins BEGIN
  DELETE FROM plugin_search WHERE rowid = NEW.id;
  INSERT INTO plugin_search(rowid, full_name, package_name, description, capabilities, plugin_types)
  SELECT NEW.id, r.full_name, NEW.package_name, COALESCE(NEW.description, r.description, ''),
    COALESCE(NEW.capabilities_json, '[]'), COALESCE(NEW.plugin_types_json, '[]')
  FROM repositories r WHERE r.id = NEW.repository_id;
END;

CREATE TRIGGER plugin_search_after_repositories_update
AFTER UPDATE OF full_name, description ON repositories BEGIN
  DELETE FROM plugin_search WHERE rowid = (SELECT id FROM plugins WHERE repository_id = NEW.id);
  INSERT INTO plugin_search(rowid, full_name, package_name, description, capabilities, plugin_types)
  SELECT p.id, NEW.full_name, p.package_name, COALESCE(p.description, NEW.description, ''),
    COALESCE(p.capabilities_json, '[]'), COALESCE(p.plugin_types_json, '[]')
  FROM plugins p WHERE p.repository_id = NEW.id;
END;
