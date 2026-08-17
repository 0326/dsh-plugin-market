import { describe, expect, it, vi } from "vitest";
import { SCANNER_VERSION } from "../src/worker/domain/scan";
import { RESCAN_SWEEP_PAGE_SIZE, processRescanSweepJob, startRescanSweep } from "../src/worker/queue/scan";

describe("rescan sweep", () => {
	it("starts a full rescan with one lightweight control message", async () => {
		const send = vi.fn(async () => {});
		const env = { SCAN_QUEUE: { send } } as never;

		const result = await startRescanSweep(env);

		expect(result).toEqual({ status: "started", scannerVersion: SCANNER_VERSION });
		expect(send).toHaveBeenCalledTimes(1);
		expect(send).toHaveBeenCalledWith({ type: "RESCAN_SWEEP", afterRepositoryId: 0 });
	});

	it("enqueues a partial stale-repository page without scheduling another control page", async () => {
		const rows = [
			{ id: 11, owner: "acme", name: "my-plugin" },
			{ id: 25, owner: "acme", name: "design-tool" },
		];
		const bind = vi.fn(() => ({ all: vi.fn(async () => ({ results: rows })) }));
		const db = { prepare: vi.fn(() => ({ bind })) };
		const send = vi.fn(async () => {});
		const sendBatch = vi.fn(async () => {});
		const env = { DB: db, SCAN_QUEUE: { send, sendBatch } } as never;

		const result = await processRescanSweepJob(env, { type: "RESCAN_SWEEP", afterRepositoryId: 10 });

		expect(bind).toHaveBeenCalledWith(10, SCANNER_VERSION, RESCAN_SWEEP_PAGE_SIZE);
		expect(sendBatch).toHaveBeenCalledTimes(1);
		const batch = sendBatch.mock.calls[0][0] as Array<{ body: { repositoryId: number; owner: string; repo: string; reason: string } }>;
		expect(batch).toHaveLength(2);
		expect(batch[0].body).toEqual({ repositoryId: 11, owner: "acme", repo: "my-plugin", reason: "SCANNER_UPGRADE" });
		expect(send).not.toHaveBeenCalled();
		expect(result).toEqual({ enqueued: 2, nextAfterRepositoryId: null, done: true });
	});

	it("chains another control page when a page is full", async () => {
		const rows = Array.from({ length: RESCAN_SWEEP_PAGE_SIZE }, (_, index) => ({
			id: index + 1,
			owner: "acme",
			name: `plugin-${index + 1}`,
		}));
		const db = {
			prepare: vi.fn(() => ({
				bind: vi.fn(() => ({ all: vi.fn(async () => ({ results: rows })) })),
			})),
		};
		const send = vi.fn(async () => {});
		const sendBatch = vi.fn(async () => {});
		const env = { DB: db, SCAN_QUEUE: { send, sendBatch } } as never;

		const result = await processRescanSweepJob(env, { type: "RESCAN_SWEEP", afterRepositoryId: 0 });

		expect(sendBatch).toHaveBeenCalledTimes(1);
		expect(sendBatch.mock.calls[0][0]).toHaveLength(RESCAN_SWEEP_PAGE_SIZE);
		expect(send).toHaveBeenCalledWith({ type: "RESCAN_SWEEP", afterRepositoryId: RESCAN_SWEEP_PAGE_SIZE });
		expect(result).toEqual({
			enqueued: RESCAN_SWEEP_PAGE_SIZE,
			nextAfterRepositoryId: RESCAN_SWEEP_PAGE_SIZE,
			done: false,
		});
	});

	it("finishes cleanly when no stale repository remains", async () => {
		const db = {
			prepare: vi.fn(() => ({
				bind: vi.fn(() => ({ all: vi.fn(async () => ({ results: [] })) })),
			})),
		};
		const send = vi.fn(async () => {});
		const sendBatch = vi.fn(async () => {});
		const env = { DB: db, SCAN_QUEUE: { send, sendBatch } } as never;

		const result = await processRescanSweepJob(env, { type: "RESCAN_SWEEP", afterRepositoryId: 100 });

		expect(result).toEqual({ enqueued: 0, nextAfterRepositoryId: null, done: true });
		expect(sendBatch).not.toHaveBeenCalled();
		expect(send).not.toHaveBeenCalled();
	});
});
