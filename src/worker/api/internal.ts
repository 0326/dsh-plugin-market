import { Hono } from "hono";
import { getRepositoryByFullName, setFeatured } from "../db/repository";
import type { Env } from "../env";
import { GithubClient } from "../github/client";
import { runDiscovery } from "../github/discovery";
import { syncBaseline } from "../npm/baseline";
import { processScanJob, TransientScanError } from "../queue/scan";

export const internal = new Hono<{ Bindings: Env }>();

internal.use("*", async (c, next) => {
	const secret = c.req.header("x-internal-secret");
	if (!secret || secret !== c.env.INTERNAL_API_SECRET) return c.json({ error: "unauthorized" }, 401);
	await next();
});

internal.post("/discovery/run", async (c) => {
	const client = new GithubClient(c.env.GITHUB_TOKEN);
	const run = await runDiscovery(client, c.env.DB, c.env.SCAN_QUEUE);
	return c.json(run);
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
