/** Typed client for the DS Plugin Market API. */

export interface PluginListItem {
	owner: string;
	repo: string;
	fullName: string;
	description: string | null;
	stars: number;
	verificationStatus: string;
	compatibilityStatus: string;
	securityStatus: string;
	maintenanceStatus: string;
	riskLevel: string;
	packageName: string | null;
	latestCommitSha: string | null;
	updatedAt: string | null;
}

export interface Finding {
	category: string;
	code: string;
	severity: string;
	title: string;
	detail?: string;
	filePath?: string;
	evidence?: Record<string, unknown>;
}

export interface PluginDetail extends PluginListItem {
	htmlUrl: string;
	forks: number;
	licenseSpdx: string | null;
	featured: number;
	metadataJson: string | null;
	scannerVersion: string | null;
	scannedAt: string | null;
	findings: Finding[];
}

const API = "/api";

async function get<T>(path: string): Promise<T> {
	const res = await fetch(API + path);
	if (!res.ok) throw new Error("API error " + res.status);
	return (await res.json()) as T;
}

export interface ListPluginsOptions {
	q?: string;
	verified?: boolean;
	status?: string;
	sort?: "updated" | "stars" | "new";
	limit?: number;
	offset?: number;
}

export function listPlugins(opts: ListPluginsOptions = {}): Promise<{ items: PluginListItem[]; count: number }> {
	const params = new URLSearchParams();
	if (opts.q) params.set("q", opts.q);
	if (opts.verified) params.set("verified", "1");
	if (opts.status) params.set("status", opts.status);
	if (opts.sort) params.set("sort", opts.sort);
	if (opts.limit !== undefined) params.set("limit", String(opts.limit));
	if (opts.offset !== undefined) params.set("offset", String(opts.offset));
	const qs = params.toString();
	return get<{ items: PluginListItem[]; count: number }>("/plugins" + (qs ? "?" + qs : ""));
}

export function getPlugin(owner: string, repo: string): Promise<PluginDetail> {
	return get<PluginDetail>("/plugins/" + encodeURIComponent(owner) + "/" + encodeURIComponent(repo));
}

export function submitPlugin(url: string): Promise<{ owner: string; repo: string; status: string }> {
	return fetch(API + "/submit", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ url }),
	}).then(async (res) => {
		if (!res.ok) throw new Error("submit failed " + res.status);
		return (await res.json()) as { owner: string; repo: string; status: string };
	});
}

export function installCommand(owner: string, repo: string, sha: string | null): string {
	if (sha) return "dsh plugin --profile web add github:" + owner + "/" + repo + "#" + sha;
	return "dsh plugin --profile web add github:" + owner + "/" + repo;
}
