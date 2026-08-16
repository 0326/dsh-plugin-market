import { Hono } from "hono";
import { api } from "./api/plugins";
import { internal } from "./api/internal";
import { runCronDiscovery } from "./cron/discovery";
import type { ScanJob } from "./domain/scan";
import type { Env } from "./env";
import { syncBaseline } from "./npm/baseline";
import { processScanJob, TransientScanError } from "./queue/scan";

const app = new Hono<{ Bindings: Env }>();

app.get("/api/", (c) => c.json({ name: "dsh-plugin-market", status: "ok" }));
app.route("/api", api);
app.route("/api/internal", internal);

async function scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
	ctx.waitUntil(
		(async () => {
			await Promise.allSettled([runCronDiscovery(env), syncBaseline(env)]);
		})(),
	);
}

async function queue(batch: MessageBatch<ScanJob>, env: Env): Promise<void> {
	for (const message of batch.messages) {
		try {
			await processScanJob(env, message.body);
			message.ack();
		} catch (err) {
			if (err instanceof TransientScanError) {
				if (message.attempts < 3) message.retry({ delaySeconds: 30 * (message.attempts + 1) });
				else message.ack();
			} else {
				console.error(JSON.stringify({ message: "scan job error", error: err instanceof Error ? err.message : String(err), repositoryId: message.body.repositoryId }));
				message.ack();
			}
		}
	}
}

// Cloudflare Workers module format: every handler (fetch / scheduled / queue)
// must be a property of the default export object. A top-level named export is
// not recognized as a handler, which caused "Queue handler is missing" (11001).
export default {
	fetch: app.fetch,
	scheduled,
	queue,
};
