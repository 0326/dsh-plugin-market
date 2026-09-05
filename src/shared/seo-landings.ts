export type CapabilityLanding = {
	slug: string;
	capability: string;
	title: string;
	titleZh: string;
	definition: string;
};

/** Canonical public labels mapped to the scanner's real taxonomy. */
export const CAPABILITY_LANDINGS: CapabilityLanding[] = [
	{ slug: "security", capability: "SECURITY", title: "Security", titleZh: "安全", definition: "Static security signals, install-script checks, and risk findings for DSH plugins." },
	{ slug: "developer-tools", capability: "DEVELOPMENT", title: "Developer Tools", titleZh: "开发工具", definition: "DSH plugins that support coding, testing, debugging, editors, or development workflows." },
	{ slug: "productivity", capability: "PRODUCTIVITY", title: "Productivity", titleZh: "效率工具", definition: "DSH plugins for notes, tasks, calendars, documents, and everyday productivity workflows." },
	{ slug: "themes", capability: "UI_THEMES", title: "Themes", titleZh: "主题", definition: "DSH plugins that extend interface themes, skins, colors, or visual styling." },
	{ slug: "git", capability: "GIT_GITHUB", title: "Git and GitHub", titleZh: "Git 与 GitHub", definition: "DSH plugins that work with Git, GitHub repositories, commits, pull requests, or source workflows." },
	{ slug: "memory", capability: "MEMORY", title: "Memory", titleZh: "记忆", definition: "DSH plugins that store, retrieve, or manage context and conversation history." },
	{ slug: "browser", capability: "BROWSER_WEB", title: "Browser and Web", titleZh: "浏览器与 Web", definition: "DSH plugins for browsers, web pages, HTTP resources, or web automation." },
	{ slug: "database", capability: "DATA", title: "Data and Databases", titleZh: "数据与数据库", definition: "DSH plugins that work with data, databases, SQL, JSON, or CSV resources." },
];

export type DiscoveryLanding = {
	slug: string;
	title: string;
	titleZh: string;
	definition: string;
	sort: "updated" | "stars" | "new";
	verified?: boolean;
};

export const DISCOVERY_LANDINGS: DiscoveryLanding[] = [
	{ slug: "popular", title: "Popular", titleZh: "热门", definition: "The most starred DSH plugins currently listed in the registry.", sort: "stars" },
	{ slug: "new", title: "New", titleZh: "最新", definition: "The newest DSH plugins discovered by the registry.", sort: "new" },
	{ slug: "verified", title: "Verified", titleZh: "已验证", definition: "DSH plugins with a current format-verification result and registry evidence.", sort: "updated", verified: true },
];

export const LANDING_MINIMUM_PLUGINS = 3;

export function getCapabilityLanding(slug: string): CapabilityLanding | null {
	return CAPABILITY_LANDINGS.find((landing) => landing.slug === slug) ?? null;
}

export function getDiscoveryLanding(slug: string): DiscoveryLanding | null {
	return DISCOVERY_LANDINGS.find((landing) => landing.slug === slug) ?? null;
}
