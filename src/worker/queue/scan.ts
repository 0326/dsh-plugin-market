import { completeScan, createScan, getBaseline, getRepositoryById, updateRepositorySha } from "../db/repository";
import { SCANNER_VERSION, type ScanJob } from "../domain/scan";
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

export interface RescanResult {
	enqueued: number;
}

/**
 * Enqueue a re-scan for every repository whose latest scan predates the
 * current scanner version (i.e. a scanner upgrade). Idempotent: once a repo
 * is re-scanned with the current version it is skipped on subsequent runs.
 */
export async function enqueueRescanAll(env: Env): Promise<RescanResult> {
	const rows = await env.DB
		.prepare(
			`SELECT r.id AS id, r.owner AS owner, r.name AS name
			FROM repositories r
			JOIN plugins p ON p.repository_id = r.id
			WHERE p.latest_scan_id IS NOT NULL
				AND (SELECT s.scanner_version FROM scans s WHERE s.id = p.latest_scan_id) != ?`,
		)
		.bind(SCANNER_VERSION)
		.all<{ id: number; owner: string; name: string }>();

	let enqueued = 0;
	for (const row of rows.results ?? []) {
		await env.SCAN_QUEUE.send({ repositoryId: row.id, owner: row.owner, repo: row.name, reason: "SCANNER_UPGRADE" });
		enqueued++;
	}
	return { enqueued };
}
