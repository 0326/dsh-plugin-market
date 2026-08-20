import { getPlugin, type PluginDetail, type PluginListItem } from "./db/repository";
import { buildSitemapXml } from "./seo";

const SITEMAP_PLUGIN_LIMIT = 45_000;

export const INDEXABLE_VERIFICATION_STATUSES = ["DETECTED", "FORMAT_VERIFIED", "FEATURED"] as const;
export const NOINDEX_ROBOTS = "noindex,follow";

export interface PluginIndexabilityInput {
	verificationStatus: string;
	pluginTypes?: readonly string[] | null;
	pluginTypesJson?: string | null;
	metadataJson?: string | null;
}

export interface SitemapCandidate extends PluginListItem {
	pluginTypesJson: string | null;
}

function parseStringArray(raw: string | null | undefined): string[] {
	if (!raw) return [];
	try {
		const value = JSON.parse(raw) as unknown;
		return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
	} catch {
		return [];
	}
}

function parseMetadataPluginTypes(raw: string | null | undefined): string[] {
	if (!raw) return [];
	try {
		const value = JSON.parse(raw) as { pluginTypes?: unknown };
		return Array.isArray(value.pluginTypes)
			? value.pluginTypes.filter((item): item is string => typeof item === "string")
			: [];
	} catch {
		return [];
	}
}

export function isPluginIndexable(plugin: PluginIndexabilityInput): boolean {
	if (!(INDEXABLE_VERIFICATION_STATUSES as readonly string[]).includes(plugin.verificationStatus)) return false;
	const pluginTypes =
		plugin.pluginTypes ??
		(plugin.pluginTypesJson !== undefined ? parseStringArray(plugin.pluginTypesJson) : parseMetadataPluginTypes(plugin.metadataJson));
	return !pluginTypes.includes("NON_PLUGIN");
}

export function filterIndexableSitemapItems(items: SitemapCandidate[]): PluginListItem[] {
	return items.filter(isPluginIndexable).map(({ pluginTypesJson: _pluginTypesJson, ...item }) => item);
}

async function listSitemapCandidates(db: D1Database): Promise<SitemapCandidate[]> {
	const placeholders = INDEXABLE_VERIFICATION_STATUSES.map(() => "?").join(", ");
	const sql = `SELECT r.owner, r.name AS repo, r.full_name AS fullName, r.description, r.stars,
		p.verification_status AS verificationStatus, p.compatibility_status AS compatibilityStatus,
		p.security_status AS securityStatus, p.maintenance_status AS maintenanceStatus,
		p.risk_level AS riskLevel, p.package_name AS packageName,
		p.plugin_types_json AS pluginTypesJson,
		s.commit_sha AS latestCommitSha, p.updated_at AS updatedAt, r.preview_image_url AS previewImageUrl
	FROM plugins p
	JOIN repositories r ON r.id = p.repository_id
	LEFT JOIN scans s ON s.id = p.latest_scan_id
	WHERE p.verification_status IN (${placeholders})
	ORDER BY r.updated_at DESC
	LIMIT ?`;
	const result = await db
		.prepare(sql)
		.bind(...INDEXABLE_VERIFICATION_STATUSES, SITEMAP_PLUGIN_LIMIT)
		.all<SitemapCandidate>();
	return result.results ?? [];
}

export async function renderIndexableSitemap(db: D1Database): Promise<Response> {
	const candidates = await listSitemapCandidates(db);
	const items = filterIndexableSitemapItems(candidates);
	return new Response(buildSitemapXml(items), {
		headers: {
			"content-type": "application/xml; charset=utf-8",
			"cache-control": "public, max-age=300, s-maxage=1800, stale-while-revalidate=86400",
		},
	});
}

function safeDecode(value: string): string {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}

function pluginMatch(pathname: string): { owner: string; repo: string } | null {
	const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
	const match = /^\/plugin\/([^/]+)\/([^/]+)$/.exec(normalized);
	return match ? { owner: safeDecode(match[1]), repo: safeDecode(match[2]) } : null;
}

export function detailIsIndexable(detail: Pick<PluginDetail, "verificationStatus" | "metadataJson">): boolean {
	return isPluginIndexable({ verificationStatus: detail.verificationStatus, metadataJson: detail.metadataJson });
}

export async function applyPluginIndexability(response: Response, pathname: string, db: D1Database): Promise<Response> {
	const match = pluginMatch(pathname);
	if (!match) return response;
	const detail = await getPlugin(db, match.owner, match.repo);
	if (!detail || detailIsIndexable(detail)) return response;

	const headers = new Headers(response.headers);
	headers.set("x-robots-tag", "noindex, follow");
	const noindexResponse = new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
	const contentType = headers.get("content-type") ?? "";
	if (!contentType.includes("text/html")) return noindexResponse;

	return new HTMLRewriter()
		.on('meta[name="robots"]', {
			element(element) {
				element.setAttribute("content", NOINDEX_ROBOTS);
			},
		})
		.transform(noindexResponse);
}
