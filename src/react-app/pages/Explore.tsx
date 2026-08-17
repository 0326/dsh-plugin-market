import { useEffect, useMemo, useState } from "react";
import { Icon } from "../components/Icon";
import { PluginCard } from "../components/PluginCard";
import { PluginGridSkeleton } from "../components/Skeletons";
import { useI18n, type Language } from "../lib/i18n";
import { getCategories, listPlugins, type PluginListItem, type Sort } from "../lib/api";
import "../explore.css";

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
	NON_PLUGIN: { zh: "非插件", en: "Not a plugin" },
	UNKNOWN: { zh: "未知", en: "Unknown" },
};

function taxonomyLabel(value: string, lang: Language, labels: Record<string, Record<Language, string>>): string {
	return labels[value]?.[lang] ?? value.replace(/_/g, " ").toLowerCase();
}

function splitFilterParam(raw: string | null): string[] {
	if (!raw) return [];
	return [...new Set(raw.split(",").map((value) => value.trim()).filter(Boolean))];
}

interface FacetTreeProps {
	title: string;
	items: string[];
	selected: string[];
	getLabel: (value: string) => string;
	onToggle: (value: string) => void;
	onClear: () => void;
}

function FacetTree({ title, items, selected, getLabel, onToggle, onClear }: FacetTreeProps) {
	return (
		<section className="explore-facet-group" aria-label={title}>
			<label className="explore-facet-parent">
				<input
					type="checkbox"
					className="checkbox checkbox-xs"
					checked={selected.length === 0}
					onChange={onClear}
				/>
				<span>{title}</span>
				{selected.length > 0 && <span className="explore-facet-count">{selected.length}</span>}
			</label>
			<div className="explore-facet-children" role="group" aria-label={title}>
				{items.map((item) => (
					<label key={item} className="explore-facet-option">
						<input
							type="checkbox"
							className="checkbox checkbox-xs"
							checked={selected.includes(item)}
							onChange={() => onToggle(item)}
						/>
						<span>{getLabel(item)}</span>
					</label>
				))}
			</div>
		</section>
	);
}

export default function Explore({ query = "" }: { query?: string }) {
	const { t, lang } = useI18n();
	const params = useMemo(() => new URLSearchParams(query), [query]);
	const [result, setResult] = useState<{ key: string; items: PluginListItem[] } | null>(null);
	const [q, setQ] = useState(params.get("q") ?? "");
	const [featuredOnly, setFeaturedOnly] = useState(params.get("featured") === "1");
	const [verifiedOnly, setVerifiedOnly] = useState(params.get("verified") === "1");
	const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>(() => splitFilterParam(params.get("capability")));
	const [selectedPluginTypes, setSelectedPluginTypes] = useState<string[]>(() => splitFilterParam(params.get("pluginType")));
	const [compatibility, setCompatibility] = useState(params.get("compatibility") ?? "");
	const [risk, setRisk] = useState(params.get("risk") ?? "");
	const [sort, setSort] = useState<Sort>((params.get("sort") as Sort) ?? "updated");
	const [capabilities, setCapabilities] = useState<string[]>([]);
	const [pluginTypes, setPluginTypes] = useState<string[]>([]);
	const capabilityFilter = selectedCapabilities.join(",");
	const pluginTypeFilter = selectedPluginTypes.join(",");
	const requestKey = JSON.stringify({ q, featuredOnly, verifiedOnly, capabilityFilter, pluginTypeFilter, compatibility, risk, sort });
	const sidebarLabel = lang === "zh" ? "分类筛选" : "Category filters";

	useEffect(() => {
		let ignore = false;
		getCategories()
			.then((c) => {
				if (!ignore) {
					setCapabilities(c.capabilities);
					setPluginTypes(c.pluginTypes);
					setSelectedCapabilities((current) => current.filter((value) => c.capabilities.includes(value)));
					setSelectedPluginTypes((current) => current.filter((value) => c.pluginTypes.includes(value)));
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
				capability: capabilityFilter || undefined,
				pluginType: pluginTypeFilter || undefined,
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
	}, [q, featuredOnly, verifiedOnly, capabilityFilter, pluginTypeFilter, compatibility, risk, sort, requestKey]);

	function toggleCapability(value: string) {
		setSelectedCapabilities((current) =>
			current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
		);
	}

	function togglePluginType(value: string) {
		setSelectedPluginTypes((current) =>
			current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
		);
	}

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

			<div className="explore-market-layout">
				<aside className="explore-sidebar" aria-label={sidebarLabel}>
					<div className="explore-sidebar-kicker">{sidebarLabel}</div>
					<FacetTree
						title={t("explore.allCapabilities")}
						items={capabilities}
						selected={selectedCapabilities}
						getLabel={(value) => taxonomyLabel(value, lang, CAPABILITY_LABELS)}
						onToggle={toggleCapability}
						onClear={() => setSelectedCapabilities([])}
					/>
					<FacetTree
						title={t("explore.allTypes")}
						items={pluginTypes}
						selected={selectedPluginTypes}
						getLabel={(value) => taxonomyLabel(value, lang, PLUGIN_TYPE_LABELS)}
						onToggle={togglePluginType}
						onClear={() => setSelectedPluginTypes([])}
					/>
				</aside>

				<div className="explore-results">
					<div className="explore-filters-scroll mb-8">
						<div className="explore-filters">
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
						<div className="explore-results-grid">
							{items.map((p) => (
								<PluginCard key={p.fullName} p={p} />
							))}
						</div>
					)}
				</div>
			</div>
		</section>
	);
}
