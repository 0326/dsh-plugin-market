import { describe, expect, it } from "vitest";

import type { PluginDetail, PluginListItem } from "../src/worker/db/repository";
import { buildPluginJsonLd, buildSitemapXml } from "../src/worker/seo";

function plugin(overrides: Partial<PluginListItem> = {}): PluginListItem {
	return {
		owner: "acme",
		repo: "dsh-demo",
		fullName: "acme/dsh-demo",
		description: "A demo DSH plugin",
		stars: 10,
		verificationStatus: "FORMAT_VERIFIED",
		compatibilityStatus: "COMPATIBLE",
		securityStatus: "PASS",
		maintenanceStatus: "ACTIVE",
		riskLevel: "LOW",
		packageName: "@acme/dsh-demo",
		latestCommitSha: "abc123",
		updatedAt: "2026-08-17T06:00:00.000Z",
		previewImageUrl: null,
		...overrides,
	};
}

describe("buildSitemapXml", () => {
	it("includes static, trust, plugin, and publisher URLs with lastmod", () => {
		const xml = buildSitemapXml([plugin()]);
		expect(xml).toContain("https://dsh-plugin.market/");
		expect(xml).toContain("https://dsh-plugin.market/plugins");
		expect(xml).toContain("https://dsh-plugin.market/trust");
		expect(xml).toContain("https://dsh-plugin.market/plugin/acme/dsh-demo");
		expect(xml).toContain("https://dsh-plugin.market/publisher/acme");
		expect(xml).toContain("2026-08-17T06:00:00.000Z");
	});

	it("URL-encodes path segments", () => {
		const xml = buildSitemapXml([plugin({ owner: "acme team", repo: "plugin one" })]);
		expect(xml).toContain("/plugin/acme%20team/plugin%20one");
		expect(xml).toContain("/publisher/acme%20team");
	});
});

describe("buildPluginJsonLd", () => {
	it("exposes plugin identity and trust signals", () => {
		const detail: PluginDetail = {
			...plugin(),
			htmlUrl: "https://github.com/acme/dsh-demo",
			forks: 2,
			licenseSpdx: "MIT",
			featured: 1,
			metadataJson: JSON.stringify({ packageVersion: "1.2.3", capabilities: ["search"], pluginTypes: ["tool"] }),
			scannerVersion: "1.0.0",
			scannedAt: "2026-08-17T06:00:00.000Z",
			findings: [],
		};
		const json = buildPluginJsonLd(detail, "/plugin/acme/dsh-demo", "A demo DSH plugin") as { "@graph": Array<Record<string, unknown>> };
		const software = json["@graph"].find((node) => node["@type"] === "SoftwareSourceCode");
		expect(software).toBeTruthy();
		expect(software?.codeRepository).toBe("https://github.com/acme/dsh-demo");
		expect(software?.version).toBe("1.2.3");
		expect(String(software?.keywords)).toContain("DeepSeek Harness");
		expect(JSON.stringify(software?.additionalProperty)).toContain("FORMAT_VERIFIED");
		expect(JSON.stringify(software?.additionalProperty)).toContain("abc123");
	});
});
