import { describe, expect, it, vi } from "vitest";
import { listPlugins } from "../src/worker/db/repository";

function mockDb() {
	let sql = "";
	let params: unknown[] = [];
	const all = vi.fn(async () => ({ results: [] }));
	const bind = vi.fn((...values: unknown[]) => {
		params = values;
		return { all };
	});
	const prepare = vi.fn((statement: string) => {
		sql = statement;
		return { bind };
	});
	return {
		db: { prepare } as never,
		getSql: () => sql,
		getParams: () => params,
	};
}

describe("listPlugins multi-select facets", () => {
	it("matches any selected capability and any selected plugin type", async () => {
		const { db, getSql, getParams } = mockDb();

		await listPlugins(db, {
			capability: "SEARCH,DATA",
			pluginType: "AGENT,WORKFLOW",
		});

		expect(getSql()).toContain("(p.capabilities_json LIKE ? OR p.capabilities_json LIKE ?)");
		expect(getSql()).toContain("(p.plugin_types_json LIKE ? OR p.plugin_types_json LIKE ?)");
		expect(getParams()).toEqual([
			'%"SEARCH"%',
			'%"DATA"%',
			'%"AGENT"%',
			'%"WORKFLOW"%',
			50,
			0,
		]);
	});

	it("deduplicates repeated facet values and ignores empty entries", async () => {
		const { db, getSql, getParams } = mockDb();

		await listPlugins(db, {
			capability: "SEARCH,SEARCH,,DATA,",
		});

		expect(getSql()).toContain("(p.capabilities_json LIKE ? OR p.capabilities_json LIKE ?)");
		expect(getParams()).toEqual(['%"SEARCH"%', '%"DATA"%', 50, 0]);
	});
});
