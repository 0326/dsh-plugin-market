/** Typed GitHub REST API client for Cloudflare Workers. */

export class GithubError extends Error {
	constructor(
		message: string,
		readonly status: number,
		readonly retryAfterSeconds?: number,
		readonly rateLimited: boolean = false,
	) {
		super(message);
		this.name = "GithubError";
	}
}

export interface GithubRepo {
	id: number;
	owner: { login: string };
	name: string;
	full_name: string;
	html_url: string;
	description: string | null;
	default_branch: string;
	stargazers_count: number;
	forks_count: number;
	license: { spdx_id: string | null } | null;
	archived: boolean;
	disabled: boolean;
	created_at: string;
	updated_at: string;
	pushed_at: string;
}

export interface GithubBranch {
	name: string;
	commit: { sha: string };
}

export interface GithubSearchReposResult {
	total_count: number;
	incomplete_results: boolean;
	items: GithubRepo[];
}

interface GithubContentFile {
	type: string;
	content: string;
	sha: string;
}

export interface GithubResponse<T> {
	data: T;
	etag?: string;
	remaining?: number;
}

function parseNumber(value: string | null): number | undefined {
	if (!value) return undefined;
	const n = Number(value);
	return Number.isFinite(n) ? n : undefined;
}

function parseRetryAfter(retryAfter: string | null, rateLimitReset: string | null): number | undefined {
	const ra = parseNumber(retryAfter);
	if (ra !== undefined) return ra;
	const reset = parseNumber(rateLimitReset);
	if (reset !== undefined) return Math.max(0, reset - Math.floor(Date.now() / 1000));
	return undefined;
}

function encodePath(path: string): string {
	return path.split("/").map(encodeURIComponent).join("/");
}

function decodeBase64(b64: string): string {
	const clean = b64.replace(/\s+/g, "");
	const binary = atob(clean);
	const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
	return new TextDecoder("utf-8").decode(bytes);
}

export class GithubClient {
	private readonly base = "https://api.github.com";

	constructor(private readonly token: string) {}

	async get<T>(path: string, etag?: string): Promise<GithubResponse<T>> {
		const headers = new Headers({
			Accept: "application/vnd.github+json",
			"X-GitHub-Api-Version": "2022-11-28",
			"User-Agent": "dsh-plugin-market",
		});
		if (this.token) headers.set("Authorization", "Bearer " + this.token);
		if (etag) headers.set("If-None-Match", etag);

		const res = await fetch(this.base + path, { headers });
		const remaining = parseNumber(res.headers.get("X-RateLimit-Remaining"));
		const reset = res.headers.get("X-RateLimit-Reset");
		const retryAfter = parseRetryAfter(res.headers.get("Retry-After"), reset);

		if (res.status === 304) throw new GithubError("not modified", 304, undefined, false);
		if (res.status === 404) throw new GithubError("not found", 404, undefined, false);
		if (res.status === 429 || (res.status === 403 && remaining === 0)) {
			throw new GithubError("rate limited", res.status, retryAfter, true);
		}
		if (res.status === 403) throw new GithubError("forbidden", 403, undefined, false);
		if (res.status >= 400) throw new GithubError("github error " + res.status, res.status, undefined, false);

		const data = (await res.json()) as T;
		return { data, etag: res.headers.get("ETag") ?? undefined, remaining };
	}

	async getRepo(owner: string, repo: string): Promise<GithubRepo> {
		const res = await this.get<GithubRepo>("/repos/" + encodePath(owner) + "/" + encodePath(repo));
		return res.data;
	}

	async getBranchSha(owner: string, repo: string, branch: string): Promise<string> {
		const res = await this.get<GithubBranch>("/repos/" + encodePath(owner) + "/" + encodePath(repo) + "/branches/" + encodePath(branch));
		return res.data.commit.sha;
	}

	async searchRepos(query: string, page: number, perPage: number): Promise<GithubSearchReposResult> {
		const res = await this.get<GithubSearchReposResult>(
			"/search/repositories?q=" + encodeURIComponent(query) + "&page=" + page + "&per_page=" + perPage,
		);
		return res.data;
	}

	/** Fetch and decode a single file; returns undefined when absent or too large to fetch. */
	async getFile(owner: string, repo: string, path: string, ref: string): Promise<string | undefined> {
		try {
			const res = await this.get<GithubContentFile | GithubContentFile[]>(
				"/repos/" + encodePath(owner) + "/" + encodePath(repo) + "/contents/" + encodePath(path) + "?ref=" + encodeURIComponent(ref),
			);
			const data = res.data;
			if (Array.isArray(data)) return undefined;
			if (data.type !== "file" || !data.content) return undefined;
			return decodeBase64(data.content);
		} catch (err) {
			if (err instanceof GithubError) {
				// 404 = file absent; 403 without rate limiting = blob over the 1MB contents limit.
				if (err.status === 404) return undefined;
				if (err.status === 403 && !err.rateLimited) return undefined;
			}
			throw err;
		}
	}
}
