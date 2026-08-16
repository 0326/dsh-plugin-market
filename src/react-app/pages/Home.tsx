import { useEffect, useState } from "react";
import { PluginCard } from "../components/PluginCard";
import { listPlugins, type PluginListItem } from "../lib/api";

export default function Home() {
	const [items, setItems] = useState<PluginListItem[]>([]);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let ignore = false;
		listPlugins({ limit: 50 })
			.then((res) => {
				if (!ignore) setItems(res.items);
			})
			.catch((err) => {
				if (!ignore) setError(err instanceof Error ? err.message : String(err));
			});
		return () => {
			ignore = true;
		};
	}, []);

	const verified = items.filter((p) => p.verificationStatus === "FORMAT_VERIFIED");

	return (
		<section>
			<div className="hero">
				<h1>Discover. Verify. Install with confidence.</h1>
				<p>A trusted plugin registry, discovery, and installation experience for the DeepSeek Harness ecosystem.</p>
				<div className="hero-stats">
					<div><strong>{items.length}</strong><span>candidates</span></div>
					<div><strong>{verified.length}</strong><span>format-verified</span></div>
				</div>
			</div>
			{error && <p className="error">Failed to load registry: {error}</p>}
			<h2>Format-verified plugins</h2>
			{verified.length === 0 ? (
				<p className="empty">No verified plugins yet — run discovery to populate the registry.</p>
			) : (
				<div className="plugin-grid">
					{verified.slice(0, 12).map((p) => (
						<PluginCard key={p.fullName} p={p} />
					))}
				</div>
			)}
		</section>
	);
}
