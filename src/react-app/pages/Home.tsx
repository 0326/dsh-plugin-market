import { useEffect, useState, type ReactNode } from "react";
import { ContentSection, FAQ, FactList, RelatedLinks } from "../components/ContentBlocks";
import { Icon, type IconName } from "../components/Icon";
import { Kun } from "../components/Kun";
import { PluginCard } from "../components/PluginCard";
import { getContentSeoCopy } from "../content/seo-content";
import { useI18n } from "../lib/i18n";
import { navigate } from "../lib/router";
import { getCategories, getRegistryContext, listPlugins, type PluginListItem, type RegistryContext } from "../lib/api";

interface HomeData {
	context: RegistryContext;
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
				<a className="link" href={href}>{seeAll} →</a>
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

function Pipeline({ steps }: { steps: string[] }) {
	return (
		<ol className="content-pipeline">
			{steps.map((step, index) => (
				<li key={step}>
					<span>{String(index + 1).padStart(2, "0")}</span>
					<strong>{step}</strong>
				</li>
			))}
		</ol>
	);
}

export default function Home() {
	const { t, lang } = useI18n();
	const copy = getContentSeoCopy(lang).home;
	const [data, setData] = useState<HomeData | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [query, setQuery] = useState("");

	useEffect(() => {
		let ignore = false;
		Promise.all([
			getRegistryContext(),
			listPlugins({ featured: true, limit: 3 }),
			listPlugins({ sort: "new", limit: 6 }),
			listPlugins({ sort: "stars", limit: 6 }),
			getCategories(),
		])
			.then(([context, featured, latest, popular, cats]) => {
				if (!ignore) setData({ context, featured: featured.items, latest: latest.items, popular: popular.items, capabilities: cats.capabilities });
			})
			.catch((err) => {
				if (!ignore) setError(err instanceof Error ? err.message : String(err));
			});
		return () => { ignore = true; };
	}, []);

	if (error) return <p className="text-error">{t("home.loadError", { msg: error })}</p>;
	if (!data) return <p className="text-base-content/60">{t("common.loading")}</p>;

	const { stats, baseline, scannerVersion } = data.context;
	const lastScanTime = stats.lastScanAt
		? new Intl.DateTimeFormat(lang === "zh" ? "zh-CN" : "en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(stats.lastScanAt))
		: t("home.noScanYet");
	const baselineLabel = baseline ? `DSH ${baseline.dshVersion} · Cordis ${baseline.cordisVersion}` : "—";
	const progressLabels = lang === "zh"
		? ["GitHub 总量", "已发现仓库", "已扫描仓库", "已检测插件", "格式已验证"]
		: ["GitHub total", "discovered repos", "scanned repos", "detected plugins", "format verified"];
	const discoveredLabel = lang === "zh" ? "已发现仓库" : "Discovered repositories";
	const progressValues: Array<number | string> = [stats.githubTotal ?? "—", stats.discovered, stats.scanned, stats.detected, stats.verified];

	function onSearch(e: React.FormEvent) {
		e.preventDefault();
		navigate("/plugins?q=" + encodeURIComponent(query));
	}

	const faqItems = copy.faq.map((item) => ({
		question: item.question,
		answer: (
			<p>
				{item.answer}{" "}
				{item.href && item.linkLabel && <a className="link font-bold" href={item.href}>{item.linkLabel} →</a>}
			</p>
		),
	}));

	const whatGuideLabel = lang === "zh" ? "阅读 DSH Plugin 指南" : "Read the DSH Plugin guide";
	const installGuideLabel = lang === "zh" ? "完整安装指南" : "Full install guide";
	const chooseGuideLabel = lang === "zh" ? "如何选择插件" : "How to choose a plugin";

	return (
		<div>
			<section className="home-hero">
				<div className="hero-copy">
					<p className="hero-updated mb-5">{t("home.lastScanLabel")}：<time dateTime={stats.lastScanAt ?? undefined}>{lastScanTime}</time></p>
					<h1 className="hero-title"><strong>DEEPSEEK HARNESS</strong><span>PLUGIN MARKET</span></h1>
					<p className="hero-tagline">{t("home.heroTagline")}</p>
					<form className="hero-search join w-full" onSubmit={onSearch} role="search">
						<input className="input join-item w-full" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("home.searchPlaceholder")} aria-label={t("home.searchPlaceholder")} />
						<button type="submit" className="btn join-item btn-neutral"><Icon name="search" size={18} stroke={2} />{t("home.search")}</button>
					</form>
					<div className="mt-[1.65rem] grid max-w-[760px] grid-cols-2 sm:grid-cols-5">
						{progressValues.map((value, index) => (
							<div key={progressLabels[index]} className={"hero-stat " + (index % 2 === 0 ? "max-sm:border-l-0 max-sm:pl-0" : "")}>
								<strong>{value}</strong><span>{progressLabels[index]}</span>
							</div>
						))}
					</div>
				</div>
				<div className="hero-art hidden lg:grid">
					<span className="hero-basketball" aria-hidden="true"><Icon name="ball-basketball" size={58} stroke={2.2} /></span>
					<span className="hero-music" aria-hidden="true">♪</span>
					<Kun className="w-full" ariaHidden />
				</div>
			</section>

			<nav className="category-bar" aria-label={t("home.browse")}>
				<span className="mr-2 text-xs font-bold uppercase tracking-widest opacity-50">{t("home.browse")}</span>
				<a className="active btn btn-sm" href="/plugins?featured=1">{t("home.featured")}</a>
				<a className="btn btn-sm btn-ghost" href="/plugins?sort=new">{t("home.latest")}</a>
				<a className="btn btn-sm btn-ghost" href="/plugins?sort=stars">{t("home.popular")}</a>
				{data.capabilities.slice(0, 6).map((c) => <a key={c} className="btn btn-ghost btn-sm" href={"/plugins?capability=" + encodeURIComponent(c)}>{c.replace(/_/g, " ")}</a>)}
				<a className="btn btn-sm btn-ghost ml-auto" href="/plugins">{t("home.seeAll")} →</a>
			</nav>

			<Section title={t("home.featured")} seeAll={t("home.seeAll")} href="/plugins?featured=1" empty={t("home.emptyFeatured")} isEmpty={data.featured.length === 0}>
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.featured.slice(0, 3).map((p) => <PluginCard key={p.fullName} p={p} featured />)}</div>
			</Section>

			<Section title={t("home.latest")} seeAll={t("home.seeAll")} href="/plugins?sort=new" empty={t("home.emptyVerified")} isEmpty={data.latest.length === 0}>
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.latest.map((p) => <PluginCard key={p.fullName} p={p} />)}</div>
			</Section>

			<Section title={t("home.popular")} seeAll={t("home.seeAll")} href="/plugins?sort=stars" empty={t("home.emptyVerified")} isEmpty={data.popular.length === 0}>
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.popular.map((p) => <PluginCard key={p.fullName} p={p} />)}</div>
			</Section>

			<div className="trust-strip">
				<TrustCard icon="check" tone="text-success" title={t("home.trustFormatTitle")} desc={t("home.trustFormatDesc")} />
				<TrustCard icon="exchange" tone="text-info" title={t("home.trustCompatTitle")} desc={t("home.trustCompatDesc")} />
				<TrustCard icon="shield-alert" tone="text-error" title={t("home.trustSecurityTitle")} desc={t("home.trustSecurityDesc")} />
				<a className="flex items-center justify-between gap-3 font-bold" href="/trust">{copy.verified.learn} <span className="text-2xl">→</span></a>
			</div>

			<section className="knowledge-intro">
				<p className="content-kicker">{copy.sectionKicker}</p>
				<div><h2>{copy.sectionTitle}</h2><p>{copy.sectionIntro}</p></div>
			</section>

			<div className="knowledge-stack">
				<ContentSection kicker={copy.market.kicker} title={copy.market.title} answer={<p>{copy.market.body}</p>} actions={<RelatedLinks links={[{ href: "/about", label: copy.market.about }, { href: "/trust", label: copy.market.trust }]} />}>
					<div className="entity-chain" aria-label="DSH Plugin Market entity relationships"><strong>GitHub</strong><span>→</span><strong>DSH Plugin Market</strong><span>→</span><strong>DeepSeek Harness</strong></div>
				</ContentSection>

				<ContentSection kicker={copy.plugin.kicker} title={copy.plugin.title} answer={<p>{copy.plugin.body}</p>} actions={<a className="link font-bold" href="/guide/what-is-dsh-plugin">{whatGuideLabel} →</a>} className="content-section-accent">
					<div className="capability-grid">{copy.plugin.capabilities.map((item, index) => <div key={item}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong></div>)}</div>
				</ContentSection>

				<ContentSection kicker={copy.works.kicker} title={copy.works.title} answer={<p>{copy.works.body}</p>}>
					<div className="works-grid">
						<Pipeline steps={copy.works.steps} />
						<FactList items={[
							{ label: discoveredLabel, value: stats.discovered },
							{ label: copy.works.facts.verified, value: stats.verified },
							{ label: copy.works.facts.scanner, value: scannerVersion },
							{ label: copy.works.facts.baseline, value: baselineLabel },
							{ label: copy.works.facts.lastScan, value: lastScanTime },
						]} />
					</div>
				</ContentSection>

				<ContentSection kicker={copy.install.kicker} title={copy.install.title} answer={<p>{copy.install.body}</p>} actions={<RelatedLinks links={[{ href: "/guide/install-dsh-plugin", label: installGuideLabel }, { href: "/plugins", label: copy.install.browse }]} />} className="content-section-dark">
					<div className="install-examples">
						<div><span>{copy.install.standard}</span><code>dsh plugin --profile web add github:owner/repo</code></div>
						<div><span>{copy.install.pinned}</span><code>dsh plugin --profile web add github:owner/repo#&lt;scanned_commit&gt;</code></div>
						<strong>{copy.install.equation}</strong>
					</div>
				</ContentSection>

				<ContentSection kicker={copy.verified.kicker} title={copy.verified.title} answer={<p>{copy.verified.body}</p>} actions={<RelatedLinks links={[{ href: "/trust", label: copy.verified.learn }, { href: "/guide/choose-dsh-plugin", label: chooseGuideLabel }]} />}>
					<div className="verified-panel"><strong>{copy.verified.warning}</strong>{copy.verified.items.map((item) => <div key={item.label}><span>{item.label}</span><p>{item.text}</p></div>)}</div>
				</ContentSection>
			</div>

			<FAQ title={copy.faqTitle} items={faqItems} />
		</div>
	);
}
