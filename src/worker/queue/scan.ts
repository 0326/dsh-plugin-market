import { completeScan, createScan, getBaseline, getRepositoryById, updateRepositorySha } from "../db/repository";
import { SCANNER_VERSION, type RescanSweepJob, type ScanJob } from "../domain/scan";
import type { Env } from "../env";
import { GithubClient } from "../github/client";
import { ensurePreviewImage } from "../github/discovery";
import { fetchSnapshot } from "../github/repository";
import { scanRepository } from "../scanner";
import { DEFAULT_BASELINE } from "../scanner/compatibility";
import { getFileContent } from "../scanner/snapshot";
import { maybeAutoFeatureScan } from "../curation/featured";

/** A transient failure (e.g. rate limit) that should be retried by the queue. */
export class TransientScanError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "TransientScanError";
	}
}

export async function processScanJob(env: Env, job: ScanJob): Promise<void> {
	const repo = await getRepositoryById(env.DB, job.repositoryId);
	if (!repo) {
		console.warn("scan skipped: repository not in registry", job.repositoryId);
		return;
	}

	const client = new GithubClient(env.GITHUB_TOKEN);
	const fetched = await fetchSnapshot(client, repo.owner, repo.name, repo.default_branch ?? "main", job.expectedSha);
	if (fetched.error || !fetched.snapshot) {
		if (fetched.error?.code === "GITHUB_RATE_LIMITED") throw new TransientScanError(fetched.error.message);
		throw new Error("scan failed for " + repo.full_name + ": " + (fetched.error?.message ?? "unknown error"));
	}

	const snapshot = fetched.snapshot;
	await ensurePreviewImage(client, env.DB, repo, getFileContent(snapshot, "README.md"), snapshot.commitSha);
	const baseline = (await getBaseline(env.DB)) ?? DEFAULT_BASELINE;
	const result = scanRepository({
		snapshot,
		maintenance: {
			archived: repo.archived === 1,
			disabled: false,
			lastPushAt: repo.github_pushed_at ?? undefined,
			stars: repo.stars,
			forks: repo.forks,
		},
		baseline,
	});

	const scan = await createScan(env.DB, repo.id, snapshot.commitSha);
	if (!scan.created) return;
	await completeScan(env.DB, scan.id, result);
	await updateRepositorySha(env.DB, repo.id, snapshot.commitSha);
	await maybeAutoFeatureScan(env, repo, result);
}

/** Keep each sweep expansion small enough for Free-plan HTTP/queue CPU budgets. */
export const RESCAN_SWEEP_PAGE_SIZE = 100;

export interface RescanSweepResult {
	enqueued: number;
	nextAfterRepositoryId: number | null;
	done: boolean;
}

/** Start a full stale-scanner rescan with a single lightweight queue write. */
export async function startRescanSweep(env: Env): Promise<{ status: "started"; scannerVersion: string }> {
	await env.SCAN_QUEUE.send({ type: "RESCAN_SWEEP", afterRepositoryId: 0 });
	return { status: "started", scannerVersion: SCANNER_VERSION };
}

/**
 * Expand one page of a rescan sweep. The control message advances by repository
 * id, so it never depends on earlier scan jobs finishing before the next page is
 * discovered. Re-running the sweep is safe because current-version rows are
 * filtered out by the query and completed scans are idempotent.
 */
export async function processRescanSweepJob(env: Env, job: RescanSweepJob): Promise<RescanSweepResult> {
	const rows = await env.DB
		.prepare(
			`SELECT r.id AS id, r.owner AS owner, r.name AS name
			FROM repositories r
			LEFT JOIN plugins p ON p.repository_id = r.id
			LEFT JOIN scans s ON s.id = p.latest_scan_id
			WHERE r.id > ?
				AND (p.id IS NULL OR s.scanner_version IS NULL OR s.scanner_version != ?)
			ORDER BY r.id ASC
			LIMIT ?`,
		)
		.bind(job.afterRepositoryId, SCANNER_VERSION, RESCAN_SWEEP_PAGE_SIZE)
		.all<{ id: number; owner: string; name: string }>();

	const page = rows.results ?? [];
	if (page.length === 0) return { enqueued: 0, nextAfterRepositoryId: null, done: true };

	const scanJobs: { body: ScanJob }[] = page.map((row) => ({
		body: { repositoryId: row.id, owner: row.owner, repo: row.name, reason: "SCANNER_UPGRADE" },
	}));
	await env.SCAN_QUEUE.sendBatch(scanJobs);

	const lastRepositoryId = page[page.length - 1].id;
	const hasPotentialNextPage = page.length === RESCAN_SWEEP_PAGE_SIZE;
	if (hasPotentialNextPage) {
		await env.SCAN_QUEUE.send({ type: "RESCAN_SWEEP", afterRepositoryId: lastRepositoryId });
	}

	return {
		enqueued: page.length,
		nextAfterRepositoryId: hasPotentialNextPage ? lastRepositoryId : null,
		done: !hasPotentialNextPage,
	};
}
