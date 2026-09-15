import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

interface WranglerConfig {
	triggers?: { crons?: string[] };
	queues?: { consumers?: Array<{ max_concurrency?: number; max_retries?: number; dead_letter_queue?: string }> };
	vars?: Record<string, string>;
	assets?: { run_worker_first?: string[] };
}

describe("wrangler cron configuration", () => {
	it("uses Cloudflare's five-field cron syntax", () => {
		const config = JSON.parse(readFileSync("wrangler.json", "utf8")) as WranglerConfig;
		const crons = config.triggers?.crons ?? [];

		expect(crons.length).toBeGreaterThan(0);
		for (const cron of crons) {
			expect(cron.trim().split(/\s+/)).toHaveLength(5);
		}
	});

	it("keeps scan throughput bounded and preserves failed messages", () => {
		const config = JSON.parse(readFileSync("wrangler.json", "utf8")) as WranglerConfig;
		const consumer = config.queues?.consumers?.[0];

		expect(consumer?.max_concurrency).toBe(1);
		expect(consumer?.max_retries).toBeGreaterThanOrEqual(3);
		expect(consumer?.dead_letter_queue).toBeTruthy();
		expect(config.vars?.RESCAN_DAILY_BUDGET).toBe("250");
	});

	it("keeps whitepaper redirects and SEO endpoints worker-first", () => {
		const config = JSON.parse(readFileSync("wrangler.json", "utf8")) as WranglerConfig;
		const routes = config.assets?.run_worker_first ?? [];

		for (const path of ["/", "/whitepaper", "/whitepaper/*", "/latest", "/latest/*", "/robots.txt", "/sitemap.xml"]) {
			expect(routes).toContain(path);
		}
	});
});
