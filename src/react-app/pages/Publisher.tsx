import { useEffect, useState } from "react";
import { PluginCard } from "../components/PluginCard";
import { getPublisher, type Publisher } from "../lib/api";

export default function Publisher({ owner }: { owner: string }) {
	const [pub, setPub] = useState<Publisher | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let ignore = false;
		getPublisher(owner)
			.then((p) => {
				if (!ignore) setPub(p);
			})
			.catch((err) => {
				if (!ignore) setError(err instanceof Error ? err.message : String(err));
			});
		return () => {
			ignore = true;
		};
	}, [owner]);

	if (error) return <p className="error">Failed to load publisher: {error}</p>;
	if (!pub) return <p className="empty">Loading…</p>;

	return (
		<section>
			<h1>{pub.owner}</h1>
			<p className="plugin-desc">
				{pub.verifiedCount} verified · {pub.repos.length} plugins · ★ {pub.totalStars}
			</p>
			<div className="plugin-grid">
				{pub.repos.map((p) => (
					<PluginCard key={p.fullName} p={p} />
				))}
			</div>
		</section>
	);
}
