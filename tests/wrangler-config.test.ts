import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

interface WranglerConfig {
	triggers?: { crons?: string[] };
	queues?: { consumers?: Array<{ max_concurrency?: number; max_retries?: number; dead_letter_queue?: string }> };
	vars?: Record<string, string>;
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
});
