import { beforeEach, describe, expect, it, vi } from "vitest";

// Make the discovery throttle instant so the test runs fast.
vi.spyOn(globalThis, "setTimeout").mockImplementation(((fn: () => void) => {
	fn();
	return 0 as unknown as ReturnType<typeof setTimeout>;
}) as never);

vi.mock("../src/worker/db/repository", () => ({
	upsertRepository: vi.fn(async (_db: unknown, repo: { id: number }) => ({ id: repo.id, changed: true })),
	updateRepositoryPreviewImage: vi.fn(async () => {}),
}));

import { ensurePreviewImage, runDiscovery } from "../src/worker/github/discovery";
import { updateRepositoryPreviewImage } from "../src/worker/db/repository";

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

describe("runDiscovery sharding", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("captures all repos when the window is under the search cap", async () => {
		const repos = Array.from({ length: 5 }, (_, i) => makeRepo(i, i));
		const client = {
			searchRepos: vi.fn(async (query: string, page: number, perPage: number, opts?: { sort?: string; order?: string }) => {
				if (opts?.sort === "created") return { total_count: repos.length, items: [repos[0]], incomplete_results: false };
				return { total_count: repos.length, items: repos.slice((page - 1) * perPage, page * perPage), incomplete_results: false };
			}),
			getOpenGraphImageUrls: vi.fn(async () => new Map<string, string | null>()),
		};
		const queue = { send: vi.fn(async () => {}) };
		const result = await runDiscovery(client as never, {} as never, queue as never);
		expect(result.reposSeen).toBe(5);
		expect(result.enqueued).toBe(5);
	});

	it("splits an oversized window and still captures every repo", async () => {
		const N = 2500;
		const repos = Array.from({ length: N }, (_, i) => makeRepo(i, i % 86400)); // spread over one day
		repos.sort((a, b) => a.created_at.localeCompare(b.created_at));

		const client = {
			searchRepos: vi.fn(async (query: string, page: number, perPage: number, opts?: { sort?: string; order?: string }) => {
				if (opts?.sort === "created" && opts.order === "asc") {
					return { total_count: N, items: [repos[0]], incomplete_results: false };
				}
				const m = /created:([^\s]+)\.\.([^\s]+)/.exec(query);
				let items = repos;
				if (m) items = repos.filter((r) => r.created_at >= m[1] && r.created_at <= m[2]);
				const total = items.length;
				return { total_count: total, items: items.slice((page - 1) * perPage, page * perPage), incomplete_results: false };
			}),
			getOpenGraphImageUrls: vi.fn(async () => new Map<string, string | null>()),
		};
		const queue = { send: vi.fn(async () => {}) };
		const result = await runDiscovery(client as never, {} as never, queue as never);

		expect(result.reposSeen).toBe(N);
		expect(result.enqueued).toBe(N);
		expect(result.shards).toBeGreaterThan(1); // proves the recursion split happened
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
