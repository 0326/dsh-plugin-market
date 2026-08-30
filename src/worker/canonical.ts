import { isSeoPagePath } from "./seo";

export const CANONICAL_HOST = "dsh-plugin.market";

function isPublicPagePath(pathname: string): boolean {
	const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
	return isSeoPagePath(pathname) || isSeoPagePath(normalized);
}

/**
 * Return a permanent redirect for public URL variants.
 *
 * The apex domain is the canonical host used by SITE_URL, sitemap entries and
 * all generated metadata. Path normalization is intentionally limited to SEO
 * pages so API and static asset semantics remain unchanged.
 */
export function canonicalRedirect(request: Request): Response | null {
	const url = new URL(request.url);
	const hostname = url.hostname.toLowerCase();
	const wwwHost = `www.${CANONICAL_HOST}`;
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
	const response = Response.redirect(url.toString(), 301);
	response.headers.set("cache-control", "public, max-age=86400");
	return response;
}
