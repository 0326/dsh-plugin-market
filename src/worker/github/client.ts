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

export interface GithubTreeEntry {
	path: string;
	type: "blob" | "tree";
	size?: number;
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

interface GithubGraphqlResponse<T> {
	data?: T;
	errors?: { message: string }[];
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

	private headers(accept = "application/vnd.github+json"): Headers {
		const headers = new Headers({
			Accept: accept,
			"X-GitHub-Api-Version": "2022-11-28",
			"User-Agent": "dsh-plugin-market",
		});
		if (this.token) headers.set("Authorization", "Bearer " + this.token);
		return headers;
	}

	private githubError(res: Response, remaining?: number): GithubError {
		const reset = res.headers.get("X-RateLimit-Reset");
		const retryAfter = parseRetryAfter(res.headers.get("Retry-After"), reset);
		if (res.status === 404) return new GithubError("not found", 404, undefined, false);
		if (res.status === 429 || (res.status === 403 && remaining === 0)) return new GithubError("rate limited", res.status, retryAfter, true);
		if (res.status === 403) return new GithubError("forbidden", 403, undefined, false);
		return new GithubError("github error " + res.status, res.status, undefined, false);
	}

	async get<T>(path: string, etag?: string): Promise<GithubResponse<T>> {
		const headers = this.headers();
		if (etag) headers.set("If-None-Match", etag);

		const res = await fetch(this.base + path, { headers });
		const remaining = parseNumber(res.headers.get("X-RateLimit-Remaining"));
		if (res.status === 304) throw new GithubError("not modified", 304, undefined, false);
		if (res.status >= 400) throw this.githubError(res, remaining);

		const data = (await res.json()) as T;
		return { data, etag: res.headers.get("ETag") ?? undefined, remaining };
	}

	async getRepo(owner: string, repo: string): Promise<GithubRepo> {
		const res = await this.get<GithubRepo>("/repos/" + encodePath(owner) + "/" + encodePath(repo));
		return res.data;
	}

	private async graphql<T>(query: string): Promise<T> {
		const headers = this.headers();
		headers.set("Content-Type", "application/json");

		const res = await fetch("https://api.github.com/graphql", {
			method: "POST",
			headers,
			body: JSON.stringify({ query }),
		});
		const remaining = parseNumber(res.headers.get("X-RateLimit-Remaining"));
		if (res.status === 401) throw new GithubError("unauthorized", 401, undefined, false);
		if (res.status >= 400) throw this.githubError(res, remaining);

		const body = (await res.json()) as GithubGraphqlResponse<T>;
		if (body.errors?.length) throw new GithubError("graphql error: " + body.errors[0].message, 200, undefined, false);
		if (!body.data) throw new GithubError("graphql returned no data", 200, undefined, false);
		return body.data;
	}

	/** Render trusted-by-GitHub GFM HTML. Repository-relative URLs are intentionally left for the client to resolve against the scanned ref. */
	async renderMarkdown(markdown: string): Promise<string> {
		const headers = this.headers("text/html");
		headers.set("Content-Type", "application/json");
		const res = await fetch(this.base + "/markdown", {
			method: "POST",
			headers,
			body: JSON.stringify({ text: markdown, mode: "gfm" }),
		});
		const remaining = parseNumber(res.headers.get("X-RateLimit-Remaining"));
		if (res.status >= 400) throw this.githubError(res, remaining);
		return res.text();
	}

	/**
	 * Fetch each repository's social preview (Open Graph) image URL in a single
	 * batched GraphQL request. Missing/unavailable images resolve to null for
	 * that repo; the keys are `owner/name`.
	 */
	async getOpenGraphImageUrls(repos: { owner: string; name: string }[]): Promise<Map<string, string | null>> {
		const result = new Map<string, string | null>();
		if (repos.length === 0) return result;

		const fields = repos
			.map((r, i) => `r${i}: repository(owner: ${JSON.stringify(r.owner)}, name: ${JSON.stringify(r.name)}) { openGraphImageUrl }`)
			.join("\n");
		const data = await this.graphql<Record<string, { openGraphImageUrl: string | null } | null>>(`query { ${fields} }`);

		for (let i = 0; i < repos.length; i++) {
			const key = repos[i].owner + "/" + repos[i].name;
			result.set(key, data?.[`r${i}`]?.openGraphImageUrl ?? null);
		}
		return result;
	}

	async getBranchSha(owner: string, repo: string, branch: string): Promise<string> {
		const res = await this.get<GithubBranch>("/repos/" + encodePath(owner) + "/" + encodePath(repo) + "/branches/" + encodePath(branch));
		return res.data.commit.sha;
	}

	/** Fetch the recursive git tree for a commit in a single request. */
	async getTree(owner: string, repo: string, sha: string): Promise<GithubTreeEntry[]> {
		const res = await this.get<{ tree: GithubTreeEntry[]; truncated: boolean }>(
			"/repos/" + encodePath(owner) + "/" + encodePath(repo) + "/git/trees/" + encodeURIComponent(sha) + "?recursive=1",
		);
		return res.data.tree ?? [];
	}

	async searchRepos(
		query: string,
		page: number,
		perPage: number,
		opts?: { sort?: string; order?: "asc" | "desc" },
	): Promise<GithubSearchReposResult> {
		let url = "/search/repositories?q=" + encodeURIComponent(query) + "&page=" + page + "&per_page=" + perPage;
		if (opts?.sort) url += "&sort=" + opts.sort;
		if (opts?.order) url += "&order=" + opts.order;
		const res = await this.get<GithubSearchReposResult>(url);
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
