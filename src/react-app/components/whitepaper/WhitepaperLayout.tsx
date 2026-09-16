import type { ReactNode } from "react";
import { useI18n } from "../../lib/i18n";
import { navigate } from "../../lib/router";
import {
	chapterForId,
	extractToc,
	groupForChapter,
	officialSourceUrl,
	WHITEPAPER_VERSIONS,
	type WhitepaperChapter,
	type WhitepaperVersion,
} from "../../lib/whitepaper";
import { whitepaperHrefForHost, whitepaperVersionsHrefForHost } from "../../../shared/site-routing";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface WhitepaperLayoutProps {
	version: WhitepaperVersion;
	chapter: WhitepaperChapter;
	notFound?: boolean;
}

function currentHostname(): string {
	return typeof window === "undefined" ? "" : window.location.hostname;
}

function chapterHref(version: WhitepaperVersion, chapter?: WhitepaperChapter): string {
	return whitepaperHrefForHost(currentHostname(), version.id, chapter?.slug ?? version.chapters[0]?.slug ?? "overview");
}

function chapterNumber(version: WhitepaperVersion, chapter: WhitepaperChapter): string {
	const index = version.chapters.findIndex((item) => item.id === chapter.id);
	return String(index + 1).padStart(2, "0");
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
					navigate(chapterHref(target, nextChapter));
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
			{version.groups.map((group) => {
				const active = group.chapters.some((item) => item.id === chapter.id);
				return (
					<details key={group.id} className={group.type === "reference" ? "wp-nav-group is-reference" : "wp-nav-group"} open={active}>
						<summary>
							<span>{group.title}</span>
							{group.type === "reference" && <small>附</small>}
						</summary>
						<div className="wp-nav-group-items">
							{group.chapters.map((item) => (
								<a key={item.id} className={item.id === chapter.id ? "wp-nav-item is-active" : "wp-nav-item"} href={chapterHref(version, item)} aria-current={item.id === chapter.id ? "page" : undefined}>
									<span className="wp-nav-index">{chapterNumber(version, item)}</span>
									<strong>{item.title}</strong>
								</a>
							))}
						</div>
					</details>
				);
			})}
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
	const group = groupForChapter(version, chapter);
	const index = version.chapters.findIndex((item) => item.id === chapter.id);
	const previous = index > 0 ? version.chapters[index - 1] : undefined;
	const next = index >= 0 ? version.chapters[index + 1] : undefined;

	return (
		<div className="whitepaper-shell">
			<header className="wp-local-header">
				<div>
					<a href={chapterHref(version)} className="wp-kicker">DSH DEVELOPER WHITEPAPER</a>
					<p>官方源码驱动 · 版本化快照 · 架构与工程边界</p>
				</div>
				<div className="wp-header-actions">
					<a href={whitepaperVersionsHrefForHost(currentHostname())}>版本</a>
					<button type="button" className="wp-print-action" onClick={() => window.print()}>打印 / PDF</button>
					<VersionSelect version={version} chapter={chapter} />
				</div>
			</header>

			<details className="wp-mobile-nav">
				<summary>{group?.title ?? "目录"} · {chapter.title}</summary>
				<NavItems version={version} chapter={chapter} />
			</details>

			<div className="wp-grid">
				<aside className="wp-sidebar">
					<div className="wp-sidebar-version"><span>{version.label}</span><small>{version.status === "preview" ? "Preview" : "Published"}</small></div>
					<NavItems version={version} chapter={chapter} />
				</aside>

				<article className="wp-article">
					{notFound && <div className="wp-version-notice">当前版本不存在请求的文章，已返回该版本首篇文章。</div>}
					<MarkdownRenderer html={chapter.html} />
					<footer className="wp-article-footer">
						{previous ? <a href={chapterHref(version, previous)}>← {previous.title}</a> : <span />}
						<span>{group?.title} · {chapterNumber(version, chapter)} / {String(version.chapters.length).padStart(2, "0")}</span>
						{next ? <a href={chapterHref(version, next)}>{next.title} →</a> : <span />}
					</footer>
				</article>

				<aside className="wp-page-aside">
					<AsideCard title="阅读位置">
						<p className="wp-reading-position"><strong>{group?.title}</strong><span>第 {chapterNumber(version, chapter)} 篇</span></p>
					</AsideCard>
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
