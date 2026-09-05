import { getBaseline, getPlugin, getPublisher, listPlugins, type PluginDetail, type PluginListItem, type PublisherInfo } from "./db/repository";
import { getRegistryStats } from "./db/registry";
import { SCANNER_VERSION } from "./domain/scan";
import type { Env } from "./env";
import { loadPluginReadme, rewriteReadmeHtmlUrls, type PluginReadmeContent } from "./github/readme-content";
import { isRegistryPluginLinkable, isPublisherIndexable } from "./seo-policy";
import { getCapabilityLanding, getDiscoveryLanding, LANDING_MINIMUM_PLUGINS } from "./seo-landings";
import { getContentSeoCopy } from "../react-app/content/seo-content";
import { getGuideCopy, isGuideSlug, type GuideSlug } from "../react-app/content/guide-content";
import { getHomePayload, type HomePayload } from "./registry-home";

export const SITE_URL = "https://dsh-plugin.market";
export const SITE_NAME = "DSH Plugin Market";
const DEFAULT_IMAGE = `${SITE_URL}/kun.png`;
export const CONTENT_UPDATED = "2026-09-02T00:00:00.000Z";
const GUIDE_UPDATED = CONTENT_UPDATED;
export const SITEMAP_PLUGIN_LIMIT = 45_000;
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
	landingInfo?: LandingInfo;
}

interface LandingInfo {
	slug: string;
	title: string;
	definition: string;
	kind: "capability" | "discovery";
	capability?: string;
	items: PluginListItem[];
}

interface LiveSeoFacts {
	verified: number;
	scannerVersion: string;
	dshVersion: string;
	cordisVersion: string;
	lastScanAt: string | null;
}

function organizationNode(): Record<string, unknown> {
	return {
		"@type": "Organization",
		"@id": `${SITE_URL}/#organization`,
		url: `${SITE_URL}/`,
		name: SITE_NAME,
		description: "An independent community registry for discovering and assessing DeepSeek Harness plugins.",
		logo: { "@type": "ImageObject", url: DEFAULT_IMAGE },
		sameAs: ["https://github.com/0326/dsh-plugin-market"],
	};
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
		about: { "@type": "SoftwareApplication", name: "DeepSeek Harness", url: "https://github.com/deepseek-ai/deepseek-harness" },
		publisher: { "@id": `${SITE_URL}/#organization` },
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
		inLanguage: "en",
		isPartOf: { "@id": `${SITE_URL}/#website` },
		publisher: { "@id": `${SITE_URL}/#organization` },
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
	return { "@context": "https://schema.org", "@graph": [organizationNode(), websiteNode(), ...nodes] };
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

function inlineHtml(value: string): string {
	return htmlEscape(value).replace(/`([^`]+)`/g, "<code>$1</code>");
}

function paragraphList(values: string[]): string {
	return values.map((value) => `<p>${inlineHtml(value)}</p>`).join("\n");
}

function liveFactsHtml(facts: LiveSeoFacts): string {
	return `<dl><div><dt>Format verified</dt><dd>${facts.verified}</dd></div><div><dt>Scanner version</dt><dd>${htmlEscape(facts.scannerVersion)}</dd></div><div><dt>DSH baseline</dt><dd>${htmlEscape(facts.dshVersion)}</dd></div><div><dt>Cordis baseline</dt><dd>${htmlEscape(facts.cordisVersion)}</dd></div><div><dt>Latest scan</dt><dd>${htmlEscape(facts.lastScanAt ?? "Unknown")}</dd></div></dl>`;
}

function buildHomeSeoBody(recent: PluginListItem[] = [], facts?: LiveSeoFacts): string {
	const copy = getContentSeoCopy("en").home;
	const linkableRecent = recent.filter(isRegistryPluginLinkable).slice(0, 12);
	const faq = copy.faq.map((item) => `<article><h3>${inlineHtml(item.question)}</h3><p>${inlineHtml(item.answer)}</p>${item.href ? `<a href="${htmlEscape(item.href)}">${inlineHtml(item.linkLabel ?? "Read more")}</a>` : ""}</article>`).join("\n");
	const latest = linkableRecent.length > 0
		? `<section aria-labelledby="seo-latest-title"><h2 id="seo-latest-title">Latest DSH plugins</h2><ol>${linkableRecent.map(pluginLink).join("\n")}</ol></section>`
		: "";
	return `<article data-dsh-edge-body="home" class="mx-auto max-w-7xl px-4 py-8">
	<header><p>${inlineHtml(copy.sectionKicker)}</p><h1>${inlineHtml(copy.sectionTitle)}</h1><p>${inlineHtml(copy.sectionIntro)}</p></header>
	<section aria-labelledby="seo-market-title"><h2 id="seo-market-title">${inlineHtml(copy.market.title)}</h2><p>${inlineHtml(copy.market.body)}</p><p><a href="/about">${inlineHtml(copy.market.about)}</a> · <a href="/trust">${inlineHtml(copy.market.trust)}</a></p></section>
	<section aria-labelledby="seo-plugin-title"><h2 id="seo-plugin-title">${inlineHtml(copy.plugin.title)}</h2><p>${inlineHtml(copy.plugin.body)}</p><ul>${copy.plugin.capabilities.map((item) => `<li>${htmlEscape(item)}</li>`).join("\n")}</ul></section>
	<section aria-labelledby="seo-works-title"><h2 id="seo-works-title">${inlineHtml(copy.works.title)}</h2><p>${inlineHtml(copy.works.body)}</p><ol>${copy.works.steps.map((item) => `<li>${inlineHtml(item)}</li>`).join("\n")}</ol></section>
	${facts ? `<section aria-labelledby="seo-live-facts-title"><h2 id="seo-live-facts-title">Live registry facts</h2>${liveFactsHtml(facts)}</section>` : ""}
	<section aria-labelledby="seo-install-title"><h2 id="seo-install-title">${inlineHtml(copy.install.title)}</h2><p>${inlineHtml(copy.install.body)}</p><pre><code>dsh plugin --profile web add github:owner/repo#&lt;scanned_commit&gt;</code></pre></section>
	<section aria-labelledby="seo-verified-title"><h2 id="seo-verified-title">${inlineHtml(copy.verified.title)}</h2><p><strong>${inlineHtml(copy.verified.warning)}</strong> — ${inlineHtml(copy.verified.body)}</p><ul>${copy.verified.items.map((item) => `<li><strong>${htmlEscape(item.label)}</strong>: ${inlineHtml(item.text)}</li>`).join("\n")}</ul><a href="/trust">${inlineHtml(copy.verified.learn)}</a></section>
	${latest}
	<section aria-labelledby="seo-faq-title"><h2 id="seo-faq-title">${inlineHtml(copy.faqTitle)}</h2>${faq}</section>
</article>`;
}

function buildTrustSeoBody(facts?: LiveSeoFacts): string {
	const copy = getContentSeoCopy("en").trust;
	return `<article data-dsh-edge-body="trust" class="mx-auto max-w-5xl px-4 py-8">
	<header><p>${inlineHtml(copy.kicker)}</p><h1>${inlineHtml(copy.title)}</h1><p>${inlineHtml(copy.intro)}</p><p><strong>${inlineHtml(copy.warning)}</strong></p></header>
	<section aria-labelledby="seo-trust-pillars-title"><h2 id="seo-trust-pillars-title">Trust dimensions</h2><ol>${copy.pillars.map((item) => `<li><h3>${inlineHtml(item.title)}</h3><p>${inlineHtml(item.text)}</p></li>`).join("\n")}</ol></section>
	<section aria-labelledby="seo-trust-process-title"><h2 id="seo-trust-process-title">${inlineHtml(copy.processTitle)}</h2><p>${inlineHtml(copy.processBody)}</p><ol>${copy.process.map((item) => `<li>${inlineHtml(item)}</li>`).join("\n")}</ol></section>
	<section aria-labelledby="seo-trust-safety-title"><h2 id="seo-trust-safety-title">${inlineHtml(copy.safetyTitle)}</h2><p>${inlineHtml(copy.safetyBody)}</p><ul>${copy.never.map((item) => `<li>${inlineHtml(item)}</li>`).join("\n")}</ul></section>
	<section aria-labelledby="seo-trust-evidence-title"><h2 id="seo-trust-evidence-title">${inlineHtml(copy.evidenceTitle)}</h2><p>${inlineHtml(copy.evidenceBody)}</p>${facts ? liveFactsHtml(facts) : ""}</section>
</article>`;
}

function buildGuideSeoBody(slug: GuideSlug, facts?: LiveSeoFacts): string {
	const copy = getGuideCopy("en", slug);
	const sections = copy.sections.map((section) => `<section><p>${inlineHtml(section.kicker)}</p><h2>${inlineHtml(section.title)}</h2>${paragraphList(section.body)}${section.bullets ? `<ul>${section.bullets.map((item) => `<li><strong>${inlineHtml(item.title)}</strong>: ${inlineHtml(item.text)}</li>`).join("\n")}</ul>` : ""}${section.code ? section.code.map((item) => `<p><strong>${inlineHtml(item.label)}</strong></p><pre><code>${inlineHtml(item.value)}</code></pre>`).join("\n") : ""}${section.note ? `<aside><strong>${inlineHtml(section.note.label)}</strong><p>${inlineHtml(section.note.text)}</p></aside>` : ""}</section>`).join("\n");
	const related = copy.related.map((item) => `<li><a href="${htmlEscape(item.href)}">${inlineHtml(item.label)}</a></li>`).join("\n");
	const sources = copy.sources.map((item) => `<li><a href="${htmlEscape(item.href)}">${inlineHtml(item.label)}</a></li>`).join("\n");
	return `<article data-dsh-edge-body="guide" class="mx-auto max-w-5xl px-4 py-8">
	<header><p>${inlineHtml(copy.kicker)}</p><h1>${inlineHtml(copy.title)}</h1><p><strong>${inlineHtml(copy.directAnswer)}</strong></p><p>${inlineHtml(copy.intro)}</p></header>
	<section aria-labelledby="seo-guide-facts-title"><h2 id="seo-guide-facts-title">Key facts</h2><p>Current scanner and registry facts are shown on this page and are bound to the current scan data.</p>${facts ? liveFactsHtml(facts) : ""}</section>
	${sections}
	<section><h2>${inlineHtml(copy.relatedTitle)}</h2><ul>${related}</ul></section>
	<section><h2>${inlineHtml(copy.sourcesTitle)}</h2><ul>${sources}</ul></section>
	<footer><p>${htmlEscape(copy.updatedLabel)}: <time dateTime="${CONTENT_UPDATED}">${CONTENT_UPDATED.slice(0, 10)}</time></p></footer>
</article>`;
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
		["Scanner version", detail.scannerVersion],
		["Last scan", detail.scannedAt],
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

function signalExplanation(label: string, value: string | null | undefined): string {
	if (!value) return "";
	const explanations: Record<string, string> = {
		"Format verification": value === "FORMAT_VERIFIED" ? "The repository matches the structure rules understood by the current scanner." : `The current scanner classified this repository as ${value}.`,
		Compatibility: value === "COMPATIBLE" ? "Declared dependencies align with the current compatibility baseline." : `The current compatibility result is ${value}.`,
		Security: value === "PASSED" ? "No high-risk static security finding was reported; this is not an absolute safety guarantee." : `The current static security result is ${value}.`,
		Maintenance: value === "ACTIVE" ? "The repository has recent public maintenance signals." : `The current maintenance result is ${value}.`,
	};
	return explanations[label] ?? `${label}: ${value}.`;
}

export function buildPluginSeoBody(detail: PluginDetail, readme: PluginReadmeContent | null, related: PluginListItem[] = []): string {
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
		["Scanner version", detail.scannerVersion],
		["Last scan", detail.scannedAt],
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
	const explanations = [
		signalExplanation("Format verification", detail.verificationStatus),
		signalExplanation("Compatibility", detail.compatibilityStatus),
		signalExplanation("Security", detail.securityStatus),
		signalExplanation("Maintenance", detail.maintenanceStatus),
	].map((text) => `<li>${htmlEscape(text)}</li>`).join("\n");
	const findings = detail.findings.length > 0
		? `<ul>${detail.findings.slice(0, 50).map((finding) => `<li><strong>${htmlEscape(finding.severity)} — ${htmlEscape(finding.title)}</strong>${finding.detail ? `: ${htmlEscape(finding.detail)}` : ""}${finding.filePath ? ` <code>${htmlEscape(finding.filePath)}</code>` : ""}</li>`).join("\n")}</ul>`
		: "<p>No findings were recorded for the latest completed scan. Review the scanner boundary before treating this as a safety conclusion.</p>";
	const relatedSection = related.length > 0
		? `<section aria-labelledby="seo-related-title"><h2 id="seo-related-title">Related DSH plugins</h2><ul>${related.map(pluginLink).join("\n")}</ul></section>`
		: "";
	const installCommand = detail.latestCommitSha
		? `dsh plugin --profile web add github:${detail.owner}/${detail.repo}#${detail.latestCommitSha}`
		: `dsh plugin --profile web add github:${detail.owner}/${detail.repo}`;

	return `<article data-dsh-edge-body="plugin" class="mx-auto max-w-5xl px-4 py-8">
	<nav aria-label="Breadcrumb"><a href="/plugins">DSH Plugin Market</a> / <a href="${publisherPath}">${htmlEscape(detail.owner)}</a></nav>
	<header>
		<h1>${htmlEscape(detail.fullName)}</h1>
		<p>${htmlEscape(description)}</p>
		<p><strong>Direct answer:</strong> This is a ${htmlEscape(detail.verificationStatus)} DSH plugin record with compatibility, security, maintenance, and commit-bound scan signals.</p>
	</header>
	<section aria-labelledby="seo-plugin-info-title">
		<h2 id="seo-plugin-info-title">Plugin information</h2>
		<dl>${detailRows}</dl>
		<p><a href="${htmlEscape(detail.htmlUrl)}" rel="noopener noreferrer">GitHub repository</a></p>
	</section>
	<section aria-labelledby="seo-plugin-signals-title"><h2 id="seo-plugin-signals-title">How to read this Trust Profile</h2><ul>${explanations}</ul></section>
	<section aria-labelledby="seo-plugin-install-title"><h2 id="seo-plugin-install-title">Pinned install</h2><p>Install the same source revision used for the latest scan when a scanned commit is available.</p><pre><code>${htmlEscape(installCommand)}</code></pre></section>
	<section aria-labelledby="seo-plugin-evidence-title"><h2 id="seo-plugin-evidence-title">Latest scan evidence</h2>${findings}</section>
	${readmeSection}
	${relatedSection}
</article>`;
}


function pluginHref(item: PluginListItem): string {
	return `/plugin/${encodeURIComponent(item.owner)}/${encodeURIComponent(item.repo)}`;
}

function pluginLink(item: PluginListItem): string {
	const description = cleanDescription(item.description, "DeepSeek Harness plugin.");
	const status = [item.verificationStatus, item.compatibilityStatus, item.maintenanceStatus].filter(Boolean).join(" · ");
	return `<li><a href="${htmlEscape(pluginHref(item))}"><strong>${htmlEscape(item.fullName)}</strong></a><p>${htmlEscape(description)}</p><small>${htmlEscape(status)}</small></li>`;
}

export function buildExploreSeoBody(items: PluginListItem[]): string {
	const links = items.filter(isRegistryPluginLinkable).slice(0, 50).map(pluginLink).join("\n");
	return `<section data-dsh-edge-body="plugins" class="mx-auto max-w-7xl px-4 py-8">
	<nav aria-label="Breadcrumb"><a href="/">DSH Plugin Market</a> / <span>Explore plugins</span></nav>
	<header><h1>Explore DSH Plugins</h1><p>Explore DeepSeek Harness plugins with format verification, compatibility, security, maintenance and traceable install signals.</p></header>
	<section aria-labelledby="seo-plugin-list-title">
	<h2 id="seo-plugin-list-title">DSH plugin registry</h2>
	<ol>${links}</ol>
	</section>
	<p><a href="/trust">Read the trust model</a> · <a href="/guide/choose-dsh-plugin">How to choose a plugin</a></p>
</section>`;
}

export function buildLandingSeoBody(info: LandingInfo): string {
	const links = info.items.slice(0, 50).map(pluginLink).join("\n");
	const guidance = info.kind === "capability"
		? "Compare the current entries using their format, compatibility, security, maintenance, and commit evidence. The category is generated from the scanner taxonomy, not from a keyword-only page template."
		: "This list uses a documented registry sort and contains only entries that pass the current indexability policy. It is a discovery view, not a safety endorsement.";
	return `<article data-dsh-edge-body="landing" class="mx-auto max-w-7xl px-4 py-8">
	<nav aria-label="Breadcrumb"><a href="/">DSH Plugin Market</a> / <a href="/plugins">Explore plugins</a> / <span>${htmlEscape(info.title)}</span></nav>
	<header><p>${info.kind === "capability" ? "CAPABILITY" : "DISCOVERY"}</p><h1>${htmlEscape(info.title)} DSH Plugins</h1><p>${htmlEscape(info.definition)}</p><p>${htmlEscape(guidance)}</p></header>
	<section aria-labelledby="seo-landing-list-title"><h2 id="seo-landing-list-title">Current registry entries</h2><ol>${links}</ol></section>
	<section aria-labelledby="seo-landing-trust-title"><h2 id="seo-landing-trust-title">Trust and evidence</h2><p>Each linked plugin page separates format verification, compatibility, security signals, maintenance, and scanned commit evidence. <a href="/trust">Read the trust model</a>.</p></section>
	<nav aria-label="Related pages"><a href="/plugins">All DSH plugins</a> · <a href="/guide/choose-dsh-plugin">How to choose a plugin</a></nav>
</article>`;
}

export function buildPublisherSeoBody(pub: PublisherInfo): string {
	const links = pub.repos.filter(isRegistryPluginLinkable).slice(0, 100).map(pluginLink).join("\n");
	return `<section data-dsh-edge-body="publisher" class="mx-auto max-w-5xl px-4 py-8">
	<nav aria-label="Breadcrumb"><a href="/plugins">DSH Plugin Market</a> / <span>${htmlEscape(pub.owner)}</span></nav>
	<header><h1>${htmlEscape(pub.owner)} DSH Plugins</h1><p>Explore ${pub.repos.length} DeepSeek Harness plugin${pub.repos.length === 1 ? "" : "s"} from ${htmlEscape(pub.owner)}, including ${pub.verifiedCount} format-verified plugin${pub.verifiedCount === 1 ? "" : "s"} and trust signals.</p></header>
	<section aria-labelledby="seo-publisher-list-title">
	<h2 id="seo-publisher-list-title">Published plugins</h2>
	<ol>${links}</ol>
	</section>
</section>`;
}

function staticRelatedLinks(pathname: string): Array<[string, string]> {
	if (pathname === "/") return [
		["/plugins", "Explore DSH Plugins"],
		["/trust", "How verification works"],
		["/guide/what-is-dsh-plugin", "What is a DSH Plugin?"],
	];
	if (pathname === "/plugins") return [
		["/trust", "How verification works"],
		["/guide/choose-dsh-plugin", "How to choose a plugin"],
	];
	if (pathname === "/trust") return [
		["/guide/choose-dsh-plugin", "How to choose a plugin"],
		["/guide/install-dsh-plugin", "How to install a plugin"],
	];
	if (pathname === "/about") return [
		["/trust", "Trust model"],
		["/guide/what-is-dsh-plugin", "What is a DSH Plugin?"],
	];
	if (pathname === "/submit") return [
		["/guide/what-is-dsh-plugin", "What is a DSH Plugin?"],
		["/plugins", "Explore the registry"],
	];
	return [
		["/plugins", "Explore DSH Plugins"],
		["/trust", "Trust model"],
	];
}

export function buildStaticSeoBody(pathname: string, spec: SeoSpec, recent: PluginListItem[] = []): string {
	const heading = pathname === "/" ? "DSH Plugin Market" : spec.title.replace(` — ${SITE_NAME}`, "");
	const related = staticRelatedLinks(pathname).map(([href, label]) => `<li><a href="${htmlEscape(href)}">${htmlEscape(label)}</a></li>`).join("\n");
	const linkableRecent = recent.filter(isRegistryPluginLinkable);
	const recentSection = pathname === "/" && linkableRecent.length > 0
		? `<section aria-labelledby="seo-latest-title"><h2 id="seo-latest-title">Latest DSH plugins</h2><ol>${linkableRecent.slice(0, 12).map(pluginLink).join("\n")}</ol></section>`
		: "";
	return `<article data-dsh-edge-body="static" class="mx-auto max-w-7xl px-4 py-8">
	<nav aria-label="Breadcrumb"><a href="/">DSH Plugin Market</a></nav>
	<h1>${htmlEscape(heading)}</h1>
	<p>${htmlEscape(spec.description)}</p>
	${recentSection}
	<nav aria-label="Related pages"><h2>Related pages</h2><ul>${related}</ul></nav>
</article>`;
}

function buildPluginListJsonLd(items: PluginListItem[]): Record<string, unknown> {
	const title = "Explore DSH Plugins — DSH Plugin Market";
	const description = "Explore DeepSeek Harness plugins with format verification, compatibility, security, maintenance and traceable install signals.";
	const page = webPageNode("/plugins", title, description);
	page["@type"] = "CollectionPage";
	page.mainEntity = {
		"@type": "ItemList",
		numberOfItems: items.filter(isRegistryPluginLinkable).length,
		itemListElement: items.filter(isRegistryPluginLinkable).slice(0, 50).map((item, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: item.fullName,
			url: `${SITE_URL}${pluginHref(item)}`,
		})),
	};
	return graph(page);
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


function publisherSpec(pub: PublisherInfo): SeoSpec {
	const canonicalPath = `/publisher/${encodeURIComponent(pub.owner)}`;
	const title = `${pub.owner} DSH Plugins — ${SITE_NAME}`;
	const description = `Explore ${pub.repos.length} DeepSeek Harness plugin${pub.repos.length === 1 ? "" : "s"} from ${pub.owner}, including ${pub.verifiedCount} format-verified plugin${pub.verifiedCount === 1 ? "" : "s"} and trust signals.`;
	const page = webPageNode(canonicalPath, title, description);
	page["@type"] = "CollectionPage";
	page.about = { name: pub.owner, url: `https://github.com/${encodeURIComponent(pub.owner)}` };
	const linkableRepos = pub.repos.filter(isRegistryPluginLinkable);
	page.mainEntity = {
		"@type": "ItemList",
		numberOfItems: linkableRepos.length,
		itemListElement: linkableRepos.slice(0, 100).map((repo, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: repo.fullName,
			url: `${SITE_URL}/plugin/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}`,
		})),
	};
	return {
		title,
		description,
		canonicalPath,
		image: DEFAULT_IMAGE,
		robots: isPublisherIndexable(pub) ? "index,follow,max-image-preview:large" : "noindex,follow",
		jsonLd: graph(page),
		publisherInfo: pub,
	};
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
	return pathname === "/" || pathname === "/plugins" || pathname === "/submit" || pathname === "/about" || pathname === "/trust" || pathname === "/guide" || pathname.startsWith("/guide/") || /^\/plugin\/[^/]+\/[^/]+\/?$/.test(pathname) || /^\/publisher\/[^/]+\/?$/.test(pathname) || isIndexableLandingPath(pathname);
}

export function isIndexableLandingPath(pathname: string): boolean {
	return /^\/plugins\/[^/]+\/?$/.test(pathname);
}

async function resolveLandingInfo(pathname: string, db: D1Database): Promise<LandingInfo | null> {
	const match = /^\/plugins\/([^/]+)$/.exec(pathname);
	if (!match) return null;
	const slug = safeDecode(match[1]);
	const capability = getCapabilityLanding(slug);
	const discovery = getDiscoveryLanding(slug);
	if (!capability && !discovery) return null;
	const items = capability
		? await listPlugins(db, { capability: capability.capability, sort: "stars", limit: 50 })
		: await listPlugins(db, { sort: discovery!.sort, verifiedOnly: discovery!.verified, limit: 50 });
	const linkable = items.filter(isRegistryPluginLinkable);
	if (linkable.length < LANDING_MINIMUM_PLUGINS) return null;
	return capability
		? { slug, title: capability.title, definition: capability.definition, kind: "capability", capability: capability.capability, items: linkable }
		: { slug, title: discovery!.title, definition: discovery!.definition, kind: "discovery", items: linkable };
}

function landingSpec(info: LandingInfo): SeoSpec {
	const title = `${info.title} DSH Plugins — ${SITE_NAME}`;
	const description = `${info.definition} Browse ${info.items.length} current registry entries with traceable plugin evidence.`;
	const path = `/plugins/${info.slug}`;
	const page = webPageNode(path, title, description);
	page["@type"] = "CollectionPage";
	page.breadcrumb = { "@id": `${SITE_URL}${path}#breadcrumb` };
	page.mainEntity = {
		"@type": "ItemList",
		numberOfItems: info.items.length,
		itemListElement: info.items.slice(0, 50).map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.fullName, url: `${SITE_URL}${pluginHref(item)}` })),
	};
	return { title, description, canonicalPath: path, image: DEFAULT_IMAGE, robots: "index,follow,max-image-preview:large", jsonLd: graph(page, breadcrumbNode(path, title)), landingInfo: info };
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

	const landing = await resolveLandingInfo(normalized, db);
	if (landing) return landingSpec(landing);
	if (/^\/plugins\/[^/]+$/.test(normalized)) return notFoundSpec(normalized);

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

export function buildSitemapXml(items: PluginListItem[], landingPaths: string[] = []): string {
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
	for (const path of landingPaths) urls.push({ loc: `${SITE_URL}${path}` });

	for (const item of items) {
		urls.push({
			loc: `${SITE_URL}/plugin/${encodeURIComponent(item.owner)}/${encodeURIComponent(item.repo)}`,
			lastmod: lastMod(item.updatedAt),
		});
	}

	const owners = new Map<string, { updatedAt: string | null; count: number }>();
	for (const item of items) {
		const current = owners.get(item.owner);
		if (!current) {
			owners.set(item.owner, { updatedAt: item.updatedAt, count: 1 });
			continue;
		}
		current.count += 1;
		if (item.updatedAt && (!current.updatedAt || item.updatedAt > current.updatedAt)) current.updatedAt = item.updatedAt;
	}
	const remaining = Math.max(0, SITEMAP_URL_LIMIT - urls.length);
	for (const [owner, info] of [...owners.entries()].filter(([, value]) => value.count >= 2).slice(0, remaining)) {
		urls.push({ loc: `${SITE_URL}/publisher/${encodeURIComponent(owner)}`, lastmod: lastMod(info.updatedAt) });
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
	const url = new URL(request.url);
	const normalizedPath = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : url.pathname;
	const spec = await resolveSeoSpec(url.pathname, env.DB);
	let edgeBody: string | null = null;
	let liveFacts: LiveSeoFacts | undefined;
	let homePayload: HomePayload | undefined;
	if (!spec.status && normalizedPath === "/") {
		try {
			homePayload = await getHomePayload(env.DB);
			liveFacts = {
				verified: homePayload.context.stats.verified,
				scannerVersion: homePayload.context.scannerVersion,
				dshVersion: homePayload.context.baseline?.dshVersion ?? "Unknown",
				cordisVersion: homePayload.context.baseline?.cordisVersion ?? "Unknown",
				lastScanAt: homePayload.context.stats.lastScanAt,
			};
		} catch (err) {
			console.warn("edge home payload failed", err instanceof Error ? err.message : String(err));
		}
	}
	if (!spec.status && !liveFacts && (normalizedPath === "/" || normalizedPath === "/trust" || normalizedPath.startsWith("/guide/"))) {
		try {
			const [stats, baseline] = await Promise.all([getRegistryStats(env.DB), getBaseline(env.DB)]);
			liveFacts = {
				verified: stats.verified,
				scannerVersion: SCANNER_VERSION,
				dshVersion: baseline?.dshVersion ?? "Unknown",
				cordisVersion: baseline?.cordisVersion ?? "Unknown",
				lastScanAt: stats.lastScanAt,
			};
		} catch (err) {
			console.warn("edge live SEO facts failed", err instanceof Error ? err.message : String(err));
		}
	}

	if (spec.pluginDetail && !spec.status) {
		let readme: PluginReadmeContent | null = null;
		try {
			readme = await loadPluginReadme({
				detail: spec.pluginDetail,
				// The canonical crawlable document is English; the client remains bilingual.
				language: "en",
				githubToken: env.GITHUB_TOKEN,
				origin: url.origin,
				waitUntil: (promise) => ctx.waitUntil(promise),
			});
		} catch (err) {
			console.warn(
				`edge README pre-render failed for ${spec.pluginDetail.fullName}`,
				err instanceof Error ? err.message : String(err),
			);
		}
		let related: PluginListItem[] = [];
		try {
			const metadata = parseMetadata(spec.pluginDetail.metadataJson);
			const candidates = metadata.capabilities?.length
				? await listPlugins(env.DB, { capability: metadata.capabilities[0], sort: "stars", limit: 50 })
				: await listPlugins(env.DB, { owner: spec.pluginDetail.owner, sort: "stars", limit: 50 });
			related = candidates.filter((item) => item.fullName !== spec.pluginDetail!.fullName && isRegistryPluginLinkable(item)).slice(0, 6);
		} catch (err) {
			console.warn("edge related plugin lookup failed", err instanceof Error ? err.message : String(err));
		}
		edgeBody = buildPluginSeoBody(spec.pluginDetail, readme, related);
	} else if (!spec.status) {
		try {
			if (spec.landingInfo) {
				edgeBody = buildLandingSeoBody(spec.landingInfo);
			} else if (normalizedPath === "/plugins") {
				const items = await listPlugins(env.DB, { sort: "updated", limit: 50 });
				edgeBody = buildExploreSeoBody(items);
				spec.jsonLd = buildPluginListJsonLd(items);
			} else if (normalizedPath === "/") {
				const recent = homePayload?.latest ?? await listPlugins(env.DB, { sort: "updated", installableOnly: true, limit: 12 });
				edgeBody = buildHomeSeoBody(recent, liveFacts);
			} else if (normalizedPath === "/trust") {
				edgeBody = buildTrustSeoBody(liveFacts);
			} else if (normalizedPath.startsWith("/guide/")) {
				const slug = normalizedPath.slice("/guide/".length);
				if (isGuideSlug(slug)) edgeBody = buildGuideSeoBody(slug, liveFacts);
			} else if (spec.publisherInfo) {
				edgeBody = buildPublisherSeoBody(spec.publisherInfo);
			} else {
				const recent = normalizedPath === "/" ? await listPlugins(env.DB, { sort: "updated", limit: 12 }) : [];
				edgeBody = buildStaticSeoBody(normalizedPath, spec, recent);
			}
		} catch (err) {
			console.warn(
				`edge SEO body generation failed for ${normalizedPath}`,
				err instanceof Error ? err.message : String(err),
			);
		}
	}

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
	const rewriter = new HTMLRewriter()
		.on("html", { element(e) { e.setAttribute("lang", "en"); } })
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
		.on("head", {
			element(e) {
				e.append(`<meta name="dsh-edge-seo" content="${spec.canonicalPath.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}">`, { html: true });
				if (homePayload) e.append(`<script id="dsh-home-bootstrap" type="application/json">${serializeJsonLd(homePayload as unknown as Record<string, unknown>)}</script>`, { html: true });
			},
		});
	if (edgeBody) {
		rewriter.on("#root", { element(e) { e.setInnerContent(edgeBody!, { html: true }); } });
	}
	return rewriter.transform(response);
}
