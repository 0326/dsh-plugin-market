import { describe, expect, it } from "vitest";
import { resolveReadmePath } from "../src/worker/github/readme";

const blob = (path: string) => ({ path, type: "blob" as const });

describe("resolveReadmePath", () => {
	it("prefers a language-specific README over README.md", () => {
		const entries = [blob("README.md"), blob("README.en.md"), blob("README.zh-CN.md")];
		expect(resolveReadmePath(entries, "zh")).toEqual({ path: "README.zh-CN.md", language: "zh", fallback: false });
		expect(resolveReadmePath(entries, "en")).toEqual({ path: "README.en.md", language: "en", fallback: false });
	});

	it("uses README.md when only the generic README is available", () => {
		expect(resolveReadmePath([blob("README.md")], "en")).toEqual({ path: "README.md", language: "unknown", fallback: false });
	});

	it("supports README files in .github and docs and matches names case-insensitively", () => {
		const entries = [blob("docs/readme.ZH.md"), blob(".github/README.EN-US.MD")];
		expect(resolveReadmePath(entries, "zh")?.path).toBe("docs/readme.ZH.md");
		expect(resolveReadmePath(entries, "en")?.path).toBe(".github/README.EN-US.MD");
	});

	it("falls back to the other language only when no generic README exists", () => {
		expect(resolveReadmePath([blob("README.en.md")], "zh")).toEqual({ path: "README.en.md", language: "en", fallback: true });
	});

	it("returns null when the repository has no supported README", () => {
		expect(resolveReadmePath([blob("docs/guide.md")], "en")).toBeNull();
	});
});
