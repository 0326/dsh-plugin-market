import type { ScanJob } from "../domain/scan";
import { upsertRepository } from "../db/repository";
import type { GithubClient } from "./client";

const TOPIC_QUERY = "topic:dsh-plugin";
const MAX_PAGES = 3;
const PER_PAGE = 100;

export interface DiscoveryRun {
	reposSeen: number;
	enqueued: number;
}

/**
 * Discover candidate repositories and enqueue scans for new / changed ones.
 *
 * v1.0 uses a single topic search with pagination. Time-window sharding (§6.4)
 * is persisted in `discovery_state` and will replace this once the topic grows
 * beyond a single pass.
 */
export async function runDiscovery(client: GithubClient, db: D1Database, queue: Queue<ScanJob>): Promise<DiscoveryRun> {
	let reposSeen = 0;
	let enqueued = 0;

	for (let page = 1; page <= MAX_PAGES; page++) {
		const res = await client.searchRepos(TOPIC_QUERY, page, PER_PAGE);
		for (const repo of res.items) {
			reposSeen++;
			const { id, changed } = await upsertRepository(db, repo);
			if (changed) {
				await queue.send({ repositoryId: id, owner: repo.owner.login, repo: repo.name, reason: "DISCOVERY" });
				enqueued++;
			}
		}
		if (res.items.length < PER_PAGE) break;
	}

	return { reposSeen, enqueued };
}
