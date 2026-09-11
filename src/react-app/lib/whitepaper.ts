import overviewMarkdown from "../content/whitepaper/v0.1.5-rc.1/00-overview.md?raw";
import compositionMarkdown from "../content/whitepaper/v0.1.5-rc.1/01-composition.md?raw";
import bootConfigMarkdown from "../content/whitepaper/v0.1.5-rc.1/02-boot-config.md?raw";
import agentCoreMarkdown from "../content/whitepaper/v0.1.5-rc.1/03-agent-core.md?raw";
import runtimeMarkdown from "../content/whitepaper/v0.1.5-rc.1/04-runtime.md?raw";
import sessionStateMarkdown from "../content/whitepaper/v0.1.5-rc.1/05-session-state.md?raw";
import capabilitySeamsMarkdown from "../content/whitepaper/v0.1.5-rc.1/06-capability-seams.md?raw";
import coreCapabilitiesMarkdown from "../content/whitepaper/v0.1.5-rc.1/07-core-capabilities.md?raw";
import presetsMarkdown from "../content/whitepaper/v0.1.5-rc.1/08-presets.md?raw";
import subagentWorkflowJobsMarkdown from "../content/whitepaper/v0.1.5-rc.1/09-subagent-workflow-jobs.md?raw";
import hooksInterceptionMarkdown from "../content/whitepaper/v0.1.5-rc.1/10-hooks-interception.md?raw";
import webClientMarkdown from "../content/whitepaper/v0.1.5-rc.1/11-web-client.md?raw";
import pluginsMarkdown from "../content/whitepaper/v0.1.5-rc.1/12-plugin-development.md?raw";
import extensionMapMarkdown from "../content/whitepaper/v0.1.5-rc.1/13-extension-map.md?raw";
import sdkAcpWebhookMarkdown from "../content/whitepaper/v0.1.5-rc.1/14-sdk-acp-webhook.md?raw";
import securityPermissionsMarkdown from "../content/whitepaper/v0.1.5-rc.1/15-security-permissions.md?raw";
import diagnosticsObservabilityMarkdown from "../content/whitepaper/v0.1.5-rc.1/16-diagnostics-observability.md?raw";
import evolutionMarkdown from "../content/whitepaper/v0.1.5-rc.1/17-evolution.md?raw";

import overviewHtml from "../content/whitepaper/generated/v0.1.5-rc.1/00-overview.html?raw";
import compositionHtml from "../content/whitepaper/generated/v0.1.5-rc.1/01-composition.html?raw";
import bootConfigHtml from "../content/whitepaper/generated/v0.1.5-rc.1/02-boot-config.html?raw";
import agentCoreHtml from "../content/whitepaper/generated/v0.1.5-rc.1/03-agent-core.html?raw";
import runtimeHtml from "../content/whitepaper/generated/v0.1.5-rc.1/04-runtime.html?raw";
import sessionStateHtml from "../content/whitepaper/generated/v0.1.5-rc.1/05-session-state.html?raw";
import capabilitySeamsHtml from "../content/whitepaper/generated/v0.1.5-rc.1/06-capability-seams.html?raw";
import coreCapabilitiesHtml from "../content/whitepaper/generated/v0.1.5-rc.1/07-core-capabilities.html?raw";
import presetsHtml from "../content/whitepaper/generated/v0.1.5-rc.1/08-presets.html?raw";
import subagentWorkflowJobsHtml from "../content/whitepaper/generated/v0.1.5-rc.1/09-subagent-workflow-jobs.html?raw";
import hooksInterceptionHtml from "../content/whitepaper/generated/v0.1.5-rc.1/10-hooks-interception.html?raw";
import webClientHtml from "../content/whitepaper/generated/v0.1.5-rc.1/11-web-client.html?raw";
import pluginsHtml from "../content/whitepaper/generated/v0.1.5-rc.1/12-plugin-development.html?raw";
import extensionMapHtml from "../content/whitepaper/generated/v0.1.5-rc.1/13-extension-map.html?raw";
import sdkAcpWebhookHtml from "../content/whitepaper/generated/v0.1.5-rc.1/14-sdk-acp-webhook.html?raw";
import securityPermissionsHtml from "../content/whitepaper/generated/v0.1.5-rc.1/15-security-permissions.html?raw";
import diagnosticsObservabilityHtml from "../content/whitepaper/generated/v0.1.5-rc.1/16-diagnostics-observability.html?raw";
import evolutionHtml from "../content/whitepaper/generated/v0.1.5-rc.1/17-evolution.html?raw";

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
			summary: "从组合、Agent Runtime、能力 Seam 与产品表面建立完整心智模型。",
			markdown: overviewMarkdown,
			html: overviewHtml,
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
			summary: "理解 Context、Plugin、Service、Event、Effect 与可逆生命周期。",
			markdown: compositionMarkdown,
			html: compositionHtml,
			sources: [
				{ path: "docs/architecture.zh.md", label: "Architecture" },
				{ path: "docs/cordis-primer.zh.md", label: "Cordis primer" },
			],
		},
		{
			id: "boot-config",
			slug: "boot-config",
			title: "启动与配置组装",
			summary: "Profile、Bundle、Patch 如何在启动时组成最终 Plugin Tree。",
			markdown: bootConfigMarkdown,
			html: bootConfigHtml,
			sources: [
				{ path: "docs/architecture.zh.md", label: "Architecture" },
				{ path: "packages/boot/README.zh.md", label: "Boot" },
				{ path: "packages/bundle/README.zh.md", label: "Bundles" },
			],
		},
		{
			id: "agent-core",
			slug: "agent-core",
			title: "Agent Core",
			summary: "Session、Prompt、Tools、Agent 与默认 Agent Loop 的职责边界。",
			markdown: agentCoreMarkdown,
			html: agentCoreHtml,
			sources: [
				{ path: "docs/architecture.zh.md", label: "Architecture" },
				{ path: "docs/subsystems/core.zh.md", label: "Core subsystem" },
				{ path: "packages/core/README.zh.md", label: "Core packages" },
			],
		},
		{
			id: "runtime",
			slug: "runtime",
			title: "Agent 运行机制",
			summary: "从 Inbox 到 Turn、Step、LLM Stream、Tool Execution 与持久化 Settlement。",
			markdown: runtimeMarkdown,
			html: runtimeHtml,
			sources: [
				{ path: "docs/architecture.zh.md", label: "Turn flow" },
				{ path: "docs/agent-lifecycle.zh.md", label: "Agent lifecycle" },
				{ path: "packages/core/agent-loop/README.zh.md", label: "Agent loop" },
			],
		},
		{
			id: "session-state",
			slug: "session-state",
			title: "Session 与状态",
			summary: "Event Log、Surface、Request Header、Fork、Persistence 与 V3 数据格式。",
			markdown: sessionStateMarkdown,
			html: sessionStateHtml,
			sources: [
				{ path: "packages/core/session/README.zh.md", label: "Session" },
				{ path: "docs/subsystems/session.zh.md", label: "Session subsystem" },
				{ path: "docs/subsystems/persistence.zh.md", label: "Persistence" },
				{ path: "packages/session/session-format-v2-to-v3/README.zh.md", label: "V3 migration" },
			],
		},
		{
			id: "capability-seams",
			slug: "capability-seams",
			title: "Capability Seam",
			summary: "Definition、Provider、Consumer 如何形成可替换能力边界。",
			markdown: capabilitySeamsMarkdown,
			html: capabilitySeamsHtml,
			sources: [
				{ path: "docs/capability-seams.zh.md", label: "Capability seams" },
				{ path: "docs/architecture.zh.md", label: "Architecture" },
				{ path: "packages/README.zh.md", label: "Package map" },
			],
		},
		{
			id: "core-capabilities",
			slug: "core-capabilities",
			title: "核心能力模块",
			summary: "执行、模型、数据与产品支撑能力的包组地图。",
			markdown: coreCapabilitiesMarkdown,
			html: coreCapabilitiesHtml,
			sources: [
				{ path: "packages/README.zh.md", label: "Package map" },
				{ path: "docs/capability-seams.zh.md", label: "Capability seams" },
			],
		},
		{
			id: "presets",
			slug: "presets",
			title: "Preset 与 Agent 组装",
			summary: "按 Session 组合 Tool、Skill、Prompt、Persona 与 Agent Scope。",
			markdown: presetsMarkdown,
			html: presetsHtml,
			sources: [
				{ path: "packages/preset/README.zh.md", label: "Preset packages" },
				{ path: "docs/subsystems/scope.zh.md", label: "Scope" },
				{ path: "docs/subsystems/system-prompt.zh.md", label: "System prompt" },
			],
		},
		{
			id: "subagent-workflow-jobs",
			slug: "subagent-workflow-jobs",
			title: "Subagent / Workflow / Jobs",
			summary: "区分任务委派、多 Agent 编排和后台任务三类异步能力。",
			markdown: subagentWorkflowJobsMarkdown,
			html: subagentWorkflowJobsHtml,
			sources: [
				{ path: "packages/subagent/README.zh.md", label: "Subagent" },
				{ path: "docs/subsystems/subagent.zh.md", label: "Subagent subsystem" },
				{ path: "packages/workflow/README.zh.md", label: "Workflow" },
				{ path: "packages/jobs/README.zh.md", label: "Jobs" },
			],
		},
		{
			id: "hooks-interception",
			slug: "hooks-interception",
			title: "Hooks 与拦截",
			summary: "Agent / Tool Waterfall 与 Claude Code、Codex Hook Bridge 的边界。",
			markdown: hooksInterceptionMarkdown,
			html: hooksInterceptionHtml,
			sources: [
				{ path: "docs/architecture.zh.md", label: "Architecture" },
				{ path: "packages/hooks/README.zh.md", label: "Hooks" },
				{ path: "docs/subsystems/tools.zh.md", label: "Tools subsystem" },
			],
		},
		{
			id: "web-client",
			slug: "web-client",
			title: "Web Client 架构",
			summary: "Host、Remote、Client Model、Conversation、Slots 与 React 的完整数据通路。",
			markdown: webClientMarkdown,
			html: webClientHtml,
			sources: [
				{ path: "docs/subsystems/web-client.zh.md", label: "Web client" },
				{ path: "docs/subsystems/slots.zh.md", label: "Slots" },
				{ path: "docs/api-gateway.zh.md", label: "API gateway" },
				{ path: "packages/client/ui-slots/README.zh.md", label: "UI slots" },
			],
		},
		{
			id: "plugin-development",
			slug: "plugin-development",
			title: "插件开发与扩展面",
			summary: "按 Service、Event、Tool、Provider、Preset、Hook 与 Client Slot 选择扩展位置。",
			markdown: pluginsMarkdown,
			html: pluginsHtml,
			sources: [
				{ path: "docs/architecture.zh.md", label: "Extension points" },
				{ path: "docs/cookbook/extension-cookbook.zh.md", label: "Extension cookbook" },
				{ path: "docs/subsystems/slots.zh.md", label: "Slot map" },
				{ path: "packages/client/ui-slots/README.zh.md", label: "Client UI slots" },
			],
		},
		{
			id: "extension-map",
			slug: "extension-map",
			title: "扩展能力地图",
			summary: "从需求反查 LLM、Tool、Event、Preset、Persistence、UI 与 Dynamic Extension。",
			markdown: extensionMapMarkdown,
			html: extensionMapHtml,
			sources: [
				{ path: "docs/architecture.zh.md", label: "Extension points" },
				{ path: "docs/capability-seams.zh.md", label: "Capability seams" },
				{ path: "packages/extensions/README.zh.md", label: "Dynamic extensions" },
				{ path: "docs/subsystems/extensions.zh.md", label: "Extensions subsystem" },
			],
		},
		{
			id: "sdk-acp-webhook",
			slug: "sdk-acp-webhook",
			title: "SDK / ACP / Webhook",
			summary: "比较三种外部系统接入 DSH 的方向、协议与可靠性边界。",
			markdown: sdkAcpWebhookMarkdown,
			html: sdkAcpWebhookHtml,
			sources: [
				{ path: "packages/sdk/README.zh.md", label: "SDK" },
				{ path: "packages/acp/README.zh.md", label: "ACP" },
				{ path: "packages/webhook/README.zh.md", label: "Webhook" },
			],
		},
		{
			id: "security-permissions",
			slug: "security-permissions",
			title: "安全与权限",
			summary: "Sandbox、Approval、Permission Preset 与 Human Interaction 的职责分层。",
			markdown: securityPermissionsMarkdown,
			html: securityPermissionsHtml,
			sources: [
				{ path: "packages/interaction/README.zh.md", label: "Interaction" },
				{ path: "packages/sandbox/README.zh.md", label: "Sandbox" },
				{ path: "docs/subsystems/approval.zh.md", label: "Approval" },
				{ path: "docs/subsystems/permission-presets.zh.md", label: "Permission presets" },
			],
		},
		{
			id: "diagnostics-observability",
			slug: "diagnostics-observability",
			title: "调试与观测",
			summary: "从组合、Runtime Invariant、Session Log 到 Web Client 投影定位问题。",
			markdown: diagnosticsObservabilityMarkdown,
			html: diagnosticsObservabilityHtml,
			sources: [
				{ path: "packages/runtime-diagnostics/README.zh.md", label: "Runtime diagnostics" },
				{ path: "docs/subsystems/invariants.zh.md", label: "Invariants" },
				{ path: "docs/config-catalog.zh.md", label: "Config catalog" },
				{ path: "docs/tool-catalog.zh.md", label: "Tool catalog" },
			],
		},
		{
			id: "evolution",
			slug: "evolution",
			title: "版本演进",
			summary: "v0.1.2-rc.1 到 v0.1.5-rc.1 的架构、API 与插件迁移要点。",
			markdown: evolutionMarkdown,
			html: evolutionHtml,
			sources: [
				{ path: "packages/session/session-format-v2-to-v3/README.zh.md", label: "Session V3 migration" },
				{ path: "packages/core/agent-loop/README.zh.md", label: "Agent loop" },
				{ path: "docs/subsystems/slots.zh.md", label: "Slots" },
				{ path: "packages/subagent/README.zh.md", label: "Subagent" },
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
