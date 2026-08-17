import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

interface WranglerConfig {
	triggers?: { crons?: string[] };
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
});
