import type { PluginDetail } from "../db/repository";
import { GithubClient } from "./client";
import { resolveReadmePath, type ReadmeLanguage } from "./readme";

export type { ReadmeLanguage } from "./readme";

export interface PluginReadmeContent {
	owner: string;
	repo: string;
	path: string;
	language: ReadmeLanguage | "unknown";
	fallback: boolean;
	ref: string;
	html: string;
	sourceUrl: string;
}

interface LoadPluginReadmeOptions {
	detail: Pick<PluginDetail, "owner" | "repo" | "latestCommitSha">;
	language: ReadmeLanguage;
	githubToken: string;
	origin: string;
	waitUntil?: (promise: Promise<unknown>) => void;
}

function encodeGithubPath(path: string): string {
	return path.split("/").map(encodeURIComponent).join("/");
}

function cacheRequest(origin: string, owner: string, repo: string, language: ReadmeLanguage): Request {
	return new Request(
		new URL(`/api/plugins/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme?lang=${language}`, origin).toString(),
	);
}

export async function loadPluginReadme(options: LoadPluginReadmeOptions): Promise<PluginReadmeContent | null> {
	const { detail, language, githubToken, origin, waitUntil } = options;
	const key = cacheRequest(origin, detail.owner, detail.repo, language);
	const cached = await caches.default.match(key);
	if (cached?.ok) {
		try {
			return (await cached.json()) as PluginReadmeContent;
		} catch {
			// Ignore a malformed cache entry and refresh it from GitHub.
		}
	}

	const client = new GithubClient(githubToken);
	let ref = detail.latestCommitSha;
	if (!ref) {
		const githubRepo = await client.getRepo(detail.owner, detail.repo);
		ref = await client.getBranchSha(detail.owner, detail.repo, githubRepo.default_branch);
	}

	const tree = await client.getTree(detail.owner, detail.repo, ref);
	const resolved = resolveReadmePath(tree, language);
	if (!resolved) return null;

	const markdown = await client.getFile(detail.owner, detail.repo, resolved.path, ref);
	if (!markdown) return null;

	const html = await client.renderMarkdown(markdown);
	const result: PluginReadmeContent = {
		owner: detail.owner,
		repo: detail.repo,
		path: resolved.path,
		language: resolved.language,
		fallback: resolved.fallback,
		ref,
		html,
		sourceUrl: `https://github.com/${encodeURIComponent(detail.owner)}/${encodeURIComponent(detail.repo)}/blob/${encodeURIComponent(ref)}/${encodeGithubPath(resolved.path)}`,
	};

	const cacheResponse = new Response(JSON.stringify(result), {
		headers: {
			"content-type": "application/json; charset=utf-8",
			"cache-control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
		},
	});
	const put = caches.default.put(key, cacheResponse);
	if (waitUntil) waitUntil(put);
	else await put;
	return result;
}

function normalizeRepoPath(path: string): string | null {
	const segments: string[] = [];
	for (const segment of path.split("/")) {
		if (!segment || segment === ".") continue;
		if (segment === "..") {
			if (segments.length === 0) return null;
			segments.pop();
			continue;
		}
		segments.push(segment);
	}
	return segments.join("/");
}

function readmeDirectory(path: string): string {
	const slash = path.lastIndexOf("/");
	return slash === -1 ? "" : path.slice(0, slash + 1);
}

function encodePath(path: string): string {
	return path
		.split("/")
		.map((segment) => {
			try {
				return encodeURIComponent(decodeURIComponent(segment));
			} catch {
				return encodeURIComponent(segment);
			}
		})
		.join("/");
}

function decodeAttribute(value: string): string {
	return value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");
}

function escapeAttribute(value: string): string {
	return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function resolveReadmeUrl(value: string, kind: "link" | "image", readme: PluginReadmeContent): string | null {
	const trimmed = decodeAttribute(value).trim();
	if (!trimmed) return null;
	if (kind === "link" && trimmed.startsWith("#")) return trimmed;
	if (trimmed.startsWith("//")) return "https:" + trimmed;

	try {
		const absolute = new URL(trimmed);
		const allowedProtocols = kind === "image" ? ["http:", "https:"] : ["http:", "https:", "mailto:"];
		return allowedProtocols.includes(absolute.protocol) ? absolute.href : null;
	} catch {
		// Repository-relative URL; resolve it against the README directory and scanned ref.
	}

	const queryIndex = trimmed.indexOf("?");
	const hashIndex = trimmed.indexOf("#");
	const suffixIndex = [queryIndex, hashIndex]
		.filter((index) => index >= 0)
		.reduce((min, index) => Math.min(min, index), trimmed.length);
	const pathPart = trimmed.slice(0, suffixIndex);
	const suffix = trimmed.slice(suffixIndex);
	const baseDirectory = pathPart.startsWith("/") ? "" : readmeDirectory(readme.path);
	const normalized = normalizeRepoPath(baseDirectory + pathPart.replace(/^\/+/, ""));
	if (!normalized) return null;
	const encoded = encodePath(normalized);

	if (kind === "image") {
		return `https://raw.githubusercontent.com/${encodeURIComponent(readme.owner)}/${encodeURIComponent(readme.repo)}/${encodeURIComponent(readme.ref)}/${encoded}${suffix}`;
	}
	return `https://github.com/${encodeURIComponent(readme.owner)}/${encodeURIComponent(readme.repo)}/blob/${encodeURIComponent(readme.ref)}/${encoded}${suffix}`;
}

/** GitHub already sanitizes rendered Markdown; this only pins repository-relative URLs to the scanned commit. */
export function rewriteReadmeHtmlUrls(html: string, readme: PluginReadmeContent): string {
	return html.replace(/\b(href|src)=(['"])(.*?)\2/gi, (_match, attribute: string, quote: string, value: string) => {
		const kind = attribute.toLowerCase() === "src" ? "image" : "link";
		const resolved = resolveReadmeUrl(value, kind, readme);
		if (!resolved) return kind === "link" ? `${attribute}=${quote}#${quote}` : "";
		return `${attribute}=${quote}${escapeAttribute(resolved)}${quote}`;
	});
}
