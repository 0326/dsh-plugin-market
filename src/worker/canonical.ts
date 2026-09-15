import { isSeoPagePath } from "./seo";
import { MARKET_HOST, WHITEPAPER_HOST, isMarketHost, isWhitepaperHost, stripLegacyWhitepaperPrefix, whitepaperPath } from "../shared/site-routing";
import { WHITEPAPER_LATEST_PUBLISHED } from "../shared/whitepaper-release";

export const CANONICAL_HOST = MARKET_HOST;

function isPublicPagePath(pathname: string): boolean {
	const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
	return isSeoPagePath(pathname) || isSeoPagePath(normalized);
}

function redirect(url: URL, status: 301 | 302): Response {
	return new Response(null, {
		status,
		headers: {
			location: url.toString(),
			"cache-control": status === 301 ? "public, max-age=86400" : "public, max-age=300",
		},
	});
}

function whitepaperDestination(pathname: string): { path: string; status: 301 | 302 } | null {
	const stripped = stripLegacyWhitepaperPrefix(pathname);
	if (stripped === null) return null;
	if (stripped === "/") return { path: "/", status: 301 };

	const segments = stripped.split("/").filter(Boolean);
	if (segments.length === 1 && segments[0] === "versions") return { path: "/versions", status: 301 };
	if (segments[0] === "latest") {
		return { path: whitepaperPath(WHITEPAPER_LATEST_PUBLISHED, segments[1] ?? "overview"), status: 302 };
	}
	if (segments.length === 1 && segments[0]) return { path: whitepaperPath(segments[0], "overview"), status: 301 };
	if (segments.length >= 2 && segments[0] && segments[1]) return { path: whitepaperPath(segments[0], segments[1]), status: 301 };
	return { path: "/", status: 301 };
}

/**
 * Return canonical redirects for public URL variants and the whitepaper domain migration.
 */
export function canonicalRedirect(request: Request): Response | null {
	const url = new URL(request.url);
	const hostname = url.hostname.toLowerCase();
	const wwwHost = `www.${CANONICAL_HOST}`;
	const marketHost = isMarketHost(hostname);
	const whitepaperHost = isWhitepaperHost(hostname);

	// Diagram URLs are physical assets, not legacy page routes. Keep the asset
	// namespace stable while moving its canonical host to the whitepaper domain.
	if (url.pathname.startsWith("/whitepaper/diagrams/")) {
		if (marketHost) {
			url.protocol = "https:";
			url.hostname = WHITEPAPER_HOST;
			return redirect(url, 301);
		}
		if (whitepaperHost && url.protocol === "http:") {
			url.protocol = "https:";
			return redirect(url, 301);
		}
		return null;
	}

	if (url.pathname === "/whitepaper/sitemap.xml" && (marketHost || whitepaperHost)) {
		url.protocol = "https:";
		url.hostname = WHITEPAPER_HOST;
		url.pathname = "/sitemap.xml";
		return redirect(url, 301);
	}

	const legacyWhitepaper = whitepaperDestination(url.pathname);
	if (legacyWhitepaper && (marketHost || whitepaperHost)) {
		url.protocol = "https:";
		url.hostname = WHITEPAPER_HOST;
		url.pathname = legacyWhitepaper.path;
		return redirect(url, legacyWhitepaper.status);
	}

	if (whitepaperHost) {
		if (url.pathname === "/") {
			url.protocol = "https:";
			url.pathname = whitepaperPath(WHITEPAPER_LATEST_PUBLISHED, "overview");
			return redirect(url, 302);
		}

		const latestMatch = /^\/latest(?:\/([^/]+))?\/?$/.exec(url.pathname);
		if (latestMatch) {
			url.protocol = "https:";
			url.pathname = whitepaperPath(WHITEPAPER_LATEST_PUBLISHED, latestMatch[1] ?? "overview");
			return redirect(url, 302);
		}

		let changed = false;
		if (url.protocol === "http:") {
			url.protocol = "https:";
			changed = true;
		}
		if (url.pathname === "/versions/") {
			url.pathname = "/versions";
			changed = true;
		}
		return changed ? redirect(url, 301) : null;
	}

	let changed = false;
	if (hostname === wwwHost) {
		url.hostname = CANONICAL_HOST;
		changed = true;
	}

	if ((hostname === CANONICAL_HOST || hostname === wwwHost) && url.protocol === "http:") {
		url.protocol = "https:";
		changed = true;
	}

	if (url.pathname.length > 1 && url.pathname.endsWith("/") && isPublicPagePath(url.pathname)) {
		url.pathname = url.pathname.replace(/\/+$/, "");
		changed = true;
	}

	if (!changed) return null;
	return redirect(url, 301);
}
