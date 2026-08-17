CREATE TABLE IF NOT EXISTS discovery_lock (
  name TEXT PRIMARY KEY,
  owner TEXT NOT NULL,
  lease_until TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
