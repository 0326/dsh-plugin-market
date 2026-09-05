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
	counts?: Record<string, number>;
}

function FacetTree({ title, items, selected, getLabel, onToggle, onClear, counts }: FacetTreeProps) {
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
				{items.map((item) => {
					const checked = selected.includes(item);
					return (
						<label key={item} className={"explore-facet-option" + (checked ? " is-selected" : "")}>
							<input
								type="checkbox"
								className="checkbox checkbox-xs"
								checked={checked}
								onChange={() => onToggle(item)}
							/>
							<span>{getLabel(item)}{counts?.[item] !== undefined ? ` (${counts[item]})` : ""}</span>
						</label>
					);
				})}
			</div>
		</section>
	);
}

export default function Explore({ query = "" }: { query?: string }) {
	const { t, lang } = useI18n();
	const params = useMemo(() => new URLSearchParams(query), [query]);
	const [result, setResult] = useState<{ key: string; items: PluginListItem[]; total: number; hasMore: boolean } | null>(null);
	const [offset, setOffset] = useState(0);
	const [q, setQ] = useState(params.get("q") ?? "");
	const [featuredOnly, setFeaturedOnly] = useState(params.get("featured") === "1");
	const [verifiedOnly, setVerifiedOnly] = useState(params.get("verified") === "1");
	const [includeCandidates, setIncludeCandidates] = useState(params.get("candidates") === "1");
	const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>(() => splitFilterParam(params.get("capability")));
	const [selectedPluginTypes, setSelectedPluginTypes] = useState<string[]>(() => splitFilterParam(params.get("pluginType")));
	const [compatibility, setCompatibility] = useState(params.get("compatibility") ?? "");
	const [risk, setRisk] = useState(params.get("risk") ?? "");
	const [sort, setSort] = useState<Sort>((params.get("sort") as Sort) ?? "updated");
	const [capabilities, setCapabilities] = useState<string[]>([]);
	const [pluginTypes, setPluginTypes] = useState<string[]>([]);
	const [capabilityCounts, setCapabilityCounts] = useState<Record<string, number>>({});
	const [trendingAvailable, setTrendingAvailable] = useState(false);
	const [compareNames, setCompareNames] = useState<string[]>([]);
	const capabilityFilter = selectedCapabilities.join(",");
	const pluginTypeFilter = selectedPluginTypes.join(",");
	const effectiveSort = sort === "trending" && !trendingAvailable ? "updated" : sort;
	const queryTooShort = q.trim().length > 0 && q.trim().length < 3;
	const requestKey = JSON.stringify({ q, featuredOnly, verifiedOnly, includeCandidates, capabilityFilter, pluginTypeFilter, compatibility, risk, sort: effectiveSort, offset });
	const sidebarLabel = lang === "zh" ? "分类筛选" : "Category filters";

	useEffect(() => {
		let ignore = false;
		getCategories()
			.then((c) => {
				if (!ignore) {
					setCapabilities(c.capabilities);
					setPluginTypes(c.pluginTypes);
					setCapabilityCounts(c.capabilityCounts);
					setTrendingAvailable(c.trendingAvailable);
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
		if (queryTooShort) return () => { ignore = true; };
		const timer = window.setTimeout(() => {
			listPlugins({
				q: q || undefined,
				featured: featuredOnly,
				verified: verifiedOnly,
				installable: !includeCandidates,
				capability: capabilityFilter || undefined,
				pluginType: pluginTypeFilter || undefined,
				compatibility: compatibility || undefined,
				risk: risk || undefined,
				sort: effectiveSort,
				offset,
				includeTotal: false,
			})
			.then((res) => {
					if (!ignore) setResult((current) => ({ key: requestKey, items: offset ? [...(current?.items ?? []), ...res.items] : res.items, total: res.total, hasMore: res.hasMore }));
			})
			.catch(() => {
					if (!ignore) setResult({ key: requestKey, items: [], total: 0, hasMore: false });
				});
		}, q.trim() ? 400 : 150);
		return () => {
			ignore = true;
			window.clearTimeout(timer);
		};
	}, [q, featuredOnly, verifiedOnly, includeCandidates, capabilityFilter, pluginTypeFilter, compatibility, risk, effectiveSort, offset, requestKey, queryTooShort]);

	function toggleCapability(value: string) {
		setOffset(0);
		setSelectedCapabilities((current) =>
			current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
		);
	}

	function togglePluginType(value: string) {
		setOffset(0);
		setSelectedPluginTypes((current) =>
			current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
		);
	}

	function toggleCompare(fullName: string) {
		setCompareNames((current) => {
			if (current.includes(fullName)) return current.filter((value) => value !== fullName);
			return current.length >= 3 ? current : [...current, fullName];
		});
	}

	const loading = !queryTooShort && result?.key !== requestKey;
	const items = queryTooShort ? [] : result?.items ?? [];
	const changeFilter = <T,>(setter: (value: T) => void, value: T) => { setOffset(0); setter(value); };

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
						onChange={(e) => changeFilter(setQ, e.target.value)}
						placeholder={t("explore.searchPlaceholder")}
						aria-label={t("explore.searchPlaceholder")}
					/>
				</label>
			</div>
			<p className="mb-4 text-sm"><a className="link opacity-70" href="/changes">{lang === "zh" ? "查看注册表更新" : "View registry changes"}</a></p>

			<div className="explore-market-filters explore-filters-scroll mb-8">
				<div className="explore-filters">
					<select aria-label={t("explore.anyCompatibility")} className="select select-sm" value={compatibility} onChange={(e) => changeFilter(setCompatibility, e.target.value)}>
						<option value="">{t("explore.anyCompatibility")}</option>
						{COMPATIBILITY.map((c) => (
							<option key={c} value={c}>{t("badge." + c)}</option>
						))}
					</select>
					<select aria-label={t("explore.anyRisk")} className="select select-sm" value={risk} onChange={(e) => changeFilter(setRisk, e.target.value)}>
						<option value="">{t("explore.anyRisk")}</option>
						{RISK.map((r) => (
							<option key={r} value={r}>{t("badge." + r)}</option>
						))}
					</select>
					<select aria-label={t("explore.sortUpdated")} className="select select-sm" value={sort} onChange={(e) => changeFilter(setSort, e.target.value as Sort)}>
						<option value="updated">{t("explore.sortUpdated")}</option>
						<option value="stars">{t("explore.sortStars")}</option>
						<option value="new">{t("explore.sortNew")}</option>
						{trendingAvailable && <option value="trending">{t("explore.sortTrending")}</option>}
					</select>
					<div className="explore-checks">
						<label className="label cursor-pointer gap-2">
							<input type="checkbox" className="checkbox checkbox-sm" checked={featuredOnly} onChange={(e) => changeFilter(setFeaturedOnly, e.target.checked)} />
							<span>{t("explore.featuredOnly")}</span>
						</label>
						<label className="label cursor-pointer gap-2">
							<input type="checkbox" className="checkbox checkbox-sm" checked={verifiedOnly} onChange={(e) => changeFilter(setVerifiedOnly, e.target.checked)} />
							<span>{t("explore.verifiedOnly")}</span>
						</label>
						<label className="label cursor-pointer gap-2">
							<input type="checkbox" className="checkbox checkbox-sm" checked={includeCandidates} onChange={(e) => changeFilter(setIncludeCandidates, e.target.checked)} />
							<span>{t("explore.includeCandidates")}</span>
						</label>
					</div>
				</div>
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
						onClear={() => { setOffset(0); setSelectedCapabilities([]); }}
						counts={capabilityCounts}
					/>
					<FacetTree
						title={t("explore.allTypes")}
						items={pluginTypes}
						selected={selectedPluginTypes}
						getLabel={(value) => taxonomyLabel(value, lang, PLUGIN_TYPE_LABELS)}
						onToggle={togglePluginType}
						onClear={() => { setOffset(0); setSelectedPluginTypes([]); }}
					/>
				</aside>

				<div className="explore-results">
					{compareNames.length > 0 && (
						<div className="mb-4 flex flex-wrap items-center justify-between gap-3 border border-base-300 bg-base-200 px-3 py-2 text-sm">
							<span>{t("explore.compareSelected", { count: compareNames.length })}</span>
							{compareNames.length >= 2 && <a className="btn btn-sm btn-neutral" href={`/compare?plugins=${encodeURIComponent(compareNames.join(","))}`}>{t("explore.compareGo")}</a>}
						</div>
					)}
					{loading ? (
						<PluginGridSkeleton />
					) : queryTooShort ? (
						<p className="text-base-content/60">{t("explore.searchMinChars")}</p>
					) : items.length === 0 ? (
						<p className="text-base-content/60">{t("explore.empty")}</p>
					) : (
						<>
						<p className="mb-3 text-sm opacity-60">{t("explore.resultCount", { count: items.length })}</p>
						<div className="explore-results-grid">
							{items.map((p) => (
								<div key={p.fullName} className="relative">
									<PluginCard p={p} />
									<label className="absolute bottom-2 right-2 flex cursor-pointer items-center gap-1 bg-base-100/95 px-2 py-1 text-xs shadow-sm">
										<input type="checkbox" className="checkbox checkbox-xs" checked={compareNames.includes(p.fullName)} disabled={!compareNames.includes(p.fullName) && compareNames.length >= 3} onChange={() => toggleCompare(p.fullName)} />
										<span>{t("explore.compareSelect")}</span>
									</label>
								</div>
							))}
						</div>
						{result?.hasMore && <button type="button" className="btn btn-outline mx-auto mt-6 block" onClick={() => setOffset((value) => value + 50)}>{t("explore.loadMore")}</button>}
						</>
					)}
				</div>
			</div>
		</section>
	);
}
