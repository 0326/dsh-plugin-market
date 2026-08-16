# DS Plugin Market 开发计划

> 本文把 `docs/TECHNICAL_DESIGN.md`（v1.0 技术方案）落地为可执行、可验收的增量。技术方案是「要做什么、为什么」，本文是「按什么顺序做、做完怎么验收」。

## 现状

- 技术栈：React 19 + Vite + Hono 4 + Cloudflare Workers（`@cloudflare/vite-plugin`），TypeScript strict。
- 文档已完整（README ×2 + 技术方案 28 章），但代码仍是 Cloudflare 官方 "Vite+React+Hono" 模板（计数器 demo + `/api/` hello）。
- `wrangler.json` 尚无 D1 / Queue / Cron / Secret 绑定。

## 里程碑

### M0 — 工程地基

打通类型、绑定、数据层骨架，让项目从模板变成「能本地跑 D1/Queue 的空壳」。

- [x] `wrangler.json` 增加 `d1_databases`、`queues`、`triggers.crons` 与 Secret 说明
- [x] `src/worker/env.ts` 定义 `Env`（DB / SCAN_QUEUE / GITHUB_TOKEN / INTERNAL_API_SECRET）
- [x] `src/worker/domain/*` 定义状态机、兼容性、风险、发现(finding)类型
- [x] `migrations/0001_initial.sql` 落地 6 张 D1 表
- [x] Hono 路由骨架（公共 + internal）

**验收**：`npm run build` / `npm run check` / `npm run lint` 通过。

### M1 — Registry MVP（真实数据闭环）

对应技术方案 Phase 1。

- [x] GitHub client（认证 / ETag / rate-limit / 429 退避）
- [x] Discovery（`topic:dsh-plugin` + 时间窗口分片 + SHA 增量）
- [x] Scanner v1 纯函数（manifest / bundle / compatibility / security / maintenance）
- [x] Cron handler（只做发现）+ Queue consumer（做扫描，幂等键 `repo_id+sha+scanner_version`）
- [x] 公共 API + internal API
- [x] 前端页面（Home / Explore / Detail / Submit）

**验收**：能从 GitHub 发现候选 repo，并区分「非插件」与「标准 DSH Bundle」。

### M2 — Trust Layer（技术方案 Phase 2）

- 兼容性 baseline 从 npm/官方仓库定时同步到 D1
- 详情页 Compatibility / Security / Maintenance Tabs + 可展开 findings
- pinned-commit 安装命令

### M3 — Discovery Experience（技术方案 Phase 3）

- capability taxonomy + 高级筛选
- Featured / Trending / New & Verified
- Submit 强化、Publisher 页、SEO、AI Search（可选）

## 关键约束（护栏）

1. **Never execute untrusted plugin code**：Scanner 只静态读 API 文件。
2. **Format Verified ≠ Safe**：验证与安全独立展示。
3. 一切扫描绑定 commit SHA；推荐 pin commit 安装。
4. Evidence-first：每个结论有 findings + evidence。
5. GITHUB_TOKEN 只在 Secret；internal 接口用 secret 守卫，防 SSRF。
6. Scanner 纯函数化：输入 snapshot，输出 findings/metadata，便于单测。

## 目录结构

```text
src/worker/
  env.ts            # Env 绑定与 secret
  index.ts          # Hono 入口 + scheduled/queue 导出
  api/              # 公共 + internal 路由
  github/           # client / discovery / repository
  scanner/          # 纯函数：manifest/bundle/compatibility/security/maintenance/semver
  queue/            # Queue consumer
  cron/             # Cron discovery
  db/               # schema + repository 数据访问
  domain/           # plugin/scan/finding 类型
src/react-app/
  pages/ components/ lib/
migrations/
  0001_initial.sql
```

## 本地自测

```bash
npm install
npm run cf-typegen   # 重新生成 Env（含 DB/SCAN_QUEUE）
npm run build        # tsc -b && vite build
npm run check        # tsc && vite build && wrangler deploy --dry-run
npm run lint
npm run test         # vitest（scanner 纯函数单测）
```

> GITHUB_TOKEN / INTERNAL_API_SECRET 通过 `wrangler secret put` 配置，本地开发用 `.dev.vars`（已加入 .gitignore）。
