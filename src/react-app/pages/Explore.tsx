import { useEffect, useState } from "react";
import { PluginCard } from "../components/PluginCard";
import { useI18n } from "../lib/i18n";
import { getCategories, listPlugins, type PluginListItem, type Sort } from "../lib/api";

const COMPATIBILITY = ["COMPATIBLE", "LIKELY_COMPATIBLE", "OUTDATED", "INCOMPATIBLE", "UNKNOWN"];
const RISK = ["LOW", "MEDIUM", "HIGH", "CRITICAL", "UNKNOWN"];

export default function Explore() {
	const { t } = useI18n();
	const [items, setItems] = useState<PluginListItem[] | null>(null);
	const [q, setQ] = useState("");
	const [verifiedOnly, setVerifiedOnly] = useState(false);
	const [capability, setCapability] = useState("");
	const [pluginType, setPluginType] = useState("");
	const [compatibility, setCompatibility] = useState("");
	const [risk, setRisk] = useState("");
	const [sort, setSort] = useState<Sort>("updated");
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
	}, [q, verifiedOnly, capability, pluginType, compatibility, risk, sort]);

	const loading = items === null;

	return (
		<section>
			<h1>{t("explore.title")}</h1>
			<div className="controls">
				<input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("explore.searchPlaceholder")} />
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
