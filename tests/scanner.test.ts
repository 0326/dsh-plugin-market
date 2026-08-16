import { describe, expect, it } from "vitest";
import { analyzeBundle } from "../src/worker/scanner/bundle";
import { analyzeCompatibility, classifyConstraint, DEFAULT_BASELINE } from "../src/worker/scanner/compatibility";
import { analyzeMaintenance } from "../src/worker/scanner/maintenance";
import { parsePackageJson } from "../src/worker/scanner/manifest";
import { scanRepository } from "../src/worker/scanner";
import { computeBaseline } from "../src/worker/npm/baseline";
import { analyzeSecurity } from "../src/worker/scanner/security";
import { compareSemver, parseSemver, satisfiesRange } from "../src/worker/scanner/semver";
import type { RepoSnapshot } from "../src/worker/scanner/snapshot";
import type { ParsedPackageJson } from "../src/worker/domain/plugin";

function dshBundlePackage(overrides: Record<string, unknown> = {}): ParsedPackageJson {
	return {
		name: "my-plugin",
		version: "1.0.0",
		description: "A search plugin for DSH",
		license: "MIT",
		engines: { node: ">=18" },
		scripts: { prepare: "tsc" },
		dependencies: { "@deepseek-ai/cordis": "^0.1.0-rc.4" },
		dsh: { bundle: { patch: "./cordis.patch.yml" } },
		...overrides,
	};
}

function snapshotFor(pkg: ParsedPackageJson, files: RepoSnapshot["files"] = []): RepoSnapshot {
	const base: RepoSnapshot["files"] = [
		{ path: "package.json", content: JSON.stringify(pkg) },
		{ path: "cordis.patch.yml", content: "plugins:\n  my-plugin:\n    module: ./dist/index.js\n" },
		{ path: "README.md", content: "# My Search Plugin" },
		{ path: "pnpm-lock.yaml", content: "lockfile" },
	];
	return { owner: "acme", repo: "my-plugin", defaultBranch: "main", commitSha: "abc123", files: [...base, ...files] };
}

describe("semver", () => {
	it("parses plain and prerelease versions", () => {
		expect(parseSemver("1.2.3")).toEqual({ major: 1, minor: 2, patch: 3, prerelease: [] });
		expect(parseSemver("v1.2.3")).toEqual({ major: 1, minor: 2, patch: 3, prerelease: [] });
		expect(parseSemver("1.2.3-rc.6")).toEqual({ major: 1, minor: 2, patch: 3, prerelease: ["rc", "6"] });
		expect(parseSemver("1.2")).toBeNull();
		expect(parseSemver("latest")).toBeNull();
	});

	it("orders prereleases correctly", () => {
		const rc4 = parseSemver("0.1.0-rc.4");
		const rc6 = parseSemver("0.1.0-rc.6");
		expect(rc4).not.toBeNull();
		expect(rc6).not.toBeNull();
		expect(compareSemver(rc4!, rc6!)).toBeLessThan(0);
		expect(compareSemver(parseSemver("1.0.0")!, parseSemver("1.0.0-rc.1")!)).toBeGreaterThan(0);
	});

	it("checks ranges conservatively", () => {
		expect(satisfiesRange("1.2.3", "^1.0.0").satisfied).toBe(true);
		expect(satisfiesRange("2.0.0", "^1.0.0").satisfied).toBe(false);
		expect(satisfiesRange("1.4.5", "~1.4.0").satisfied).toBe(true);
		expect(satisfiesRange("1.5.0", "~1.4.0").satisfied).toBe(false);
		expect(satisfiesRange("0.1.0-rc.6", "^0.1.0-rc.4").satisfied).toBe(true);
		expect(satisfiesRange("1.2.3", "garbage").satisfied).toBeNull();
	});
});

describe("manifest", () => {
	it("parses valid JSON", () => {
		const res = parsePackageJson(JSON.stringify(dshBundlePackage()));
		expect(res.ok).toBe(true);
		expect(res.manifest?.name).toBe("my-plugin");
	});

	it("rejects invalid and non-object JSON", () => {
		expect(parsePackageJson("not json").ok).toBe(false);
		expect(parsePackageJson("[1,2,3]").ok).toBe(false);
		expect(parsePackageJson(undefined).ok).toBe(false);
	});
});

describe("bundle", () => {
	it("detects a valid DSH bundle", () => {
		const snap = snapshotFor(dshBundlePackage());
		const b = analyzeBundle(dshBundlePackage(), snap);
		expect(b.hasDshBundle).toBe(true);
		expect(b.hasCordisDependency).toBe(true);
		expect(b.patchExists).toBe(true);
		expect(b.patchParseable).toBe(true);
	});

	it("flags a missing patch file", () => {
		const pkg = dshBundlePackage();
		const snap = snapshotFor(pkg, []).files.filter((f) => f.path !== "cordis.patch.yml");
		const b = analyzeBundle(pkg, { ...snapshotFor(pkg), files: snap });
		expect(b.patchExists).toBe(false);
		expect(b.findings.some((f) => f.code === "PATCH_MISSING")).toBe(true);
	});
});

describe("compatibility", () => {
	it("marks an older prerelease as OUTDATED", () => {
		const v = classifyConstraint("@deepseek-ai/cordis", "^0.1.0-rc.4", DEFAULT_BASELINE);
		expect(v.status).toBe("OUTDATED");
	});

	it("marks an unsatisfiable range as INCOMPATIBLE", () => {
		const v = classifyConstraint("@deepseek-ai/cordis", "^2.0.0", DEFAULT_BASELINE);
		expect(v.status).toBe("INCOMPATIBLE");
	});

	it("returns UNKNOWN when no DSH dependency is declared", () => {
		const res = analyzeCompatibility({ name: "x" });
		expect(res.status).toBe("UNKNOWN");
	});
});

describe("security", () => {
	it("detects install scripts and missing lockfile", () => {
		const pkg = dshBundlePackage({ scripts: { prepare: "tsc", postinstall: "node setup.js" } });
		const snap = snapshotFor(pkg).files.filter((f) => f.path !== "pnpm-lock.yaml");
		const res = analyzeSecurity(pkg, snap);
		expect(res.installScripts).toContain("prepare");
		expect(res.installScripts).toContain("postinstall");
		expect(res.findings.some((f) => f.code === "NO_LOCKFILE")).toBe(true);
		expect(res.status).toBe("REVIEW");
	});
});

describe("maintenance", () => {
	it("marks archived repos", () => {
		const res = analyzeMaintenance({ archived: true, disabled: false, stars: 0, forks: 0 }, 0);
		expect(res.status).toBe("ARCHIVED");
	});

	it("marks long-inactive repos", () => {
		const res = analyzeMaintenance(
			{ archived: false, disabled: false, lastPushAt: "2020-01-01T00:00:00Z", stars: 1, forks: 0 },
			Date.parse("2026-08-01T00:00:00Z"),
		);
		expect(res.status).toBe("INACTIVE");
	});
});

describe("baseline", () => {
	it("resolves versions from a fetcher and falls back when missing", async () => {
		const b = await computeBaseline(async (pkg) => (pkg === "@deepseek-ai/cordis" ? "0.2.0" : null));
		expect(b.cordisVersion).toBe("0.2.0");
		expect(b.dshVersion).toBe(DEFAULT_BASELINE.dshVersion);
		expect(b.checkedAt).toBeTruthy();
	});
});

describe("scanRepository", () => {
	it("uses the provided compatibility baseline", () => {
		const pkg = dshBundlePackage({ dependencies: { "@deepseek-ai/cordis": "^2.0.0" } });
		const result = scanRepository({
			snapshot: snapshotFor(pkg),
			maintenance: { archived: false, disabled: false, stars: 0, forks: 0 },
			baseline: { dshVersion: "2.0.0", cordisVersion: "2.0.0", checkedAt: "2026-08-16T00:00:00.000Z" },
		});
		expect(result.compatibilityStatus).toBe("COMPATIBLE");
	});

	it("classifies a standard DSH bundle as FORMAT_VERIFIED", () => {
		const result = scanRepository({
			snapshot: snapshotFor(dshBundlePackage()),
			maintenance: { archived: false, disabled: false, lastPushAt: "2026-08-01T00:00:00Z", stars: 10, forks: 2 },
		});
		expect(result.verificationStatus).toBe("FORMAT_VERIFIED");
		expect(result.compatibilityStatus).toBe("OUTDATED");
		expect(result.securityStatus).toBe("REVIEW");
		expect(result.metadata.packageName).toBe("my-plugin");
		expect(result.metadata.dshBundlePatch).toBe("cordis.patch.yml");
	});

	it("classifies a repo with no DSH signals as CANDIDATE", () => {
		const result = scanRepository({
			snapshot: snapshotFor({ name: "not-a-plugin", version: "1.0.0" }),
			maintenance: { archived: false, disabled: false, stars: 0, forks: 0 },
		});
		expect(result.verificationStatus).toBe("CANDIDATE");
	});

	it("classifies a cordis-only repo as DETECTED", () => {
		const pkg = { name: "cordis-only", dependencies: { "@deepseek-ai/cordis": "^0.1.0" } };
		const result = scanRepository({
			snapshot: snapshotFor(pkg),
			maintenance: { archived: false, disabled: false, stars: 0, forks: 0 },
		});
		expect(result.verificationStatus).toBe("DETECTED");
	});

	it("records a MANIFEST_INVALID finding when package.json is missing", () => {
		const result = scanRepository({
			snapshot: { owner: "a", repo: "b", defaultBranch: "main", commitSha: "x", files: [] },
			maintenance: { archived: false, disabled: false, stars: 0, forks: 0 },
		});
		expect(result.verificationStatus).toBe("CANDIDATE");
		expect(result.findings.some((f) => f.code === "MANIFEST_INVALID")).toBe(true);
	});
});
