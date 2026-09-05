import { getPlugin, getPublisher, listPlugins, type PluginDetail, type PluginListItem } from "./db/repository";
import { buildSitemapXml, SITEMAP_PLUGIN_LIMIT } from "./seo";
import { INDEXABLE_VERIFICATION_STATUSES, isPluginIndexable, isPublisherIndexable } from "./seo-policy";
import { CAPABILITY_LANDINGS, DISCOVERY_LANDINGS, LANDING_MINIMUM_PLUGINS } from "./seo-landings";

export const NOINDEX_ROBOTS = "noindex,follow";
export { INDEXABLE_VERIFICATION_STATUSES, isPluginIndexable } from "./seo-policy";

export interface SitemapCandidate extends PluginListItem {
	pluginTypesJson: string | null;
	metadataJson: string | null;
}

export function filterIndexableSitemapItems(items: SitemapCandidate[]): PluginListItem[] {
	return items.filter(isPluginIndexable).map((item) => ({
		owner: item.owner,
		repo: item.repo,
		fullName: item.fullName,
		description: item.description,
		stars: item.stars,
		verificationStatus: item.verificationStatus,
		compatibilityStatus: item.compatibilityStatus,
		securityStatus: item.securityStatus,
		maintenanceStatus: item.maintenanceStatus,
		riskLevel: item.riskLevel,
		packageName: item.packageName,
		latestCommitSha: item.latestCommitSha,
		updatedAt: item.updatedAt,
		previewImageUrl: item.previewImageUrl,
	}));
}

async function listSitemapCandidates(db: D1Database): Promise<SitemapCandidate[]> {
	const placeholders = INDEXABLE_VERIFICATION_STATUSES.map(() => "?").join(", ");
	const sql = `SELECT r.owner, r.name AS repo, r.full_name AS fullName, r.description, r.stars,
		p.verification_status AS verificationStatus, p.compatibility_status AS compatibilityStatus,
		p.security_status AS securityStatus, p.maintenance_status AS maintenanceStatus,
		p.risk_level AS riskLevel, p.package_name AS packageName,
		p.plugin_types_json AS pluginTypesJson, p.metadata_json AS metadataJson,
		s.commit_sha AS latestCommitSha, p.updated_at AS updatedAt, r.preview_image_url AS previewImageUrl
	FROM plugins p
	JOIN repositories r ON r.id = p.repository_id
	LEFT JOIN scans s ON s.id = p.latest_scan_id
	WHERE p.verification_status IN (${placeholders})
		AND (COALESCE(TRIM(r.description), '') <> '' OR COALESCE(TRIM(p.package_name), '') <> '' OR s.commit_sha IS NOT NULL)
		AND NOT (p.plugin_types_json LIKE '%"NON_PLUGIN"%' OR p.metadata_json LIKE '%"NON_PLUGIN"%')
		AND (p.verification_status <> 'DETECTED' OR (COALESCE(TRIM(r.description), '') <> '' AND (COALESCE(TRIM(p.package_name), '') <> '' OR s.commit_sha IS NOT NULL)))
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
	const landingPaths = (await Promise.all([...CAPABILITY_LANDINGS, ...DISCOVERY_LANDINGS].map(async (landing) => {
		const filtered = "capability" in landing
			? await listPlugins(db, { capability: landing.capability, installableOnly: true, limit: 50 })
			: await listPlugins(db, { sort: landing.sort, verifiedOnly: landing.verified, installableOnly: true, limit: 50 });
		return filtered.filter(isPluginIndexable).length >= LANDING_MINIMUM_PLUGINS ? `/plugins/${landing.slug}` : null;
	}))).filter((path): path is string => path !== null);
	return new Response(buildSitemapXml(items, landingPaths), {
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

export function detailIsIndexable(
	detail: Pick<PluginDetail, "verificationStatus" | "metadataJson"> &
		Partial<Pick<PluginDetail, "description" | "packageName" | "latestCommitSha">>,
): boolean {
	return isPluginIndexable({
		verificationStatus: detail.verificationStatus,
		metadataJson: detail.metadataJson,
		description: detail.description,
		packageName: detail.packageName,
		latestCommitSha: detail.latestCommitSha,
	});
}

export async function applyPluginIndexability(response: Response, pathname: string, db: D1Database): Promise<Response> {
	const plugin = pluginMatch(pathname);
	if (plugin) {
		const detail = await getPlugin(db, plugin.owner, plugin.repo);
		if (detail && detailIsIndexable(detail)) return response;
		return addNoIndex(response);
	}

	const publisherMatch = /^\/publisher\/([^/]+)\/?$/.exec(pathname);
	if (!publisherMatch) return response;
	const owner = safeDecode(publisherMatch[1]);
	const publisher = await getPublisher(db, owner);
	if (publisher && isPublisherIndexable(publisher)) return response;
	return addNoIndex(response);
}

function addNoIndex(response: Response): Response {
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
