import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, basename, extname } from "node:path";
import { marked } from "marked";

const root = process.cwd();
const contentRoot = join(root, "src/react-app/content/whitepaper");
const generatedRoot = join(contentRoot, "generated");
const versions = JSON.parse(await readFile(join(contentRoot, "versions.json"), "utf8"));

let highlighterPromise;
const languageAliases = new Map([
  ["ts", "typescript"],
  ["js", "javascript"],
  ["sh", "bash"],
  ["shell", "bash"],
  ["yml", "yaml"],
  ["md", "markdown"],
]);

function stripFrontmatter(markdown) {
  return markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function headingId(value) {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-zA-Z0-9#]+;/g, " ")
    .trim()
    .toLowerCase()
    .replace(/[`*_]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function highlight(code, requestedLanguage) {
  if (!highlighterPromise) {
    const { createHighlighter } = await import("shiki");
    highlighterPromise = createHighlighter({
      themes: ["github-light", "github-dark"],
      langs: ["typescript", "javascript", "tsx", "jsx", "json", "yaml", "bash", "markdown", "html", "css", "text"],
    });
  }
  const highlighter = await highlighterPromise;
  const normalized = languageAliases.get(requestedLanguage) ?? requestedLanguage ?? "text";
  const language = highlighter.getLoadedLanguages().includes(normalized) ? normalized : "text";
  return highlighter.codeToHtml(code.replace(/\r?\n$/, ""), {
    lang: language,
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false,
  });
}

async function extractBlocks(markdown, version) {
  const blocks = [];
  const fence = /```([^\r\n]*)\r?\n([\s\S]*?)```/g;
  let cursor = 0;
  let output = "";
  let match;
  while ((match = fence.exec(markdown)) !== null) {
    output += markdown.slice(cursor, match.index);
    const info = match[1].trim();
    const [language = "", ...attrs] = info.split(/\s+/).filter(Boolean);
    const source = match[2];
    const token = `@@WP_BLOCK_${blocks.length}@@`;
    if (language === "mermaid") {
      const id = attrs.join(" ").match(/\bid=([\w-]+)/)?.[1];
      if (!id) throw new Error(`${version}: Mermaid block requires id=<stable-id>`);
      blocks.push({ type: "mermaid", id, source });
    } else {
      blocks.push({ type: "code", language: language || "text", source });
    }
    output += `\n\n${token}\n\n`;
    cursor = fence.lastIndex;
  }
  output += markdown.slice(cursor);
  return { markdown: output, blocks };
}

async function renderBlock(block, version) {
  if (block.type === "mermaid") {
    const image = `/whitepaper/diagrams/${encodeURIComponent(version)}/${encodeURIComponent(block.id)}.svg`;
    return `<figure class="wp-diagram"><a href="${image}" target="_blank" rel="noreferrer" class="wp-diagram-canvas" aria-label="打开架构图原图"><img src="${image}" alt="DSH architecture diagram" loading="lazy"></a><figcaption><span>Mermaid source · ${escapeHtml(block.id)}</span><details><summary>查看源码</summary><pre><code>${escapeHtml(block.source.trimEnd())}</code></pre></details></figcaption></figure>`;
  }
  const html = await highlight(block.source, block.language);
  return `<div class="wp-code-block" data-language="${escapeHtml(block.language)}">${html}</div>`;
}

async function compile(markdown, version) {
  const body = stripFrontmatter(markdown);
  const extracted = await extractBlocks(body, version);
  let html = marked.parse(extracted.markdown, { gfm: true, breaks: false });
  if (typeof html !== "string") html = await html;

  for (let index = 0; index < extracted.blocks.length; index += 1) {
    const token = `@@WP_BLOCK_${index}@@`;
    const fragment = await renderBlock(extracted.blocks[index], version);
    html = html.replace(`<p>${token}</p>`, fragment).replace(token, fragment);
  }

  html = html.replace(/<h([1-4])>([\s\S]*?)<\/h\1>/g, (_all, level, inner) => `<h${level} id="${headingId(inner)}">${inner}</h${level}>`);
  html = html.replace(/<table>([\s\S]*?)<\/table>/g, '<div class="wp-table-wrap"><table>$1</table></div>');
  html = html.replace(/<a href="(https:\/\/[^\"]+)"/g, '<a href="$1" target="_blank" rel="noreferrer"');
  return html;
}

for (const version of versions.versions) {
  const sourceDir = join(contentRoot, version.id);
  const targetDir = join(generatedRoot, version.id);
  await mkdir(targetDir, { recursive: true });
  const nav = JSON.parse(await readFile(join(sourceDir, "nav.json"), "utf8"));
  for (const item of nav) {
    const markdown = await readFile(join(sourceDir, item.file), "utf8");
    const html = await compile(markdown, version.id);
    const output = join(targetDir, `${basename(item.file, extname(item.file))}.html`);
    await writeFile(output, html, "utf8");
  }
}

console.log(`Whitepaper content compiled: ${versions.versions.length} version(s)`);
