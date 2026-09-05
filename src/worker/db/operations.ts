import type { ScanReason } from "../domain/scan";

export type PipelineKind = "discovery_incremental" | "discovery_reconcile" | "baseline_sync" | "daily_metrics" | "rescan_sweep";

export async function startPipelineRun(db: D1Database, kind: PipelineKind, detail: Record<string, unknown> = {}): Promise<number> {
	const result = await db
		.prepare("INSERT INTO pipeline_runs (kind, status, started_at, detail_json) VALUES (?, 'running', ?, ?)")
		.bind(kind, new Date().toISOString(), JSON.stringify(detail))
		.run();
	return result.meta.last_row_id;
}

export async function finishPipelineRun(
	db: D1Database,
	id: number,
	status: "completed" | "failed",
	detail: Record<string, unknown> = {},
	errorMessage?: string,
): Promise<void> {
	await db
		.prepare("UPDATE pipeline_runs SET status = ?, completed_at = ?, detail_json = ?, error_message = ? WHERE id = ?")
		.bind(status, new Date().toISOString(), JSON.stringify(detail), errorMessage ?? null, id)
		.run();
}

export async function startScanAttempt(db: D1Database, repositoryId: number, reason: ScanReason, queueAttempt: number): Promise<number> {
	const result = await db
		.prepare("INSERT INTO scan_attempts (repository_id, reason, queue_attempt, status, created_at) VALUES (?, ?, ?, 'running', ?)")
		.bind(repositoryId, reason, queueAttempt, new Date().toISOString())
		.run();
	return result.meta.last_row_id;
}

export async function finishScanAttempt(
	db: D1Database,
	id: number,
	status: "completed" | "retrying" | "failed",
	errorMessage?: string,
): Promise<void> {
	await db
		.prepare("UPDATE scan_attempts SET status = ?, error_message = ?, completed_at = ? WHERE id = ?")
		.bind(status, errorMessage ?? null, new Date().toISOString(), id)
		.run();
}

/** Persist daily product facts; public requests only read the latest registry tables. */
export async function snapshotRegistryMetrics(db: D1Database): Promise<{ plugins: number; categories: number }> {
	const now = new Date().toISOString();
	const day = now.slice(0, 10);
	const [metrics, , categories] = await db.batch([
		db
			.prepare(
				`INSERT OR REPLACE INTO plugin_metrics_daily (
					metric_date, repository_id, stars, forks, verification_status,
					compatibility_status, security_status, maintenance_status, risk_level, recorded_at
				)
				SELECT ?, r.id, r.stars, r.forks, p.verification_status,
					p.compatibility_status, p.security_status, p.maintenance_status, p.risk_level, ?
				FROM plugins p JOIN repositories r ON r.id = p.repository_id`,
			)
			.bind(day, now),
		db
			.prepare("DELETE FROM registry_category_stats")
			.bind(),
		db
			.prepare(
				`INSERT INTO registry_category_stats (capability, plugin_count, updated_at)
				SELECT je.value, COUNT(*), ?
				FROM plugins p, json_each(COALESCE(p.capabilities_json, '[]')) AS je
				WHERE p.verification_status IN ('DETECTED', 'FORMAT_VERIFIED')
				GROUP BY je.value`,
			)
			.bind(now),
	]);
	return { plugins: metrics.meta.changes, categories: categories.meta.changes };
}
