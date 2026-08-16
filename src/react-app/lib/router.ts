import { useSyncExternalStore } from "react";

export type Route =
	| { name: "home" }
	| { name: "explore"; query: string }
	| { name: "plugin"; owner: string; repo: string }
	| { name: "publisher"; owner: string }
	| { name: "submit" }
	| { name: "about" };

export function parseRoute(pathname: string, search: string): Route {
	const path = (pathname || "/").replace(/\/+$/, "") || "/";
	const query = search.replace(/^\?/, "");
	const segments = path.split("/").filter(Boolean);
	if (segments.length === 0) return { name: "home" };
	if (segments[0] === "plugins") return { name: "explore", query };
	if (segments[0] === "plugin" && segments[1] && segments[2]) return { name: "plugin", owner: segments[1], repo: segments[2] };
	if (segments[0] === "publisher" && segments[1]) return { name: "publisher", owner: segments[1] };
	if (segments[0] === "submit") return { name: "submit" };
	if (segments[0] === "about") return { name: "about" };
	return { name: "home" };
}

function subscribe(callback: () => void): () => void {
	window.addEventListener("popstate", callback);
	return () => window.removeEventListener("popstate", callback);
}

function getSnapshot(): string {
	return window.location.pathname + window.location.search;
}

export function useRoute(): Route {
	const snapshot = useSyncExternalStore(subscribe, getSnapshot);
	const q = snapshot.indexOf("?");
	const path = q === -1 ? snapshot : snapshot.slice(0, q);
	const search = q === -1 ? "" : snapshot.slice(q + 1);
	return parseRoute(path, search);
}

/** SPA navigation without a full reload (path-based routing). */
export function navigate(to: string): void {
	const current = window.location.pathname + window.location.search;
	if (current === to) return;
	window.history.pushState({}, "", to);
	window.dispatchEvent(new Event("popstate"));
	window.scrollTo(0, 0);
}
