import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const contentRoot = join(root, "src/react-app/content/whitepaper");
const manifest = JSON.parse(readFileSync(join(contentRoot, "manifest.json"), "utf8"));
const latest = manifest.versions.find((version) => version.id === manifest.policy.latestPublished);

if (!latest) throw new Error(`latestPublished ${manifest.policy.latestPublished} is missing from manifest`);

const articlesById = new Map(manifest.articles.map((article) => [article.id, article]));
const errors = [];
const warnings = [];

// P1 sample articles. This gate intentionally validates only structural depth
// signals; factual correctness remains the responsibility of source review.
const P1_DEPTH_ARTICLES = [
  "runtime",
  "session-state",
  "subagent-workflow-jobs",
  "security-permissions",
  "reliability-evaluation",
  "evolution",
  "capability-seams",
  "hooks-interception",
  "subagent-delegation",
  "workflow-orchestration",
  "jobs-background",
  "diagnostics-observability",
];

const typeSignals = {
  "mechanism-explanation": [
    ["concrete process", /一次|过程|经历|状态变化|sequenceDiagram|flowchart/i],
    ["ownership/responsibility", /所有权|拥有者|谁拥有|谁负责|职责|责任|控制权|谁能控制|持有|归属|权力模型|不同权力|事实层/i],
    ["failure/recovery boundary", /失败|取消|恢复|拒绝|冲突|边界/i],
    ["application/diagnosis", /排障|判断|定位|继续阅读|怎么选|如何继续|诊断/i],
  ],
  "design-tradeoff": [
    ["decision framing", /选择|判断|决策|怎么选|威胁边界|什么时候应该/i],
    ["common comparison dimensions", /维度|比较|责任|负责回答|同一组|依赖方向/i],
    ["concrete scenario", /场景|一次敏感|具体|例如|以一个|实际替换/i],
    ["risk/misuse boundary", /误用|风险|失败|不应|边界|fail closed|代价/i],
  ],
  "practical-validation": [
    ["claim to prove", /证明|想证明|验证对象|结论|能回答什么/i],
    ["evidence chain", /证据链|证据层级|权威证据|首选证据|外部结果|重新读取|可观察/i],
    ["failure-path validation", /失败路径|失败|取消|超时|拒绝|teardown/i],
    ["evidence limitation", /不能.{0,4}证明|仍不能|不等于|不能自动推出|边界/i],
  ],
  "version-migration": [
    ["old/new behavior", /旧行为|新行为|rc\.1|rc\.2/i],
    ["impact/action", /影响|开发者动作|升级动作|迁移判断/i],
    ["verification", /如何验证|升级验证|验证方式|回归/i],
    ["unchanged boundary", /没有变化|继续有效|保持|无需重新|不需要再次/i],
  ],
};

function stripFrontmatter(markdown) {
  return markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
}

function proseParagraphs(markdown) {
  const body = stripFrontmatter(markdown)
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^\|.*$/gm, "")
    .replace(/^#{1,6}\s+.*$/gm, "")
    .replace(/^\s*[-*+]\s+.*$/gm, "")
    .replace(/^\s*\d+\.\s+.*$/gm, "");
  return body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

for (const articleId of P1_DEPTH_ARTICLES) {
  const article = articlesById.get(articleId);
  if (!article) {
    errors.push(`${articleId}: article metadata missing`);
    continue;
  }
  const file = join(root, latest.contentRoot, article.file);
  const markdown = readFileSync(file, "utf8");
  const body = stripFrontmatter(markdown);
  const signals = typeSignals[article.type];

  if (!signals) {
    errors.push(`${articleId}: no P1 depth profile for article type ${article.type}`);
    continue;
  }

  for (const [label, pattern] of signals) {
    if (!pattern.test(body)) errors.push(`${articleId}: missing ${label} signal for ${article.type}`);
  }

  if (!/```mermaid\s+id=/.test(body) && !/^\|.+\|$/m.test(body)) {
    errors.push(`${articleId}: P1 article needs at least one maintained diagram or comparison/ownership table`);
  }

  if (/(?:filecite|cite)|sandbox:\/|turn\d+(?:file|search|fetch)\d+/u.test(markdown)) {
    errors.push(`${articleId}: contains assistant/runtime citation syntax that must not ship in whitepaper content`);
  }

  const paragraphs = proseParagraphs(markdown);
  const longParagraphs = paragraphs.filter((paragraph) => paragraph.length > 420);
  if (longParagraphs.length) warnings.push(`${articleId}: ${longParagraphs.length} prose paragraph(s) exceed 420 characters; review scanability`);

  const intro = paragraphs[0] ?? "";
  if (intro.length > 300) warnings.push(`${articleId}: opening paragraph is ${intro.length} characters; lead with the decision sooner`);
}

if (warnings.length) {
  console.warn(`Whitepaper P1 depth review warnings (${warnings.length})`);
  for (const warning of warnings) console.warn(`- ${warning}`);
}

if (errors.length) {
  console.error(`Whitepaper P1 depth review failed (${errors.length})`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Whitepaper P1 depth review passed: ${P1_DEPTH_ARTICLES.length} latest-version article(s)`);
