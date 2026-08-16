-- Query indexes for scan consumption and publisher/detail lookups.
CREATE INDEX idx_scans_repository_id ON scans(repository_id);
CREATE INDEX idx_repositories_owner_name ON repositories(owner, name);
