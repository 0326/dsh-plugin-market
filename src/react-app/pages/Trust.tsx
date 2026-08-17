import { useEffect, useState } from "react";
import { DirectAnswer, EvidenceBlock, FactList, LastUpdated, RelatedLinks } from "../components/ContentBlocks";
import { getContentSeoCopy } from "../content/seo-content";
import { getRegistryContext, type RegistryContext } from "../lib/api";
import { useI18n } from "../lib/i18n";

function formatDate(value: string | null | undefined, lang: string, fallback: string): string {
	if (!value) return fallback;
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return fallback;
	return new Intl.DateTimeFormat(lang === "zh" ? "zh-CN" : "en", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default function Trust() {
	const { lang, t } = useI18n();
	const copy = getContentSeoCopy(lang).trust;
	const [context, setContext] = useState<RegistryContext | null>(null);
	const [contextLoaded, setContextLoaded] = useState(false);

	useEffect(() => {
		let ignore = false;
		getRegistryContext()
			.then((value) => {
				if (!ignore) setContext(value);
			})
			.catch(() => {
				if (!ignore) setContext(null);
			})
			.finally(() => {
				if (!ignore) setContextLoaded(true);
			});
		return () => { ignore = true; };
	}, []);

	const fallback = contextLoaded ? "—" : t("common.loading");
	const baseline = context?.baseline;
	const lastScan = formatDate(context?.stats.lastScanAt, lang, fallback);
	const baselineChecked = formatDate(baseline?.checkedAt, lang, fallback);

	return (
		<article className="trust-page">
			<header className="trust-hero">
				<div>
					<p className="content-kicker">{copy.kicker}</p>
					<h1>{copy.title}</h1>
					<DirectAnswer><p>{copy.intro}</p></DirectAnswer>
					<div className="content-actions">
						<a className="btn btn-neutral" href="/plugins">{copy.browse} →</a>
						<a className="btn btn-ghost border border-base-content" href="/">{copy.back}</a>
					</div>
				</div>
				<div className="trust-warning" role="note">
					<span>TRUST ≠ ABSOLUTE SAFETY</span>
					<strong>{copy.warning}</strong>
				</div>
			</header>

			<section className="trust-pillars" aria-label="Trust dimensions">
				{copy.pillars.map((pillar) => (
					<article key={pillar.index} className="trust-pillar">
						<span>{pillar.index}</span>
						<h2>{pillar.title}</h2>
						<p>{pillar.text}</p>
					</article>
				))}
			</section>

			<section className="trust-editorial-grid">
				<div className="trust-copy-panel">
					<p className="content-kicker">{copy.processKicker}</p>
					<h2>{copy.processTitle}</h2>
					<p>{copy.processBody}</p>
				</div>
				<ol className="trust-process">
					{copy.process.map((step, index) => (
						<li key={step}><span>{String(index + 1).padStart(2, "0")}</span><strong>{step}</strong></li>
					))}
				</ol>
			</section>

			<section className="trust-editorial-grid trust-safety-grid">
				<div className="trust-copy-panel">
					<p className="content-kicker">{copy.safetyKicker}</p>
					<h2>{copy.safetyTitle}</h2>
					<p>{copy.safetyBody}</p>
				</div>
				<EvidenceBlock label="NEVER EXECUTE">
					<ul className="safety-list">
						{copy.never.map((item) => <li key={item}><code>{item}</code></li>)}
					</ul>
				</EvidenceBlock>
			</section>

			<section className="trust-evidence-section">
				<div className="trust-copy-panel">
					<p className="content-kicker">{copy.evidenceKicker}</p>
					<h2>{copy.evidenceTitle}</h2>
					<p>{copy.evidenceBody}</p>
				</div>
				<FactList items={[
					{ label: copy.facts.scanner, value: context?.scannerVersion ?? fallback },
					{ label: copy.facts.dsh, value: baseline?.dshVersion ?? fallback },
					{ label: copy.facts.cordis, value: baseline?.cordisVersion ?? fallback },
					{ label: copy.facts.checked, value: baselineChecked },
					{ label: copy.facts.lastScan, value: lastScan },
				]} />
				<LastUpdated label={copy.facts.lastScan} value={lastScan} dateTime={context?.stats.lastScanAt ?? undefined} />
			</section>

			<section className="trust-unknown">
				<h2>{copy.unknownTitle}</h2>
				<p>{copy.unknownBody}</p>
				<RelatedLinks links={[
					{ href: "/plugins", label: copy.browse },
					{ href: "/about", label: lang === "zh" ? "关于 DSH Plugin Market" : "About DSH Plugin Market" },
				]} />
			</section>
		</article>
	);
}
