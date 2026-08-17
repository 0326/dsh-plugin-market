export interface RegistryStats {
	/** Backward-compatible alias for discovered repositories. */
	total: number;
	githubTotal: number | null;
	discovered: number;
	scanned: number;
	/** Repositories recognized as at least DETECTED, including FORMAT_VERIFIED. */
	detected: number;
	verified: number;
	featured: number;
	updatedThisWeek: number;
	lastScanAt: string | null;
	discoveryCheckedAt: string | null;
}

export async function upsertDiscoverySummary(
	db: D1Database,
	source: string,
	query: string,
	totalCount: number,
): Promise<void> {
	const now = new Date().toISOString();
	await db
		.prepare(
			`INSERT INTO discovery_summary (source, query, total_count, checked_at)
			 VALUES (?, ?, ?, ?)
			 ON CONFLICT(source, query) DO UPDATE SET total_count = excluded.total_count, checked_at = excluded.checked_at`,
		)
		.bind(source, query, totalCount, now)
		.run();
}

export async function getRegistryStats(db: D1Database): Promise<RegistryStats> {
	const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
	const row = await db
		.prepare(
			`SELECT
				(SELECT COUNT(*) FROM repositories) AS total,
				(SELECT total_count FROM discovery_summary WHERE source = 'github' AND query = 'topic:dsh-plugin') AS githubTotal,
				(SELECT COUNT(*) FROM repositories) AS discovered,
				(SELECT COUNT(DISTINCT repository_id) FROM scans WHERE status = 'completed') AS scanned,
				(SELECT COUNT(*) FROM plugins WHERE verification_status IN ('DETECTED', 'FORMAT_VERIFIED')) AS detected,
				(SELECT COUNT(*) FROM plugins WHERE verification_status = 'FORMAT_VERIFIED') AS verified,
				(SELECT COUNT(*) FROM plugins WHERE featured = 1) AS featured,
				(SELECT COUNT(*) FROM repositories WHERE github_pushed_at >= ?) AS updatedThisWeek,
				(SELECT MAX(completed_at) FROM scans) AS lastScanAt,
				(SELECT checked_at FROM discovery_summary WHERE source = 'github' AND query = 'topic:dsh-plugin') AS discoveryCheckedAt`,
		)
		.bind(weekAgo)
		.first<RegistryStats>();

	return row ?? {
		total: 0,
		githubTotal: null,
		discovered: 0,
		scanned: 0,
		detected: 0,
		verified: 0,
		featured: 0,
		updatedThisWeek: 0,
		lastScanAt: null,
		discoveryCheckedAt: null,
	};
}
