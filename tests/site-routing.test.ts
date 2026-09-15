import { describe, expect, it } from "vitest";

import {
	WHITEPAPER_ORIGIN,
	whitepaperHrefForHost,
	whitepaperVersionsHrefForHost,
} from "../src/shared/site-routing";

describe("whitepaper host-aware links", () => {
	it("uses short relative paths inside the whitepaper subdomain", () => {
		expect(whitepaperHrefForHost("whitepaper.dsh-plugin.market", "v0.1.5-rc.2", "overview")).toBe("/v0.1.5-rc.2/overview");
		expect(whitepaperVersionsHrefForHost("whitepaper.dsh-plugin.market")).toBe("/versions");
	});

	it("uses absolute subdomain links from the market", () => {
		expect(whitepaperHrefForHost("dsh-plugin.market", "v0.1.5-rc.2", "overview")).toBe(`${WHITEPAPER_ORIGIN}/v0.1.5-rc.2/overview`);
		expect(whitepaperVersionsHrefForHost("dsh-plugin.market")).toBe(`${WHITEPAPER_ORIGIN}/versions`);
	});

	it("keeps legacy paths for local and preview hosts", () => {
		expect(whitepaperHrefForHost("localhost", "v0.1.5-rc.2", "overview")).toBe("/whitepaper/v0.1.5-rc.2/overview");
		expect(whitepaperVersionsHrefForHost("preview.example.workers.dev")).toBe("/whitepaper/versions");
	});
});
