/**
 * Best-effort extraction of a presentable image from a repository README.
 *
 * Used only as a fallback when the GitHub social preview (Open Graph) image
 * is unavailable. Parsing is pure string analysis: no code execution, no
 * network access — consistent with the scanner safety boundary.
 */

export interface ReadmeImageContext {
	owner: string;
	repo: string;
	/** Commit the README was read at; used to pin relative image URLs. */
	sha: string;
}

/** Hosts that serve badges rather than real preview images. */
const BADGE_HOST_SUFFIXES = [
	"shields.io",
	"badgen.net",
	"travis-ci.org",
	"travis-ci.com",
	"codecov.io",
	"coveralls.io",
	"circleci.com",
	"opencollective.com",
	"npmjs.com",
	"github.com", // relative-URL accidents and raw badge endpoints resolve here
];

/** Filename/path segments that indicate a non-preview image. */
const NON_PREVIEW_KEYWORDS = /(^|[/_.-])(badge|logo|icon|avatar|qr|qrcode|pixel|spacer|tracking)([/_.-]|$)/i;

/** Vector/tracking formats that render poorly as a card preview. */
const BLOCKED_EXTENSIONS = /\.(svg)$/i;

/** Markdown image: ![alt](url) or ![alt](<url> "title") */
const MARKDOWN_IMAGE = /!\[[^\]]*\]\(\s*(?:<([^>]*)>|([^)\s]+))(?:\s+(?:"[^"]*"|'[^']*'))?\s*\)/g;

/** HTML image: <img src="..."> with double/single/unquoted value */
const HTML_IMAGE = /<img\b[^>]*?\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;

export function extractReadmeImage(readme: string | undefined, ctx: ReadmeImageContext): string | null {
	if (!readme) return null;
	const candidates = [...matchGroups(readme, MARKDOWN_IMAGE), ...matchGroups(readme, HTML_IMAGE)];
	for (const raw of candidates) {
		const url = resolveImageUrl(raw, ctx);
		if (url && isPresentable(url)) return url;
	}
	return null;
}

function matchGroups(text: string, re: RegExp): string[] {
	const out: string[] = [];
	for (const m of text.matchAll(re)) {
		const value = m.slice(1).find((g) => g !== undefined && g !== "");
		if (value) out.push(value);
	}
	return out;
}

/** Turn a README-relative or absolute reference into a loadable https URL. */
function resolveImageUrl(raw: string, ctx: ReadmeImageContext): string | null {
	// Angle-bracket markdown URLs may contain spaces; unquoted ones cannot be
	// captured by the regexes, so spaces here are encoded per path segment.
	const s = decodeEntities(raw.trim());
	if (!s || s.startsWith("#")) return null;

	if (/^https?:\/\//i.test(s)) return s;
	if (s.startsWith("//")) return "https:" + s;
	if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return null; // mailto:, data:, ftp:, ...

	let path = s;
	if (path.startsWith("./")) path = path.slice(2);
	if (path.startsWith("/")) path = path.slice(1);
	if (!path || path.split("/").includes("..")) return null;
	return `https://raw.githubusercontent.com/${ctx.owner}/${ctx.repo}/${ctx.sha}/${encodeUriPath(path)}`;
}

/** Heuristics for "would this make a reasonable card preview?" */
function isPresentable(url: string): boolean {
	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		return false;
	}
	if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;

	const host = parsed.hostname.toLowerCase();
	if (BADGE_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith("." + suffix))) return false;
	if (BLOCKED_EXTENSIONS.test(parsed.pathname)) return false;
	if (NON_PREVIEW_KEYWORDS.test(decodeURIComponent(parsed.pathname))) return false;
	return true;
}

/** Encode each path segment without breaking existing escapes or slashes. */
function encodeUriPath(path: string): string {
	return path
		.split("/")
		.map((segment) => (/^[%A-Za-z0-9._~-]+$/.test(segment) ? segment : encodeURIComponent(segment)))
		.join("/");
}

function decodeEntities(s: string): string {
	return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
}
