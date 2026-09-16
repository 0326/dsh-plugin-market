import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const contentRoot = join(root, "src/react-app/content/whitepaper");
const manifest = JSON.parse(await readFile(join(contentRoot, "manifest.json"), "utf8"));
const articleRegistry = new Map(manifest.articles.map((article) => [article.id, article]));
const checkOnly = process.argv.includes("--check");
const mermaidCliVersion = "11.17.0";
const tempRoot = await mkdtemp(join(tmpdir(), "dsh-whitepaper-mermaid-"));
const puppeteerConfig = join(tempRoot, "puppeteer-config.json");
const isCi = process.env.CI === "true";
let count = 0;

function articlesForVersion(version) {
  const ids = version.groups
    .slice()
    .sort((a, b) => a.order - b.order)
    .flatMap((group) => group.articles);
  return ids.map((id) => {
    const article = articleRegistry.get(id);
    if (!article) throw new Error(`${version.id}: manifest references unknown article ${id}`);
    return article;
  });
}

try {
  if (isCi) {
    // GitHub-hosted Ubuntu runners restrict Chromium's user-namespace sandbox.
    // Mermaid only renders repository-owned, validated Markdown in this job.
    await writeFile(
      puppeteerConfig,
      JSON.stringify({ args: ["--no-sandbox", "--disable-setuid-sandbox"] }),
      "utf8",
    );
  }

  for (const version of manifest.versions) {
    const sourceDir = join(root, version.contentRoot);
    const targetDir = checkOnly ? join(tempRoot, version.id) : join(root, version.assetRoot);
    await mkdir(targetDir, { recursive: true });

    for (const article of articlesForVersion(version)) {
      const markdown = await readFile(join(sourceDir, article.file), "utf8");
      const mermaid = [...markdown.matchAll(/```mermaid\s+id=([\w-]+)\r?\n([\s\S]*?)```/g)];
      for (const match of mermaid) {
        const [, id, source] = match;
        const input = join(tempRoot, `${version.id}-${id}.mmd`);
        const output = join(targetDir, `${id}.svg`);
        await writeFile(input, source.trimEnd() + "\n", "utf8");
        const args = [
          "--yes",
          `--package=@mermaid-js/mermaid-cli@${mermaidCliVersion}`,
          "mmdc",
          "-i",
          input,
          "-o",
          output,
          "-b",
          "transparent",
          "-t",
          "neutral",
        ];
        if (isCi) args.push("-p", puppeteerConfig);
        const result = spawnSync("npx", args, {
          stdio: "inherit",
          env: { ...process.env, PUPPETEER_DISABLE_HEADLESS_WARNING: "true" },
        });
        if (result.status !== 0) throw new Error(`Mermaid render failed: ${version.id}/${article.file}#${id}`);
        count += 1;
      }
    }
  }
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}

console.log(`${checkOnly ? "Whitepaper Mermaid syntax checked" : "Whitepaper Mermaid SVG generated"}: ${count} diagram(s)`);
