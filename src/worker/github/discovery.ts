import type { ScanJob } from "../domain/scan";
import { updateRepositoryPreviewImage, upsertRepository } from "../db/repository";
import { GithubError, type GithubClient, type GithubSearchReposResult } from "./client";

const TOPIC_QUERY = "topic:dsh-plugin";
const PER_PAGE = 100;
const MAX_PAGES = 10; // GitHub Search API returns at most 1000 results per query.
const SHARD_LIMIT = 1000; // Split a query window larger than this.
const THROTTLE_MS = 2200; // Keep under the 30 search requests/min rate limit.
const MIN_WINDOW_MS = 1000; // Stop splitting below 1 second.
const MAX_RETRIES = 10;

export interface DiscoveryRun {
	reposSeen: number;
	enqueued: number;
	shards: number;
}

interface ShardResult {
	reposSeen: number;
	enqueued: number;
	shards: number;
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
 * Discover every candidate repository under the dsh-plugin topic.
 *
 * The GitHub Search API caps a single query at 1000 results, so the topic is
 * sharded by creation-time windows (created:START..END) and a window larger
 * than the cap is recursively split in half (TECHNICAL_DESIGN.md §6.4).
 */
export async function runDiscovery(client: GithubClient, db: D1Database, queue: Queue<ScanJob>): Promise<DiscoveryRun> {
	const earliest = await findEarliestDate(client);
	if (!earliest) return { reposSeen: 0, enqueued: 0, shards: 0 };
	const latest = new Date().toISOString();
	return discoverWindow(client, db, queue, earliest, latest);
}

async function findEarliestDate(client: GithubClient): Promise<string | null> {
	const res = await searchThrottled(client, TOPIC_QUERY, 1, 1, { sort: "created", order: "asc" });
	return res.items[0]?.created_at ?? null;
}

async function discoverWindow(
	client: GithubClient,
	db: D1Database,
	queue: Queue<ScanJob>,
	start: string,
	end: string,
): Promise<ShardResult> {
	const query = TOPIC_QUERY + " created:" + start + ".." + end;
	const probe = await searchThrottled(client, query, 1, 1);
	const startMs = Date.parse(start);
	const endMs = Date.parse(end);
	if (probe.total_count <= SHARD_LIMIT || endMs - startMs <= MIN_WINDOW_MS) {
		return paginateShard(client, db, queue, query);
	}
	const mid = new Date((startMs + endMs) / 2).toISOString();
	const a = await discoverWindow(client, db, queue, start, mid);
	const b = await discoverWindow(client, db, queue, mid, end);
	return { reposSeen: a.reposSeen + b.reposSeen, enqueued: a.enqueued + b.enqueued, shards: a.shards + b.shards };
}

async function paginateShard(client: GithubClient, db: D1Database, queue: Queue<ScanJob>, query: string): Promise<ShardResult> {
	let reposSeen = 0;
	let enqueued = 0;
	for (let page = 1; page <= MAX_PAGES; page++) {
		const res = await searchThrottled(client, query, page, PER_PAGE);
		for (const repo of res.items) {
			reposSeen++;
			const { id, changed } = await upsertRepository(db, repo);
			if (changed) {
				await queue.send({ repositoryId: id, owner: repo.owner.login, repo: repo.name, reason: "DISCOVERY" });
				enqueued++;
			}
		}
		await enrichPreviewImages(client, db, res.items);
		if (res.items.length < PER_PAGE) break;
	}
	return { reposSeen, enqueued, shards: 1 };
}

/**
 * Populate `preview_image_url` from the GitHub social preview (Open Graph)
 * image. This is best-effort: a rate limit or GraphQL failure must never
 * abort discovery, so every error is logged and swallowed.
 */
async function enrichPreviewImages(client: GithubClient, db: D1Database, repos: { owner: { login: string }; name: string; full_name: string }[]): Promise<void> {
	if (repos.length === 0) return;
	try {
		const urls = await client.getOpenGraphImageUrls(repos.map((r) => ({ owner: r.owner.login, name: r.name })));
		for (const repo of repos) {
			const url = urls.get(repo.full_name);
			if (url) await updateRepositoryPreviewImage(db, repo.full_name, url);
		}
	} catch (err) {
		console.warn("preview image enrichment failed", err instanceof Error ? err.message : String(err));
	}
}
