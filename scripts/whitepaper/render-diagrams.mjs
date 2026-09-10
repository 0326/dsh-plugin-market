import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const contentRoot = join(root, "src/react-app/content/whitepaper");
const outputRoot = join(root, "public/whitepaper/diagrams");
const versions = JSON.parse(await readFile(join(contentRoot, "versions.json"), "utf8"));
const checkOnly = process.argv.includes("--check");
const mermaidCliVersion = "11.17.0";
const tempRoot = await mkdtemp(join(tmpdir(), "dsh-whitepaper-mermaid-"));
let count = 0;

try {
  for (const version of versions.versions) {
    const sourceDir = join(contentRoot, version.id);
    const nav = JSON.parse(await readFile(join(sourceDir, "nav.json"), "utf8"));
    const targetDir = checkOnly ? join(tempRoot, version.id) : join(outputRoot, version.id);
    await mkdir(targetDir, { recursive: true });

    for (const item of nav) {
      const markdown = await readFile(join(sourceDir, item.file), "utf8");
      const mermaid = [...markdown.matchAll(/```mermaid\s+id=([\w-]+)\r?\n([\s\S]*?)```/g)];
      for (const match of mermaid) {
        const [, id, source] = match;
        const input = join(tempRoot, `${version.id}-${id}.mmd`);
        const output = join(targetDir, `${id}.svg`);
        await writeFile(input, source.trimEnd() + "\n", "utf8");
        const result = spawnSync(
          "npx",
          ["--yes", `--package=@mermaid-js/mermaid-cli@${mermaidCliVersion}`, "mmdc", "-i", input, "-o", output, "-b", "transparent", "-t", "neutral"],
          { stdio: "inherit", env: { ...process.env, PUPPETEER_DISABLE_HEADLESS_WARNING: "true" } },
        );
        if (result.status !== 0) throw new Error(`Mermaid render failed: ${version.id}/${item.file}#${id}`);
        count += 1;
      }
    }
  }
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}

console.log(`${checkOnly ? "Whitepaper Mermaid syntax checked" : "Whitepaper Mermaid SVG generated"}: ${count} diagram(s)`);
