import { describe, expect, it, vi } from "vitest";
import { enqueueRescanAll } from "../src/worker/queue/scan";

describe("enqueueRescanAll", () => {
	it("enqueues SCANNER_UPGRADE jobs via sendBatch for every repository needing a scan", async () => {
		const rows = [
			{ id: 1, owner: "acme", name: "my-plugin" },
			{ id: 2, owner: "acme", name: "design-tool" },
		];
		const sendBatch = vi.fn(async () => {});
		const db = {
			prepare: vi.fn(() => ({
				bind: vi.fn(() => ({
					all: vi.fn(async () => ({ results: rows })),
				})),
			})),
		};
		const env = { DB: db, SCAN_QUEUE: { sendBatch } } as never;

		const result = await enqueueRescanAll(env);

		expect(result.enqueued).toBe(2);
		expect(sendBatch).toHaveBeenCalledTimes(1);
		const batch = sendBatch.mock.calls[0][0] as Array<{ body: { repositoryId: number; owner: string; repo: string; reason: string } }>;
		expect(batch).toHaveLength(2);
		expect(batch[0].body).toEqual({ repositoryId: 1, owner: "acme", repo: "my-plugin", reason: "SCANNER_UPGRADE" });
		expect(batch[1].body).toEqual({ repositoryId: 2, owner: "acme", repo: "design-tool", reason: "SCANNER_UPGRADE" });
	});

	it("returns zero and sends nothing when no repository needs a scan", async () => {
		const sendBatch = vi.fn(async () => {});
		const db = {
			prepare: vi.fn(() => ({
				bind: vi.fn(() => ({
					all: vi.fn(async () => ({ results: [] })),
				})),
			})),
		};
		const env = { DB: db, SCAN_QUEUE: { sendBatch } } as never;

		const result = await enqueueRescanAll(env);

		expect(result.enqueued).toBe(0);
		expect(sendBatch).not.toHaveBeenCalled();
	});
});
