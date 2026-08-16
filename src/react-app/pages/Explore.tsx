import { useEffect, useState } from "react";
import { PluginCard } from "../components/PluginCard";
import { listPlugins, type PluginListItem } from "../lib/api";

export default function Explore() {
	const [items, setItems] = useState<PluginListItem[] | null>(null);
	const [q, setQ] = useState("");
	const [verifiedOnly, setVerifiedOnly] = useState(false);
	const [sort, setSort] = useState<"updated" | "stars" | "new">("updated");

	useEffect(() => {
		let ignore = false;
		listPlugins({ q: q || undefined, verified: verifiedOnly, sort })
			.then((res) => {
				if (!ignore) setItems(res.items);
			})
			.catch(() => {
				if (!ignore) setItems([]);
			});
		return () => {
			ignore = true;
		};
	}, [q, verifiedOnly, sort]);

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
				<select value={sort} onChange={(e) => setSort(e.target.value as "updated" | "stars" | "new")}>
					<option value="updated">Recently updated</option>
					<option value="stars">Most stars</option>
					<option value="new">Newest</option>
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
