import { describe, expect, it } from "vitest";

import type { PluginListItem } from "../src/worker/db/repository";
import {
	detailIsIndexable,
	filterIndexableSitemapItems,
	isPluginIndexable,
	type SitemapCandidate,
} from "../src/worker/seo-indexability";
import { buildSitemapXml } from "../src/worker/seo";

function plugin(overrides: Partial<SitemapCandidate> = {}): SitemapCandidate {
	return {
		owner: "acme",
		repo: "dsh-demo",
		fullName: "acme/dsh-demo",
		description: "A demo DSH plugin",
		stars: 10,
		verificationStatus: "FORMAT_VERIFIED",
		compatibilityStatus: "COMPATIBLE",
		securityStatus: "PASSED",
		maintenanceStatus: "ACTIVE",
		riskLevel: "LOW",
		packageName: "@acme/dsh-demo",
		latestCommitSha: "abc123",
		updatedAt: "2026-08-20T06:00:00.000Z",
		previewImageUrl: null,
		pluginTypesJson: JSON.stringify(["TOOL"]),
		...overrides,
	};
}

describe("plugin SEO indexability", () => {
	it("indexes detected, format-verified, and featured plugins", () => {
		for (const verificationStatus of ["DETECTED", "FORMAT_VERIFIED", "FEATURED"]) {
			expect(isPluginIndexable({ verificationStatus, pluginTypes: ["TOOL"] })).toBe(true);
		}
	});

	it("keeps candidates and rejected records out of the index", () => {
		expect(isPluginIndexable({ verificationStatus: "CANDIDATE", pluginTypes: ["TOOL"] })).toBe(false);
		expect(isPluginIndexable({ verificationStatus: "REJECTED", pluginTypes: ["TOOL"] })).toBe(false);
	});

	it("never indexes records classified as NON_PLUGIN", () => {
		expect(isPluginIndexable({ verificationStatus: "FORMAT_VERIFIED", pluginTypes: ["NON_PLUGIN"] })).toBe(false);
		expect(
			detailIsIndexable({
				verificationStatus: "FORMAT_VERIFIED",
				metadataJson: JSON.stringify({ pluginTypes: ["NON_PLUGIN"] }),
			}),
		).toBe(false);
	});
});

describe("sitemap indexability", () => {
	it("only emits indexable plugin and publisher URLs", () => {
		const candidates = [
			plugin({ owner: "verified", repo: "plugin" }),
			plugin({ owner: "detected", repo: "plugin", verificationStatus: "DETECTED" }),
			plugin({ owner: "candidate", repo: "plugin", verificationStatus: "CANDIDATE" }),
			plugin({ owner: "rejected", repo: "plugin", verificationStatus: "REJECTED" }),
			plugin({ owner: "not-plugin", repo: "repo", pluginTypesJson: JSON.stringify(["NON_PLUGIN"]) }),
		];

		const items: PluginListItem[] = filterIndexableSitemapItems(candidates);
		const xml = buildSitemapXml(items);

		expect(xml).toContain("/plugin/verified/plugin");
		expect(xml).toContain("/plugin/detected/plugin");
		expect(xml).toContain("/publisher/verified");
		expect(xml).toContain("/publisher/detected");
		expect(xml).not.toContain("/plugin/candidate/plugin");
		expect(xml).not.toContain("/plugin/rejected/plugin");
		expect(xml).not.toContain("/plugin/not-plugin/repo");
		expect(xml).not.toContain("/publisher/candidate");
		expect(xml).not.toContain("/publisher/rejected");
		expect(xml).not.toContain("/publisher/not-plugin");
	});
});
