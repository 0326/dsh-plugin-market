CREATE TABLE discovery_summary (
  source TEXT NOT NULL,
  query TEXT NOT NULL,
  total_count INTEGER NOT NULL DEFAULT 0,
  checked_at TEXT NOT NULL,
  PRIMARY KEY (source, query)
);
