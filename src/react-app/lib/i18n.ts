import { createContext, useContext } from "react";
import type { Language } from "../../shared/language";

export type { Language } from "../../shared/language";

export function formatDateTime(value: string | null | undefined, lang: Language): string {
	if (!value) return "—";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "—";
	return new Intl.DateTimeFormat(lang === "zh" ? "zh-CN" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

const STORAGE_KEY = "dsh-market-lang";

export type Dict = { [key: string]: string | Dict };

const zh: Dict = {
  meta: {
    title: "DSH Plugin Market",
    description:
      "DSH Plugin Market — 面向 DeepSeek Harness 生态的独立插件可信注册表。",
  },
  nav: { home: "首页", explore: "插件市场", submit: "提交插件", about: "关于" },
  langSwitch: "English",
  theme: { light: "亮色", dark: "暗色" },
  github: { star: "加星", starAria: "在 GitHub 上给 DSH Plugin Market 加星" },
  footer:
    "DSH Plugin Market 是社区项目，并非 DeepSeek 官方产品。格式验证 ≠ 安全。",
  footerLinks: "项目链接",
  footerSource: "项目源码",
  common: {
    loading: "加载中…",
    noDescription: "暂无描述。",
  },
  home: {
    heroTagline: "从 GitHub 候选到可核验的 DSH 插件，先看格式、兼容性和安全信号，再放心安装。",
    searchPlaceholder: "搜索插件、功能或开发者……",
    search: "搜索",
    browse: "浏览",
    statsFeatured: "精选插件",
    statsVerified: "已验证插件",
    statsUpdated: "本周更新",
    statsTotal: "全部插件",
    lastScanLabel: "插件任务最后更新时间",
    noScanYet: "暂无扫描记录",
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
    ctaButton: "浏览全部插件",
  },
  about: {
    title: "可信的 DeepSeek Harness 插件入口",
    intro:
      "DSH-PLUGIN MARKET 是面向 DeepSeek Harness 生态的社区插件注册表，帮助用户在安装前了解插件的结构、兼容性、维护状态与安全信号。",
    featureFormatTitle: "格式验证",
    featureFormatText:
      "检查仓库和插件清单是否符合 DSH 插件规范，让可发现、可安装成为基础条件。",
    featureCompatTitle: "兼容性分析",
    featureCompatText:
      "结合 DSH、Cordis 和 Node 版本范围，提供清晰的兼容状态与问题定位。",
    featureSecurityTitle: "安全信号",
    featureSecurityText:
      "扫描安装脚本、依赖和敏感行为，并展示风险等级；验证结果不等同于绝对安全。",
    featureTraceTitle: "可追溯安装",
    featureTraceText:
      "记录扫描提交与历史结果，安装命令可固定到已扫描的 commit，减少源码漂移风险。",
    logoKicker: "LOGO 由来",
    logoTitle: "一只从深海游向 AI 世界的鲲",
    logoText:
      "DeepSeek 让人联想到深海探索与鲸，AI 则赋予它智能。鲸游入东方想象成为鲲，AI 的发音又连接到“爱”，最后汇成更轻松、更有记忆点的 iKun。Kun Logo 因此既保留深海意象，也表达社区对 AI 创作与开放生态的热爱。",
    logoEquationAria:
      "DeepSeek 加 AI，等于鲸加 AI，等于 AI 加鲲，等于爱加鲲，等于 iKun",
    communityTitle: "社区驱动，开放协作",
    communityText: "项目并非 DeepSeek 官方产品，欢迎通过 GitHub 参与改进。",
    source: "查看项目源码",
  },
  explore: {
    title: "探索插件",
    subtitle: "浏览、筛选并比较 DSH 插件。",
    searchPlaceholder: "搜索插件…",
    featuredOnly: "仅看精选",
    verifiedOnly: "仅看已验证",
	includeCandidates: "包含候选仓库",
    allCapabilities: "全部能力",
    allTypes: "全部类型",
    anyCompatibility: "任意兼容性",
    anyRisk: "任意安全风险",
    sortUpdated: "最近更新",
    sortStars: "最多 Star",
    sortNew: "最新",
    sortTrending: "近 7 天 Star 增长",
    loadMore: "加载更多",
    resultCount: "已展示 {count} 个插件",
    empty: "未找到插件。",
    searchMinChars: "请至少输入 3 个字符开始搜索。",
	compareSelect: "加入对比",
	compareSelected: "已选 {count}/3",
	compareGo: "对比所选插件",
  },
  compare: {
		title: "插件对比",
		subtitle: "并排查看当前扫描得到的可信信号，帮助你在安装前做取舍。",
		needTwo: "请从插件市场选择至少两个插件进行对比。",
		signal: "信号",
		format: "格式",
		compatibility: "兼容性",
		security: "安全扫描",
		risk: "安全风险",
		maintenance: "维护状态",
		capabilities: "能力",
		types: "类型",
		stars: "GitHub Stars",
		scannedCommit: "已扫描 commit",
	},
	changes: {
		title: "注册表更新",
		subtitle: "仅记录扫描中发现的有意义状态变化；它不等同于仓库的完整提交历史。",
		empty: "新的扫描会在此留下状态变化记录。",
	},
  submit: {
    title: "提交插件",
    desc: "粘贴 GitHub 仓库 URL。我们会验证它、加入候选列表，并加入扫描队列。",
    placeholder: "https://github.com/owner/repo",
    submit: "提交",
    submitting: "提交中…",
    queued: "已将 {owner}/{repo} 加入扫描队列。",
    eyebrow: "开放提交",
    step1Title: "提交仓库",
    step1Desc: "粘贴 GitHub 仓库 URL，立即加入候选列表。",
    step2Title: "自动扫描",
    step2Desc: "静态分析格式、兼容、维护与安全信号，绝不执行插件代码。",
    step3Title: "放心安装",
    step3Desc: "扫描结果绑定具体 commit，安装命令可固定到已扫描版本。",
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
    baselineTitle: "兼容性基线",
    baselineCheckedAt: "检查时间",
    compatVerdicts: "依赖兼容性",
    range: "声明范围",
    evidence: "证据",
    riskNote: "安全风险仅根据 SECURITY 类扫描发现计算，不包含格式、兼容性或维护状态。",
    noBaseline: "暂无兼容性基线信息。",
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
    risk: "安全风险",
    copy: "复制命令",
    source: "查看源码",
    copied: "已复制",
    copyFailed: "复制失败，请手动复制",
    pinned: "固定到已扫描的提交 {sha}。",
    noCommit: "暂无已扫描提交。",
  },
  riskLabel: "安全风险 {level}",
  card: {
    publisher: "作者 {owner}",
    updated: "更新于 {time}",
  },
  badge: {
    FORMAT_VERIFIED: "格式已验证",
    FEATURED: "精选",
    DETECTED: "已检测",
    CANDIDATE: "非插件",
    NON_PLUGIN: "非插件",
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
    title: "DSH Plugin Market",
    description:
      "DSH Plugin Market — an independent trust registry for DeepSeek Harness plugins.",
  },
  nav: {
    home: "Home",
    explore: "Plugin market",
    submit: "Submit",
    about: "About",
  },
  langSwitch: "中文",
  theme: { light: "Light", dark: "Dark" },
  github: { star: "Star", starAria: "Star DSH Plugin Market on GitHub" },
  footer:
    "DSH Plugin Market is a community project — not an official DeepSeek product. Format Verified ≠ Safe.",
  footerLinks: "Project links",
  footerSource: "Source code",
  common: {
    loading: "Loading…",
    noDescription: "No description.",
  },
  home: {
    heroTagline: "From GitHub candidates to verifiable DSH plugins — review format, compatibility, and security signals before installing.",
    searchPlaceholder: "Search plugins, capabilities, or developers…",
    search: "Search",
    browse: "Browse",
    statsFeatured: "featured plugins",
    statsVerified: "verified plugins",
    statsUpdated: "updated this week",
    statsTotal: "total plugins",
    lastScanLabel: "Last plugin task update",
    noScanYet: "No scan recorded",
    featured: "Featured",
    latest: "Latest",
    popular: "Trending",
    seeAll: "View all",
    emptyFeatured: "No featured plugins yet.",
    emptyVerified: "No verified plugins yet.",
    loadError: "Failed to load registry: {msg}",
    trustFormatTitle: "Format Verified",
    trustFormatDesc:
      "Whether the plugin structure follows the DSH plugin spec.",
    trustCompatTitle: "Compatibility",
    trustCompatDesc: "Compatibility with the current DSH / Cordis versions.",
    trustSecurityTitle: "Security Signals",
    trustSecurityDesc:
      "Static scan, install scripts, permissions, and dependency risks.",
    ctaButton: "Browse all plugins",
  },
  about: {
    title: "A trusted entry point for DeepSeek Harness plugins",
    intro:
      "DSH-PLUGIN MARKET is a community registry for the DeepSeek Harness ecosystem, helping users understand plugin structure, compatibility, maintenance, and security signals before installation.",
    featureFormatTitle: "Format validation",
    featureFormatText:
      "Checks repositories and manifests against the DSH plugin specification so discoverability and installability start from a known structure.",
    featureCompatTitle: "Compatibility analysis",
    featureCompatText:
      "Evaluates DSH, Cordis, and Node version ranges and presents actionable compatibility results.",
    featureSecurityTitle: "Security signals",
    featureSecurityText:
      "Scans install scripts, dependencies, and sensitive behavior. Verification is useful evidence, not an absolute safety guarantee.",
    featureTraceTitle: "Traceable installs",
    featureTraceText:
      "Keeps scan history and commit provenance so install commands can pin the exact revision that was inspected.",
    logoKicker: "The logo story",
    logoTitle: "A Kun swimming from the deep sea into AI",
    logoText:
      "DeepSeek evokes deep-sea exploration and a whale, while AI gives it intelligence. The whale becomes the mythical Kun in an eastern imagination; the sound of AI then connects with love, finally forming the playful and memorable iKun. The Kun logo carries both the deep-sea motif and the community's enthusiasm for AI creation and an open ecosystem.",
    logoEquationAria:
      "DeepSeek plus AI equals whale plus AI, equals AI plus Kun, equals love plus Kun, equals iKun",
    communityTitle: "Community-driven and open",
    communityText:
      "This is not an official DeepSeek product. Contributions are welcome on GitHub.",
    source: "View source code",
  },
  explore: {
    title: "Explore plugins",
    subtitle: "Browse, filter, and compare DSH plugins.",
    searchPlaceholder: "Search plugins…",
    featuredOnly: "Featured only",
    verifiedOnly: "Verified only",
	includeCandidates: "Include candidates",
    allCapabilities: "All capabilities",
    allTypes: "All types",
    anyCompatibility: "Any compatibility",
    anyRisk: "Any security risk",
    sortUpdated: "Recently updated",
    sortStars: "Most stars",
    sortNew: "Newest",
    sortTrending: "7-day star growth",
    loadMore: "Load more",
    resultCount: "Showing {count} plugins",
    empty: "No plugins found.",
    searchMinChars: "Enter at least 3 characters to search.",
	compareSelect: "Add to compare",
	compareSelected: "{count}/3 selected",
	compareGo: "Compare selected",
  },
  compare: {
		title: "Compare plugins",
		subtitle: "Review current scan signals side by side before choosing what to install.",
		needTwo: "Select at least two plugins from the market to compare them.",
		signal: "Signal",
		format: "Format",
		compatibility: "Compatibility",
		security: "Security scan",
		risk: "Security risk",
		maintenance: "Maintenance",
		capabilities: "Capabilities",
		types: "Types",
		stars: "GitHub stars",
		scannedCommit: "Scanned commit",
	},
	changes: {
		title: "Registry changes",
		subtitle: "Only meaningful scan-status changes are recorded here; this is not a full repository commit history.",
		empty: "New scans will add meaningful status changes here.",
	},
  submit: {
    title: "Submit a plugin",
    desc: "Paste a GitHub repository URL. We validate it, add it as a candidate, and enqueue a scan.",
    placeholder: "https://github.com/owner/repo",
    submit: "Submit",
    submitting: "Submitting…",
    queued: "Queued {owner}/{repo} for scanning.",
    eyebrow: "Open submission",
    step1Title: "Submit the repo",
    step1Desc: "Paste a GitHub URL and we add it to the candidate list right away.",
    step2Title: "Automatic scan",
    step2Desc: "Static analysis of format, compatibility, maintenance, and security — plugin code is never executed.",
    step3Title: "Install with confidence",
    step3Desc: "Results are pinned to a specific commit, so install commands reference the scanned revision.",
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
    baselineTitle: "Compatibility baseline",
    baselineCheckedAt: "Checked at",
    compatVerdicts: "Dependency compatibility",
    range: "Declared range",
    evidence: "Evidence",
    riskNote: "Security risk is derived only from SECURITY findings; format, compatibility, and maintenance findings are kept separate.",
    noBaseline: "No compatibility baseline recorded.",
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
    risk: "Security risk",
    copy: "Copy command",
    source: "View source",
    copied: "Copied",
    copyFailed: "Copy failed; copy manually",
    pinned: "Pinned to the scanned commit {sha}.",
    noCommit: "No scanned commit yet.",
  },
  riskLabel: "security risk {level}",
  card: {
    publisher: "by {owner}",
    updated: "updated {time}",
  },
  badge: {
    FORMAT_VERIFIED: "format verified",
    FEATURED: "featured",
    DETECTED: "detected",
    CANDIDATE: "not a plugin",
    NON_PLUGIN: "not a plugin",
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
  t: (
    key: string,
    params?: Record<string, string | number>,
    fallback?: string,
  ) => string;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within a LanguageProvider");
  return ctx;
}
