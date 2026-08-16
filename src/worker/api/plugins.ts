import { Hono } from "hono";
import { getPlugin, listPlugins, upsertRepository } from "../db/repository";
import { CAPABILITY, PLUGIN_TYPE } from "../domain/plugin";
import type { Env } from "../env";
import { GithubClient, GithubError, type GithubRepo } from "../github/client";

export const api = new Hono<{ Bindings: Env }>();

function clampInt(raw: string | undefined, def: number, min: number, max: number): number {
	const n = Number(raw);
	if (!Number.isFinite(n)) return def;
	return Math.min(max, Math.max(min, Math.floor(n)));
}

function parseRepoUrl(input: string | undefined): { owner: string; repo: string } | null {
	if (!input) return null;
	const t = input.trim();
	let m = /^https?:\/\/github\.com\/([^/\s]+)\/([^/\s#?]+)/.exec(t);
	if (!m) m = /^(?:github\.com\/)?([^/\s]+)\/([^/\s#?]+)$/.exec(t);
	if (!m) return null;
	return { owner: m[1], repo: m[2].replace(/\.git$/, "") };
}

api.get("/plugins", async (c) => {
	const q = c.req.query();
	const items = await listPlugins(c.env.DB, {
		q: q.q,
		verifiedOnly: q.verified === "1" || q.verified === "true",
		status: q.status,
		sort: q.sort === "stars" || q.sort === "new" ? q.sort : "updated",
		limit: clampInt(q.limit, 50, 1, 100),
		offset: clampInt(q.offset, 0, 0, 100000),
	});
	return c.json({ items, count: items.length });
});

api.get("/plugins/:owner/:repo", async (c) => {
	const detail = await getPlugin(c.env.DB, c.req.param("owner"), c.req.param("repo"));
	if (!detail) return c.json({ error: "not_found" }, 404);
	return c.json(detail);
});

api.get("/plugins/:owner/:repo/scans/latest", async (c) => {
	const detail = await getPlugin(c.env.DB, c.req.param("owner"), c.req.param("repo"));
	if (!detail) return c.json({ error: "not_found" }, 404);
	return c.json({ commitSha: detail.latestCommitSha, scannerVersion: detail.scannerVersion, scannedAt: detail.scannedAt, findings: detail.findings });
});

api.get("/categories", (c) => c.json({ capabilities: CAPABILITY, pluginTypes: PLUGIN_TYPE }));

api.get("/search", async (c) => {
	const q = c.req.query("q");
	if (!q) return c.json({ items: [], count: 0 });
	const items = await listPlugins(c.env.DB, { q, limit: 50 });
	return c.json({ items, count: items.length });
});

api.post("/submit", async (c) => {
	let url: string | undefined;
	try {
		const body = await c.req.json<{ url?: string }>();
		url = body?.url;
	} catch {
		url = undefined;
	}
	const parsed = parseRepoUrl(url);
	if (!parsed) return c.json({ error: "invalid_github_url" }, 400);

	const client = new GithubClient(c.env.GITHUB_TOKEN);
	let repo: GithubRepo;
	try {
		repo = await client.getRepo(parsed.owner, parsed.repo);
	} catch (err) {
		if (err instanceof GithubError && err.status === 404) return c.json({ error: "repository_not_found" }, 404);
		throw err;
	}
	const { id } = await upsertRepository(c.env.DB, repo);
	await c.env.SCAN_QUEUE.send({ repositoryId: id, owner: parsed.owner, repo: parsed.repo, reason: "MANUAL" });
	return c.json({ owner: parsed.owner, repo: parsed.repo, status: "queued" });
});
