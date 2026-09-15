import { useSyncExternalStore } from "react";
import { isGuideSlug, type GuideSlug } from "../content/guide-content";
import { isWhitepaperHost, MARKET_HOST } from "../../shared/site-routing";

export type Route =
	| { name: "home" }
	| { name: "explore"; query: string }
	| { name: "landing"; slug: string }
	| { name: "compare"; query: string }
	| { name: "changes" }
	| { name: "plugin"; owner: string; repo: string }
	| { name: "publisher"; owner: string }
	| { name: "submit" }
	| { name: "about" }
	| { name: "trust" }
	| { name: "guide"; slug: GuideSlug }
	| { name: "whitepaper"; version: string; slug?: string }
	| { name: "whitepaper-versions" };

export function parseRoute(pathname: string, search: string, hostname = MARKET_HOST): Route {
	const path = (pathname || "/").replace(/\/+$/, "") || "/";
	const query = search.replace(/^\?/, "");
	const segments = path.split("/").filter(Boolean);

	if (isWhitepaperHost(hostname)) {
		if (segments.length === 0) return { name: "whitepaper", version: "latest" };
		if (segments.length === 1 && segments[0] === "versions") return { name: "whitepaper-versions" };
		if (segments.length === 1 && segments[0]) return { name: "whitepaper", version: segments[0] };
		if (segments.length === 2 && segments[0] && segments[1]) return { name: "whitepaper", version: segments[0], slug: segments[1] };
		return { name: "whitepaper", version: "latest" };
	}

	if (segments.length === 0) return { name: "home" };
	if (segments.length === 1 && segments[0] === "plugins") return { name: "explore", query };
	if (segments.length === 1 && segments[0] === "compare") return { name: "compare", query };
	if (segments.length === 1 && segments[0] === "changes") return { name: "changes" };
	if (segments.length === 1 && segments[0] === "whitepaper") return { name: "whitepaper", version: "latest" };
	if (segments.length === 2 && segments[0] === "whitepaper" && segments[1] === "versions") return { name: "whitepaper-versions" };
	if (segments.length === 2 && segments[0] === "whitepaper" && segments[1]) return { name: "whitepaper", version: segments[1] };
	if (segments.length === 3 && segments[0] === "whitepaper" && segments[1] && segments[2]) return { name: "whitepaper", version: segments[1], slug: segments[2] };
	if (segments.length === 2 && segments[0] === "plugins" && segments[1]) return { name: "landing", slug: segments[1] };
	if (segments.length === 3 && segments[0] === "plugin" && segments[1] && segments[2]) return { name: "plugin", owner: segments[1], repo: segments[2] };
	if (segments.length === 2 && segments[0] === "publisher" && segments[1]) return { name: "publisher", owner: segments[1] };
	if (segments.length === 2 && segments[0] === "guide" && isGuideSlug(segments[1])) return { name: "guide", slug: segments[1] };
	if (segments.length === 1 && segments[0] === "submit") return { name: "submit" };
	if (segments.length === 1 && segments[0] === "trust") return { name: "trust" };
	if (segments.length === 1 && segments[0] === "about") return { name: "about" };
	return { name: "home" };
}

function subscribe(callback: () => void): () => void {
	window.addEventListener("popstate", callback);
	return () => window.removeEventListener("popstate", callback);
}

function getSnapshot(): string {
	return `${window.location.hostname}\n${window.location.pathname}${window.location.search}`;
}

export function useRoute(): Route {
	const snapshot = useSyncExternalStore(subscribe, getSnapshot);
	const separator = snapshot.indexOf("\n");
	const hostname = separator === -1 ? MARKET_HOST : snapshot.slice(0, separator);
	const location = separator === -1 ? snapshot : snapshot.slice(separator + 1);
	const q = location.indexOf("?");
	const path = q === -1 ? location : location.slice(0, q);
	const search = q === -1 ? "" : location.slice(q + 1);
	return parseRoute(path, search, hostname);
}

/** SPA navigation without a full reload (path-based routing). */
export function navigate(to: string): void {
	if (/^https?:\/\//.test(to)) {
		window.location.assign(to);
		return;
	}
	const current = window.location.pathname + window.location.search;
	if (current === to) return;
	window.history.pushState({}, "", to);
	window.dispatchEvent(new Event("popstate"));
	window.scrollTo(0, 0);
}
