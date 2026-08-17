import { Hono } from "hono";
import { api } from "./api/plugins";
import { internal } from "./api/internal";
import { runCronDiscovery } from "./cron/discovery";
import type { ScanJob } from "./domain/scan";
import type { Env } from "./env";
import { recomputeFeatured } from "./curation/featured";
import { syncBaseline } from "./npm/baseline";
import { enqueueRescanAll, processScanJob, TransientScanError } from "./queue/scan";

const app = new Hono<{ Bindings: Env }>();

app.get("/api/", (c) => c.json({ name: "dsh-plugin-market", status: "ok" }));
app.route("/api", api);
app.route("/api/internal", internal);

/** Daily cron that queues a re-scan of repos with a stale scanner version. */
const RESCAN_CRON = "30 0 * * *";

async function scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
	if (controller.cron === RESCAN_CRON) {
		ctx.waitUntil(
			(async () => {
				try {
					const result = await enqueueRescanAll(env);
					console.log("rescan queued", JSON.stringify(result));
				} catch (err) {
					console.error("rescan queue failed", err);
				}
			})(),
		);
		return;
	}
	ctx.waitUntil(
		(async () => {
			await Promise.allSettled([runCronDiscovery(env), syncBaseline(env), recomputeFeatured(env)]);
		})(),
	);
}

/** Number of scan jobs processed concurrently within a single batch. */
const SCAN_CONCURRENCY = 3;

async function queue(batch: MessageBatch<ScanJob>, env: Env): Promise<void> {
	const messages = [...batch.messages];
	let cursor = 0;

	async function worker(): Promise<void> {
		while (cursor < messages.length) {
			const message = messages[cursor++];
			try {
				await processScanJob(env, message.body);
				message.ack();
			} catch (err) {
				if (err instanceof TransientScanError) {
					if (message.attempts < 5) message.retry({ delaySeconds: 30 * (message.attempts + 1) });
					else message.ack();
				} else {
					console.error(JSON.stringify({ message: "scan job error", error: err instanceof Error ? err.message : String(err), repositoryId: message.body.repositoryId }));
					message.ack();
				}
			}
		}
	}

	await Promise.all(Array.from({ length: Math.min(SCAN_CONCURRENCY, messages.length) }, () => worker()));
}

// Cloudflare Workers module format: every handler (fetch / scheduled / queue)
// must be a property of the default export object. A top-level named export is
// not recognized as a handler, which caused "Queue handler is missing" (11001).
export default {
	fetch: app.fetch,
	scheduled,
	queue,
};
