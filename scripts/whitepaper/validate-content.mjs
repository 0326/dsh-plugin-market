import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { classifyDshRelease } from "./release-policy.mjs";

const root = process.cwd();
const contentRoot = join(root, "src/react-app/content/whitepaper");
const versions = JSON.parse(readFileSync(join(contentRoot, "versions.json"), "utf8"));
const allowedRepo = "deepseek-ai/deepseek-harness";
const allowedExternalPrefixes = [
	"https://github.com/deepseek-ai/deepseek-harness",
	"https://deepseek-harness.github.io/deepseek-harness",
];
const errors = [];

function frontmatter(markdown, file) {
	const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(markdown);
	if (!match) {
		errors.push(`${file}: missing frontmatter`);
		return {};
	}
	try {
		return parseYaml(match[1]);
	} catch (error) {
		errors.push(`${file}: invalid frontmatter: ${error.message}`);
		return {};
	}
}

function validLinkTarget(target) {
	return target.startsWith("#") || target.startsWith("/whitepaper/") || allowedExternalPrefixes.some((prefix) => target.startsWith(prefix));
}

for (const version of versions.versions) {
	const channel = classifyDshRelease(version.tag);
	if (!channel) errors.push(`${version.id}: only rc and stable DSH releases are supported`);
	if (version.id !== version.tag?.replace(/^dsh-/, "")) errors.push(`${version.id}: id must match upstream tag without dsh- prefix`);
	if (version.channel && version.channel !== channel) errors.push(`${version.id}: declared channel does not match tag`);

	const dir = join(contentRoot, version.id);
	const manifestPath = join(dir, "manifest.json");
	const navPath = join(dir, "nav.json");
	if (!existsSync(manifestPath) || !existsSync(navPath)) {
		errors.push(`${version.id}: manifest.json and nav.json are required`);
		continue;
	}
	const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
	const nav = JSON.parse(readFileSync(navPath, "utf8"));
	if (manifest.upstreamRepo !== allowedRepo) errors.push(`${version.id}: upstreamRepo must be ${allowedRepo}`);
	if (manifest.version !== version.id || manifest.upstreamTag !== version.tag || manifest.upstreamCommit !== version.commit) errors.push(`${version.id}: versions.json and manifest.json are inconsistent`);
	if (manifest.releaseChannel && manifest.releaseChannel !== channel) errors.push(`${version.id}: manifest releaseChannel does not match tag`);

	for (const item of nav) {
		const file = join(dir, item.file);
		if (!existsSync(file)) {
			errors.push(`${version.id}/${item.file}: missing chapter file`);
			continue;
		}
		const markdown = readFileSync(file, "utf8");
		const meta = frontmatter(markdown, `${version.id}/${item.file}`);
		for (const field of ["title", "chapter_id", "slug", "dsh_version", "upstream_tag", "upstream_commit", "verified_at", "sources"]) {
			if (!meta[field]) errors.push(`${version.id}/${item.file}: missing ${field}`);
		}
		if (meta.chapter_id !== item.id || meta.slug !== item.slug) errors.push(`${version.id}/${item.file}: nav id/slug mismatch`);
		if (meta.dsh_version !== manifest.version || meta.upstream_tag !== manifest.upstreamTag || meta.upstream_commit !== manifest.upstreamCommit) errors.push(`${version.id}/${item.file}: upstream pin mismatch`);
		if (!Array.isArray(meta.sources) || meta.sources.some((source) => typeof source !== "string" || source.startsWith("http") || source.includes(".."))) errors.push(`${version.id}/${item.file}: sources must be official repository-relative paths`);

		const body = markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
		if (/^\s*<\/?[A-Za-z!][^>]*>/m.test(body)) errors.push(`${version.id}/${item.file}: raw HTML is not allowed in whitepaper Markdown`);

		const links = [...body.matchAll(/!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)].map((match) => match[1]);
		for (const target of links) {
			if (!validLinkTarget(target)) errors.push(`${version.id}/${item.file}: unsupported link target ${target}`);
		}

		const mermaid = [...markdown.matchAll(/```mermaid\s+id=([\w-]+)\r?\n[\s\S]*?```/g)];
		for (const match of mermaid) {
			const asset = join(root, "public/whitepaper/diagrams", version.id, `${match[1]}.svg`);
			if (!existsSync(asset)) errors.push(`${version.id}/${item.file}: missing pre-rendered diagram ${match[1]}.svg`);
		}
		const urls = [...markdown.matchAll(/https?:\/\/[^\s)>]+/g)].map((match) => match[0]);
		for (const url of urls) {
			if (!allowedExternalPrefixes.some((prefix) => url.startsWith(prefix))) errors.push(`${version.id}/${item.file}: non-official URL ${url}`);
		}
	}
}

if (!versions.versions.some((item) => item.id === versions.latestPublished)) errors.push("versions.json: latestPublished must reference a known version");
if (versions.upstreamLatest && !versions.versions.some((item) => item.id === versions.upstreamLatest)) errors.push("versions.json: upstreamLatest must reference a tracked rc/stable version");

if (errors.length) {
	console.error(`Whitepaper validation failed (${errors.length})`);
	for (const error of errors) console.error(`- ${error}`);
	process.exit(1);
}

console.log(`Whitepaper validation passed: ${versions.versions.length} rc/stable version(s)`);
