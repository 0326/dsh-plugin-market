-- Reduce D1 rows-read on the marketplace hot paths observed in production.
-- Keep this set intentionally focused because every extra index also adds
-- write/storage overhead during discovery and scan updates.

-- Public plugin lists: updated / popular / new.
CREATE INDEX IF NOT EXISTS idx_repositories_updated_at
  ON repositories(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_repositories_stars
  ON repositories(stars DESC);
CREATE INDEX IF NOT EXISTS idx_repositories_discovered_at
  ON repositories(discovered_at DESC);

-- Trending and registry statistics.
CREATE INDEX IF NOT EXISTS idx_repositories_github_pushed_at
  ON repositories(github_pushed_at DESC);
CREATE INDEX IF NOT EXISTS idx_plugins_featured
  ON plugins(featured);
CREATE INDEX IF NOT EXISTS idx_plugins_risk
  ON plugins(risk_level);
CREATE INDEX IF NOT EXISTS idx_scans_status_repository
  ON scans(status, repository_id);
CREATE INDEX IF NOT EXISTS idx_scans_completed_at
  ON scans(completed_at DESC);

-- Auto-feature checks only care about blocking security findings for the
-- latest scan, so let SQLite answer that lookup from the index alone.
CREATE INDEX IF NOT EXISTS idx_scan_findings_security
  ON scan_findings(scan_id, category, severity);
