import { WhitepaperLayout } from "../components/whitepaper/WhitepaperLayout";
import type { Route } from "../lib/router";
import { chapterForSlug, resolveWhitepaperVersion, whitepaperHref, WHITEPAPER_LATEST_VERSION, WHITEPAPER_VERSIONS } from "../lib/whitepaper";

interface WhitepaperProps {
	route: Extract<Route, { name: "whitepaper" }>;
}

export default function Whitepaper({ route }: WhitepaperProps) {
	const version = resolveWhitepaperVersion(route.version);
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

	const requested = chapterForSlug(version, route.slug);
	const chapter = requested ?? version.chapters[0];
	if (!chapter) return null;

	if (route.version === "latest" && typeof window !== "undefined") {
		window.history.replaceState({}, "", whitepaperHref(version, chapter));
	}

	return <WhitepaperLayout version={version} chapter={chapter} notFound={Boolean(route.slug && !requested)} />;
}
