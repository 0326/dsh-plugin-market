import { beforeEach, describe, expect, it, vi } from "vitest";

// Make the discovery throttle instant so the test runs fast.
vi.spyOn(globalThis, "setTimeout").mockImplementation(((fn: () => void) => {
	fn();
	return 0 as unknown as ReturnType<typeof setTimeout>;
}) as never);

vi.mock("../src/worker/db/repository", () => ({
	upsertRepository: vi.fn(async (_db: unknown, repo: { id: number }) => ({ id: repo.id, changed: true })),
	updateRepositoryPreviewImage: vi.fn(async () => {}),
	listPendingDiscoveryShards: vi.fn(async () => []),
	clearDiscoveryShards: vi.fn(async () => {}),
	insertDiscoveryShards: vi.fn(async () => {}),
	updateDiscoveryShard: vi.fn(async () => {}),
}));

import { collectShards, ensurePreviewImage, runDiscovery } from "../src/worker/github/discovery";
import { listPendingDiscoveryShards, updateDiscoveryShard, updateRepositoryPreviewImage } from "../src/worker/db/repository";

function makeRepo(i: number, secondOfDay: number) {
	const created = new Date(Date.UTC(2026, 0, 1, 0, 0, secondOfDay)).toISOString();
	return {
		id: i,
		name: "repo" + i,
		owner: { login: "org" },
		full_name: "org/repo" + i,
		html_url: "https://github.com/org/repo" + i,
		description: null,
		default_branch: "main",
		stargazers_count: 0,
		forks_count: 0,
		license: null,
		archived: false,
		disabled: false,
		created_at: created,
		updated_at: created,
		pushed_at: created,
	};
}

describe("collectShards", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("splits an oversized window into ordered, non-overlapping shards", async () => {
		const N = 2500;
		const repos = Array.from({ length: N }, (_, i) => makeRepo(i, i % 86400)); // spread over one day
		repos.sort((a, b) => a.created_at.localeCompare(b.created_at));

		const client = {
			searchRepos: vi.fn(async (query: string) => {
				const m = /created:([^\s]+)\.\.([^\s]+)/.exec(query);
				let items = repos;
				if (m) items = repos.filter((r) => r.created_at >= m[1] && r.created_at <= m[2]);
				return { total_count: items.length, items: [], incomplete_results: false };
			}),
		};

		const out: { start: string; end: string }[] = [];
		await collectShards(client as never, "2025-01-01T00:00:00.000Z", "2026-08-17T00:00:00.000Z", out);

		expect(out.length).toBeGreaterThanOrEqual(3); // 2500 repos need at least 3 shards of <=1000
		for (let i = 1; i < out.length; i++) {
			expect(out[i].start).toBe(out[i - 1].end); // ordered and contiguous
		}
	});
});

describe("runDiscovery", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("processes a pending shard, upserts repos, and enqueues via sendBatch", async () => {
		const repos = Array.from({ length: 5 }, (_, i) => makeRepo(i, i));
		vi.mocked(listPendingDiscoveryShards).mockResolvedValue([
			{ id: 1, windowStart: "2025-01-01T00:00:00.000Z", windowEnd: "2026-08-17T00:00:00.000Z", page: 1 },
		]);

		const client = {
			searchRepos: vi.fn(async () => ({ total_count: repos.length, items: repos, incomplete_results: false })),
		};
		const sendBatch = vi.fn(async () => {});
		const queue = { sendBatch };

		const result = await runDiscovery(client as never, {} as never, queue as never);

		expect(result.reposSeen).toBe(5);
		expect(result.enqueued).toBe(5);
		expect(sendBatch).toHaveBeenCalledTimes(1);
		const bodies = sendBatch.mock.calls[0][0] as Array<{ body: { repositoryId: number } }>;
		expect(bodies).toHaveLength(5);
		expect(bodies[0].body.repositoryId).toBe(0);
		expect(vi.mocked(updateDiscoveryShard)).toHaveBeenCalledWith({}, 1, 1, "done");
	});
});

describe("ensurePreviewImage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const repoRow = { owner: "org", name: "repo", full_name: "org/repo", preview_image_url: null as string | null };
	const readme = "![demo](assets/demo.png)";
	const ogClient = {
		getOpenGraphImageUrls: vi.fn(async () => new Map([["org/repo", "https://opengraph.githubassets.com/x/org/repo"]])),
	};

	it("does nothing when the repo already has a preview image", async () => {
		const calls = vi.mocked(updateRepositoryPreviewImage).mock;
		await ensurePreviewImage({ getOpenGraphImageUrls: vi.fn() } as never, {} as never, { ...repoRow, preview_image_url: "https://x/y.png" }, readme, "sha1");
		expect(calls.calls.length).toBe(0);
	});

	it("prefers the open graph image over the readme image", async () => {
		await ensurePreviewImage(ogClient as never, {} as never, repoRow, readme, "sha1");
		expect(updateRepositoryPreviewImage).toHaveBeenCalledWith({}, "org/repo", "https://opengraph.githubassets.com/x/org/repo");
	});

	it("falls back to the readme image when open graph returns nothing", async () => {
		const client = { getOpenGraphImageUrls: vi.fn(async () => new Map<string, string | null>()) };
		await ensurePreviewImage(client as never, {} as never, repoRow, readme, "sha1");
		expect(updateRepositoryPreviewImage).toHaveBeenCalledWith({}, "org/repo", "https://raw.githubusercontent.com/org/repo/sha1/assets/demo.png");
	});

	it("falls back to the readme image when open graph fails", async () => {
		const client = { getOpenGraphImageUrls: vi.fn(async () => { throw new Error("rate limited"); }) };
		await ensurePreviewImage(client as never, {} as never, repoRow, readme, "sha1");
		expect(updateRepositoryPreviewImage).toHaveBeenCalledWith({}, "org/repo", "https://raw.githubusercontent.com/org/repo/sha1/assets/demo.png");
	});

	it("writes nothing when neither source yields an image", async () => {
		const client = { getOpenGraphImageUrls: vi.fn(async () => new Map<string, string | null>()) };
		await ensurePreviewImage(client as never, {} as never, repoRow, "no images here", "sha1");
		expect(updateRepositoryPreviewImage).not.toHaveBeenCalled();
	});
});
