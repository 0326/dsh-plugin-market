import { useEffect, useState, type ReactNode } from "react";
import { Icon, type IconName } from "../components/Icon";
import { Kun } from "../components/Kun";
import { PluginCard } from "../components/PluginCard";
import { useI18n } from "../lib/i18n";
import { navigate } from "../lib/router";
import { getCategories, getStats, listPlugins, type PluginListItem, type RegistryStats } from "../lib/api";

interface HomeData {
	stats: RegistryStats;
	featured: PluginListItem[];
	latest: PluginListItem[];
	popular: PluginListItem[];
	capabilities: string[];
}

function Section({
	title,
	seeAll,
	href,
	empty,
	isEmpty,
	children,
}: {
	title: string;
	seeAll: string;
	href: string;
	empty: string;
	isEmpty: boolean;
	children: ReactNode;
}) {
	return (
		<section className={isEmpty ? "home-section home-section-empty" : "home-section"}>
			<div className="section-heading">
				<h2>{title}</h2>
				<a className="link" href={href}>
					{seeAll} →
				</a>
			</div>
			{isEmpty ? <p className="text-base-content/60">{empty}</p> : children}
		</section>
	);
}

function TrustCard({ icon, tone, title, desc }: { icon: IconName; tone: string; title: string; desc: string }) {
	return (
		<div className="flex items-start gap-3">
			<span className={"mt-0.5 grid h-10 w-10 shrink-0 place-items-center border-2 border-current " + tone}>
				<Icon name={icon} size={20} stroke={2} />
			</span>
			<div><h3 className="font-bold">{title}</h3><p className="mt-1 text-sm opacity-70">{desc}</p></div>
		</div>
	);
}

export default function Home() {
	const { t, lang } = useI18n();
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

	if (error) return <p className="text-error">{t("home.loadError", { msg: error })}</p>;
	if (!data) return <p className="text-base-content/60">{t("common.loading")}</p>;
	const lastScanTime = data.stats.lastScanAt
		? new Intl.DateTimeFormat(lang === "zh" ? "zh-CN" : "en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(data.stats.lastScanAt))
		: t("home.noScanYet");

	function onSearch(e: React.FormEvent) {
		e.preventDefault();
		navigate("/plugins?q=" + encodeURIComponent(query));
	}

	return (
		<div>
			<section className="home-hero">
				<div className="hero-copy">
					<p className="hero-updated mb-5">
						{t("home.lastScanLabel")}：<time dateTime={data.stats.lastScanAt ?? undefined}>{lastScanTime}</time>
					</p>
					<h1 className="hero-title"><strong>DEEPSEEK HARNESS</strong><span>PLUGIN MARKET</span></h1>
					<p className="hero-tagline">{t("home.heroTagline")}</p>
					<form className="hero-search join w-full" onSubmit={onSearch} role="search">
							<input
								className="input join-item w-full"
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								placeholder={t("home.searchPlaceholder")}
								aria-label={t("home.searchPlaceholder")}
							/>
							<button type="submit" className="btn join-item btn-neutral">
								<Icon name="search" size={18} stroke={2} />
								{t("home.search")}
							</button>
						</form>
					<div className="hero-stats">
						<div className="hero-stat"><strong>{data.stats.total}</strong><span>{t("home.statsTotal")}</span></div>
						<div className="hero-stat"><strong>{data.stats.featured}</strong><span>{t("home.statsFeatured")}</span></div>
						<div className="hero-stat"><strong>{data.stats.verified}</strong><span>{t("home.statsVerified")}</span></div>
						<div className="hero-stat"><strong>{data.stats.updatedThisWeek}</strong><span>{t("home.statsUpdated")}</span></div>
						</div>
					</div>
				<div className="hero-art hidden lg:grid">
					<span className="hero-basketball" aria-hidden="true"><Icon name="ball-basketball" size={58} stroke={2.2} /></span>
					<span className="hero-music" aria-hidden="true">♪</span>
					<Kun className="w-full" ariaHidden />
				</div>
				</section>

			{/* Browse navigation */}
			<nav className="category-bar" aria-label={t("home.browse")}>
				<span className="mr-2 text-xs font-bold uppercase tracking-widest opacity-50">{t("home.browse")}</span>
				<a className="active btn btn-sm" href="/plugins?featured=1">{t("home.featured")}</a>
				<a className="btn btn-sm btn-ghost" href="/plugins?sort=new">{t("home.latest")}</a>
				<a className="btn btn-sm btn-ghost" href="/plugins?sort=stars">{t("home.popular")}</a>
				{data.capabilities.slice(0, 6).map((c) => (
					<a key={c} className="btn btn-ghost btn-sm" href={"/plugins?capability=" + encodeURIComponent(c)}>
						{c.replace(/_/g, " ")}
					</a>
				))}
				<a className="btn btn-sm btn-ghost ml-auto" href="/plugins">{t("home.seeAll")} →</a>
			</nav>

			{/* Featured */}
			<Section
				title={t("home.featured")}
				seeAll={t("home.seeAll")}
				href="/plugins?featured=1"
				empty={t("home.emptyFeatured")}
				isEmpty={data.featured.length === 0}
			>
				<div className="grid gap-4 md:grid-cols-2">
					{data.featured[0] && <PluginCard p={data.featured[0]} featured large />}
					<div className="grid gap-4">
						{data.featured.slice(1, 3).map((p) => (
							<PluginCard key={p.fullName} p={p} featured />
						))}
					</div>
				</div>
			</Section>

			{/* Latest */}
			<Section
				title={t("home.latest")}
				seeAll={t("home.seeAll")}
				href="/plugins?sort=new"
				empty={t("home.emptyVerified")}
				isEmpty={data.latest.length === 0}
			>
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{data.latest.map((p) => (
						<PluginCard key={p.fullName} p={p} />
					))}
				</div>
			</Section>

			{/* Popular */}
			<Section
				title={t("home.popular")}
				seeAll={t("home.seeAll")}
				href="/plugins?sort=stars"
				empty={t("home.emptyVerified")}
				isEmpty={data.popular.length === 0}
			>
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{data.popular.map((p) => (
						<PluginCard key={p.fullName} p={p} />
					))}
				</div>
			</Section>

			{/* Trust strip */}
			<div className="trust-strip">
				<TrustCard icon="check" tone="text-success" title={t("home.trustFormatTitle")} desc={t("home.trustFormatDesc")} />
				<TrustCard icon="exchange" tone="text-info" title={t("home.trustCompatTitle")} desc={t("home.trustCompatDesc")} />
				<TrustCard icon="shield-alert" tone="text-error" title={t("home.trustSecurityTitle")} desc={t("home.trustSecurityDesc")} />
				<a className="flex items-center justify-between gap-3 font-bold" href="/plugins">{t("home.ctaButton")} <span className="text-2xl">→</span></a>
			</div>

		</div>
	);
}
