import { describe, expect, it } from "vitest";
import { AUTO_FEATURE_DEFAULT_MIN_STARS, parseAutoFeatureMinStars, shouldAutoFeature } from "../src/worker/curation/featured";
import type { Finding } from "../src/worker/domain/finding";

function finding(overrides: Partial<Finding> = {}): Finding {
	return { category: "SECURITY", code: "X", severity: "LOW", title: "x", ...overrides };
}

describe("parseAutoFeatureMinStars", () => {
	it("uses 100 stars as the default feature threshold", () => {
		expect(AUTO_FEATURE_DEFAULT_MIN_STARS).toBe(100);
	});

	it("falls back to the default when unset or invalid", () => {
		expect(parseAutoFeatureMinStars(undefined)).toBe(AUTO_FEATURE_DEFAULT_MIN_STARS);
		expect(parseAutoFeatureMinStars("")).toBe(AUTO_FEATURE_DEFAULT_MIN_STARS);
		expect(parseAutoFeatureMinStars("garbage")).toBe(AUTO_FEATURE_DEFAULT_MIN_STARS);
		expect(parseAutoFeatureMinStars("-5")).toBe(AUTO_FEATURE_DEFAULT_MIN_STARS);
	});

	it("parses valid thresholds, including 0 to drop the star gate", () => {
		expect(parseAutoFeatureMinStars("100")).toBe(100);
		expect(parseAutoFeatureMinStars("0")).toBe(0);
		expect(parseAutoFeatureMinStars("12.9")).toBe(12);
	});
});

describe("shouldAutoFeature", () => {
	const base = { stars: 100, verificationStatus: "FORMAT_VERIFIED", findings: [] as Finding[], minStars: 50 };

	it("features a qualifying plugin", () => {
		expect(shouldAutoFeature(base)).toBe(true);
	});

	it("rejects plugins below the star bar", () => {
		expect(shouldAutoFeature({ ...base, stars: 49 })).toBe(false);
	});

	it("rejects plugins that are not Format Verified", () => {
		expect(shouldAutoFeature({ ...base, verificationStatus: "DETECTED" })).toBe(false);
		expect(shouldAutoFeature({ ...base, verificationStatus: "CANDIDATE" })).toBe(false);
	});

	it("rejects plugins with a blocking security finding", () => {
		expect(shouldAutoFeature({ ...base, findings: [finding({ severity: "HIGH" })] })).toBe(false);
		expect(shouldAutoFeature({ ...base, findings: [finding({ severity: "CRITICAL" })] })).toBe(false);
	});

	it("ignores non-security findings and low/medium security findings", () => {
		expect(shouldAutoFeature({ ...base, findings: [finding({ severity: "MEDIUM" })] })).toBe(true);
		expect(shouldAutoFeature({ ...base, findings: [finding({ category: "MAINTENANCE", severity: "HIGH" })] })).toBe(true);
	});
});
