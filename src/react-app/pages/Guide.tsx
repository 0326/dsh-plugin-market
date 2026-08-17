import { useEffect, useState, type ReactNode } from "react";
import { FactList, LastUpdated, RelatedLinks } from "../components/ContentBlocks";
import { getGuideCopy, type GuideExampleMode, type GuideSlug } from "../content/guide-content";
import { getRegistryContext, installCommand, listPlugins, type PluginListItem, type RegistryContext } from "../lib/api";
import { useI18n } from "../lib/i18n";

function signalTone(value: string): string {
	const normalized = value.toUpperCase();
	if (["FORMAT_VERIFIED", "COMPATIBLE", "PASS", "PASSED", "ACTIVE", "LOW"].includes(normalized)) return "guide-signal guide-signal-good";
	if (["LIKELY_COMPATIBLE", "REVIEW", "OUTDATED", "INACTIVE", "MEDIUM", "UNKNOWN"].includes(normalized)) return "guide-signal guide-signal-review";
	if (["INCOMPATIBLE", "FAILED", "REJECTED", "HIGH", "CRITICAL", "ARCHIVED"].includes(normalized)) return "guide-signal guide-signal-stop";
	return "guide-signal";
}

function InlineText({ text }: { text: string }): ReactNode {
	const parts = text.split(/(`[^`]+`)/g);
	return parts.map((part, index) => {
		if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
			return <code className="guide-inline-code" key={index}>{part.slice(1, -1)}</code>;
		}
		return part;
	});
}

function PluginExample({ plugin, mode, lang }: { plugin: PluginListItem; mode: GuideExampleMode; lang: string }) {
	const href = `/plugin/${encodeURIComponent(plugin.owner)}/${encodeURIComponent(plugin.repo)}`;
	const description = plugin.description || (lang === "zh" ? "暂无仓库描述。" : "No repository description.");

	return (
		<article className="guide-example">
			<div className="guide-example-head">
				<div>
					<p>{plugin.owner}</p>
					<h3><a href={href}>{plugin.repo}</a></h3>
				</div>
				<span>★ {plugin.stars}</span>
			</div>
			<p className="guide-example-desc">{description}</p>

			{mode === "overview" && (
				<div className="guide-signals">
					<span className={signalTone(plugin.verificationStatus)}>{plugin.verificationStatus}</span>
					<span className={signalTone(plugin.compatibilityStatus)}>{plugin.compatibilityStatus}</span>
				</div>
			)}

			{mode === "install" && (
				<div className="guide-example-command">
					<span>{plugin.latestCommitSha ? (lang === "zh" ? "固定到已扫描 commit" : "Pinned to scanned commit") : (lang === "zh" ? "暂无 scanned commit" : "No scanned commit available")}</span>
					<code>{installCommand(plugin.owner, plugin.repo, plugin.latestCommitSha)}</code>
				</div>
			)}

			{mode === "evaluate" && (
				<dl className="guide-signal-matrix">
					<div><dt>FORMAT</dt><dd className={signalTone(plugin.verificationStatus)}>{plugin.verificationStatus}</dd></div>
					<div><dt>COMPAT</dt><dd className={signalTone(plugin.compatibilityStatus)}>{plugin.compatibilityStatus}</dd></div>
					<div><dt>SECURITY</dt><dd className={signalTone(plugin.securityStatus)}>{plugin.securityStatus}</dd></div>
					<div><dt>MAINT.</dt><dd className={signalTone(plugin.maintenanceStatus)}>{plugin.maintenanceStatus}</dd></div>
					<div><dt>RISK</dt><dd className={signalTone(plugin.riskLevel)}>{plugin.riskLevel}</dd></div>
				</dl>
			)}

			<a className="guide-example-link" href={href}>{lang === "zh" ? "查看完整插件证据" : "View full plugin evidence"} →</a>
		</article>
	);
}

export default function Guide({ slug }: { slug: GuideSlug }) {
	const { lang, t } = useI18n();
	const copy = getGuideCopy(lang, slug);
	const [context, setContext] = useState<RegistryContext | null>(null);
	const [examples, setExamples] = useState<PluginListItem[]>([]);
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		let ignore = false;
		Promise.allSettled([
			getRegistryContext(),
			listPlugins({ verified: true, sort: "stars", limit: 3 }),
		]).then(([contextResult, pluginsResult]) => {
			if (ignore) return;
			setContext(contextResult.status === "fulfilled" ? contextResult.value : null);
			setExamples(pluginsResult.status === "fulfilled" ? pluginsResult.value.items : []);
			setLoaded(true);
		});
		return () => { ignore = true; };
	}, [slug]);

	const fallback = loaded ? "—" : t("common.loading");
	const baseline = context?.baseline;
	const facts = [
		{ label: copy.factLabels.scanner, value: context?.scannerVersion ?? fallback },
		{ label: copy.factLabels.dsh, value: baseline?.dshVersion ?? fallback },
		{ label: copy.factLabels.cordis, value: baseline?.cordisVersion ?? fallback },
		{ label: copy.factLabels.verified, value: context?.stats.verified ?? fallback },
	];

	return (
		<article className="guide-page">
			<nav className="guide-breadcrumb" aria-label="Breadcrumb">
				<a href="/">{lang === "zh" ? "首页" : "Home"}</a>
				<span>/</span>
				<span>{lang === "zh" ? "指南" : "Guides"}</span>
				<span>/</span>
				<strong>{copy.title}</strong>
			</nav>

			<header className="guide-hero">
				<div className="guide-hero-copy">
					<p className="content-kicker">{copy.kicker}</p>
					<h1>{copy.title}</h1>
					<p className="guide-direct-answer"><InlineText text={copy.directAnswer} /></p>
					<p className="guide-intro"><InlineText text={copy.intro} /></p>
				</div>
				<div className="guide-live-facts">
					<p className="content-kicker">LIVE REGISTRY CONTEXT</p>
					<FactList items={facts} />
					<LastUpdated label={copy.updatedLabel} value={copy.updated} dateTime={copy.updated} />
				</div>
			</header>

			<div className="guide-body">
				{copy.sections.map((section, index) => (
					<section className="guide-section" key={section.kicker}>
						<div className="guide-section-index">{String(index + 1).padStart(2, "0")}</div>
						<div className="guide-section-copy">
							<p className="content-kicker">{section.kicker}</p>
							<h2>{section.title}</h2>
							{section.body.map((paragraph) => <p key={paragraph}><InlineText text={paragraph} /></p>)}

							{section.bullets && (
								<div className="guide-bullet-grid">
									{section.bullets.map((bullet) => (
										<div key={bullet.title}><strong>{bullet.title}</strong><p><InlineText text={bullet.text} /></p></div>
									))}
								</div>
							)}

							{section.code && (
								<div className="guide-code-list">
									{section.code.map((item) => <div key={item.label}><span>{item.label}</span><code>{item.value}</code></div>)}
								</div>
							)}

							{section.note && <aside className="guide-note"><strong>{section.note.label}</strong><p><InlineText text={section.note.text} /></p></aside>}
						</div>
					</section>
				))}
			</div>

			<section className="guide-examples-section">
				<div>
					<p className="content-kicker">REGISTRY EVIDENCE</p>
					<h2>{copy.examplesTitle}</h2>
					<p><InlineText text={copy.examplesIntro} /></p>
				</div>
				<div className="guide-example-grid">
					{!loaded && <p className="guide-examples-empty">{t("common.loading")}</p>}
					{loaded && examples.length === 0 && <p className="guide-examples-empty">{copy.examplesEmpty} <a className="link font-bold" href="/plugins">{lang === "zh" ? "浏览 Registry" : "Browse Registry"} →</a></p>}
					{examples.map((plugin) => <PluginExample key={plugin.fullName} plugin={plugin} mode={copy.exampleMode} lang={lang} />)}
				</div>
			</section>

			<footer className="guide-footer">
				<section>
					<p className="content-kicker">RELATED</p>
					<h2>{copy.relatedTitle}</h2>
					<RelatedLinks links={copy.related} />
				</section>
				<section>
					<p className="content-kicker">SOURCES</p>
					<h2>{copy.sourcesTitle}</h2>
					<ul className="guide-source-list">
						{copy.sources.map((source) => (
							<li key={source.href}><a href={source.href} target={source.external ? "_blank" : undefined} rel={source.external ? "noreferrer" : undefined}>{source.label}{source.external ? " ↗" : " →"}</a></li>
						))}
					</ul>
				</section>
			</footer>
		</article>
	);
}
