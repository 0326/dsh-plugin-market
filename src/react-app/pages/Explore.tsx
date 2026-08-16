import { useEffect, useMemo, useState } from "react";
import { PluginCard } from "../components/PluginCard";
import { useI18n } from "../lib/i18n";
import { getCategories, listPlugins, type PluginListItem, type Sort } from "../lib/api";

const COMPATIBILITY = ["COMPATIBLE", "LIKELY_COMPATIBLE", "OUTDATED", "INCOMPATIBLE", "UNKNOWN"];
const RISK = ["LOW", "MEDIUM", "HIGH", "CRITICAL", "UNKNOWN"];

export default function Explore({ query = "" }: { query?: string }) {
	const { t } = useI18n();
	const params = useMemo(() => new URLSearchParams(query), [query]);
	// State is initialized from the URL query once; App remounts this page
	// (key={query}) whenever the hash query changes, so no effect-sync needed.
	const [items, setItems] = useState<PluginListItem[] | null>(null);
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
				if (!ignore) setItems(res.items);
			})
			.catch(() => {
				if (!ignore) setItems([]);
			});
		return () => {
			ignore = true;
		};
	}, [q, featuredOnly, verifiedOnly, capability, pluginType, compatibility, risk, sort]);

	const loading = items === null;

	return (
		<section>
			<h1 className="page-title">{t("explore.title")}</h1>
			<p className="page-subtitle">{t("explore.subtitle")}</p>
			<div className="controls">
				<input
					className="search-input"
					value={q}
					onChange={(e) => setQ(e.target.value)}
					placeholder={t("explore.searchPlaceholder")}
					aria-label={t("explore.searchPlaceholder")}
				/>
				<label className="check">
					<input type="checkbox" checked={featuredOnly} onChange={(e) => setFeaturedOnly(e.target.checked)} />
					{t("explore.featuredOnly")}
				</label>
				<label className="check">
					<input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} />
					{t("explore.verifiedOnly")}
				</label>
				<select value={capability} onChange={(e) => setCapability(e.target.value)}>
					<option value="">{t("explore.allCapabilities")}</option>
					{capabilities.map((c) => (
						<option key={c} value={c}>{c.replace(/_/g, " ")}</option>
					))}
				</select>
				<select value={pluginType} onChange={(e) => setPluginType(e.target.value)}>
					<option value="">{t("explore.allTypes")}</option>
					{pluginTypes.map((pt) => (
						<option key={pt} value={pt}>{pt.replace(/_/g, " ")}</option>
					))}
				</select>
				<select value={compatibility} onChange={(e) => setCompatibility(e.target.value)}>
					<option value="">{t("explore.anyCompatibility")}</option>
					{COMPATIBILITY.map((c) => (
						<option key={c} value={c}>{c.replace(/_/g, " ")}</option>
					))}
				</select>
				<select value={risk} onChange={(e) => setRisk(e.target.value)}>
					<option value="">{t("explore.anyRisk")}</option>
					{RISK.map((r) => (
						<option key={r} value={r}>{r}</option>
					))}
				</select>
				<select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
					<option value="updated">{t("explore.sortUpdated")}</option>
					<option value="stars">{t("explore.sortStars")}</option>
					<option value="new">{t("explore.sortNew")}</option>
					<option value="trending">{t("explore.sortTrending")}</option>
				</select>
			</div>
			{loading ? (
				<p className="empty">{t("common.loading")}</p>
			) : items.length === 0 ? (
				<p className="empty">{t("explore.empty")}</p>
			) : (
				<div className="plugin-grid">
					{items.map((p) => (
						<PluginCard key={p.fullName} p={p} />
					))}
				</div>
			)}
		</section>
	);
}
