import { useMemo } from "react";
import type { PluginReadme } from "../lib/api";
import "./readme.css";

const ALLOWED_TAGS = new Set([
	"A", "ABBR", "B", "BLOCKQUOTE", "BR", "CODE", "DEL", "DETAILS", "DIV", "EM", "H1", "H2", "H3", "H4", "H5", "H6",
	"HR", "I", "IMG", "INPUT", "KBD", "LI", "MARK", "OL", "P", "PRE", "S", "SAMP", "SMALL", "SPAN", "STRONG", "SUB",
	"SUMMARY", "SUP", "TABLE", "TBODY", "TD", "TFOOT", "TH", "THEAD", "TR", "UL",
]);

const ALLOWED_ATTRIBUTES = new Set([
	"alt", "aria-hidden", "checked", "class", "colspan", "dir", "disabled", "height", "href", "id", "open", "rowspan", "scope",
	"src", "title", "type", "width",
]);

function normalizeRepoPath(path: string): string | null {
	const segments: string[] = [];
	for (const segment of path.split("/")) {
		if (!segment || segment === ".") continue;
		if (segment === "..") {
			if (segments.length === 0) return null;
			segments.pop();
			continue;
		}
		segments.push(segment);
	}
	return segments.join("/");
}

function readmeDirectory(path: string): string {
	const slash = path.lastIndexOf("/");
	return slash === -1 ? "" : path.slice(0, slash + 1);
}

function encodePath(path: string): string {
	return path.split("/").map((segment) => {
		try {
			return encodeURIComponent(decodeURIComponent(segment));
		} catch {
			return encodeURIComponent(segment);
		}
	}).join("/");
}

function resolveUrl(value: string, kind: "link" | "image", readme: PluginReadme): string | null {
	const trimmed = value.trim();
	if (!trimmed) return null;
	if (kind === "link" && trimmed.startsWith("#")) return trimmed;
	if (trimmed.startsWith("//")) return "https:" + trimmed;

	try {
		const absolute = new URL(trimmed);
		const allowedProtocols = kind === "image" ? ["http:", "https:"] : ["http:", "https:", "mailto:"];
		if (allowedProtocols.includes(absolute.protocol)) return absolute.href;
		return null;
	} catch {
		// Relative repository URL; resolve it against the README's directory.
	}

	const queryIndex = trimmed.indexOf("?");
	const hashIndex = trimmed.indexOf("#");
	const suffixIndex = [queryIndex, hashIndex].filter((index) => index >= 0).reduce((min, index) => Math.min(min, index), trimmed.length);
	const pathPart = trimmed.slice(0, suffixIndex);
	const suffix = trimmed.slice(suffixIndex);
	const baseDirectory = pathPart.startsWith("/") ? "" : readmeDirectory(readme.path);
	const normalized = normalizeRepoPath(baseDirectory + pathPart.replace(/^\/+/, ""));
	if (!normalized) return null;
	const encoded = encodePath(normalized);
	if (kind === "image") {
		return `https://raw.githubusercontent.com/${encodeURIComponent(readme.owner)}/${encodeURIComponent(readme.repo)}/${encodeURIComponent(readme.ref)}/${encoded}${suffix}`;
	}
	return `https://github.com/${encodeURIComponent(readme.owner)}/${encodeURIComponent(readme.repo)}/blob/${encodeURIComponent(readme.ref)}/${encoded}${suffix}`;
}

function sanitizeGithubHtml(html: string, readme: PluginReadme): string {
	if (typeof DOMParser === "undefined") return "";
	const doc = new DOMParser().parseFromString(`<div id="readme-root">${html}</div>`, "text/html");
	const root = doc.getElementById("readme-root");
	if (!root) return "";

	const nodes = Array.from(root.querySelectorAll("*"));
	for (const element of nodes) {
		if (!ALLOWED_TAGS.has(element.tagName)) {
			element.replaceWith(doc.createTextNode(element.textContent ?? ""));
			continue;
		}

		for (const attr of Array.from(element.attributes)) {
			if (!ALLOWED_ATTRIBUTES.has(attr.name.toLowerCase()) || attr.name.toLowerCase().startsWith("on")) {
				element.removeAttribute(attr.name);
			}
		}

		if (element instanceof HTMLAnchorElement) {
			const href = element.getAttribute("href");
			if (href) {
				const resolved = resolveUrl(href, "link", readme);
				if (resolved) element.setAttribute("href", resolved);
				else element.removeAttribute("href");
			}
			if (element.getAttribute("href")?.startsWith("http")) {
				element.setAttribute("target", "_blank");
				element.setAttribute("rel", "noopener noreferrer");
			}
		}

		if (element instanceof HTMLImageElement) {
			const src = element.getAttribute("src");
			if (src) {
				const resolved = resolveUrl(src, "image", readme);
				if (resolved) element.setAttribute("src", resolved);
				else element.removeAttribute("src");
			}
			element.setAttribute("loading", "lazy");
			element.setAttribute("decoding", "async");
		}

		if (element instanceof HTMLInputElement) {
			element.setAttribute("disabled", "");
		}
	}

	return root.innerHTML;
}

export function ReadmeContent({ readme }: { readme: PluginReadme }) {
	const html = useMemo(() => sanitizeGithubHtml(readme.html, readme), [readme]);
	return (
		<div className="readme-shell">
			<div className="readme-markdown" dangerouslySetInnerHTML={{ __html: html }} />
			<div className="readme-source">
				<a href={readme.sourceUrl} target="_blank" rel="noopener noreferrer">{readme.path}</a>
			</div>
		</div>
	);
}
