import { describe, expect, it } from "vitest";

import type { PluginDetail, PluginListItem } from "../src/worker/db/repository";
import type { PluginReadmeContent } from "../src/worker/github/readme-content";
import { buildPluginJsonLd, buildPluginSeoBody, buildSitemapXml, isSeoPagePath, resolveSeoSpec } from "../src/worker/seo";

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

function pluginDetail(): PluginDetail {
	return {
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
}

describe("buildSitemapXml", () => {
	it("includes static, guide, plugin, and publisher URLs with lastmod", () => {
		const xml = buildSitemapXml([plugin()]);
		expect(xml).toContain("https://dsh-plugin.market/");
		expect(xml).toContain("https://dsh-plugin.market/plugins");
		expect(xml).toContain("https://dsh-plugin.market/trust");
		expect(xml).toContain("https://dsh-plugin.market/guide/what-is-dsh-plugin");
		expect(xml).toContain("https://dsh-plugin.market/guide/install-dsh-plugin");
		expect(xml).toContain("https://dsh-plugin.market/guide/choose-dsh-plugin");
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

describe("guide SEO", () => {
	it("serves all supported guides through the SEO worker", () => {
		expect(isSeoPagePath("/guide/what-is-dsh-plugin")).toBe(true);
		expect(isSeoPagePath("/guide/install-dsh-plugin")).toBe(true);
		expect(isSeoPagePath("/guide/choose-dsh-plugin")).toBe(true);
		expect(isSeoPagePath("/guide/not-a-guide")).toBe(true);
	});

	it("returns indexable metadata and BreadcrumbList for a supported guide", async () => {
		const spec = await resolveSeoSpec("/guide/install-dsh-plugin", {} as D1Database);
		expect(spec.status).toBeUndefined();
		expect(spec.canonicalPath).toBe("/guide/install-dsh-plugin");
		expect(spec.robots).toContain("index,follow");
		expect(spec.title).toContain("Install a DSH Plugin");
		expect(JSON.stringify(spec.jsonLd)).toContain("BreadcrumbList");
		expect(JSON.stringify(spec.jsonLd)).toContain("DeepSeek Harness");
	});

	it("returns a real noindex 404 spec for unknown guide paths", async () => {
		const spec = await resolveSeoSpec("/guide/not-a-guide", {} as D1Database);
		expect(spec.status).toBe(404);
		expect(spec.robots).toBe("noindex,nofollow");
	});
});

describe("buildPluginJsonLd", () => {
	it("exposes plugin identity and trust signals", () => {
		const detail = pluginDetail();
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

describe("buildPluginSeoBody", () => {
	it("renders indexable plugin detail and README HTML pinned to the scanned commit", () => {
		const readme: PluginReadmeContent = {
			owner: "acme",
			repo: "dsh-demo",
			path: "docs/README.md",
			language: "unknown",
			fallback: false,
			ref: "abc123",
			html: '<h2>Install</h2><p><a href="guide.md">Guide</a></p><img src="images/demo.png">',
			sourceUrl: "https://github.com/acme/dsh-demo/blob/abc123/docs/README.md",
		};
		const html = buildPluginSeoBody(pluginDetail(), readme);
		expect(html).toContain("acme/dsh-demo");
		expect(html).toContain("FORMAT_VERIFIED");
		expect(html).toContain("COMPATIBLE");
		expect(html).toContain("README");
		expect(html).toContain("<h2>Install</h2>");
		expect(html).toContain("https://github.com/acme/dsh-demo/blob/abc123/docs/guide.md");
		expect(html).toContain("https://raw.githubusercontent.com/acme/dsh-demo/abc123/docs/images/demo.png");
	});
});
