import type { Env } from "../env";
import { GithubClient } from "../github/client";
import { runDiscovery } from "../github/discovery";

/** Cron entrypoint: discover candidates and enqueue scans only. */
export async function runCronDiscovery(env: Env): Promise<void> {
	try {
		const client = new GithubClient(env.GITHUB_TOKEN);
		const run = await runDiscovery(client, env.DB, env.SCAN_QUEUE);
		console.log("discovery completed", JSON.stringify(run));
	} catch (err) {
		console.error("discovery failed", err);
	}
}
