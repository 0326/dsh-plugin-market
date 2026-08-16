import { describe, expect, it } from "vitest";

import { extractReadmeImage } from "../src/worker/scanner/readme-image";

const ctx = { owner: "org", repo: "repo", sha: "abc123" };

describe("extractReadmeImage", () => {
	it("returns null for missing or empty readme", () => {
		expect(extractReadmeImage(undefined, ctx)).toBeNull();
		expect(extractReadmeImage("", ctx)).toBeNull();
	});

	it("extracts the first markdown image and pins relative paths to the scanned commit", () => {
		const readme = "# Title\n\n![demo](assets/screenshot.png)\n";
		expect(extractReadmeImage(readme, ctx)).toBe("https://raw.githubusercontent.com/org/repo/abc123/assets/screenshot.png");
	});

	it("normalizes ./ and leading-slash relative paths", () => {
		expect(extractReadmeImage("![a](./docs/demo.png)", ctx)).toBe("https://raw.githubusercontent.com/org/repo/abc123/docs/demo.png");
		expect(extractReadmeImage("![a](/docs/demo.png)", ctx)).toBe("https://raw.githubusercontent.com/org/repo/abc123/docs/demo.png");
	});

	it("keeps absolute https URLs as-is", () => {
		expect(extractReadmeImage("![a](https://cdn.example.com/x/demo.png)", ctx)).toBe("https://cdn.example.com/x/demo.png");
	});

	it("resolves scheme-relative URLs to https", () => {
		expect(extractReadmeImage("![a](//cdn.example.com/x/demo.png)", ctx)).toBe("https://cdn.example.com/x/demo.png");
	});

	it("skips badge hosts and picks the next presentable image", () => {
		const readme = [
			"![build](https://img.shields.io/badge/build-passing-brightgreen)",
			"![npm](https://badge.fury.io/js/foo.svg)",
			"![demo](docs/demo.png)",
		].join("\n");
		expect(extractReadmeImage(readme, ctx)).toBe("https://raw.githubusercontent.com/org/repo/abc123/docs/demo.png");
	});

	it("skips non-preview keywords and svg files", () => {
		expect(extractReadmeImage("![l](assets/logo.png)\n![d](docs/demo.png)", ctx)).toMatch(/demo\.png$/);
		expect(extractReadmeImage("![a](assets/architecture.svg)\n![b](assets/banner.png)", ctx)).toMatch(/banner\.png$/);
	});

	it("skips non-image links and non-http schemes", () => {
		expect(extractReadmeImage("[docs](https://example.com)", ctx)).toBeNull();
		expect(extractReadmeImage("![a](mailto:someone@example.com)", ctx)).toBeNull();
		expect(extractReadmeImage("![a](#section)", ctx)).toBeNull();
		expect(extractReadmeImage("![a](data:image/png;base64,AAAA)", ctx)).toBeNull();
	});

	it("skips parent traversal and empty targets", () => {
		expect(extractReadmeImage("![a](../outside.png)", ctx)).toBeNull();
		expect(extractReadmeImage("![]()", ctx)).toBeNull();
	});

	it("supports html img tags including unquoted and encoded sources", () => {
		expect(extractReadmeImage('<img src="docs/demo.png" />', ctx)).toBe("https://raw.githubusercontent.com/org/repo/abc123/docs/demo.png");
		expect(extractReadmeImage("<img src=docs/demo.png>", ctx)).toBe("https://raw.githubusercontent.com/org/repo/abc123/docs/demo.png");
		expect(extractReadmeImage('<img src="https://x.example.com/a&amp;b.png" />', ctx)).toBe("https://x.example.com/a&b.png");
	});

	it("ignores badge-like images inside html", () => {
		expect(extractReadmeImage('<img src="https://img.shields.io/npm/v/foo" /><img src="docs/demo.png" />', ctx)).toMatch(/demo\.png$/);
	});

	it("supports markdown titles and angle-bracket urls", () => {
		expect(extractReadmeImage('![a](docs/my demo.png "title")', ctx)).toBeNull(); // unquoted spaces are not valid markdown URLs
		expect(extractReadmeImage('![a](<docs/my demo.png> "title")', ctx)).toBe("https://raw.githubusercontent.com/org/repo/abc123/docs/my%20demo.png");
	});
});
