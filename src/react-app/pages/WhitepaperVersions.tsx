import { WHITEPAPER_LATEST_VERSION, WHITEPAPER_VERSIONS, whitepaperHref } from "../lib/whitepaper";

export default function WhitepaperVersions() {
	return (
		<section className="wp-versions-page">
			<p className="wp-kicker">DSH DEVELOPER WHITEPAPER</p>
			<h1>版本</h1>
			<p className="wp-lead">每个版本是一套独立内容快照。目录、正文、架构图和官方源码链接保持同一 DSH Tag。</p>
			<div className="wp-version-list">
				{WHITEPAPER_VERSIONS.map((version) => (
					<a key={version.id} href={whitepaperHref(version)} className="wp-version-row">
						<div><strong>{version.label}</strong>{version.id === WHITEPAPER_LATEST_VERSION && <span>Latest</span>}</div>
						<p>{version.chapters.length} 个 P0 章节 · DSH 发布于 {version.releasedAt}</p>
						<code>{version.upstreamCommit}</code>
					</a>
				))}
			</div>
		</section>
	);
}
