import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { classifyDshRelease } from "./release-policy.mjs";

const root = process.cwd();
const contentRoot = join(root, "src/react-app/content/whitepaper");
const manifestPath = join(contentRoot, "manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const allowedRepo = "https://github.com/deepseek-ai/deepseek-harness";
const allowedExternalPrefixes = [
	"https://github.com/deepseek-ai/deepseek-harness",
	"https://deepseek-harness.github.io/deepseek-harness",
];
const allowedArticleTypes = new Set([
	"overview-selection",
	"mechanism-explanation",
	"design-tradeoff",
	"practical-validation",
	"version-migration",
	"glossary",
	"conventions",
	"lifecycle",
	"api-reference",
	"source-index",
]);
const errors = [];
const warnings = [];

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

function requireArray(value, location) {
	if (!Array.isArray(value)) {
		errors.push(`${location}: expected array`);
		return [];
	}
	return value;
}

function requireText(value, location) {
	if (typeof value !== "string" || !value.trim()) {
		errors.push(`${location}: expected non-empty string`);
		return false;
	}
	return true;
}

function uniqueBy(items, field, location) {
	const seen = new Set();
	for (const item of items) {
		const value = item?.[field];
		if (!requireText(value, `${location}.${field}`)) continue;
		if (seen.has(value)) errors.push(`${location}: duplicate ${field} ${value}`);
		seen.add(value);
	}
}

if (manifest.schemaVersion !== 3) errors.push("manifest.json: schemaVersion must be 3");
if (manifest.project?.upstream !== allowedRepo) errors.push(`manifest.json: project.upstream must be ${allowedRepo}`);
if (manifest.policy?.sourcePolicy !== "official-only") errors.push("manifest.json: sourcePolicy must be official-only");
if (manifest.policy?.versionFallback !== "explicit-only") errors.push("manifest.json: versionFallback must be explicit-only");

const channels = requireArray(manifest.policy?.channels, "manifest.policy.channels");
if (!channels.includes("rc") || !channels.includes("stable")) errors.push("manifest.json: policy.channels must include rc and stable");

const sources = requireArray(manifest.sources, "manifest.sources");
uniqueBy(sources, "id", "manifest.sources");
const upstreamSource = sources.find((source) => source.id === "dsh-upstream");
if (!upstreamSource || upstreamSource.kind !== "git" || upstreamSource.official !== true || upstreamSource.repository !== allowedRepo) {
	errors.push("manifest.json: dsh-upstream must be the official DeepSeek Harness git repository");
}

const articles = requireArray(manifest.articles, "manifest.articles");
uniqueBy(articles, "id", "manifest.articles");
uniqueBy(articles, "slug", "manifest.articles");
uniqueBy(articles, "file", "manifest.articles");
const articleById = new Map();
for (const article of articles) {
	if (!article?.id) continue;
	articleById.set(article.id, article);
	for (const field of ["title", "slug", "file", "type", "readerOutcome", "kind", "authority", "verification"]) {
		requireText(article[field], `manifest.articles.${article.id}.${field}`);
	}
	if (!allowedArticleTypes.has(article.type)) errors.push(`manifest.articles.${article.id}: unsupported article type ${article.type}`);
	if (!Array.isArray(article.audience) || article.audience.length === 0 || article.audience.some((value) => typeof value !== "string" || !value.trim())) {
		errors.push(`manifest.articles.${article.id}.audience: at least one audience is required`);
	}
	if (article.kind !== "article" && article.kind !== "appendix") errors.push(`manifest.articles.${article.id}: kind must be article or appendix`);
	if (article.authority !== "upstream" && article.authority !== "document-policy") errors.push(`manifest.articles.${article.id}: invalid authority ${article.authority}`);
	if (article.verification !== "draft" && article.verification !== "reviewed" && article.verification !== "blocked") errors.push(`manifest.articles.${article.id}: invalid verification ${article.verification}`);
}

const requiredAppendices = requireArray(manifest.policy?.requiredAppendices, "manifest.policy.requiredAppendices");
for (const appendixId of requiredAppendices) {
	const article = articleById.get(appendixId);
	if (!article) errors.push(`manifest.policy.requiredAppendices: unknown article ${appendixId}`);
	else if (article.kind !== "appendix") errors.push(`manifest.policy.requiredAppendices: ${appendixId} must be an appendix`);
}

const versions = requireArray(manifest.versions, "manifest.versions");
uniqueBy(versions, "id", "manifest.versions");
const versionById = new Map(versions.map((version) => [version.id, version]));
const latestPublished = versionById.get(manifest.policy?.latestPublished);
if (!latestPublished) errors.push("manifest.policy.latestPublished must reference a known version");
else if (latestPublished.status !== "published") errors.push("manifest.policy.latestPublished must reference a published version");
if (manifest.policy?.upstreamLatest && !versionById.has(manifest.policy.upstreamLatest)) errors.push("manifest.policy.upstreamLatest must reference a tracked eligible version");

for (const version of versions) {
	const channel = classifyDshRelease(version.tag);
	if (!channel) errors.push(`${version.id}: only rc and stable DSH releases are supported`);
	if (version.id !== version.tag?.replace(/^dsh-/, "")) errors.push(`${version.id}: id must match upstream tag without dsh- prefix`);
	if (version.channel !== channel) errors.push(`${version.id}: declared channel does not match tag`);
	if (!/^[0-9a-f]{40}$/.test(version.commit ?? "")) errors.push(`${version.id}: commit must be a complete 40-character SHA`);
	if (version.status !== "preview" && version.status !== "published") errors.push(`${version.id}: status must be preview or published`);
	if (!Number.isInteger(version.documentationRevision) || version.documentationRevision < 1) errors.push(`${version.id}: documentationRevision must be a positive integer`);
	if (!requireText(version.contentRoot, `${version.id}.contentRoot`)) continue;
	if (!requireText(version.assetRoot, `${version.id}.assetRoot`)) continue;

	const sourceLocks = requireArray(version.sourceLocks, `${version.id}.sourceLocks`);
	const lock = sourceLocks.find((item) => item.sourceId === "dsh-upstream");
	if (!lock) errors.push(`${version.id}: missing dsh-upstream source lock`);
	else {
		if (lock.ref !== version.tag) errors.push(`${version.id}: source lock ref must match version tag`);
		if (lock.commit !== version.commit) errors.push(`${version.id}: source lock commit must match version commit`);
		if (!requireText(lock.accessed, `${version.id}.sourceLocks.dsh-upstream.accessed`)) continue;
	}

	const groups = requireArray(version.groups, `${version.id}.groups`).slice().sort((a, b) => a.order - b.order);
	uniqueBy(groups, "id", `${version.id}.groups`);
	const bodyGroups = groups.filter((group) => group.kind === "body");
	const appendixGroups = groups.filter((group) => group.kind === "appendix");
	if (Number.isInteger(manifest.policy?.expectedBodyGroups) && bodyGroups.length !== manifest.policy.expectedBodyGroups) {
		errors.push(`${version.id}: expected ${manifest.policy.expectedBodyGroups} body groups, found ${bodyGroups.length}`);
	}
	if (appendixGroups.length < 1) errors.push(`${version.id}: at least one appendix group is required`);

	const referenced = [];
	for (const group of groups) {
		if (group.kind !== "body" && group.kind !== "appendix") errors.push(`${version.id}/${group.id}: invalid group kind ${group.kind}`);
		if (!Number.isInteger(group.order) || group.order < 0) errors.push(`${version.id}/${group.id}: group order must be a non-negative integer`);
		for (const articleId of requireArray(group.articles, `${version.id}/${group.id}.articles`)) {
			const article = articleById.get(articleId);
			if (!article) {
				errors.push(`${version.id}/${group.id}: unknown article ${articleId}`);
				continue;
			}
			if (group.kind === "appendix" && article.kind !== "appendix") errors.push(`${version.id}/${group.id}: ${articleId} must be an appendix`);
			if (group.kind === "body" && article.kind !== "article") errors.push(`${version.id}/${group.id}: ${articleId} must be a body article`);
			referenced.push(articleId);
		}
	}
	const duplicateReferences = referenced.filter((id, index) => referenced.indexOf(id) !== index);
	if (duplicateReferences.length) errors.push(`${version.id}: articles must appear in navigation once: ${[...new Set(duplicateReferences)].join(", ")}`);
	for (const appendixId of requiredAppendices) {
		if (!referenced.includes(appendixId)) errors.push(`${version.id}: required appendix is not in navigation: ${appendixId}`);
	}

	for (const articleId of referenced) {
		const article = articleById.get(articleId);
		if (!article) continue;
		if (version.status === "published" && article.verification !== "reviewed") errors.push(`${version.id}/${articleId}: published versions require reviewed article metadata`);
		const file = join(root, version.contentRoot, article.file);
		if (!existsSync(file)) {
			errors.push(`${version.id}/${article.file}: missing chapter file`);
			continue;
		}
		const markdown = readFileSync(file, "utf8");
		const meta = frontmatter(markdown, `${version.id}/${article.file}`);
		for (const field of ["title", "chapter_id", "slug", "dsh_version", "upstream_tag", "upstream_commit", "verified_at", "sources"]) {
			if (!meta[field]) errors.push(`${version.id}/${article.file}: missing ${field}`);
		}
		if (meta.chapter_id !== article.id || meta.slug !== article.slug || meta.title !== article.title) errors.push(`${version.id}/${article.file}: canonical article metadata mismatch`);
		if (meta.dsh_version !== version.id || meta.upstream_tag !== version.tag || meta.upstream_commit !== version.commit) errors.push(`${version.id}/${article.file}: upstream pin mismatch`);
		if (article.verification === "reviewed" && meta.status !== "verified") errors.push(`${version.id}/${article.file}: reviewed canonical metadata requires frontmatter status: verified`);
		if (!Array.isArray(meta.sources) || meta.sources.length === 0 || meta.sources.some((source) => typeof source !== "string" || source.startsWith("http") || source.includes(".."))) {
			errors.push(`${version.id}/${article.file}: sources must be non-empty official repository-relative paths`);
		}

		const body = markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
		if (/^\s*<\/?[A-Za-z!][^>]*>/m.test(body)) errors.push(`${version.id}/${article.file}: raw HTML is not allowed in whitepaper Markdown`);

		const links = [...body.matchAll(/!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)].map((match) => match[1]);
		for (const target of links) {
			if (!validLinkTarget(target)) errors.push(`${version.id}/${article.file}: unsupported link target ${target}`);
		}

		const mermaid = [...markdown.matchAll(/```mermaid\s+id=([\w-]+)\r?\n[\s\S]*?```/g)];
		for (const match of mermaid) {
			const asset = join(root, version.assetRoot, `${match[1]}.svg`);
			if (!existsSync(asset)) errors.push(`${version.id}/${article.file}: missing pre-rendered diagram ${match[1]}.svg`);
		}
		const urls = [...markdown.matchAll(/https?:\/\/[^\s)>]+/g)].map((match) => match[0]);
		for (const url of urls) {
			if (!allowedExternalPrefixes.some((prefix) => url.startsWith(prefix))) errors.push(`${version.id}/${article.file}: non-official URL ${url}`);
		}
	}
}

warnings.push("claim-level evidence IDs are not yet encoded in the target manifest; semantic source verification remains a separate automated review concern");
warnings.push("fixed upstream source paths are not exhaustively checked in this repository-only validation; tag-to-commit pins must be audited against the official upstream repository");

if (errors.length) {
	console.error(`Whitepaper validation failed (${errors.length})`);
	for (const error of errors) console.error(`- ${error}`);
	process.exit(1);
}

console.log(`Whitepaper validation passed: ${versions.length} tracked version(s), ${articles.length} canonical article definition(s)`);
for (const warning of warnings) console.warn(`Whitepaper validation note: ${warning}`);
