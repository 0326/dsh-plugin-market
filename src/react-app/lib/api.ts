/** Typed client for the dsh-plugin market API. */

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
	previewImageUrl: string | null;
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

export interface PluginReadme {
	owner: string;
	repo: string;
	path: string;
	language: "zh" | "en" | "unknown";
	fallback: boolean;
	ref: string;
	html: string;
	sourceUrl: string;
}

export interface RegistryStats {
	total: number;
	verified: number;
	featured: number;
	updatedThisWeek: number;
	lastScanAt: string | null;
}

export interface CompatibilityBaseline {
	dshVersion: string;
	cordisVersion: string;
	checkedAt: string;
}

export interface RegistryContext {
	stats: RegistryStats;
	scannerVersion: string;
	baseline: CompatibilityBaseline | null;
}

export interface ScanRow {
	id: number;
	commitSha: string;
	scannerVersion: string;
	status: string;
	startedAt: string;
	completedAt: string | null;
	errorCode: string | null;
}

export interface Publisher {
	owner: string;
	repos: PluginListItem[];
	totalStars: number;
	verifiedCount: number;
}

const API = "/api";

async function get<T>(path: string): Promise<T> {
	const res = await fetch(API + path);
	if (!res.ok) throw new Error("API error " + res.status);
	return (await res.json()) as T;
}

export type Sort = "updated" | "stars" | "new" | "trending";

export interface ListPluginsOptions {
	q?: string;
	verified?: boolean;
	featured?: boolean;
	status?: string;
	capability?: string;
	pluginType?: string;
	compatibility?: string;
	risk?: string;
	sort?: Sort;
	limit?: number;
	offset?: number;
}

export function listPlugins(opts: ListPluginsOptions = {}): Promise<{ items: PluginListItem[]; count: number }> {
	const params = new URLSearchParams();
	if (opts.q) params.set("q", opts.q);
	if (opts.verified) params.set("verified", "1");
	if (opts.featured) params.set("featured", "1");
	if (opts.status) params.set("status", opts.status);
	if (opts.capability) params.set("capability", opts.capability);
	if (opts.pluginType) params.set("pluginType", opts.pluginType);
	if (opts.compatibility) params.set("compatibility", opts.compatibility);
	if (opts.risk) params.set("risk", opts.risk);
	if (opts.sort) params.set("sort", opts.sort);
	if (opts.limit !== undefined) params.set("limit", String(opts.limit));
	if (opts.offset !== undefined) params.set("offset", String(opts.offset));
	const qs = params.toString();
	return get<{ items: PluginListItem[]; count: number }>("/plugins" + (qs ? "?" + qs : ""));
}

export function getPlugin(owner: string, repo: string): Promise<PluginDetail> {
	return get<PluginDetail>("/plugins/" + encodeURIComponent(owner) + "/" + encodeURIComponent(repo));
}

export async function getPluginReadme(owner: string, repo: string, lang: "zh" | "en"): Promise<PluginReadme | null> {
	const path = "/plugins/" + encodeURIComponent(owner) + "/" + encodeURIComponent(repo) + "/readme?lang=" + encodeURIComponent(lang);
	const res = await fetch(API + path);
	if (res.status === 404) return null;
	if (!res.ok) throw new Error("API error " + res.status);
	return (await res.json()) as PluginReadme;
}

export function getScans(owner: string, repo: string): Promise<{ scans: ScanRow[] }> {
	return get<{ scans: ScanRow[] }>("/plugins/" + encodeURIComponent(owner) + "/" + encodeURIComponent(repo) + "/scans");
}

export function getStats(): Promise<RegistryStats> {
	return get<RegistryStats>("/stats");
}

export function getRegistryContext(): Promise<RegistryContext> {
	return get<RegistryContext>("/context");
}

export function getPublisher(owner: string): Promise<Publisher> {
	return get<Publisher>("/publishers/" + encodeURIComponent(owner));
}

export function getCategories(): Promise<{ capabilities: string[]; pluginTypes: string[] }> {
	return get<{ capabilities: string[]; pluginTypes: string[] }>("/categories");
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
