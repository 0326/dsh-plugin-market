import { useEffect, useState } from "react";
import { PluginCard } from "../components/PluginCard";
import { useI18n } from "../lib/i18n";
import { getStats, listPlugins, type PluginListItem, type RegistryStats } from "../lib/api";

interface HomeData {
	stats: RegistryStats;
	featured: PluginListItem[];
	newVerified: PluginListItem[];
	popular: PluginListItem[];
}

export default function Home() {
	const { t } = useI18n();
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

	if (error) return <p className="error">{t("home.loadError", { msg: error })}</p>;
	if (!data) return <p className="empty">{t("common.loading")}</p>;

	return (
		<section>
			<div className="hero">
				<h1>{t("home.heroTitle")}</h1>
				<p>{t("home.heroSubtitle")}</p>
				<div className="hero-stats">
					<div><strong>{data.stats.totalCandidates}</strong><span>{t("home.statsCandidates")}</span></div>
					<div><strong>{data.stats.verified}</strong><span>{t("home.statsVerified")}</span></div>
					<div><strong>{data.stats.updatedThisWeek}</strong><span>{t("home.statsUpdated")}</span></div>
				</div>
			</div>
			<Section title={t("home.featured")} items={data.featured} empty={t("home.emptyFeatured")} />
			<Section title={t("home.newVerified")} items={data.newVerified} empty={t("home.emptyVerified")} />
			<Section title={t("home.popular")} items={data.popular} empty={t("home.emptyVerified")} />
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
