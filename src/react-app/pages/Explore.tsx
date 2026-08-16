import { useEffect, useState } from "react";
import { PluginCard } from "../components/PluginCard";
import { getCategories, listPlugins, type PluginListItem, type Sort } from "../lib/api";

const COMPATIBILITY = ["COMPATIBLE", "LIKELY_COMPATIBLE", "OUTDATED", "INCOMPATIBLE", "UNKNOWN"];
const RISK = ["LOW", "MEDIUM", "HIGH", "CRITICAL", "UNKNOWN"];

export default function Explore() {
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
			<h1>Explore plugins</h1>
			<div className="controls">
				<input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search plugins…" />
				<label className="check">
					<input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} />
					Verified only
				</label>
				<select value={capability} onChange={(e) => setCapability(e.target.value)}>
					<option value="">All capabilities</option>
					{capabilities.map((c) => (
						<option key={c} value={c}>{c.replace(/_/g, " ")}</option>
					))}
				</select>
				<select value={pluginType} onChange={(e) => setPluginType(e.target.value)}>
					<option value="">All types</option>
					{pluginTypes.map((t) => (
						<option key={t} value={t}>{t.replace(/_/g, " ")}</option>
					))}
				</select>
				<select value={compatibility} onChange={(e) => setCompatibility(e.target.value)}>
					<option value="">Any compatibility</option>
					{COMPATIBILITY.map((c) => (
						<option key={c} value={c}>{c.replace(/_/g, " ")}</option>
					))}
				</select>
				<select value={risk} onChange={(e) => setRisk(e.target.value)}>
					<option value="">Any risk</option>
					{RISK.map((r) => (
						<option key={r} value={r}>{r}</option>
					))}
				</select>
				<select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
					<option value="updated">Recently updated</option>
					<option value="stars">Most stars</option>
					<option value="new">Newest</option>
					<option value="trending">Trending</option>
				</select>
			</div>
			{loading ? (
				<p className="empty">Loading…</p>
			) : items.length === 0 ? (
				<p className="empty">No plugins found.</p>
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
