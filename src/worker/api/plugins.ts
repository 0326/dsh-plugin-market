import { Hono } from "hono";
import { getPlugin, getPublisher, getStats, listPlugins, listPluginScans, upsertRepository } from "../db/repository";
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
	let owner: string | undefined;
	let repo: string | undefined;
	if (/^https?:\/\//i.test(t)) {
		try {
			const url = new URL(t);
			if (url.hostname.toLowerCase() !== "github.com" || url.search || url.hash) return null;
			const parts = url.pathname.split("/").filter(Boolean);
			if (parts.length !== 2) return null;
			[owner, repo] = parts;
		} catch {
			return null;
		}
	} else {
		const m = /^(?:github\.com\/)?([^/\s]+)\/([^/\s#?]+)$/.exec(t);
		if (!m) return null;
		[, owner, repo] = m;
	}
	if (!owner || !repo || !/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(repo)) return null;
	const normalizedRepo = repo.replace(/\.git$/, "");
	return normalizedRepo ? { owner, repo: normalizedRepo } : null;
}

api.get("/plugins", async (c) => {
	const q = c.req.query();
	const sort = q.sort === "stars" || q.sort === "new" || q.sort === "trending" ? q.sort : "updated";
	const items = await listPlugins(c.env.DB, {
		q: q.q,
		verifiedOnly: q.verified === "1" || q.verified === "true",
		featured: q.featured === "1" || q.featured === "true",
		status: q.status,
		capability: q.capability,
		pluginType: q.pluginType,
		compatibility: q.compatibility,
		risk: q.risk,
		sort,
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

api.get("/plugins/:owner/:repo/scans", async (c) => {
	const scans = await listPluginScans(c.env.DB, c.req.param("owner"), c.req.param("repo"));
	return c.json({ scans });
});

api.get("/plugins/:owner/:repo/scans/latest", async (c) => {
	const detail = await getPlugin(c.env.DB, c.req.param("owner"), c.req.param("repo"));
	if (!detail) return c.json({ error: "not_found" }, 404);
	return c.json({ commitSha: detail.latestCommitSha, scannerVersion: detail.scannerVersion, scannedAt: detail.scannedAt, findings: detail.findings });
});

api.get("/stats", async (c) => c.json(await getStats(c.env.DB)));

api.get("/categories", (c) => c.json({ capabilities: CAPABILITY, pluginTypes: PLUGIN_TYPE }));

api.get("/publishers/:owner", async (c) => {
	const pub = await getPublisher(c.env.DB, c.req.param("owner"));
	if (!pub) return c.json({ error: "not_found" }, 404);
	return c.json(pub);
});

api.get("/search", async (c) => {
	const q = c.req.query("q");
	if (!q) return c.json({ items: [], count: 0 });
	const items = await listPlugins(c.env.DB, { q, limit: 50 });
	return c.json({ items, count: items.length });
});

api.post("/submit", async (c) => {
	const contentLength = Number(c.req.header("content-length") ?? 0);
	if (contentLength > 4096) return c.json({ error: "request_too_large" }, 413);
	let url: string | undefined;
	try {
		const raw = await c.req.text();
		if (raw.length > 2048) return c.json({ error: "request_too_large" }, 413);
		const body = JSON.parse(raw) as { url?: unknown };
		url = typeof body?.url === "string" ? body.url : undefined;
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
	await c.env.SCAN_QUEUE.send({ repositoryId: id, owner: repo.owner.login, repo: repo.name, reason: "MANUAL" });
	return c.json({ owner: repo.owner.login, repo: repo.name, status: "queued" }, 202);
});
