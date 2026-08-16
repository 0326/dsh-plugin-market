import { completeScan, createScan, getBaseline, getRepositoryByFullName, updateRepositorySha } from "../db/repository";
import type { ScanJob } from "../domain/scan";
import type { Env } from "../env";
import { GithubClient } from "../github/client";
import { fetchSnapshot } from "../github/repository";
import { scanRepository } from "../scanner";
import { DEFAULT_BASELINE } from "../scanner/compatibility";

/** A transient failure (e.g. rate limit) that should be retried by the queue. */
export class TransientScanError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "TransientScanError";
	}
}

export async function processScanJob(env: Env, job: ScanJob): Promise<void> {
	const repo = await getRepositoryByFullName(env.DB, job.owner + "/" + job.repo);
	if (!repo) {
		console.warn("scan skipped: repository not in registry", job.owner + "/" + job.repo);
		return;
	}

	const client = new GithubClient(env.GITHUB_TOKEN);
	const fetched = await fetchSnapshot(client, job.owner, job.repo, repo.default_branch ?? "main", job.expectedSha);
	if (fetched.error || !fetched.snapshot) {
		if (fetched.error?.code === "GITHUB_RATE_LIMITED") throw new TransientScanError(fetched.error.message);
		console.warn("scan failed", job.owner + "/" + job.repo, fetched.error?.code ?? "UNKNOWN");
		return;
	}

	const snapshot = fetched.snapshot;
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

	const scanId = await createScan(env.DB, repo.id, snapshot.commitSha);
	await completeScan(env.DB, scanId, result);
	await updateRepositorySha(env.DB, repo.id, snapshot.commitSha);
}
