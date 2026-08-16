import { useEffect, useState, type ReactNode } from "react";
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
		<section>
			<div className="mb-5 flex items-baseline justify-between gap-4">
				<h2 className="text-2xl font-extrabold tracking-tight">{title}</h2>
				<a className="link text-sm font-semibold" href={href}>
					{seeAll} →
				</a>
			</div>
			{isEmpty ? <p className="text-base-content/60">{empty}</p> : children}
		</section>
	);
}

function TrustCard({ icon, tone, title, desc }: { icon: string; tone: string; title: string; desc: string }) {
	return (
		<div className="card border border-base-300 bg-base-100">
			<div className="card-body gap-3">
				<span className={"grid h-10 w-10 place-items-center rounded-lg border-2 border-current text-lg font-extrabold " + tone}>
					{icon}
				</span>
				<h3 className="text-base font-bold">{title}</h3>
				<p className="text-sm opacity-70">{desc}</p>
			</div>
		</div>
	);
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

	if (error) return <p className="text-error">{t("home.loadError", { msg: error })}</p>;
	if (!data) return <p className="text-base-content/60">{t("common.loading")}</p>;

	function onSearch(e: React.FormEvent) {
		e.preventDefault();
		window.location.hash = "#/plugins?q=" + encodeURIComponent(query);
	}

	return (
		<div className="space-y-16">
			{/* Hero */}
			<div className="hero">
				<div className="hero-content w-full flex-col items-start gap-10 p-0 lg:flex-row lg:items-center lg:justify-between">
					<div className="max-w-xl">
						<p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] opacity-60">ds-plugin.market</p>
						<h1 className="mb-5 text-5xl font-extrabold uppercase leading-[0.95] tracking-tight md:text-7xl">
							DSH
							<br />
							Plugin Market
						</h1>
						<p className="mb-7 max-w-md text-base opacity-70">{t("home.heroTagline")}</p>
						<form className="join w-full max-w-lg" onSubmit={onSearch} role="search">
							<input
								className="input join-item w-full"
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								placeholder={t("home.searchPlaceholder")}
								aria-label={t("home.searchPlaceholder")}
							/>
							<button type="submit" className="btn join-item btn-neutral">
								{t("home.search")}
							</button>
						</form>
						<div className="stats mt-8 w-full bg-transparent">
							<div className="stat px-0">
								<div className="stat-value text-2xl">{data.stats.featured}</div>
								<div className="stat-desc opacity-60">{t("home.statsFeatured")}</div>
							</div>
							<div className="stat">
								<div className="stat-value text-2xl">{data.stats.verified}</div>
								<div className="stat-desc opacity-60">{t("home.statsVerified")}</div>
							</div>
							<div className="stat">
								<div className="stat-value text-2xl">{data.stats.updatedThisWeek}</div>
								<div className="stat-desc opacity-60">{t("home.statsUpdated")}</div>
							</div>
						</div>
					</div>
					<div className="hidden shrink-0 lg:block">
						<Kun className="w-72" ariaHidden />
					</div>
				</div>
			</div>

			{/* Browse navigation */}
			<div className="flex flex-wrap items-center gap-2">
				<span className="mr-1 text-xs font-semibold uppercase tracking-widest opacity-50">{t("home.browse")}</span>
				<a className="btn btn-sm btn-warning" href="#/plugins?featured=1">{t("home.featured")}</a>
				<a className="btn btn-outline btn-sm" href="#/plugins?sort=new">{t("home.latest")}</a>
				<a className="btn btn-outline btn-sm" href="#/plugins?sort=stars">{t("home.popular")}</a>
				{data.capabilities.slice(0, 6).map((c) => (
					<a key={c} className="btn btn-ghost btn-sm" href={"#/plugins?capability=" + encodeURIComponent(c)}>
						{c.replace(/_/g, " ")}
					</a>
				))}
			</div>

			{/* Featured */}
			<Section
				title={t("home.featured")}
				seeAll={t("home.seeAll")}
				href="#/plugins?featured=1"
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
				href="#/plugins?sort=new"
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
				href="#/plugins?sort=stars"
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
			<div className="grid gap-4 md:grid-cols-3">
				<TrustCard icon="✓" tone="text-success" title={t("home.trustFormatTitle")} desc={t("home.trustFormatDesc")} />
				<TrustCard icon="⇄" tone="text-info" title={t("home.trustCompatTitle")} desc={t("home.trustCompatDesc")} />
				<TrustCard icon="!" tone="text-error" title={t("home.trustSecurityTitle")} desc={t("home.trustSecurityDesc")} />
			</div>

			{/* Developer CTA */}
			<div className="card border-2 border-base-300 bg-base-200">
				<div className="card-body gap-4 md:flex-row md:items-center md:justify-between">
					<div>
						<h2 className="text-2xl font-extrabold">{t("home.ctaTitle")}</h2>
						<p className="opacity-70">{t("home.ctaText")}</p>
					</div>
					<a className="btn btn-primary" href="#/plugins">
						{t("home.ctaButton")}
					</a>
				</div>
			</div>
		</div>
	);
}
