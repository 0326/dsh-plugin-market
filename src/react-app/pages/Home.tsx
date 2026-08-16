import { useEffect, useState } from "react";
import { PluginCard } from "../components/PluginCard";
import { getStats, listPlugins, type PluginListItem, type RegistryStats } from "../lib/api";

interface HomeData {
	stats: RegistryStats;
	featured: PluginListItem[];
	newVerified: PluginListItem[];
	popular: PluginListItem[];
}

export default function Home() {
	const [data, setData] = useState<HomeData | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let ignore = false;
		Promise.all([
			getStats(),
			listPlugins({ featured: true, limit: 12 }),
			listPlugins({ verified: true, sort: "new", limit: 12 }),
			listPlugins({ verified: true, sort: "stars", limit: 12 }),
		])
			.then(([stats, featured, newVerified, popular]) => {
				if (!ignore) setData({ stats, featured: featured.items, newVerified: newVerified.items, popular: popular.items });
			})
			.catch((err) => {
				if (!ignore) setError(err instanceof Error ? err.message : String(err));
			});
		return () => {
			ignore = true;
		};
	}, []);

	if (error) return <p className="error">Failed to load registry: {error}</p>;
	if (!data) return <p className="empty">Loading…</p>;

	return (
		<section>
			<div className="hero">
				<h1>Discover. Verify. Install with confidence.</h1>
				<p>A trusted plugin registry, discovery, and installation experience for the DeepSeek Harness ecosystem.</p>
				<div className="hero-stats">
					<div><strong>{data.stats.totalCandidates}</strong><span>candidates</span></div>
					<div><strong>{data.stats.verified}</strong><span>format-verified</span></div>
					<div><strong>{data.stats.updatedThisWeek}</strong><span>updated this week</span></div>
				</div>
			</div>
			<Section title="Featured" items={data.featured} empty="No featured plugins yet." />
			<Section title="New & Verified" items={data.newVerified} empty="No verified plugins yet." />
			<Section title="Popular" items={data.popular} empty="No verified plugins yet." />
		</section>
	);
}

function Section({ title, items, empty }: { title: string; items: PluginListItem[]; empty: string }) {
	return (
		<>
			<h2>{title}</h2>
			{items.length === 0 ? (
				<p className="empty">{empty}</p>
			) : (
				<div className="plugin-grid">
					{items.map((p) => (
						<PluginCard key={p.fullName} p={p} />
					))}
				</div>
			)}
		</>
	);
}
