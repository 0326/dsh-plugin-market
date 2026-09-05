import { Hono } from "hono";
import { api } from "./api/plugins";
import { internal } from "./api/internal";
import { runCronDiscovery } from "./cron/discovery";
import { isRescanSweepJob, type ScanQueueJob } from "./domain/scan";
import { finishPipelineRun, finishScanAttempt, snapshotRegistryMetrics, startPipelineRun, startScanAttempt } from "./db/operations";
import { canonicalRedirect } from "./canonical";
import type { Env } from "./env";
import { recomputeFeatured } from "./curation/featured";
import { syncBaseline } from "./npm/baseline";
import { processRescanSweepJob, processScanJob, startRescanSweep, TransientScanError } from "./queue/scan";
import { applyPluginIndexability, renderIndexableSitemap } from "./seo-indexability";
import { isSeoPagePath, renderSeoPage } from "./seo";

const app = new Hono<{ Bindings: Env }>();

app.get("/api/", (c) => c.json({ name: "dsh-plugin-market", status: "ok" }));
app.route("/api", api);
app.route("/api/internal", internal);

const INCREMENTAL_DISCOVERY_CRON = "15 * * * *";
const RECONCILE_DISCOVERY_CRON = "20 2 * * *";
const BASELINE_CRON = "5 */6 * * *";
const DAILY_METRICS_CRON = "35 3 * * *";
const RESCAN_CRON = "50 3 * * *";
/** Bump only when a public response shape or SEO document changes. */
const PUBLIC_CACHE_VERSION = "2026-09-05-ops-v1";

function positiveInt(raw: string | undefined, fallback: number): number {
	const value = Number(raw);
	return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

async function trackedPipeline(
	env: Env,
	kind: Parameters<typeof startPipelineRun>[1],
	work: () => Promise<Record<string, unknown>>,
): Promise<void> {
	const id = await startPipelineRun(env.DB, kind);
	try {
		const detail = await work();
		await finishPipelineRun(env.DB, id, "completed", detail);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		await finishPipelineRun(env.DB, id, "failed", {}, message);
		throw err;
	}
}

/**
 * Public reads are intentionally cacheable because the registry only changes on
 * discovery / scan activity. Caching here (rather than only sending response
 * headers) prevents repeated requests from reaching D1 at every edge request.
 */
function publicCacheTtl(pathname: string): number | null {
	if (pathname === "/sitemap.xml") return 1_800;
	if (isSeoPagePath(pathname)) return 600;
	if (pathname === "/api/stats" || pathname === "/api/context" || pathname === "/api/home") return 600;
	if (pathname === "/api/categories") return 86_400;
	if (pathname === "/api/plugins") return 600;
	if (/^\/api\/publishers\/[^/]+\/?$/.test(pathname)) return 600;
	if (/^\/api\/plugins\/[^/]+\/[^/]+\/readme\/?$/.test(pathname)) return 3_600;
	if (/^\/api\/plugins\/[^/]+\/[^/]+\/?$/.test(pathname)) return 600;
	return null;
}

function publicCacheKey(request: Request, pathname: string): Request {
	const url = new URL(request.url);
	// SEO output is derived from the pathname only. Ignore explore/search query
	// parameters so crawlers do not create thousands of equivalent cache keys.
	if (isSeoPagePath(pathname)) url.search = "";
	// Cache API entries persist independently of a Worker deployment. Versioning
	// the internal key makes schema/UI releases immediately observable without
	// asking visitors to wait for an old edge entry to expire.
	url.searchParams.set("__dsh_cache", PUBLIC_CACHE_VERSION);
	return new Request(url.toString(), { method: "GET" });
}

async function cachedPublicGet(
	request: Request,
	ctx: ExecutionContext,
	pathname: string,
	ttlSeconds: number,
	load: () => Promise<Response>,
): Promise<Response> {
	// Keep the cache strictly for anonymous public reads so future authenticated
	// endpoints cannot accidentally inherit this behavior.
	if (request.headers.has("authorization") || request.headers.has("cookie")) return load();

	const cache = caches.default;
	const cacheKey = publicCacheKey(request, pathname);
	const hit = await cache.match(cacheKey);
	if (hit) return hit;

	const response = await load();
	if (!response.ok || response.headers.has("set-cookie")) return response;

	const headers = new Headers(response.headers);
	headers.set("cache-control", `public, max-age=60, s-maxage=${ttlSeconds}, stale-while-revalidate=86400`);
	const cachedResponse = new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
	ctx.waitUntil(
		cache.put(cacheKey, cachedResponse.clone()).catch((err) => {
			console.warn("public cache put failed", err instanceof Error ? err.message : String(err));
		}),
	);
	return cachedResponse;
}

async function scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
	if (controller.cron === INCREMENTAL_DISCOVERY_CRON || controller.cron === RECONCILE_DISCOVERY_CRON) {
		const isReconcile = controller.cron === RECONCILE_DISCOVERY_CRON;
		ctx.waitUntil(
			(async () => {
				try {
					await trackedPipeline(env, isReconcile ? "discovery_reconcile" : "discovery_incremental", async () => {
						const result = await runCronDiscovery(env, isReconcile ? positiveInt(env.DISCOVERY_RECONCILE_LIMIT, 800) : positiveInt(env.DISCOVERY_INCREMENTAL_LIMIT, 100));
						console.log("discovery completed", JSON.stringify(result));
						return { ...result };
					});
				} catch (err) {
					console.error("discovery cron failed", err);
				}
			})(),
		);
		return;
	}
	if (controller.cron === BASELINE_CRON) {
		ctx.waitUntil(
			(async () => {
				try {
					await trackedPipeline(env, "baseline_sync", async () => {
						const baseline = await syncBaseline(env);
						return { baseline };
					});
				} catch (err) {
					console.error("baseline cron failed", err);
				}
			})(),
		);
		return;
	}
	if (controller.cron === DAILY_METRICS_CRON) {
		ctx.waitUntil(
			(async () => {
				try {
					await trackedPipeline(env, "daily_metrics", async () => snapshotRegistryMetrics(env.DB));
				} catch (err) {
					console.error("daily metrics snapshot failed", err);
				}
			})(),
		);
		return;
	}
	if (controller.cron === RESCAN_CRON) {
		ctx.waitUntil(
			(async () => {
				try {
					await trackedPipeline(env, "rescan_sweep", async () => {
						const [result, featured] = await Promise.all([startRescanSweep(env), recomputeFeatured(env)]);
						return { ...result, featured };
					});
				} catch (err) {
					console.error("rescan sweep failed", err);
				}
			})(),
		);
		return;
	}
	ctx.waitUntil(
		(async () => {
			console.warn("unknown cron trigger", controller.cron);
		})(),
	);
}

/** Number of scan/control jobs processed concurrently within a single batch. */
const SCAN_CONCURRENCY = 1;

async function queue(batch: MessageBatch<ScanQueueJob>, env: Env): Promise<void> {
	const messages = [...batch.messages];
	let cursor = 0;

	async function worker(): Promise<void> {
		while (cursor < messages.length) {
			const message = messages[cursor++];
			const body = message.body;
			const isSweep = isRescanSweepJob(body);
			let attemptId: number | null = null;
			try {
				if (isSweep) {
					const result = await processRescanSweepJob(env, body);
					console.log("rescan sweep page", JSON.stringify(result));
				} else {
					attemptId = await startScanAttempt(env.DB, body.repositoryId, body.reason, message.attempts);
					await processScanJob(env, body);
					await finishScanAttempt(env.DB, attemptId, "completed");
				}
				message.ack();
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : String(err);
				if (isSweep) {
					console.error(JSON.stringify({ message: "rescan sweep page error", error: errorMessage, afterRepositoryId: body.afterRepositoryId }));
					message.retry({ delaySeconds: Math.min(600, 30 * (message.attempts + 1)) });
				} else if (err instanceof TransientScanError) {
					if (attemptId !== null) await finishScanAttempt(env.DB, attemptId, "retrying", errorMessage);
					message.retry({ delaySeconds: Math.min(600, 30 * (message.attempts + 1)) });
				} else {
					if (attemptId !== null) await finishScanAttempt(env.DB, attemptId, "failed", errorMessage);
					console.error(JSON.stringify({ message: "scan job error", error: errorMessage, repositoryId: body.repositoryId }));
					message.ack();
				}
			}
		}
	}

	await Promise.all(Array.from({ length: Math.min(SCAN_CONCURRENCY, messages.length) }, () => worker()));
}

async function fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
	const redirect = canonicalRedirect(request);
	if (redirect) return redirect;

	const url = new URL(request.url);
	const ttl = request.method === "GET" ? publicCacheTtl(url.pathname) : null;
	const load = async (): Promise<Response> => {
		if (url.pathname === "/compare" || url.pathname === "/changes") return env.ASSETS.fetch(request);
		if (url.pathname === "/sitemap.xml") return renderIndexableSitemap(env.DB);
		if (isSeoPagePath(url.pathname)) {
			const response = await renderSeoPage(request, env, ctx);
			return applyPluginIndexability(response, url.pathname, env.DB);
		}
		return app.fetch(request, env, ctx);
	};

	return ttl === null ? load() : cachedPublicGet(request, ctx, url.pathname, ttl, load);
}

// Cloudflare Workers module format: every handler (fetch / scheduled / queue)
// must be a property of the default export object.
export default {
	fetch,
	scheduled,
	queue,
};
