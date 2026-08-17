import { useEffect, useMemo, useState } from "react";
import { Icon } from "../components/Icon";
import { PluginCard } from "../components/PluginCard";
import { PluginGridSkeleton } from "../components/Skeletons";
import { useI18n, type Language } from "../lib/i18n";
import { getCategories, listPlugins, type PluginListItem, type Sort } from "../lib/api";

const COMPATIBILITY = ["COMPATIBLE", "LIKELY_COMPATIBLE", "OUTDATED", "INCOMPATIBLE", "UNKNOWN"];
const RISK = ["LOW", "MEDIUM", "HIGH", "CRITICAL", "UNKNOWN"];

const CAPABILITY_LABELS: Record<string, Record<Language, string>> = {
	DEVELOPMENT: { zh: "开发", en: "Development" },
	GIT_GITHUB: { zh: "Git / GitHub", en: "Git / GitHub" },
	BROWSER_WEB: { zh: "浏览器 / Web", en: "Browser / Web" },
	DESIGN: { zh: "设计", en: "Design" },
	VISION: { zh: "视觉", en: "Vision" },
	SEARCH: { zh: "搜索", en: "Search" },
	MEMORY: { zh: "记忆", en: "Memory" },
	MCP_INTEGRATION: { zh: "MCP 集成", en: "MCP integration" },
	AUTOMATION: { zh: "自动化", en: "Automation" },
	DATA: { zh: "数据", en: "Data" },
	PRODUCTIVITY: { zh: "效率工具", en: "Productivity" },
	COMMUNICATION: { zh: "通信", en: "Communication" },
	UI_THEMES: { zh: "UI 主题", en: "UI themes" },
	AGENT_WORKFLOW: { zh: "Agent 工作流", en: "Agent workflow" },
	SECURITY: { zh: "安全", en: "Security" },
};

const PLUGIN_TYPE_LABELS: Record<string, Record<Language, string>> = {
	TOOL: { zh: "工具", en: "Tool" },
	SERVICE: { zh: "服务", en: "Service" },
	SURFACE: { zh: "交互界面", en: "Surface" },
	CLIENT_UI: { zh: "客户端 UI", en: "Client UI" },
	AGENT: { zh: "智能体", en: "Agent" },
	WORKFLOW: { zh: "工作流", en: "Workflow" },
	INTEGRATION: { zh: "集成", en: "Integration" },
	THEME: { zh: "主题", en: "Theme" },
	BUNDLE: { zh: "插件包", en: "Bundle" },
	UNKNOWN: { zh: "未知", en: "Unknown" },
};

function taxonomyLabel(value: string, lang: Language, labels: Record<string, Record<Language, string>>): string {
	return labels[value]?.[lang] ?? value.replace(/_/g, " ").toLowerCase();
}

export default function Explore({ query = "" }: { query?: string }) {
	const { t, lang } = useI18n();
	const params = useMemo(() => new URLSearchParams(query), [query]);
	const [result, setResult] = useState<{ key: string; items: PluginListItem[] } | null>(null);
	const [q, setQ] = useState(params.get("q") ?? "");
	const [featuredOnly, setFeaturedOnly] = useState(params.get("featured") === "1");
	const [verifiedOnly, setVerifiedOnly] = useState(params.get("verified") === "1");
	const [capability, setCapability] = useState(params.get("capability") ?? "");
	const [pluginType, setPluginType] = useState(params.get("pluginType") ?? "");
	const [compatibility, setCompatibility] = useState(params.get("compatibility") ?? "");
	const [risk, setRisk] = useState(params.get("risk") ?? "");
	const [sort, setSort] = useState<Sort>((params.get("sort") as Sort) ?? "updated");
	const [capabilities, setCapabilities] = useState<string[]>([]);
	const [pluginTypes, setPluginTypes] = useState<string[]>([]);
	const requestKey = JSON.stringify({ q, featuredOnly, verifiedOnly, capability, pluginType, compatibility, risk, sort });

	useEffect(() => {
		let ignore = false;
		getCategories()
			.then((c) => {
				if (!ignore) {
					setCapabilities(c.capabilities);
					setPluginTypes(c.pluginTypes);
				}
			})
			.catch(() => undefined);
		return () => {
			ignore = true;
		};
	}, []);

	useEffect(() => {
		let ignore = false;
		const timer = window.setTimeout(() => {
			listPlugins({
				q: q || undefined,
				featured: featuredOnly,
				verified: verifiedOnly,
				capability: capability || undefined,
				pluginType: pluginType || undefined,
				compatibility: compatibility || undefined,
				risk: risk || undefined,
				sort,
			})
				.then((res) => {
					if (!ignore) setResult({ key: requestKey, items: res.items });
				})
				.catch(() => {
					if (!ignore) setResult({ key: requestKey, items: [] });
				});
		}, 250);
			return () => {
				ignore = true;
				window.clearTimeout(timer);
			};
	}, [q, featuredOnly, verifiedOnly, capability, pluginType, compatibility, risk, sort, requestKey]);

	const loading = result?.key !== requestKey;
	const items = result?.items ?? [];

	return (
		<section>
			<div className="explore-head">
				<div className="explore-heading-copy">
					<h1 className="text-3xl font-extrabold tracking-tight">{t("explore.title")}</h1>
					<p className="opacity-60">{t("explore.subtitle")}</p>
				</div>
				<label className="explore-search input flex items-center gap-2">
					<Icon name="search" size={16} stroke={2} className="opacity-50" />
					<input
						className="grow border-0 bg-transparent outline-none"
						value={q}
						onChange={(e) => setQ(e.target.value)}
						placeholder={t("explore.searchPlaceholder")}
						aria-label={t("explore.searchPlaceholder")}
					/>
				</label>
			</div>

			<div className="explore-filters-scroll mb-8">
			<div className="explore-filters">
				<select aria-label={t("explore.allCapabilities")} className="select select-sm" value={capability} onChange={(e) => setCapability(e.target.value)}>
					<option value="">{t("explore.allCapabilities")}</option>
					{capabilities.map((c) => (
						<option key={c} value={c}>{taxonomyLabel(c, lang, CAPABILITY_LABELS)}</option>
					))}
				</select>
				<select aria-label={t("explore.allTypes")} className="select select-sm" value={pluginType} onChange={(e) => setPluginType(e.target.value)}>
					<option value="">{t("explore.allTypes")}</option>
					{pluginTypes.map((pt) => (
						<option key={pt} value={pt}>{taxonomyLabel(pt, lang, PLUGIN_TYPE_LABELS)}</option>
					))}
				</select>
				<select aria-label={t("explore.anyCompatibility")} className="select select-sm" value={compatibility} onChange={(e) => setCompatibility(e.target.value)}>
					<option value="">{t("explore.anyCompatibility")}</option>
					{COMPATIBILITY.map((c) => (
						<option key={c} value={c}>{t("badge." + c)}</option>
					))}
				</select>
				<select aria-label={t("explore.anyRisk")} className="select select-sm" value={risk} onChange={(e) => setRisk(e.target.value)}>
					<option value="">{t("explore.anyRisk")}</option>
					{RISK.map((r) => (
						<option key={r} value={r}>{t("badge." + r)}</option>
					))}
				</select>
				<select aria-label={t("explore.sortUpdated")} className="select select-sm" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
					<option value="updated">{t("explore.sortUpdated")}</option>
					<option value="stars">{t("explore.sortStars")}</option>
					<option value="new">{t("explore.sortNew")}</option>
					<option value="trending">{t("explore.sortTrending")}</option>
				</select>
				<div className="explore-checks">
					<label className="label cursor-pointer gap-2">
						<input type="checkbox" className="checkbox checkbox-sm" checked={featuredOnly} onChange={(e) => setFeaturedOnly(e.target.checked)} />
						<span>{t("explore.featuredOnly")}</span>
					</label>
					<label className="label cursor-pointer gap-2">
						<input type="checkbox" className="checkbox checkbox-sm" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} />
						<span>{t("explore.verifiedOnly")}</span>
					</label>
				</div>
			</div>
			</div>

			{loading ? (
				<PluginGridSkeleton />
			) : items.length === 0 ? (
				<p className="text-base-content/60">{t("explore.empty")}</p>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{items.map((p) => (
						<PluginCard key={p.fullName} p={p} />
					))}
				</div>
			)}
		</section>
	);
}
