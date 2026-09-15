import { describe, expect, it } from "vitest";

import { canonicalRedirect } from "../src/worker/canonical";

describe("canonical URL redirects", () => {
	it("redirects www to the apex host and preserves the query string", () => {
		const response = canonicalRedirect(new Request("https://www.dsh-plugin.market/plugins?q=trust"));
		expect(response?.status).toBe(301);
		expect(response?.headers.get("location")).toBe("https://dsh-plugin.market/plugins?q=trust");
	});

	it("normalizes trailing slashes on capability landing pages", () => {
		const response = canonicalRedirect(new Request("https://dsh-plugin.market/plugins/security/"));
		expect(response?.status).toBe(301);
		expect(response?.headers.get("location")).toBe("https://dsh-plugin.market/plugins/security");
	});

	it("normalizes public trailing slashes", () => {
		const response = canonicalRedirect(new Request("https://dsh-plugin.market/plugin/acme/demo/"));
		expect(response?.status).toBe(301);
		expect(response?.headers.get("location")).toBe("https://dsh-plugin.market/plugin/acme/demo");
	});

	it("combines http, www and trailing-slash normalization in one redirect", () => {
		const response = canonicalRedirect(new Request("http://www.dsh-plugin.market/guide/install-dsh-plugin/?lang=en"));
		expect(response?.status).toBe(301);
		expect(response?.headers.get("location")).toBe("https://dsh-plugin.market/guide/install-dsh-plugin?lang=en");
	});

	it("redirects legacy whitepaper chapter URLs to the subdomain and preserves query", () => {
		const response = canonicalRedirect(new Request("https://dsh-plugin.market/whitepaper/v0.1.5-rc.2/overview?from=old"));
		expect(response?.status).toBe(301);
		expect(response?.headers.get("location")).toBe("https://whitepaper.dsh-plugin.market/v0.1.5-rc.2/overview?from=old");
	});

	it("redirects the whitepaper root to the concrete latest version", () => {
		const response = canonicalRedirect(new Request("https://whitepaper.dsh-plugin.market/"));
		expect(response?.status).toBe(302);
		expect(response?.headers.get("location")).toBe("https://whitepaper.dsh-plugin.market/v0.1.5-rc.2/overview");
	});

	it("redirects latest aliases to the concrete latest chapter", () => {
		const response = canonicalRedirect(new Request("https://whitepaper.dsh-plugin.market/latest/runtime"));
		expect(response?.status).toBe(302);
		expect(response?.headers.get("location")).toBe("https://whitepaper.dsh-plugin.market/v0.1.5-rc.2/runtime");
	});

	it("redirects the phase-one whitepaper path on the subdomain to the short path", () => {
		const response = canonicalRedirect(new Request("https://whitepaper.dsh-plugin.market/whitepaper/v0.1.5-rc.1/runtime"));
		expect(response?.status).toBe(301);
		expect(response?.headers.get("location")).toBe("https://whitepaper.dsh-plugin.market/v0.1.5-rc.1/runtime");
	});

	it("does not redirect an already canonical market URL", () => {
		expect(canonicalRedirect(new Request("https://dsh-plugin.market/plugins?q=trust"))).toBeNull();
	});

	it("does not redirect an already canonical whitepaper URL", () => {
		expect(canonicalRedirect(new Request("https://whitepaper.dsh-plugin.market/v0.1.5-rc.2/overview"))).toBeNull();
	});

	it("does not rewrite unknown asset-like paths", () => {
		expect(canonicalRedirect(new Request("https://dsh-plugin.market/assets/app.js/"))).toBeNull();
	});
});
