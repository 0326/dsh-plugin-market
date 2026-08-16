-- M2/M3: compatibility baseline + denormalized capability/type columns for filtering.

CREATE TABLE baseline (
  id INTEGER PRIMARY KEY,
  dsh_version TEXT NOT NULL,
  cordis_version TEXT NOT NULL,
  checked_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

ALTER TABLE plugins ADD COLUMN capabilities_json TEXT;
ALTER TABLE plugins ADD COLUMN plugin_types_json TEXT;
