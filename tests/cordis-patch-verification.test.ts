import { describe, expect, it } from "vitest";
import type { ParsedPackageJson } from "../src/worker/domain/plugin";
import { SCANNER_VERSION } from "../src/worker/domain/scan";
import { scanRepository } from "../src/worker/scanner";
import { analyzeBundle } from "../src/worker/scanner/bundle";
import type { RepoSnapshot } from "../src/worker/scanner/snapshot";

const pkg: ParsedPackageJson = {
	name: "@liustack/modlens",
	version: "3.18.2",
	dsh: { bundle: { patch: "./cordis.patch.yml" } },
};

function snapshot(patch: string): RepoSnapshot {
	return {
		owner: "liustack",
		repo: "modlens",
		defaultBranch: "main",
		commitSha: "abc123",
		files: [
			{ path: "package.json", content: JSON.stringify(pkg) },
			{ path: "cordis.patch.yml", content: patch },
		],
	};
}

const realSequencePatch = `
- insert:
    - id: modlens
      name: '@liustack/modlens'
`;

describe("Cordis sequence patch verification", () => {
	it("accepts the operation-sequence shape used by real DSH plugins", () => {
		const result = analyzeBundle(pkg, snapshot(realSequencePatch));
		expect(result.patchExists).toBe(true);
		expect(result.patchParseable).toBe(true);
		expect(result.findings.some((finding) => finding.code === "PATCH_INVALID")).toBe(false);
	});

	it("promotes a DSH bundle with a valid sequence patch to FORMAT_VERIFIED", () => {
		const result = scanRepository({
			snapshot: snapshot(realSequencePatch),
			maintenance: { archived: false, disabled: false, stars: 100, forks: 0 },
		});
		expect(result.verificationStatus).toBe("FORMAT_VERIFIED");
	});

	it("rejects empty or scalar YAML sequences", () => {
		expect(analyzeBundle(pkg, snapshot("[]\n")).patchParseable).toBe(false);
		expect(analyzeBundle(pkg, snapshot("- not-an-operation\n")).patchParseable).toBe(false);
	});

	it("keeps arbitrary mappings rejected", () => {
		expect(analyzeBundle(pkg, snapshot("name: not-a-cordis-patch\n")).patchParseable).toBe(false);
	});

	it("bumps the scanner version so existing commits are eligible for rescan", () => {
		expect(SCANNER_VERSION).toBe("0.3.0");
	});
});
