import { useEffect } from "react";
import { WhitepaperLayout } from "../components/whitepaper/WhitepaperLayout";
import type { Route } from "../lib/router";
import { chapterForSlug, resolveWhitepaperVersion, whitepaperHref, WHITEPAPER_LATEST_VERSION, WHITEPAPER_VERSIONS } from "../lib/whitepaper";

interface WhitepaperProps {
	route: Extract<Route, { name: "whitepaper" }>;
}

export default function Whitepaper({ route }: WhitepaperProps) {
	const version = resolveWhitepaperVersion(route.version);
	const requested = version ? chapterForSlug(version, route.slug) : undefined;
	const chapter = requested ?? version?.chapters[0];

	useEffect(() => {
		if (!version || !chapter || route.version !== "latest") return;
		window.history.replaceState({}, "", whitepaperHref(version, chapter));
	}, [chapter, route.version, version]);

	if (!version) {
		return (
			<section className="wp-missing-version">
				<p className="wp-kicker">DSH DEVELOPER WHITEPAPER</p>
				<h1>未收录该 DSH 版本</h1>
				<p>当前可阅读版本：{WHITEPAPER_VERSIONS.map((item) => item.label).join("、")}。</p>
				<a className="btn btn-neutral" href={`/whitepaper/${WHITEPAPER_LATEST_VERSION}`}>打开最新版本</a>
			</section>
		);
	}

	if (!chapter) return null;
	return <WhitepaperLayout version={version} chapter={chapter} notFound={Boolean(route.slug && !requested)} />;
}
