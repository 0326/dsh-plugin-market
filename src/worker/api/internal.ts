import { Hono } from "hono";
import { recomputeFeatured } from "../curation/featured";
import { getRepositoryByFullName, setFeatured } from "../db/repository";
import type { Env } from "../env";
import { GithubClient } from "../github/client";
import { runDiscovery } from "../github/discovery";
import { syncBaseline } from "../npm/baseline";
import { enqueueRescanAll, processScanJob, TransientScanError } from "../queue/scan";

export const internal = new Hono<{ Bindings: Env }>();

async function secretsMatch(provided: string | undefined, expected: string): Promise<boolean> {
	if (!provided || !expected) return false;
	const encoder = new TextEncoder();
	const [providedHash, expectedHash] = await Promise.all([
		crypto.subtle.digest("SHA-256", encoder.encode(provided)),
		crypto.subtle.digest("SHA-256", encoder.encode(expected)),
	]);
	return crypto.subtle.timingSafeEqual(providedHash, expectedHash);
}

internal.use("*", async (c, next) => {
	const secret = c.req.header("x-internal-secret");
	if (!(await secretsMatch(secret, c.env.INTERNAL_API_SECRET))) return c.json({ error: "unauthorized" }, 401);
	await next();
});

internal.post("/discovery/run", async (c) => {
	const client = new GithubClient(c.env.GITHUB_TOKEN);
	c.executionCtx.waitUntil(
		(async () => {
			const run = await runDiscovery(client, c.env.DB, c.env.SCAN_QUEUE);
			console.log("discovery completed", JSON.stringify(run));
		})(),
	);
	return c.json({ status: "started" });
});

internal.post("/baseline/sync", async (c) => {
	const baseline = await syncBaseline(c.env);
	return c.json(baseline);
});

internal.post("/plugins/:owner/:repo/feature", async (c) => {
	const owner = c.req.param("owner");
	const repo = c.req.param("repo");
	let featured = true;
	try {
		const body = await c.req.json<{ featured?: boolean }>();
		featured = body?.featured ?? true;
	} catch {
		featured = true;
	}
	const ok = await setFeatured(c.env.DB, owner, repo, featured);
	if (!ok) return c.json({ error: "not_found" }, 404);
	return c.json({ owner, repo, featured });
});

internal.post("/featured/recompute", async (c) => {
	const result = await recomputeFeatured(c.env);
	return c.json(result);
});

internal.post("/rescan/queue", async (c) => {
	const result = await enqueueRescanAll(c.env);
	return c.json(result);
});

internal.post("/scan/:owner/:repo", async (c) => {
	const owner = c.req.param("owner");
	const repo = c.req.param("repo");
	const row = await getRepositoryByFullName(c.env.DB, owner + "/" + repo);
	if (!row) return c.json({ error: "not_found" }, 404);
	try {
		await processScanJob(c.env, { repositoryId: row.id, owner, repo, reason: "MANUAL" });
	} catch (err) {
		if (err instanceof TransientScanError) return c.json({ error: "rate_limited" }, 503);
		throw err;
	}
	return c.json({ owner, repo, status: "scanned" });
});
