import { useEffect, useState } from "react";
import { Kun } from "../components/Kun";
import { PluginCard } from "../components/PluginCard";
import { useI18n } from "../lib/i18n";
import { getCategories, getStats, listPlugins, type PluginListItem, type RegistryStats } from "../lib/api";

interface HomeData {
	stats: RegistryStats;
	featured: PluginListItem[];
	latest: PluginListItem[];
	popular: PluginListItem[];
	capabilities: string[];
}

export default function Home() {
	const { t } = useI18n();
	const [data, setData] = useState<HomeData | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [query, setQuery] = useState("");

	useEffect(() => {
		let ignore = false;
		Promise.all([
			getStats(),
			listPlugins({ featured: true, limit: 3 }),
			listPlugins({ verified: true, sort: "new", limit: 6 }),
			listPlugins({ verified: true, sort: "stars", limit: 6 }),
			getCategories(),
		])
			.then(([stats, featured, latest, popular, cats]) => {
				if (!ignore) {
					setData({ stats, featured: featured.items, latest: latest.items, popular: popular.items, capabilities: cats.capabilities });
				}
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

	function onSearch(e: React.FormEvent) {
		e.preventDefault();
		window.location.hash = "#/plugins?q=" + encodeURIComponent(query);
	}

	return (
		<section>
			{/* Hero: one big idea — brand statement + search + Kun */}
			<div className="hero">
				<div className="hero-copy">
					<p className="hero-eyebrow">ds-plugin.market</p>
					<h1 className="hero-title">
						DSH
						<br />
						PLUGIN MARKET
					</h1>
					<p className="hero-tagline">{t("home.heroTagline")}</p>
					<form className="hero-search" onSubmit={onSearch} role="search">
						<input
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder={t("home.searchPlaceholder")}
							aria-label={t("home.searchPlaceholder")}
						/>
						<button type="submit">{t("home.search")}</button>
					</form>
					<div className="hero-stats">
						<div className="hero-stat">
							<strong>{data.stats.featured}</strong>
							<span>{t("home.statsFeatured")}</span>
						</div>
						<div className="hero-stat">
							<strong>{data.stats.verified}</strong>
							<span>{t("home.statsVerified")}</span>
						</div>
						<div className="hero-stat">
							<strong>{data.stats.updatedThisWeek}</strong>
							<span>{t("home.statsUpdated")}</span>
						</div>
					</div>
				</div>
				<div className="hero-art">
					<Kun className="kun-hero" />
				</div>
			</div>

			{/* Explore navigation */}
			<nav className="browse-nav" aria-label={t("home.browse")}>
				<span className="browse-label">{t("home.browse")}</span>
				<a className="nav-chip nav-chip-yellow" href="#/plugins?featured=1">
					{t("home.featured")}
				</a>
				<a className="nav-chip" href="#/plugins?sort=new">
					{t("home.latest")}
				</a>
				<a className="nav-chip" href="#/plugins?sort=stars">
					{t("home.popular")}
				</a>
				{data.capabilities.slice(0, 6).map((c) => (
					<a key={c} className="nav-chip" href={"#/plugins?capability=" + encodeURIComponent(c)}>
						{c.replace(/_/g, " ")}
					</a>
				))}
			</nav>

			{/* Featured plugins — editorial asymmetric grid, black cards */}
			<div className="home-section">
				<div className="section-head">
					<h2 className="section-title">{t("home.featured")}</h2>
					<a className="section-link" href="#/plugins?featured=1">
						{t("home.seeAll")} →
					</a>
				</div>
				{data.featured.length === 0 ? (
					<p className="empty">{t("home.emptyFeatured")}</p>
				) : (
					<div className="featured-grid">
						<PluginCard key={data.featured[0].fullName} p={data.featured[0]} featured large />
						{data.featured.slice(1, 3).map((p) => (
							<PluginCard key={p.fullName} p={p} featured />
						))}
					</div>
				)}
			</div>

			{/* Latest */}
			<div className="home-section">
				<div className="section-head">
					<h2 className="section-title">{t("home.latest")}</h2>
					<a className="section-link" href="#/plugins?sort=new">
						{t("home.seeAll")} →
					</a>
				</div>
				{data.latest.length === 0 ? (
					<p className="empty">{t("home.emptyVerified")}</p>
				) : (
					<div className="plugin-grid">
						{data.latest.map((p) => (
							<PluginCard key={p.fullName} p={p} />
						))}
					</div>
				)}
			</div>

			{/* Popular */}
			<div className="home-section">
				<div className="section-head">
					<h2 className="section-title">{t("home.popular")}</h2>
					<a className="section-link" href="#/plugins?sort=stars">
						{t("home.seeAll")} →
					</a>
				</div>
				{data.popular.length === 0 ? (
					<p className="empty">{t("home.emptyVerified")}</p>
				) : (
					<div className="plugin-grid">
						{data.popular.map((p) => (
							<PluginCard key={p.fullName} p={p} />
						))}
					</div>
				)}
			</div>

			{/* Trust strip */}
			<div className="home-section">
				<div className="trust-strip">
					<div className="trust-item">
						<span className="trust-icon tone-ok" aria-hidden="true">✓</span>
						<h3>{t("home.trustFormatTitle")}</h3>
						<p>{t("home.trustFormatDesc")}</p>
					</div>
					<div className="trust-item">
						<span className="trust-icon tone-info" aria-hidden="true">⇄</span>
						<h3>{t("home.trustCompatTitle")}</h3>
						<p>{t("home.trustCompatDesc")}</p>
					</div>
					<div className="trust-item">
						<span className="trust-icon tone-bad" aria-hidden="true">!</span>
						<h3>{t("home.trustSecurityTitle")}</h3>
						<p>{t("home.trustSecurityDesc")}</p>
					</div>
				</div>
			</div>

			{/* Developer CTA */}
			<div className="dev-cta">
				<div className="dev-cta-inner">
					<div>
						<h2>{t("home.ctaTitle")}</h2>
						<p>{t("home.ctaText")}</p>
					</div>
					<a className="btn btn-primary" href="#/plugins">
						{t("home.ctaButton")}
					</a>
				</div>
			</div>
		</section>
	);
}
