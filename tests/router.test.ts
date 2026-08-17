import { describe, expect, it } from "vitest";

import { parseRoute } from "../src/react-app/lib/router";

describe("parseRoute", () => {
	it("keeps trust and about as independent routes", () => {
		expect(parseRoute("/trust", "")).toEqual({ name: "trust" });
		expect(parseRoute("/about", "")).toEqual({ name: "about" });
	});

	it("does not let static routes swallow extra path segments", () => {
		expect(parseRoute("/trust/extra", "")).toEqual({ name: "home" });
		expect(parseRoute("/about/extra", "")).toEqual({ name: "home" });
		expect(parseRoute("/submit/extra", "")).toEqual({ name: "home" });
	});

	it("matches dynamic routes only at their exact shape", () => {
		expect(parseRoute("/plugin/acme/demo", "")).toEqual({ name: "plugin", owner: "acme", repo: "demo" });
		expect(parseRoute("/plugin/acme/demo/extra", "")).toEqual({ name: "home" });
		expect(parseRoute("/publisher/acme", "")).toEqual({ name: "publisher", owner: "acme" });
		expect(parseRoute("/publisher/acme/extra", "")).toEqual({ name: "home" });
	});
});
