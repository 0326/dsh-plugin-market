import { getPlugin, getPublisher, listPlugins, type PluginDetail, type PluginListItem, type PublisherInfo } from "./db/repository";
import type { Env } from "./env";

export const SITE_URL = "https://dsh-plugin.market";
export const SITE_NAME = "DSH Plugin Market";
const DEFAULT_IMAGE = `${SITE_URL}/kun.png`;
const SITEMAP_PLUGIN_LIMIT = 45_000;
const SITEMAP_URL_LIMIT = 49_900;

interface PluginMetadata {
	packageVersion?: string;
	capabilities?: string[];
	pluginTypes?: string[];
}

export interface SeoSpec {
	title: string;
	description: string;
	canonicalPath: string;
	image: string;
	robots: string;
	jsonLd: Record<string, unknown>;
	status?: number;
}

function websiteNode(): Record<string, unknown> {
	return {
		"@type": "WebSite",
		"@id": `${SITE_URL}/#website`,
		url: `${SITE_URL}/`,
		name: SITE_NAME,
		alternateName: ["dsh-plugin market", "DeepSeek Harness Plugin Market", "dsh-plugin.market"],
		description: "A trusted plugin registry and discovery platform for the DeepSeek Harness ecosystem.",
		inLanguage: ["zh-CN", "en"],
		sameAs: ["https://github.com/0326/dsh-plugin-market"],
		potentialAction: {
			"@type": "SearchAction",
			target: `${SITE_URL}/plugins?q={search_term_string}`,
			"query-input": "required name=search_term_string",
		},
	};
}

function webPageNode(path: string, title: string, description: string): Record<string, unknown> {
	const url = `${SITE_URL}${path}`;
	return {
		"@type": "WebPage",
		"@id": `${url}#webpage`,
		url,
		name: title,
		description,
		isPartOf: { "@id": `${SITE_URL}/#website` },
	};
}

function graph(...nodes: Record<string, unknown>[]): Record<string, unknown> {
	return { "@context": "https://schema.org", "@graph": [websiteNode(), ...nodes] };
}

function safeDecode(value: string): string {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}

function parseMetadata(json: string | null): PluginMetadata {
	if (!json) return {};
	try {
		return JSON.parse(json) as PluginMetadata;
	} catch {
		return {};
	}
}

function cleanDescription(value: string | null | undefined, fallback: string): string {
	const text = value?.replace(/\s+/g, " ").trim();
	return text ? text.slice(0, 300) : fallback;
}

function staticSpec(pathname: string): SeoSpec | null {
	if (pathname === "/") {
		const title = "DSH Plugin Market — DeepSeek Harness Plugin Registry";
		const description = "DSH Plugin Market is a trusted registry for discovering, verifying and installing DeepSeek Harness plugins with compatibility, security and maintenance signals.";
		return { title, description, canonicalPath: "/", image: DEFAULT_IMAGE, robots: "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1", jsonLd: graph(webPageNode("/", title, description)) };
	}
	if (pathname === "/plugins") {
		const title = `Explore DSH Plugins — ${SITE_NAME}`;
		const description = "Explore DeepSeek Harness plugins with format verification, compatibility, security, maintenance and traceable install signals.";
		return { title, description, canonicalPath: "/plugins", image: DEFAULT_IMAGE, robots: "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1", jsonLd: graph(webPageNode("/plugins", title, description)) };
	}
	if (pathname === "/submit") {
		const title = `Submit a DSH Plugin — ${SITE_NAME}`;
		const description = "Submit a DeepSeek Harness plugin repository to DSH Plugin Market for discovery, verification and trust scanning.";
		return { title, description, canonicalPath: "/submit", image: DEFAULT_IMAGE, robots: "index,follow", jsonLd: graph(webPageNode("/submit", title, description)) };
	}
	if (pathname === "/about") {
		const title = `About ${SITE_NAME} — DeepSeek Harness Plugin Registry`;
		const description = "Learn how DSH Plugin Market discovers, verifies and assesses DeepSeek Harness plugins and how to interpret its trust signals.";
		return { title, description, canonicalPath: "/about", image: DEFAULT_IMAGE, robots: "index,follow", jsonLd: graph(webPageNode("/about", title, description)) };
	}
	return null;
}

export function buildPluginJsonLd(detail: PluginDetail, canonicalPath: string, description: string): Record<string, unknown> {
	const metadata = parseMetadata(detail.metadataJson);
	const canonical = `${SITE_URL}${canonicalPath}`;
	const pluginId = `${canonical}#plugin`;
	const properties = [
		["Format verification", detail.verificationStatus],
		["Compatibility", detail.compatibilityStatus],
		["Security", detail.securityStatus],
		["Maintenance", detail.maintenanceStatus],
		["Risk level", detail.riskLevel],
		["Scanned commit", detail.latestCommitSha],
	]
		.filter((entry): entry is [string, string] => Boolean(entry[1]))
		.map(([name, value]) => ({ "@type": "PropertyValue", name, value }));

	const capabilities = metadata.capabilities ?? [];
	const pluginTypes = metadata.pluginTypes ?? [];
	const software: Record<string, unknown> = {
		"@type": "SoftwareSourceCode",
		"@id": pluginId,
		name: detail.packageName ?? detail.fullName,
		alternateName: detail.fullName,
		description,
		url: canonical,
		codeRepository: detail.htmlUrl,
		image: detail.previewImageUrl ?? DEFAULT_IMAGE,
		dateModified: detail.updatedAt ?? detail.scannedAt ?? undefined,
		license: detail.licenseSpdx ?? undefined,
		version: metadata.packageVersion ?? undefined,
		keywords: [...capabilities, ...pluginTypes, "DeepSeek Harness", "DSH plugin"].join(", "),
		author: { name: detail.owner, url: `https://github.com/${encodeURIComponent(detail.owner)}` },
		targetProduct: {
			"@type": "SoftwareApplication",
			name: "DeepSeek Harness",
			url: "https://github.com/deepseek-ai/deepseek-harness",
		},
		additionalProperty: properties,
	};
	const page = webPageNode(canonicalPath, `${detail.fullName} — ${SITE_NAME}`, description);
	page.mainEntity = { "@id": pluginId };
	return graph(page, software);
}

function pluginSpec(detail: PluginDetail): SeoSpec {
	const canonicalPath = `/plugin/${encodeURIComponent(detail.owner)}/${encodeURIComponent(detail.repo)}`;
	const description = cleanDescription(
		detail.description,
		`Review DSH plugin compatibility, security, maintenance and commit-bound install information for ${detail.fullName}.`,
	);
	const title = `${detail.fullName} — ${SITE_NAME}`;
	return {
		title,
		description,
		canonicalPath,
		image: detail.previewImageUrl ?? DEFAULT_IMAGE,
		robots: "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
		jsonLd: buildPluginJsonLd(detail, canonicalPath, description),
	};
}

function publisherSpec(pub: PublisherInfo): SeoSpec {
	const canonicalPath = `/publisher/${encodeURIComponent(pub.owner)}`;
	const title = `${pub.owner} DSH Plugins — ${SITE_NAME}`;
	const description = `Explore ${pub.repos.length} DeepSeek Harness plugin${pub.repos.length === 1 ? "" : "s"} from ${pub.owner}, including ${pub.verifiedCount} format-verified plugin${pub.verifiedCount === 1 ? "" : "s"} and trust signals.`;
	const page = webPageNode(canonicalPath, title, description);
	page["@type"] = "CollectionPage";
	page.about = { name: pub.owner, url: `https://github.com/${encodeURIComponent(pub.owner)}` };
	return { title, description, canonicalPath, image: DEFAULT_IMAGE, robots: "index,follow,max-image-preview:large", jsonLd: graph(page) };
}

function notFoundSpec(pathname: string): SeoSpec {
	const title = `Not Found — ${SITE_NAME}`;
	const description = "The requested DSH Plugin Market page was not found.";
	return {
		title,
		description,
		canonicalPath: pathname,
		image: DEFAULT_IMAGE,
		robots: "noindex,nofollow",
		jsonLd: graph(webPageNode(pathname, title, description)),
		status: 404,
	};
}

export function isSeoPagePath(pathname: string): boolean {
	return pathname === "/" || pathname === "/plugins" || pathname === "/submit" || pathname === "/about" || /^\/plugin\/[^/]+\/[^/]+\/?$/.test(pathname) || /^\/publisher\/[^/]+\/?$/.test(pathname);
}

export async function resolveSeoSpec(pathname: string, db: D1Database): Promise<SeoSpec> {
	const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
	const fixed = staticSpec(normalized);
	if (fixed) return fixed;

	const pluginMatch = /^\/plugin\/([^/]+)\/([^/]+)$/.exec(normalized);
	if (pluginMatch) {
		const owner = safeDecode(pluginMatch[1]);
		const repo = safeDecode(pluginMatch[2]);
		const detail = await getPlugin(db, owner, repo);
		return detail ? pluginSpec(detail) : notFoundSpec(normalized);
	}

	const publisherMatch = /^\/publisher\/([^/]+)$/.exec(normalized);
	if (publisherMatch) {
		const owner = safeDecode(publisherMatch[1]);
		const pub = await getPublisher(db, owner);
		return pub ? publisherSpec(pub) : notFoundSpec(normalized);
	}

	return notFoundSpec(normalized);
}

function serializeJsonLd(value: Record<string, unknown>): string {
	return JSON.stringify(value).replace(/</g, "\\u003c");
}

function xmlEscape(value: string): string {
	return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function lastMod(value: string | null): string | null {
	if (!value) return null;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function buildSitemapXml(items: PluginListItem[]): string {
	const urls: { loc: string; lastmod?: string | null }[] = [
		{ loc: `${SITE_URL}/` },
		{ loc: `${SITE_URL}/plugins` },
		{ loc: `${SITE_URL}/about` },
		{ loc: `${SITE_URL}/submit` },
	];

	for (const item of items) {
		urls.push({
			loc: `${SITE_URL}/plugin/${encodeURIComponent(item.owner)}/${encodeURIComponent(item.repo)}`,
			lastmod: lastMod(item.updatedAt),
		});
	}

	const owners = new Map<string, string | null>();
	for (const item of items) {
		const previous = owners.get(item.owner);
		if (!previous || (item.updatedAt && item.updatedAt > previous)) owners.set(item.owner, item.updatedAt);
	}
	const remaining = Math.max(0, SITEMAP_URL_LIMIT - urls.length);
	for (const [owner, updatedAt] of [...owners.entries()].slice(0, remaining)) {
		urls.push({ loc: `${SITE_URL}/publisher/${encodeURIComponent(owner)}`, lastmod: lastMod(updatedAt) });
	}

	const rows = urls.map(({ loc, lastmod }) => {
		const modified = lastmod ? `\n    <lastmod>${xmlEscape(lastmod)}</lastmod>` : "";
		return `  <url>\n    <loc>${xmlEscape(loc)}</loc>${modified}\n  </url>`;
	});
	return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join("\n")}\n</urlset>\n`;
}

export async function renderSitemap(db: D1Database): Promise<Response> {
	const items = await listPlugins(db, { sort: "updated", limit: SITEMAP_PLUGIN_LIMIT });
	return new Response(buildSitemapXml(items), {
		headers: {
			"content-type": "application/xml; charset=utf-8",
			"cache-control": "public, max-age=300, s-maxage=1800, stale-while-revalidate=86400",
		},
	});
}

export async function renderSeoPage(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);
	const spec = await resolveSeoSpec(url.pathname, env.DB);
	const assetResponse = await env.ASSETS.fetch(request);
	const contentType = assetResponse.headers.get("content-type") ?? "";
	if (!contentType.includes("text/html")) return assetResponse;

	const headers = new Headers(assetResponse.headers);
	headers.set("cache-control", spec.status === 404 ? "no-store" : "public, max-age=60, s-maxage=300, stale-while-revalidate=86400");
	const response = new Response(assetResponse.body, {
		status: spec.status ?? assetResponse.status,
		statusText: assetResponse.statusText,
		headers,
	});
	const canonical = `${SITE_URL}${spec.canonicalPath}`;
	const jsonLd = serializeJsonLd(spec.jsonLd);

	return new HTMLRewriter()
		.on("title", { element(e) { e.setInnerContent(spec.title); } })
		.on('meta[name="description"]', { element(e) { e.setAttribute("content", spec.description); } })
		.on('meta[name="robots"]', { element(e) { e.setAttribute("content", spec.robots); } })
		.on('link[rel="canonical"]', { element(e) { e.setAttribute("href", canonical); } })
		.on('meta[property="og:title"]', { element(e) { e.setAttribute("content", spec.title); } })
		.on('meta[property="og:description"]', { element(e) { e.setAttribute("content", spec.description); } })
		.on('meta[property="og:url"]', { element(e) { e.setAttribute("content", canonical); } })
		.on('meta[property="og:image"]', { element(e) { e.setAttribute("content", spec.image); } })
		.on('meta[property="og:image:alt"]', { element(e) { e.setAttribute("content", spec.title); } })
		.on('meta[name="twitter:card"]', { element(e) { e.setAttribute("content", "summary_large_image"); } })
		.on('meta[name="twitter:title"]', { element(e) { e.setAttribute("content", spec.title); } })
		.on('meta[name="twitter:description"]', { element(e) { e.setAttribute("content", spec.description); } })
		.on('meta[name="twitter:image"]', { element(e) { e.setAttribute("content", spec.image); } })
		.on("script#seo-jsonld", { element(e) { e.setInnerContent(jsonLd, { html: true }); } })
		.on("head", { element(e) { e.append(`<meta name="dsh-edge-seo" content="${spec.canonicalPath.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}">`, { html: true }); } })
		.transform(response);
}
