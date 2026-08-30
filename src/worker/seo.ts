import { getPlugin, getPublisher, listPlugins, type PluginDetail, type PluginListItem, type PublisherInfo } from "./db/repository";
import type { Env } from "./env";
import { loadPluginReadme, rewriteReadmeHtmlUrls, type PluginReadmeContent } from "./github/readme-content";

export const SITE_URL = "https://dsh-plugin.market";
export const SITE_NAME = "DSH Plugin Market";
const DEFAULT_IMAGE = `${SITE_URL}/kun.png`;
const GUIDE_UPDATED = "2026-08-17T00:00:00.000Z";
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
	pluginDetail?: PluginDetail;
	publisherInfo?: PublisherInfo;
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

function breadcrumbNode(path: string, title: string): Record<string, unknown> {
	return {
		"@type": "BreadcrumbList",
		"@id": `${SITE_URL}${path}#breadcrumb`,
		itemListElement: [
			{ "@type": "ListItem", position: 1, name: "DSH Plugin Market", item: `${SITE_URL}/` },
			{ "@type": "ListItem", position: 2, name: title, item: `${SITE_URL}${path}` },
		],
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

function htmlEscape(value: string): string {
	return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function guideSpec(path: string, title: string, description: string): SeoSpec {
	const page = webPageNode(path, title, description);
	page.dateModified = GUIDE_UPDATED;
	page.breadcrumb = { "@id": `${SITE_URL}${path}#breadcrumb` };
	page.about = [
		{ "@type": "SoftwareApplication", name: "DeepSeek Harness", url: "https://github.com/deepseek-ai/deepseek-harness" },
		{ "@type": "Thing", name: "DSH Plugin" },
	];
	return {
		title,
		description,
		canonicalPath: path,
		image: DEFAULT_IMAGE,
		robots: "index,follow,max-image-preview:large,max-snippet:-1",
		jsonLd: graph(page, breadcrumbNode(path, title)),
	};
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
	if (pathname === "/trust") {
		const title = `How ${SITE_NAME} Verifies Plugins — Trust Model`;
		const description = "Learn how DSH Plugin Market verifies plugin format, checks compatibility, surfaces security and maintenance signals, and binds evidence to a concrete commit.";
		const page = webPageNode("/trust", title, description);
		page.about = [
			{ "@type": "Thing", name: "DSH Plugin verification" },
			{ "@type": "Thing", name: "DeepSeek Harness plugin compatibility" },
			{ "@type": "Thing", name: "Plugin security signals" },
		];
		return { title, description, canonicalPath: "/trust", image: DEFAULT_IMAGE, robots: "index,follow,max-image-preview:large,max-snippet:-1", jsonLd: graph(page) };
	}
	if (pathname === "/guide/what-is-dsh-plugin") {
		return guideSpec(
			pathname,
			`What is a DSH Plugin? — ${SITE_NAME}`,
			"Learn what a DSH Plugin is, how it extends DeepSeek Harness, how plugins are discovered and verified, and what to check before installation.",
		);
	}
	if (pathname === "/guide/install-dsh-plugin") {
		return guideSpec(
			pathname,
			`How to Install a DSH Plugin — ${SITE_NAME}`,
			"Install a DSH Plugin from GitHub with DeepSeek Harness and understand pinned commits, compatibility checks, and install-script risks.",
		);
	}
	if (pathname === "/guide/choose-dsh-plugin") {
		return guideSpec(
			pathname,
			`How to Evaluate and Choose a DSH Plugin — ${SITE_NAME}`,
			"Evaluate DSH Plugins using format, compatibility, security, maintenance, publisher, and scanned-commit signals instead of relying on one badge.",
		);
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

export function buildPluginSeoBody(detail: PluginDetail, readme: PluginReadmeContent | null): string {
	const metadata = parseMetadata(detail.metadataJson);
	const description = cleanDescription(detail.description, `DeepSeek Harness plugin ${detail.fullName}.`);
	const publisherPath = `/publisher/${encodeURIComponent(detail.owner)}`;
	const fields: Array<[string, string | null | undefined]> = [
		["Package", detail.packageName],
		["Version", metadata.packageVersion],
		["Format verification", detail.verificationStatus],
		["Compatibility", detail.compatibilityStatus],
		["Security", detail.securityStatus],
		["Maintenance", detail.maintenanceStatus],
		["Risk level", detail.riskLevel],
		["License", detail.licenseSpdx],
		["Scanned commit", detail.latestCommitSha],
	];
	const detailRows = fields
		.filter((entry): entry is [string, string] => Boolean(entry[1]))
		.map(([label, value]) => `<div><dt><strong>${htmlEscape(label)}</strong></dt><dd>${htmlEscape(value)}</dd></div>`)
		.join("\n");
	const readmeSection = readme
		? `<section aria-labelledby="seo-readme-title" class="readme-shell">
	<h2 id="seo-readme-title">README</h2>
	<div class="readme-markdown">${rewriteReadmeHtmlUrls(readme.html, readme)}</div>
	<p class="readme-source"><a href="${htmlEscape(readme.sourceUrl)}" rel="noopener noreferrer">${htmlEscape(readme.path)}</a></p>
</section>`
		: "";

	return `<article data-dsh-edge-body="plugin" class="mx-auto max-w-5xl px-4 py-8">
	<nav aria-label="Breadcrumb"><a href="/plugins">DSH Plugin Market</a> / <a href="${publisherPath}">${htmlEscape(detail.owner)}</a></nav>
	<header>
		<h1>${htmlEscape(detail.fullName)}</h1>
		<p>${htmlEscape(description)}</p>
	</header>
	<section aria-labelledby="seo-plugin-info-title">
		<h2 id="seo-plugin-info-title">Plugin information</h2>
		<dl>${detailRows}</dl>
		<p><a href="${htmlEscape(detail.htmlUrl)}" rel="noopener noreferrer">GitHub repository</a></p>
	</section>
	${readmeSection}
</article>`;
}


function pluginHref(item: PluginListItem): string {
\treturn \`/plugin/\${encodeURIComponent(item.owner)}/\${encodeURIComponent(item.repo)}\`;
}

function pluginLink(item: PluginListItem): string {
\tconst description = cleanDescription(item.description, "DeepSeek Harness plugin.");
\tconst status = [item.verificationStatus, item.compatibilityStatus, item.maintenanceStatus].filter(Boolean).join(" · ");
\treturn \`<li><a href="\${htmlEscape(pluginHref(item))}"><strong>\${htmlEscape(item.fullName)}</strong></a><p>\${htmlEscape(description)}</p><small>\${htmlEscape(status)}</small></li>\`;
}

export function buildExploreSeoBody(items: PluginListItem[]): string {
\tconst links = items.slice(0, 50).map(pluginLink).join("\\n");
\treturn \`<section data-dsh-edge-body="plugins" class="mx-auto max-w-7xl px-4 py-8">
\t<nav aria-label="Breadcrumb"><a href="/">DSH Plugin Market</a> / <span>Explore plugins</span></nav>
\t<header><h1>Explore DSH Plugins</h1><p>Explore DeepSeek Harness plugins with format verification, compatibility, security, maintenance and traceable install signals.</p></header>
\t<section aria-labelledby="seo-plugin-list-title">
\t<h2 id="seo-plugin-list-title">DSH plugin registry</h2>
\t<ol>\${links}</ol>
\t</section>
\t<p><a href="/trust">Read the trust model</a> · <a href="/guide/choose-dsh-plugin">How to choose a plugin</a></p>
</section>\`;
}

export function buildPublisherSeoBody(pub: PublisherInfo): string {
\tconst links = pub.repos.slice(0, 100).map(pluginLink).join("\\n");
\treturn \`<section data-dsh-edge-body="publisher" class="mx-auto max-w-5xl px-4 py-8">
\t<nav aria-label="Breadcrumb"><a href="/plugins">DSH Plugin Market</a> / <span>\${htmlEscape(pub.owner)}</span></nav>
\t<header><h1>\${htmlEscape(pub.owner)} DSH Plugins</h1><p>Explore \${pub.repos.length} DeepSeek Harness plugin\${pub.repos.length === 1 ? "" : "s"} from \${htmlEscape(pub.owner)}, including \${pub.verifiedCount} format-verified plugin\${pub.verifiedCount === 1 ? "" : "s"} and trust signals.</p></header>
\t<section aria-labelledby="seo-publisher-list-title">
\t<h2 id="seo-publisher-list-title">Published plugins</h2>
\t<ol>\${links}</ol>
\t</section>
</section>\`;
}

function staticRelatedLinks(pathname: string): Array<[string, string]> {
\tif (pathname === "/") return [
\t\t["/plugins", "Explore DSH Plugins"],
\t\t["/trust", "How verification works"],
\t\t["/guide/what-is-dsh-plugin", "What is a DSH Plugin?"],
\t];
\tif (pathname === "/plugins") return [
\t\t["/trust", "How verification works"],
\t\t["/guide/choose-dsh-plugin", "How to choose a plugin"],
\t];
\tif (pathname === "/trust") return [
\t\t["/guide/choose-dsh-plugin", "How to choose a plugin"],
\t\t["/guide/install-dsh-plugin", "How to install a plugin"],
\t];
\tif (pathname === "/about") return [
\t\t["/trust", "Trust model"],
\t\t["/guide/what-is-dsh-plugin", "What is a DSH Plugin?"],
\t];
\tif (pathname === "/submit") return [
\t\t["/guide/what-is-dsh-plugin", "What is a DSH Plugin?"],
\t\t["/plugins", "Explore the registry"],
\t];
\treturn [
\t\t["/plugins", "Explore DSH Plugins"],
\t\t["/trust", "Trust model"],
\t];
}

export function buildStaticSeoBody(pathname: string, spec: SeoSpec, recent: PluginListItem[] = []): string {
\tconst heading = pathname === "/" ? "DSH Plugin Market" : spec.title.replace(\` — \${SITE_NAME}\`, "");
\tconst related = staticRelatedLinks(pathname).map(([href, label]) => \`<li><a href="\${htmlEscape(href)}">\${htmlEscape(label)}</a></li>\`).join("\\n");
\tconst recentSection = pathname === "/" && recent.length > 0
\t\t? \`<section aria-labelledby="seo-latest-title"><h2 id="seo-latest-title">Latest DSH plugins</h2><ol>\${recent.slice(0, 12).map(pluginLink).join("\\n")}</ol></section>\`
\t\t: "";
\treturn \`<article data-dsh-edge-body="static" class="mx-auto max-w-7xl px-4 py-8">
\t<nav aria-label="Breadcrumb"><a href="/">DSH Plugin Market</a></nav>
\t<h1>\${htmlEscape(heading)}</h1>
\t<p>\${htmlEscape(spec.description)}</p>
\t\${recentSection}
\t<nav aria-label="Related pages"><h2>Related pages</h2><ul>\${related}</ul></nav>
</article>\`;
}

function buildPluginListJsonLd(items: PluginListItem[]): Record<string, unknown> {
\tconst title = "Explore DSH Plugins — DSH Plugin Market";
\tconst description = "Explore DeepSeek Harness plugins with format verification, compatibility, security, maintenance and traceable install signals.";
\tconst page = webPageNode("/plugins", title, description);
\tpage["@type"] = "CollectionPage";
\tpage.mainEntity = {
\t\t"@type": "ItemList",
\t\tnumberOfItems: items.length,
\t\titemListElement: items.slice(0, 50).map((item, index) => ({
\t\t\t"@type": "ListItem",
\t\t\tposition: index + 1,
\t\t\tname: item.fullName,
\t\t\turl: \`\${SITE_URL}\${pluginHref(item)}\`,
\t\t})),
\t};
\treturn graph(page);
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
		pluginDetail: detail,
	};
}


export function isPublisherIndexable(pub: PublisherInfo): boolean {
\tconst eligibleStatuses = new Set(["DETECTED", "FORMAT_VERIFIED", "FEATURED"]);
\treturn pub.repos.filter((repo) => eligibleStatuses.has(repo.verificationStatus)).length >= 2;
}

function publisherSpec(pub: PublisherInfo): SeoSpec {
	const canonicalPath = `/publisher/${encodeURIComponent(pub.owner)}`;
	const title = `${pub.owner} DSH Plugins — ${SITE_NAME}`;
	const description = `Explore ${pub.repos.length} DeepSeek Harness plugin${pub.repos.length === 1 ? "" : "s"} from ${pub.owner}, including ${pub.verifiedCount} format-verified plugin${pub.verifiedCount === 1 ? "" : "s"} and trust signals.`;
	const page = webPageNode(canonicalPath, title, description);
\tpage["@type"] = "CollectionPage";
\tpage.about = { name: pub.owner, url: \`https://github.com/\${encodeURIComponent(pub.owner)}\` };
\tpage.mainEntity = {
\t\t"@type": "ItemList",
\t\tnumberOfItems: pub.repos.length,
\t\titemListElement: pub.repos.slice(0, 100).map((repo, index) => ({
\t\t\t"@type": "ListItem",
\t\t\tposition: index + 1,
\t\t\tname: repo.fullName,
\t\t\turl: \`\${SITE_URL}/plugin/\${encodeURIComponent(repo.owner)}/\${encodeURIComponent(repo.repo)}\`,
\t\t})),
\t};
\treturn {
\t\ttitle,
\t\tdescription,
\t\tcanonicalPath,
\t\timage: DEFAULT_IMAGE,
\t\trobots: isPublisherIndexable(pub) ? "index,follow,max-image-preview:large" : "noindex,follow",
\t\tjsonLd: graph(page),
\t\tpublisherInfo: pub,
\t};
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
	return pathname === "/" || pathname === "/plugins" || pathname === "/submit" || pathname === "/about" || pathname === "/trust" || pathname === "/guide" || pathname.startsWith("/guide/") || /^\/plugin\/[^/]+\/[^/]+\/?$/.test(pathname) || /^\/publisher\/[^/]+\/?$/.test(pathname);
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
		{ loc: `${SITE_URL}/trust` },
		{ loc: `${SITE_URL}/guide/what-is-dsh-plugin`, lastmod: GUIDE_UPDATED },
		{ loc: `${SITE_URL}/guide/install-dsh-plugin`, lastmod: GUIDE_UPDATED },
		{ loc: `${SITE_URL}/guide/choose-dsh-plugin`, lastmod: GUIDE_UPDATED },
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

export async function renderSeoPage(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
\tconst url = new URL(request.url);
\tconst normalizedPath = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : url.pathname;
\tlet spec = await resolveSeoSpec(url.pathname, env.DB);
\tlet edgeBody: string | null = null;

\tif (spec.pluginDetail && !spec.status) {
\t\tlet readme: PluginReadmeContent | null = null;
\t\ttry {
\t\t\treadme = await loadPluginReadme({
\t\t\t\tdetail: spec.pluginDetail,
\t\t\t\tlanguage: "zh",
\t\t\t\tgithubToken: env.GITHUB_TOKEN,
\t\t\t\torigin: url.origin,
\t\t\t\twaitUntil: (promise) => ctx.waitUntil(promise),
\t\t\t});
\t\t} catch (err) {
\t\t\tconsole.warn(
\t\t\t\t\`edge README pre-render failed for \${spec.pluginDetail.fullName}\`,
\t\t\t\terr instanceof Error ? err.message : String(err),
\t\t\t);
\t\t}
\t\tedgeBody = buildPluginSeoBody(spec.pluginDetail, readme);
\t} else if (!spec.status) {
\t\ttry {
\t\t\tif (normalizedPath === "/plugins") {
\t\t\t\tconst items = await listPlugins(env.DB, { sort: "updated", limit: 50 });
\t\t\t\tedgeBody = buildExploreSeoBody(items);
\t\t\t\tspec.jsonLd = buildPluginListJsonLd(items);
\t\t\t} else if (spec.publisherInfo) {
\t\t\t\tedgeBody = buildPublisherSeoBody(spec.publisherInfo);
\t\t\t} else {
\t\t\t\tconst recent = normalizedPath === "/" ? await listPlugins(env.DB, { sort: "updated", limit: 12 }) : [];
\t\t\t\tedgeBody = buildStaticSeoBody(normalizedPath, spec, recent);
\t\t\t}
\t\t} catch (err) {
\t\t\tconsole.warn(
\t\t\t\t\`edge SEO body generation failed for \${normalizedPath}\`,
\t\t\t\terr instanceof Error ? err.message : String(err),
\t\t\t);
\t\t}
\t}

\tconst assetResponse = await env.ASSETS.fetch(request);
\tconst contentType = assetResponse.headers.get("content-type") ?? "";
\tif (!contentType.includes("text/html")) return assetResponse;

\tconst headers = new Headers(assetResponse.headers);
\theaders.set("cache-control", spec.status === 404 ? "no-store" : "public, max-age=60, s-maxage=300, stale-while-revalidate=86400");
\tconst response = new Response(assetResponse.body, {
\t\tstatus: spec.status ?? assetResponse.status,
\t\tstatusText: assetResponse.statusText,
\t\theaders,
\t});
\tconst canonical = \`\${SITE_URL}\${spec.canonicalPath}\`;
\tconst jsonLd = serializeJsonLd(spec.jsonLd);
\tconst rewriter = new HTMLRewriter()
\t\t.on("title", { element(e) { e.setInnerContent(spec.title); } })
\t\t.on('meta[name="description"]', { element(e) { e.setAttribute("content", spec.description); } })
\t\t.on('meta[name="robots"]', { element(e) { e.setAttribute("content", spec.robots); } })
\t\t.on('link[rel="canonical"]', { element(e) { e.setAttribute("href", canonical); } })
\t\t.on('meta[property="og:title"]', { element(e) { e.setAttribute("content", spec.title); } })
\t\t.on('meta[property="og:description"]', { element(e) { e.setAttribute("content", spec.description); } })
\t\t.on('meta[property="og:url"]', { element(e) { e.setAttribute("content", canonical); } })
\t\t.on('meta[property="og:image"]', { element(e) { e.setAttribute("content", spec.image); } })
\t\t.on('meta[property="og:image:alt"]', { element(e) { e.setAttribute("content", spec.title); } })
\t\t.on('meta[name="twitter:card"]', { element(e) { e.setAttribute("content", "summary_large_image"); } })
\t\t.on('meta[name="twitter:title"]', { element(e) { e.setAttribute("content", spec.title); } })
\t\t.on('meta[name="twitter:description"]', { element(e) { e.setAttribute("content", spec.description); } })
\t\t.on('meta[name="twitter:image"]', { element(e) { e.setAttribute("content", spec.image); } })
\t\t.on("script#seo-jsonld", { element(e) { e.setInnerContent(jsonLd, { html: true }); } })
\t\t.on("head", { element(e) { e.append(\`<meta name="dsh-edge-seo" content="\${spec.canonicalPath.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}">\`, { html: true }); } });
\tif (edgeBody) {
\t\trewriter.on("#root", { element(e) { e.setInnerContent(edgeBody!, { html: true }); } });
\t}
\treturn rewriter.transform(response);
}
