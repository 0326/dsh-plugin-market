import type { Env } from "../env";
import { GithubClient } from "../github/client";
import { runDiscovery, type DiscoveryRun } from "../github/discovery";

/** Cron entrypoint: discover candidates and enqueue scans only. */
export async function runCronDiscovery(env: Env, maxReposPerRun?: number): Promise<DiscoveryRun> {
	const client = new GithubClient(env.GITHUB_TOKEN);
	return runDiscovery(client, env.DB, env.SCAN_QUEUE, maxReposPerRun);
}
