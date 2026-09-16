import whitepaperManifest from "../content/whitepaper/manifest.json";

export interface WhitepaperSource {
	path: string;
	label: string;
}

export interface WhitepaperChapter {
	id: string;
	slug: string;
	title: string;
	summary: string;
	markdown: string;
	html: string;
	sources: WhitepaperSource[];
	groupId: string;
	type: string;
	readerOutcome: string;
	audience: string[];
}

export interface WhitepaperGroup {
	id: string;
	title: string;
	type: "body" | "reference";
	chapters: WhitepaperChapter[];
}

export interface WhitepaperVersion {
	id: string;
	label: string;
	upstreamTag: string;
	upstreamCommit: string;
	releasedAt: string;
	status: "preview" | "published";
	chapters: WhitepaperChapter[];
	groups: WhitepaperGroup[];
}

interface WhitepaperArticleDefinition {
	id: string;
	slug: string;
	title: string;
	file: string;
	type: string;
	audience: string[];
	readerOutcome: string;
	kind: "article" | "appendix";
	authority: "upstream" | "document-policy";
	verification: "draft" | "reviewed" | "blocked";
}

interface WhitepaperManifestGroup {
	id: string;
	title: string;
	kind: "body" | "appendix";
	order: number;
	articles: string[];
}

interface WhitepaperRelease {
	id: string;
	label: string;
	tag: string;
	commit: string;
	releasedAt: string;
	channel: string;
	status: "preview" | "published";
	documentationRevision: number;
	verifiedAt: string;
	contentRoot: string;
	assetRoot: string;
	groups: WhitepaperManifestGroup[];
}

interface WhitepaperManifest {
	policy: {
		latestPublished: string;
	};
	articles: WhitepaperArticleDefinition[];
	versions: WhitepaperRelease[];
}

const markdownModules = import.meta.glob("../content/whitepaper/*/*.md", {
	eager: true,
	query: "?raw",
	import: "default",
}) as Record<string, string>;

const htmlModules = import.meta.glob("../content/whitepaper/generated/*/*.html", {
	eager: true,
	query: "?raw",
	import: "default",
}) as Record<string, string>;

const manifest = whitepaperManifest as WhitepaperManifest;
const articleRegistry = new Map(manifest.articles.map((article) => [article.id, article]));

function frontmatterValue(markdown: string, key: string): string | undefined {
	const match = new RegExp(`^${key}:\\s*(.+)$`, "m").exec(markdown);
	return match?.[1]?.trim().replace(/^['"]|['"]$/g, "");
}

function sourcePaths(markdown: string): string[] {
	const match = /^sources:\s*\r?\n((?:\s+-\s+.+(?:\r?\n|$))*)/m.exec(markdown);
	if (!match) return [];
	return [...match[1].matchAll(/^\s+-\s+(.+)$/gm)]
		.map((item) => item[1].trim().replace(/^['"]|['"]$/g, ""))
		.filter(Boolean);
}

function sourceLabel(path: string): string {
	const segments = path.split("/");
	const name = segments[segments.length - 1] ?? path;
	return name.replace(/\.zh\.md$|\.md$/i, "").replace(/[-_]/g, " ");
}

function markdownKey(versionId: string, file: string): string {
	return `../content/whitepaper/${versionId}/${file}`;
}

function htmlKey(versionId: string, file: string): string {
	return `../content/whitepaper/generated/${versionId}/${file.replace(/\.md$/i, ".html")}`;
}

function articleForId(articleId: string): WhitepaperArticleDefinition {
	const article = articleRegistry.get(articleId);
	if (!article) throw new Error(`Whitepaper article is missing from canonical manifest: ${articleId}`);
	return article;
}

function chapterForArticle(versionId: string, groupId: string, articleId: string): WhitepaperChapter {
	const article = articleForId(articleId);
	const markdown = markdownModules[markdownKey(versionId, article.file)];
	const html = htmlModules[htmlKey(versionId, article.file)];
	if (typeof markdown !== "string" || typeof html !== "string") {
		throw new Error(`Whitepaper assets are missing for ${versionId}/${article.file}`);
	}
	return {
		id: article.id,
		slug: article.slug,
		title: article.title,
		summary: frontmatterValue(markdown, "summary") ?? frontmatterValue(markdown, "title") ?? article.title,
		markdown,
		html,
		sources: sourcePaths(markdown).map((path) => ({ path, label: sourceLabel(path) })),
		groupId,
		type: article.type,
		readerOutcome: article.readerOutcome,
		audience: article.audience,
	};
}

function buildVersion(release: WhitepaperRelease): WhitepaperVersion {
	const groups = [...release.groups]
		.sort((a, b) => a.order - b.order)
		.map((group) => ({
			id: group.id,
			title: group.title,
			type: group.kind === "appendix" ? "reference" as const : "body" as const,
			chapters: group.articles.map((articleId) => chapterForArticle(release.id, group.id, articleId)),
		}));
	return {
		id: release.id,
		label: release.label,
		upstreamTag: release.tag,
		upstreamCommit: release.commit,
		releasedAt: release.releasedAt,
		status: release.status,
		groups,
		chapters: groups.flatMap((group) => group.chapters),
	};
}

export const WHITEPAPER_VERSIONS: WhitepaperVersion[] = manifest.versions.map(buildVersion);
export const WHITEPAPER_LATEST_VERSION = manifest.policy.latestPublished;

export function resolveWhitepaperVersion(requested: string): WhitepaperVersion | undefined {
	const id = requested === "latest" ? WHITEPAPER_LATEST_VERSION : requested;
	return WHITEPAPER_VERSIONS.find((version) => version.id === id);
}

export function chapterForSlug(version: WhitepaperVersion, slug?: string): WhitepaperChapter | undefined {
	if (!slug) return version.chapters[0];
	return version.chapters.find((chapter) => chapter.slug === slug);
}

export function chapterForId(version: WhitepaperVersion, id: string): WhitepaperChapter | undefined {
	return version.chapters.find((chapter) => chapter.id === id);
}

export function groupForChapter(version: WhitepaperVersion, chapter: WhitepaperChapter): WhitepaperGroup | undefined {
	return version.groups.find((group) => group.id === chapter.groupId);
}

export function whitepaperHref(version: WhitepaperVersion, chapter?: WhitepaperChapter): string {
	return chapter ? `/whitepaper/${version.id}/${chapter.slug}` : `/whitepaper/${version.id}`;
}

export function officialSourceUrl(version: WhitepaperVersion, path: string): string {
	return `https://github.com/deepseek-ai/deepseek-harness/blob/${encodeURIComponent(version.upstreamTag)}/${path}`;
}

export function stripFrontmatter(markdown: string): string {
	return markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
}

export interface TocItem {
	level: 2 | 3;
	text: string;
	id: string;
}

export function headingId(text: string): string {
	return text
		.trim()
		.toLowerCase()
		.replace(/[`*_]/g, "")
		.replace(/[^\p{L}\p{N}\s-]/gu, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-");
}

export function extractToc(markdown: string): TocItem[] {
	return stripFrontmatter(markdown)
		.split(/\r?\n/)
		.flatMap((line) => {
			const match = /^(##|###)\s+(.+)$/.exec(line.trim());
			if (!match) return [];
			const text = match[2].replace(/\s+#+$/, "").trim();
			return [{ level: match[1].length as 2 | 3, text, id: headingId(text) }];
		});
}
