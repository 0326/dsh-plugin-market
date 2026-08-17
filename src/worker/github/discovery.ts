import type { ScanJob, ScanQueueJob } from "../domain/scan";
import {
	clearDiscoveryShards,
	insertDiscoveryShards,
	listPendingDiscoveryShards,
	updateDiscoveryShard,
	acquireDiscoveryLease,
	releaseDiscoveryLease,
	updateRepositoryPreviewImage,
	upsertRepository,
} from "../db/repository";
import { upsertDiscoverySummary } from "../db/registry";
import { extractReadmeImage } from "../scanner/readme-image";
import { GithubError, type GithubClient, type GithubSearchReposResult } from "./client";

const TOPIC_QUERY = "topic:dsh-plugin";
const SOURCE = "github";
const PER_PAGE = 100;
const MAX_PAGES = 10; // GitHub Search API returns at most 1000 results per query.
const SHARD_LIMIT = 1000; // Split a query window larger than this.
const THROTTLE_MS = 2200; // Keep under the 30 search requests/min rate limit.
const MIN_WINDOW_MS = 1000; // Stop splitting below 1 second.
const MAX_RETRIES = 10;
/**
 * Search the complete practical GitHub repository history instead of assuming
 * dsh-plugin repositories were created after the DSH launch. Older repos can
 * add the topic later, so a DSH-specific creation-date floor would miss them.
 */
export const GITHUB_REPOSITORY_EPOCH = "2008-01-01T00:00:00.000Z";
/**
 * Repos processed per cron run. Sized to the Workers free plan: 2 D1 queries
 * per repo (~800 for 400 repos) + a few sendBatch + search calls stay under
 * the 1000 Cloudflare-service and 50 external subrequest budgets.
 */
const MAX_REPOS_PER_RUN = 400;

export interface DiscoveryRun {
	githubTotal: number;
	reposSeen: number;
	enqueued: number;
	shardsProcessed: number;
	pendingShards: number;
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function searchThrottled(
	client: GithubClient,
	query: string,
	page: number,
	perPage: number,
	opts?: { sort?: string; order?: "asc" | "desc" },
): Promise<GithubSearchReposResult> {
	for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
		try {
			const res = await client.searchRepos(query, page, perPage, opts);
			await sleep(THROTTLE_MS);
			return res;
		} catch (err) {
			if (err instanceof GithubError && err.rateLimited) {
				await sleep(((err.retryAfterSeconds ?? 30) + 1) * 1000);
				continue;
			}
			throw err;
		}
	}
	throw new Error("search rate limit retries exhausted");
}

/**
 * Recursively split the created-time window into shards, each with at most
 * SHARD_LIMIT results, so every shard can be paginated within MAX_PAGES.
 */
export async function collectShards(
	client: GithubClient,
	start: string,
	end: string,
	out: { start: string; end: string }[],
): Promise<void> {
	const query = TOPIC_QUERY + " created:" + start + ".." + end;
	const probe = await searchThrottled(client, query, 1, 1);
	const startMs = Date.parse(start);
	const endMs = Date.parse(end);
	if (probe.total_count <= SHARD_LIMIT || endMs - startMs <= MIN_WINDOW_MS) {
		out.push({ start, end });
		return;
	}
	const mid = new Date((startMs + endMs) / 2).toISOString();
	await collectShards(client, start, mid, out);
	await collectShards(client, mid, end, out);
}

/**
 * Discover candidate repositories under the dsh-plugin topic, checkpointed
 * across cron runs via the discovery_state table. Each run processes at most
 * maxReposPerRun repos so a single Worker invocation never exceeds the free
 * plan subrequest budgets (50 external + 1000 Cloudflare-service requests).
 */
export async function runDiscovery(
	client: GithubClient,
	db: D1Database,
	queue: Queue<ScanQueueJob>,
	maxReposPerRun: number = MAX_REPOS_PER_RUN,
): Promise<DiscoveryRun> {
	const leaseOwner = crypto.randomUUID();
	if (!(await acquireDiscoveryLease(db, leaseOwner))) {
		return { githubTotal: 0, reposSeen: 0, enqueued: 0, shardsProcessed: 0, pendingShards: (await listPendingDiscoveryShards(db, SOURCE, TOPIC_QUERY)).length };
	}
	try {
	// Persist the unfiltered GitHub topic count once per discovery run. Homepage
	// requests read this cached D1 value instead of spending GitHub API quota.
	const totalProbe = await searchThrottled(client, TOPIC_QUERY, 1, 1);
	await upsertDiscoverySummary(db, SOURCE, TOPIC_QUERY, totalProbe.total_count);

	let pending = await listPendingDiscoveryShards(db, SOURCE, TOPIC_QUERY);
	if (pending.length === 0) {
		const windows: { start: string; end: string }[] = [];
		await collectShards(client, GITHUB_REPOSITORY_EPOCH, new Date().toISOString(), windows);
		await clearDiscoveryShards(db, SOURCE, TOPIC_QUERY);
		await insertDiscoveryShards(db, SOURCE, TOPIC_QUERY, windows);
		pending = await listPendingDiscoveryShards(db, SOURCE, TOPIC_QUERY);
	}

	let reposSeen = 0;
	let enqueued = 0;
	let shardsProcessed = 0;
	const jobs: ScanJob[] = [];

	const flushJobs = async () => {
		while (jobs.length > 0) {
			const chunk = jobs.splice(0, 100).map((body) => ({ body }));
			await queue.sendBatch(chunk);
		}
	};

	for (const shard of pending) {
		const query = TOPIC_QUERY + " created:" + shard.windowStart + ".." + shard.windowEnd;
		let page = shard.page;
		let done = false;

		while (page <= MAX_PAGES && reposSeen < maxReposPerRun) {
			const res = await searchThrottled(client, query, page, PER_PAGE);
			const items = res.items ?? [];
			for (const repo of items) {
				reposSeen++;
				const { id, changed } = await upsertRepository(db, repo);
				if (changed) {
					jobs.push({ repositoryId: id, owner: repo.owner.login, repo: repo.name, reason: "DISCOVERY" });
					enqueued++;
				}
			}
			await flushJobs();
			if (items.length < PER_PAGE) {
				done = true;
				break;
			}
			page++;
		}

		if (done || page > MAX_PAGES) {
			await updateDiscoveryShard(db, shard.id, page, "done");
			shardsProcessed++;
		} else {
			await updateDiscoveryShard(db, shard.id, page, "pending");
		}
		if (reposSeen >= maxReposPerRun) break;
	}

	await flushJobs();

	const remaining = (await listPendingDiscoveryShards(db, SOURCE, TOPIC_QUERY)).length;
	return { githubTotal: totalProbe.total_count, reposSeen, enqueued, shardsProcessed, pendingShards: remaining };
	} finally {
		await releaseDiscoveryLease(db, leaseOwner);
	}
}

/**
 * Backfill a repository's preview image when it has none yet: prefer the
 * GitHub social preview (Open Graph), then fall back to the first presentable
 * image found in the README (pinned to the scanned commit). Best-effort —
 * failures never abort a scan.
 */
export async function ensurePreviewImage(
	client: GithubClient,
	db: D1Database,
	repo: { owner: string; name: string; full_name: string; preview_image_url: string | null },
	readme: string | undefined,
	commitSha: string,
): Promise<void> {
	if (repo.preview_image_url) return;

	try {
		const urls = await client.getOpenGraphImageUrls([{ owner: repo.owner, name: repo.name }]);
		const url = urls.get(repo.full_name);
		if (url) {
			await updateRepositoryPreviewImage(db, repo.full_name, url);
			return;
		}
	} catch (err) {
		console.warn("preview image backfill (open graph) failed", err instanceof Error ? err.message : String(err));
	}

	const readmeImage = extractReadmeImage(readme, { owner: repo.owner, repo: repo.name, sha: commitSha });
	if (readmeImage) await updateRepositoryPreviewImage(db, repo.full_name, readmeImage);
}
