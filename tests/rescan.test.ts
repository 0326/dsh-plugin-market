import { describe, expect, it, vi } from "vitest";
import { enqueueRescanAll } from "../src/worker/queue/scan";

describe("enqueueRescanAll", () => {
	it("enqueues SCANNER_UPGRADE jobs for every stale repository", async () => {
		const rows = [
			{ id: 1, owner: "acme", name: "my-plugin" },
			{ id: 2, owner: "acme", name: "design-tool" },
		];
		const send = vi.fn(async () => {});
		const db = {
			prepare: vi.fn(() => ({
				bind: vi.fn(() => ({
					all: vi.fn(async () => ({ results: rows })),
				})),
			})),
		};
		const env = { DB: db, SCAN_QUEUE: { send } } as never;

		const result = await enqueueRescanAll(env);

		expect(result.enqueued).toBe(2);
		expect(send).toHaveBeenCalledTimes(2);
		expect(send).toHaveBeenCalledWith({ repositoryId: 1, owner: "acme", repo: "my-plugin", reason: "SCANNER_UPGRADE" });
		expect(send).toHaveBeenCalledWith({ repositoryId: 2, owner: "acme", repo: "design-tool", reason: "SCANNER_UPGRADE" });
	});

	it("returns zero when no stale repository exists", async () => {
		const send = vi.fn(async () => {});
		const db = {
			prepare: vi.fn(() => ({
				bind: vi.fn(() => ({
					all: vi.fn(async () => ({ results: [] })),
				})),
			})),
		};
		const env = { DB: db, SCAN_QUEUE: { send } } as never;

		const result = await enqueueRescanAll(env);

		expect(result.enqueued).toBe(0);
		expect(send).not.toHaveBeenCalled();
	});
});
