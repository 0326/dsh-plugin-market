import { createContext, useContext } from "react";

export type Language = "zh" | "en";

const STORAGE_KEY = "dsh-market-lang";

export type Dict = { [key: string]: string | Dict };

const zh: Dict = {
	meta: {
		title: "dsh-plugin market",
		description: "dsh-plugin market — 面向 DeepSeek Harness 生态的可信插件注册、发现与安装平台。",
	},
	nav: { home: "首页", explore: "插件市场", submit: "提交插件", developers: "开发者", docs: "文档", about: "关于 DSH", login: "登录 / 注册" },
	langSwitch: "English",
	theme: { light: "亮色", dark: "暗色" },
	footer: "dsh-plugin market 是社区项目，并非 DeepSeek 官方产品。格式验证 ≠ 安全。",
	common: {
		loading: "加载中…",
		noDescription: "暂无描述。",
	},
	home: {
		heroTagline: "构建安全可信的 DSH 精选插件市场",
		searchPlaceholder: "搜索插件、功能或开发者……",
		search: "搜索",
		browse: "浏览",
		statsFeatured: "精选插件",
		statsVerified: "已验证插件",
		statsUpdated: "本周更新",
		statsTotal: "全部插件",
		featured: "精选",
		latest: "最新上架",
		popular: "热门",
		seeAll: "查看全部",
		emptyFeatured: "暂无精选插件。",
		emptyVerified: "暂无已验证插件。",
		loadError: "加载注册表失败：{msg}",
		trustFormatTitle: "格式验证",
		trustFormatDesc: "插件结构是否符合 DSH 插件规范。",
		trustCompatTitle: "兼容性",
		trustCompatDesc: "与当前 DSH / Cordis 版本的兼容情况。",
		trustSecurityTitle: "安全信号",
		trustSecurityDesc: "静态扫描、安装脚本、权限与依赖风险。",
		ctaTitle: "发现你的下一个 DSH 插件",
		ctaText: "浏览经过验证的插件，安装前先了解兼容性与安全信号。",
		ctaButton: "浏览全部插件",
	},
	explore: {
		title: "探索插件",
		subtitle: "浏览、筛选并比较 DSH 插件。",
		searchPlaceholder: "搜索插件…",
		featuredOnly: "仅看精选",
		verifiedOnly: "仅看已验证",
		allCapabilities: "全部能力",
		allTypes: "全部类型",
		anyCompatibility: "任意兼容性",
		anyRisk: "任意风险",
		sortUpdated: "最近更新",
		sortStars: "最多 Star",
		sortNew: "最新",
		sortTrending: "趋势",
		empty: "未找到插件。",
	},
	submit: {
		title: "提交插件",
		desc: "粘贴 GitHub 仓库 URL。我们会验证它、加入候选列表，并加入扫描队列。",
		placeholder: "https://github.com/owner/repo",
		submit: "提交",
		submitting: "提交中…",
		queued: "已将 {owner}/{repo} 加入扫描队列。",
	},
	detail: {
		loadError: "加载插件失败：{msg}",
		by: "作者",
		overview: "概览",
		compatibility: "兼容性",
		security: "安全",
		versions: "版本",
		noFindings: "该类目暂无发现。",
		noScanHistory: "暂无扫描历史。",
		package: "包名",
		cordis: "Cordis",
		node: "Node",
		bundlePatch: "Bundle 补丁",
		capabilities: "能力",
		types: "类型",
		installScripts: "安装脚本",
		scannedAt: "已扫描提交 {sha} · 扫描器 {ver} · {at}",
		scanRow: "扫描器 {ver} · {at}",
		scanError: "错误：{code}",
		scanStatusPassed: "通过",
		scanStatusFailed: "失败",
		scanStatusUnknown: "未知",
	},
	publisher: {
		loadError: "加载发布者失败：{msg}",
		summary: "{verified} 个已验证 · {plugins} 个插件 · ★ {stars}",
	},
	install: {
		title: "安装",
		format: "格式",
		compatibility: "兼容性",
		security: "安全",
		risk: "风险",
		copy: "复制命令",
		copied: "已复制",
		copyFailed: "复制失败，请手动复制",
		pinned: "固定到已扫描的提交 {sha}。",
		noCommit: "暂无已扫描提交。",
	},
	riskLabel: "风险 {level}",
	card: {
		publisher: "作者 {owner}",
		updated: "更新于 {time}",
	},
	badge: {
		FORMAT_VERIFIED: "格式已验证",
		FEATURED: "精选",
		DETECTED: "已检测",
		CANDIDATE: "候选",
		REJECTED: "已拒绝",
		COMPATIBLE: "兼容",
		LIKELY_COMPATIBLE: "可能兼容",
		OUTDATED: "已过时",
		INCOMPATIBLE: "不兼容",
		UNKNOWN: "未知",
		PASSED: "通过",
		REVIEW: "需审查",
		FAILED: "失败",
		ACTIVE: "活跃",
		INACTIVE: "不活跃",
		ARCHIVED: "已归档",
		LOW: "低",
		MEDIUM: "中",
		HIGH: "高",
		CRITICAL: "严重",
	},
};

const en: Dict = {
	meta: {
		title: "dsh-plugin market",
		description: "dsh-plugin market — a trusted plugin registry for the DeepSeek Harness ecosystem.",
	},
	nav: { home: "Home", explore: "Plugin market", submit: "Submit", developers: "Developers", docs: "Docs", about: "About DSH", login: "Sign in / Register" },
	langSwitch: "中文",
	theme: { light: "Light", dark: "Dark" },
	footer: "dsh-plugin market is a community project — not an official DeepSeek product. Format Verified ≠ Safe.",
	common: {
		loading: "Loading…",
		noDescription: "No description.",
	},
	home: {
		heroTagline: "A secure, trusted, curated plugin marketplace for DSH.",
		searchPlaceholder: "Search plugins, capabilities, or developers…",
		search: "Search",
		browse: "Browse",
		statsFeatured: "featured plugins",
		statsVerified: "verified plugins",
		statsUpdated: "updated this week",
		statsTotal: "total plugins",
		featured: "Featured",
		latest: "Latest",
		popular: "Trending",
		seeAll: "View all",
		emptyFeatured: "No featured plugins yet.",
		emptyVerified: "No verified plugins yet.",
		loadError: "Failed to load registry: {msg}",
		trustFormatTitle: "Format Verified",
		trustFormatDesc: "Whether the plugin structure follows the DSH plugin spec.",
		trustCompatTitle: "Compatibility",
		trustCompatDesc: "Compatibility with the current DSH / Cordis versions.",
		trustSecurityTitle: "Security Signals",
		trustSecurityDesc: "Static scan, install scripts, permissions, and dependency risks.",
		ctaTitle: "Find your next DSH plugin",
		ctaText: "Browse verified plugins and check compatibility and security signals before installing.",
		ctaButton: "Browse all plugins",
	},
	explore: {
		title: "Explore plugins",
		subtitle: "Browse, filter, and compare DSH plugins.",
		searchPlaceholder: "Search plugins…",
		featuredOnly: "Featured only",
		verifiedOnly: "Verified only",
		allCapabilities: "All capabilities",
		allTypes: "All types",
		anyCompatibility: "Any compatibility",
		anyRisk: "Any risk",
		sortUpdated: "Recently updated",
		sortStars: "Most stars",
		sortNew: "Newest",
		sortTrending: "Trending",
		empty: "No plugins found.",
	},
	submit: {
		title: "Submit a plugin",
		desc: "Paste a GitHub repository URL. We validate it, add it as a candidate, and enqueue a scan.",
		placeholder: "https://github.com/owner/repo",
		submit: "Submit",
		submitting: "Submitting…",
		queued: "Queued {owner}/{repo} for scanning.",
	},
	detail: {
		loadError: "Failed to load plugin: {msg}",
		by: "by",
		overview: "Overview",
		compatibility: "Compatibility",
		security: "Security",
		versions: "Versions",
		noFindings: "No findings for this category.",
		noScanHistory: "No scan history.",
		package: "Package",
		cordis: "Cordis",
		node: "Node",
		bundlePatch: "Bundle patch",
		capabilities: "Capabilities",
		types: "Types",
		installScripts: "Install scripts",
		scannedAt: "Scanned commit {sha} · scanner {ver} · {at}",
		scanRow: "scanner {ver} · {at}",
		scanError: "error: {code}",
		scanStatusPassed: "passed",
		scanStatusFailed: "failed",
		scanStatusUnknown: "unknown",
	},
	publisher: {
		loadError: "Failed to load publisher: {msg}",
		summary: "{verified} verified · {plugins} plugins · ★ {stars}",
	},
	install: {
		title: "Install",
		format: "Format",
		compatibility: "Compatibility",
		security: "Security",
		risk: "Risk",
		copy: "Copy command",
		copied: "Copied",
		copyFailed: "Copy failed; copy manually",
		pinned: "Pinned to the scanned commit {sha}.",
		noCommit: "No scanned commit yet.",
	},
	riskLabel: "risk {level}",
	card: {
		publisher: "by {owner}",
		updated: "updated {time}",
	},
	badge: {
		FORMAT_VERIFIED: "format verified",
		FEATURED: "featured",
		DETECTED: "detected",
		CANDIDATE: "candidate",
		REJECTED: "rejected",
		COMPATIBLE: "compatible",
		LIKELY_COMPATIBLE: "likely compatible",
		OUTDATED: "outdated",
		INCOMPATIBLE: "incompatible",
		UNKNOWN: "unknown",
		PASSED: "passed",
		REVIEW: "review",
		FAILED: "failed",
		ACTIVE: "active",
		INACTIVE: "inactive",
		ARCHIVED: "archived",
		LOW: "low",
		MEDIUM: "medium",
		HIGH: "high",
		CRITICAL: "critical",
	},
};

export const translations: Record<Language, Dict> = { zh, en };

export function detectLanguage(): Language {
	if (typeof window === "undefined") return "zh";
	try {
		const saved = window.localStorage.getItem(STORAGE_KEY);
		if (saved === "zh" || saved === "en") return saved;
	} catch {
		// ignore storage access errors
	}
	const nav = (typeof navigator !== "undefined" && navigator.language) || "";
	const lang = nav.toLowerCase();
	if (lang.startsWith("zh")) return "zh";
	if (lang.startsWith("en")) return "en";
	// 未选择时默认中文
	return "zh";
}

export interface I18nContextValue {
	lang: Language;
	setLang: (lang: Language) => void;
	toggleLang: () => void;
	t: (key: string, params?: Record<string, string | number>, fallback?: string) => string;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

export function useI18n(): I18nContextValue {
	const ctx = useContext(I18nContext);
	if (!ctx) throw new Error("useI18n must be used within a LanguageProvider");
	return ctx;
}
