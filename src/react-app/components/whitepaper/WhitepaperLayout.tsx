import type { ReactNode } from "react";
import { useI18n } from "../../lib/i18n";
import { navigate } from "../../lib/router";
import { chapterForId, extractToc, officialSourceUrl, WHITEPAPER_VERSIONS, type WhitepaperChapter, type WhitepaperVersion, whitepaperHref } from "../../lib/whitepaper";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface WhitepaperLayoutProps {
	version: WhitepaperVersion;
	chapter: WhitepaperChapter;
	notFound?: boolean;
}

function VersionSelect({ version, chapter }: { version: WhitepaperVersion; chapter: WhitepaperChapter }) {
	return (
		<label className="wp-version-select">
			<span>DSH</span>
			<select
				value={version.id}
				onChange={(event) => {
					const target = WHITEPAPER_VERSIONS.find((item) => item.id === event.target.value);
					if (!target) return;
					const nextChapter = chapterForId(target, chapter.id) ?? target.chapters[0];
					navigate(whitepaperHref(target, nextChapter));
				}}
			>
				{WHITEPAPER_VERSIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
			</select>
		</label>
	);
}

function NavItems({ version, chapter }: { version: WhitepaperVersion; chapter: WhitepaperChapter }) {
	return (
		<nav className="wp-nav" aria-label="Whitepaper chapters">
			{version.chapters.map((item, index) => (
				<a key={item.id} className={item.id === chapter.id ? "wp-nav-item is-active" : "wp-nav-item"} href={whitepaperHref(version, item)} aria-current={item.id === chapter.id ? "page" : undefined}>
					<span className="wp-nav-index">{String(index).padStart(2, "0")}</span>
					<span><strong>{item.title}</strong><small>{item.summary}</small></span>
				</a>
			))}
		</nav>
	);
}

function AsideCard({ title, children }: { title: string; children: ReactNode }) {
	return <section className="wp-aside-card"><h2>{title}</h2>{children}</section>;
}

export function WhitepaperLayout({ version, chapter, notFound = false }: WhitepaperLayoutProps) {
	const { lang } = useI18n();
	const toc = extractToc(chapter.markdown);
	const sourceLabel = lang === "zh" ? "官方来源" : "Official sources";

	return (
		<div className="whitepaper-shell">
			<header className="wp-local-header">
				<div>
					<a href={whitepaperHref(version)} className="wp-kicker">DSH DEVELOPER WHITEPAPER</a>
					<p>官方源码驱动 · 版本化 · 面向开发者</p>
				</div>
				<div className="wp-header-actions">
					<a href="/whitepaper/versions">版本</a>
					<VersionSelect version={version} chapter={chapter} />
				</div>
			</header>

			<details className="wp-mobile-nav">
				<summary>章节 · {chapter.title}</summary>
				<NavItems version={version} chapter={chapter} />
			</details>

			<div className="wp-grid">
				<aside className="wp-sidebar">
					<div className="wp-sidebar-version"><span>{version.label}</span><small>{version.status === "preview" ? "Preview" : "Published"}</small></div>
					<NavItems version={version} chapter={chapter} />
				</aside>

				<article className="wp-article">
					{notFound && <div className="wp-version-notice">当前版本不存在请求的章节，已返回该版本首页。</div>}
					<MarkdownRenderer markdown={chapter.markdown} version={version.id} />
					<footer className="wp-article-footer">
						<span>DSH {version.label}</span>
						<span>Upstream {version.upstreamCommit.slice(0, 8)}</span>
					</footer>
				</article>

				<aside className="wp-page-aside">
					<AsideCard title="本页目录">
						<nav className="wp-toc">
							{toc.map((item) => <a key={item.id} className={item.level === 3 ? "is-child" : ""} href={`#${item.id}`}>{item.text}</a>)}
						</nav>
					</AsideCard>
					<AsideCard title={sourceLabel}>
						<ul className="wp-sources">
							{chapter.sources.map((source) => <li key={source.path}><a href={officialSourceUrl(version, source.path)} target="_blank" rel="noreferrer">{source.label}<small>{source.path}</small></a></li>)}
						</ul>
					</AsideCard>
					<div className="wp-pin">固定于 <code>{version.upstreamTag}</code></div>
				</aside>
			</div>
		</div>
	);
}
