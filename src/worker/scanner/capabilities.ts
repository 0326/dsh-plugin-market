import type { Capability, ParsedPackageJson, PluginType } from "../domain/plugin";

const CAPABILITY_KEYWORDS: [Capability, RegExp][] = [
	["DEVELOPMENT", /\b(dev|debug|code|editor|ide|lint|test)\b/i],
	["GIT_GITHUB", /\b(git|github|pull.?request|commit)\b/i],
	["BROWSER_WEB", /\b(browser|web|http|url|page|playwright|puppeteer)\b/i],
	["DESIGN", /\b(design|figma|canvas|css|svg)\b/i],
	["VISION", /\b(vision|image|ocr|screenshot|screen)\b/i],
	["SEARCH", /\b(search|query|retrieval|rag|index)\b/i],
	["MEMORY", /\b(memory|remember|store|context|history)\b/i],
	["MCP_INTEGRATION", /\b(mcp|model context protocol|tool server)\b/i],
	["AUTOMATION", /\b(automation|workflow|task|cron|schedule)\b/i],
	["DATA", /\b(data|database|sql|json|csv)\b/i],
	["PRODUCTIVITY", /\b(productivity|notes|todo|calendar|docs)\b/i],
	["COMMUNICATION", /\b(chat|slack|discord|email|message|notify)\b/i],
	["UI_THEMES", /\b(theme|skin|style|color)\b/i],
	["AGENT_WORKFLOW", /\b(agent|orchestrat|multi.?agent)\b/i],
	["SECURITY", /\b(security|auth|permission|scan|vuln)\b/i],
];

/** Rule-based capability detection from manifest + README text (refined in M3). */
export function detectCapabilities(manifest: ParsedPackageJson, readme?: string): Capability[] {
	const text = [
		manifest.name ?? "",
		manifest.description ?? "",
		(manifest.keywords ?? []).join(" "),
		readme ?? "",
	].join(" ");
	const out: Capability[] = [];
	for (const [cap, re] of CAPABILITY_KEYWORDS) {
		if (re.test(text)) out.push(cap);
	}
	return out;
}

/** Rule-based plugin type detection (refined in M3). */
export function detectPluginTypes(manifest: ParsedPackageJson): PluginType[] {
	const types: PluginType[] = [];
	if (manifest.dsh?.bundle?.patch) types.push("BUNDLE");
	if (manifest.dsh?.client) types.push("CLIENT_UI");
	const text = [manifest.name ?? "", manifest.description ?? "", (manifest.keywords ?? []).join(" ")].join(" ");
	if (/\btheme\b|\bskin\b/i.test(text)) types.push("THEME");
	if (/\bmcp\b|tool server/i.test(text)) types.push("INTEGRATION");
	if (/\bworkflow\b|orchestrat/i.test(text)) types.push("WORKFLOW");
	if (/\bagent\b/i.test(text)) types.push("AGENT");
	if (types.length === 0) types.push("UNKNOWN");
	return [...new Set(types)];
}
