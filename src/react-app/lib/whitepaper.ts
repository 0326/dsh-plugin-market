import overviewMarkdown from "../content/whitepaper/v0.1.5-rc.1/00-overview.md?raw";
import compositionMarkdown from "../content/whitepaper/v0.1.5-rc.1/01-composition.md?raw";
import runtimeMarkdown from "../content/whitepaper/v0.1.5-rc.1/04-runtime.md?raw";
import pluginsMarkdown from "../content/whitepaper/v0.1.5-rc.1/12-plugin-development.md?raw";

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
	sources: WhitepaperSource[];
}

export interface WhitepaperVersion {
	id: string;
	label: string;
	upstreamTag: string;
	upstreamCommit: string;
	releasedAt: string;
	status: "preview" | "published";
	chapters: WhitepaperChapter[];
}

const V015RC1: WhitepaperVersion = {
	id: "v0.1.5-rc.1",
	label: "v0.1.5-rc.1",
	upstreamTag: "dsh-v0.1.5-rc.1",
	upstreamCommit: "183f08e9c6dde7e36cd2318eaee70b0da08fb35e",
	releasedAt: "2026-09-10",
	status: "published",
	chapters: [
		{
			id: "overview",
			slug: "overview",
			title: "DSH 全貌",
			summary: "从组合模型、Agent Runtime、能力 seam 与 Web Client 四个面建立整体结构。",
			markdown: overviewMarkdown,
			sources: [
				{ path: "README.zh.md", label: "README" },
				{ path: "docs/architecture.zh.md", label: "Architecture" },
				{ path: "packages/README.zh.md", label: "Package map" },
			],
		},
		{
			id: "composition",
			slug: "composition",
			title: "Cordis 与组合模型",
			summary: "理解 Plugin Tree、Profile、Bundle、Patch 以及可逆生命周期。",
			markdown: compositionMarkdown,
			sources: [
				{ path: "docs/architecture.zh.md", label: "Architecture" },
				{ path: "docs/cordis-primer.zh.md", label: "Cordis primer" },
			],
		},
		{
			id: "runtime",
			slug: "runtime",
			title: "Agent 运行机制",
			summary: "从 Inbox 到 Turn、Step、LLM Stream、Tool Execution、SessionHandle 与持久化 settlement。",
			markdown: runtimeMarkdown,
			sources: [
				{ path: "docs/architecture.zh.md", label: "Turn flow" },
				{ path: "docs/agent-lifecycle.zh.md", label: "Agent lifecycle" },
				{ path: "packages/core/agent-loop/README.zh.md", label: "Agent loop" },
			],
		},
		{
			id: "plugin-development",
			slug: "plugin-development",
			title: "插件开发与扩展面",
			summary: "按 Service、Event、Tool、Provider、Preset、Hook 与 Client Slot 选择扩展位置。",
			markdown: pluginsMarkdown,
			sources: [
				{ path: "docs/architecture.zh.md", label: "Extension points" },
				{ path: "docs/cookbook/extension-cookbook.zh.md", label: "Extension cookbook" },
				{ path: "docs/subsystems/slots.zh.md", label: "Slot map" },
				{ path: "packages/client/ui-slots/README.zh.md", label: "Client UI slots" },
			],
		},
	],
};

export const WHITEPAPER_VERSIONS: WhitepaperVersion[] = [V015RC1];
export const WHITEPAPER_LATEST_VERSION = V015RC1.id;

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
