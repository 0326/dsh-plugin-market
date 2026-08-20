import { Hono } from "hono";
import { countPlugins, getBaseline, getPlugin, getPublisher, listPlugins, listPluginScans, updateRepositoryPreviewImage, upsertRepository } from "../db/repository";
import { getRegistryStats } from "../db/registry";
import { CAPABILITY, PLUGIN_TYPE } from "../domain/plugin";
import { SCANNER_VERSION } from "../domain/scan";
import type { Env } from "../env";
import { GithubClient, GithubError, type GithubRepo } from "../github/client";
import { loadPluginReadme, type ReadmeLanguage } from "../github/readme-content";

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
	const sort: "updated" | "stars" | "new" | "trending" = q.sort === "stars" || q.sort === "new" || q.sort === "trending" ? q.sort : "updated";
	const options = {
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
	};
	const [items, total] = await Promise.all([listPlugins(c.env.DB, options), countPlugins(c.env.DB, options)]);
	return c.json({ items, total, limit: options.limit, offset: options.offset, hasMore: options.offset + items.length < total });
});

api.get("/plugins/:owner/:repo/readme", async (c) => {
	const owner = c.req.param("owner");
	const repo = c.req.param("repo");
	const language: ReadmeLanguage = c.req.query("lang") === "en" ? "en" : "zh";
	const detail = await getPlugin(c.env.DB, owner, repo);
	if (!detail) return c.json({ error: "not_found" }, 404);

	try {
		const readme = await loadPluginReadme({
			detail,
			language,
			githubToken: c.env.GITHUB_TOKEN,
			origin: new URL(c.req.url).origin,
			waitUntil: (promise) => c.executionCtx.waitUntil(promise),
		});
		if (!readme) return c.json({ error: "readme_not_found" }, 404);
		c.header("Cache-Control", "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400");
		return c.json(readme);
	} catch (err) {
		if (err instanceof GithubError && err.rateLimited) {
			if (err.retryAfterSeconds !== undefined) c.header("Retry-After", String(err.retryAfterSeconds));
			return c.json({ error: "github_rate_limited" }, 503);
		}
		if (err instanceof GithubError && err.status === 404) return c.json({ error: "readme_not_found" }, 404);
		throw err;
	}
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

api.get("/stats", async (c) => c.json(await getRegistryStats(c.env.DB)));

api.get("/context", async (c) => {
	const [stats, baseline] = await Promise.all([getRegistryStats(c.env.DB), getBaseline(c.env.DB)]);
	return c.json({
		stats,
		scannerVersion: SCANNER_VERSION,
		baseline,
	});
});

api.get("/categories", (c) => c.json({ capabilities: CAPABILITY, pluginTypes: PLUGIN_TYPE }));

api.get("/publishers/:owner", async (c) => {
	const pub = await getPublisher(c.env.DB, c.req.param("owner"));
	if (!pub) return c.json({ error: "not_found" }, 404);
	return c.json(pub);
});

api.get("/search", async (c) => {
	const q = c.req.query("q");
	if (!q) return c.json({ items: [], total: 0, limit: 50, offset: 0, hasMore: false });
	const options = { q, limit: 50, offset: 0 };
	const [items, total] = await Promise.all([listPlugins(c.env.DB, options), countPlugins(c.env.DB, options)]);
	return c.json({ items, total, limit: 50, offset: 0, hasMore: items.length < total });
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
	try {
		const urls = await client.getOpenGraphImageUrls([{ owner: repo.owner.login, name: repo.name }]);
		const preview = urls.get(repo.full_name);
		if (preview) await updateRepositoryPreviewImage(c.env.DB, repo.full_name, preview);
	} catch (err) {
		console.warn("preview image fetch failed for " + repo.full_name, err instanceof Error ? err.message : String(err));
	}
	await c.env.SCAN_QUEUE.send({ repositoryId: id, owner: repo.owner.login, repo: repo.name, reason: "MANUAL" });
	return c.json({ owner: repo.owner.login, repo: repo.name, status: "queued" }, 202);
});
