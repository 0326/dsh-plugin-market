export const MARKET_HOST = "dsh-plugin.market";
export const WHITEPAPER_HOST = "whitepaper.dsh-plugin.market";
export const MARKET_ORIGIN = `https://${MARKET_HOST}`;
export const WHITEPAPER_ORIGIN = `https://${WHITEPAPER_HOST}`;

export function normalizeHostname(hostname: string): string {
	return hostname.trim().toLowerCase().replace(/:\d+$/, "");
}

export function isWhitepaperHost(hostname: string): boolean {
	return normalizeHostname(hostname) === WHITEPAPER_HOST;
}

export function isMarketHost(hostname: string): boolean {
	const normalized = normalizeHostname(hostname);
	return normalized === MARKET_HOST || normalized === `www.${MARKET_HOST}`;
}

export function whitepaperPath(version: string, slug = "overview"): string {
	return `/${encodeURIComponent(version)}/${encodeURIComponent(slug)}`;
}

export function whitepaperUrl(version: string, slug = "overview"): string {
	return `${WHITEPAPER_ORIGIN}${whitepaperPath(version, slug)}`;
}

export function whitepaperVersionsUrl(): string {
	return `${WHITEPAPER_ORIGIN}/versions`;
}

export function legacyWhitepaperPath(version?: string, slug?: string): string {
	if (!version) return "/whitepaper";
	if (!slug) return `/whitepaper/${encodeURIComponent(version)}`;
	return `/whitepaper/${encodeURIComponent(version)}/${encodeURIComponent(slug)}`;
}

export function whitepaperHrefForHost(hostname: string, version: string, slug = "overview"): string {
	if (isWhitepaperHost(hostname)) return whitepaperPath(version, slug);
	if (isMarketHost(hostname)) return whitepaperUrl(version, slug);
	return legacyWhitepaperPath(version, slug);
}

export function whitepaperVersionsHrefForHost(hostname: string): string {
	if (isWhitepaperHost(hostname)) return "/versions";
	if (isMarketHost(hostname)) return whitepaperVersionsUrl();
	return "/whitepaper/versions";
}

export function stripLegacyWhitepaperPrefix(pathname: string): string | null {
	if (pathname === "/whitepaper" || pathname === "/whitepaper/") return "/";
	if (!pathname.startsWith("/whitepaper/")) return null;
	const stripped = pathname.slice("/whitepaper".length);
	return stripped || "/";
}
