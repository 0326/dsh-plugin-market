import { Hono } from "hono";
import { api } from "./api/plugins";
import { internal } from "./api/internal";
import { runCronDiscovery } from "./cron/discovery";
import { isRescanSweepJob, type ScanQueueJob } from "./domain/scan";
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

/** Daily cron that starts a paged re-scan of repos with a stale scanner version. */
const RESCAN_CRON = "30 0 * * *";

/**
 * Public reads are intentionally cacheable because the registry only changes on
 * discovery / scan activity. Caching here (rather than only sending response
 * headers) prevents repeated requests from reaching D1 at every edge request.
 */
function publicCacheTtl(pathname: string): number | null {
	if (pathname === "/sitemap.xml") return 1_800;
	if (isSeoPagePath(pathname)) return 600;
	if (pathname === "/api/stats" || pathname === "/api/context") return 3_600;
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
	if (controller.cron === RESCAN_CRON) {
		ctx.waitUntil(
			(async () => {
				try {
					const result = await startRescanSweep(env);
					console.log("rescan sweep started", JSON.stringify(result));
				} catch (err) {
					console.error("rescan sweep start failed", err);
				}
				// Existing scans are already auto-featured as they complete. A daily
				// backfill is enough to catch repositories that crossed the star gate
				// without a new scan, and avoids a full-registry read every hour.
				try {
					const result = await recomputeFeatured(env);
					console.log("featured backfill completed", JSON.stringify(result));
				} catch (err) {
					console.error("featured backfill failed", err);
				}
			})(),
		);
		return;
	}
	ctx.waitUntil(
		(async () => {
			await Promise.allSettled([runCronDiscovery(env), syncBaseline(env)]);
		})(),
	);
}

/** Number of scan/control jobs processed concurrently within a single batch. */
const SCAN_CONCURRENCY = 3;

async function queue(batch: MessageBatch<ScanQueueJob>, env: Env): Promise<void> {
	const messages = [...batch.messages];
	let cursor = 0;

	async function worker(): Promise<void> {
		while (cursor < messages.length) {
			const message = messages[cursor++];
			const body = message.body;
			const isSweep = isRescanSweepJob(body);
			try {
				if (isSweep) {
					const result = await processRescanSweepJob(env, body);
					console.log("rescan sweep page", JSON.stringify(result));
				} else {
					await processScanJob(env, body);
				}
				message.ack();
			} catch (err) {
				if (isSweep) {
					console.error(JSON.stringify({ message: "rescan sweep page error", error: err instanceof Error ? err.message : String(err), afterRepositoryId: body.afterRepositoryId }));
					if (message.attempts < 5) message.retry({ delaySeconds: 30 * (message.attempts + 1) });
					else message.ack();
				} else if (err instanceof TransientScanError) {
					if (message.attempts < 5) message.retry({ delaySeconds: 30 * (message.attempts + 1) });
					else message.ack();
				} else {
					console.error(JSON.stringify({ message: "scan job error", error: err instanceof Error ? err.message : String(err), repositoryId: body.repositoryId }));
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
