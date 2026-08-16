# DS Plugin Market

[English](README.en.md) | **简体中文**

> **Discover. Verify. Install with confidence.**
>
> 面向 DeepSeek Harness 生态的可信插件注册、发现与安装平台。

🌐 **https://ds-plugin.market**

![DS Plugin Market](screenshot.png)

![Runtime](https://img.shields.io/badge/Runtime-Cloudflare%20Workers-orange)
![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%2B%20TypeScript-61dafb)
![API](https://img.shields.io/badge/API-Hono-ff6c37)
![Registry](https://img.shields.io/badge/Registry-Cloudflare%20D1-f6821f)
![Deploy](https://img.shields.io/badge/Deploy-GitHub%20Actions-2088ff)

> 本项目面向 DeepSeek Harness 生态。DeepSeek Harness 本身处于 Developer Preview，插件规范和兼容性规则可能快速变化，本项目的扫描规则会随之演进。

---

## 为什么做这个项目？

DeepSeek Harness 的核心理念是 **Everything is a Plugin**。官方目前通过 GitHub [`dsh-plugin`](https://github.com/topics/dsh-plugin) Topic 帮助社区发现插件。

但 GitHub Topic 只能回答：

> “哪些仓库声称自己与 DSH Plugin 有关？”

它不能回答用户安装前更重要的问题：

- 这个仓库**真的是**符合规范的 DSH Plugin / Bundle 吗？
- 它和我当前使用的 DSH / Cordis **兼容吗**？
- 它最近还在**维护**吗？
- 安装时会不会执行 `prepare` / `postinstall` 等脚本？
- 它有哪些需要关注的**安全和供应链风险**？
- 我应该安装哪个版本 / commit，才能和市场扫描的代码保持一致？

**DS Plugin Market 不只是 GitHub Topic 的展示层，而是把候选仓库转换为结构化、可验证、可追溯的 Plugin Registry。**

## 核心价值

### Discover

持续从 GitHub 等公开来源发现 DSH 插件候选仓库，而不是依赖人工维护一份静态清单。

### Verify

自动分析插件结构，包括：

- `package.json`
- `dsh.bundle.patch`
- `cordis.patch.yml`
- DSH / Cordis dependencies 与 peerDependencies
- Plugin entry / exports
- Node.js engine
- Client / Web platform metadata

候选仓库通过明确的生命周期逐步升级：

```text
Candidate
   ↓
Detected
   ↓
Format Verified
   ↓
Featured (curated)
```

### Assess

为每个插件生成独立的 Trust Profile：

```text
Format Verification
Compatibility
Security Scan
Maintenance
Publisher Trust
```

例如：

```text
✓ Format Verified
✓ Compatible with current DSH baseline
⚠ prepare script detected
✓ Active maintenance
○ Publisher not verified
```

### Install with confidence

扫描结果绑定具体 commit SHA。对于 GitHub 安装，优先推荐安装已扫描的 commit：

```bash
dsh plugin --profile web add github:owner/repo#<scanned_commit_sha>
```

这样用户实际安装的代码，可以和市场展示的扫描结果一一对应。

## “Verified”代表什么？

这是本项目最重要的设计原则之一：

> **Format Verified ≠ Safe**

`Format Verified` 只表示仓库符合当前 Scanner 所理解的 DSH Plugin / Bundle 结构规则。

安全相关信息独立展示，包括：

- 安装脚本；
- 依赖风险信号；
- Shell / process execution；
- 文件系统 / 网络访问特征；
- 动态代码执行等静态风险信号；
- 后续接入的公开漏洞数据源。

即使 Security Scan 没有发现高风险信号，也**不代表第三方插件绝对安全**。

## 为什么安装脚本特别重要？

DeepSeek Harness 支持直接从 GitHub 安装插件：

```bash
dsh plugin --profile web add github:owner/repo
```

对于需要构建的 Git dependency，作者可能通过 `prepare` 脚本生成产物。允许该脚本意味着第三方代码会在安装阶段执行。

因此 DS Plugin Market 会把以下信息作为一等信息展示：

```text
Install scripts
Build required
Scanned commit
Recommended pinned install
```

而不是只展示 Stars、Language 和 License。

## 功能特性（当前已实现）

### Registry MVP

- [x] GitHub `dsh-plugin` topic 候选发现 + 增量同步（SHA 增量 + ETag + rate-limit / 429 退避）
- [x] D1 Registry（6 张核心表 + 版本化迁移）
- [x] Scanner v1 纯函数：manifest / bundle / compatibility / security / maintenance / semver
- [x] Cron 定时发现 + Cloudflare Queue 异步扫描（幂等键 `repo_id + sha + scanner_version`）
- [x] 公共 API + internal API（secret 守卫）
- [x] 首页 / Explore / Plugin Detail / Submit 页面

### Trust Layer

- [x] DSH / Cordis 兼容性 baseline（从 npm registry 同步，每小时 cron，缺省回退内置 baseline）
- [x] 安装脚本检测 + 静态安全信号 + 维护信号
- [x] commit 绑定的扫描历史（Versions Tab + `GET /api/plugins/:owner/:repo/scans`）
- [x] pinned-commit 安装命令（InstallCard）

### Discovery Experience

- [x] Capability taxonomy + Plugin Type 双维度（详情展示 + 筛选）
- [x] 高级筛选（capability / pluginType / compatibility / risk / verified / search / sort）
- [x] Featured（internal 置顶接口 + 首页区块）/ Trending / New & Verified / Popular
- [x] Registry 统计（`GET /api/stats`：candidates / verified / updated-this-week）
- [x] Publisher 页（`GET /api/publishers/:owner` + `/publisher/:owner`）
- [x] SEO / OpenGraph / Twitter meta
- [ ] AI Search（可选增强，后置，不阻断主体）

### 其他

- [x] 中英文双语（i18n，浏览器语言自动检测）
- [x] 亮 / 暗主题切换（持久化，无首屏闪烁）
- [x] 插件预览图：GitHub Open Graph 集成 + 扫描期回填（README 首图兜底，绑定 commit）
- [x] 骨架屏（Skeleton）加载状态

## 工作原理

```text
GitHub dsh-plugin Topic / Submit
              │
              ▼
        Candidate Discovery
              │
              ▼
       GitHub REST API
              │
      ┌───────┴────────┐
      │                │
      ▼                ▼
Repository         Commit / Tree
Metadata              Files
      │                │
      └───────┬────────┘
              ▼
        Static Scanner
              │
      ┌───────┼──────────┐
      ▼       ▼          ▼
   Format  Compatibility Security
      │       │          │
      └───────┼──────────┘
              ▼
        Trust Profile
              │
              ▼
      Cloudflare D1 Registry
              │
              ▼
        ds-plugin.market
```

自动更新链路：

```text
Cloudflare Cron（每小时）
      ↓
Discover new / changed repos
      ↓
Cloudflare Queue
      ↓
Static Scan
      ↓
D1
```

项目不会通过高频爬取 GitHub HTML 页面获取数据。

## Scanner 安全边界

v1.0 坚持一个原则：

> **Never execute untrusted plugin code.**

Scanner 只通过 API 读取和静态分析源码/配置，不会：

```text
npm install third-party repo
pnpm install third-party repo
run prepare / postinstall
execute plugin entry
execute repository shell scripts
```

对于无法静态判断的内容，结果明确标记为 `Unknown`，而不是猜测为安全。

## 技术架构

```text
Frontend        React 19 + TypeScript + Vite 7 + Tailwind CSS 4 + daisyUI 5
API             Hono 4
Runtime         Cloudflare Workers
Registry        Cloudflare D1（SQLite）
Scheduling      Cloudflare Cron Triggers（每小时）
Scan Jobs       Cloudflare Queues
Source          GitHub REST API
Test            Vitest（scanner / discovery / curation 单测）
```

详细架构、数据模型、扫描规则和分期方案请阅读：

**[技术方案 v1.0](docs/TECHNICAL_DESIGN.md)** · **[开发计划](docs/DEVELOPMENT_PLAN.md)** · **[设计语言](DESIGN.md)**

## 快速开始

### 环境要求

- Node.js 20+
- 一个 Cloudflare 账户（本地开发 D1 不需要；部署需要）

### 本地开发

安装依赖：

```bash
npm install
```

配置本地 secret（仅浏览可省略；发现/扫描需要）：

```bash
cp .dev.vars.example .dev.vars
```

创建并迁移本地 D1 数据库：

```bash
wrangler d1 migrations apply DB --local
```

本地启动：

```bash
npm run dev
```

### 常用脚本

```bash
npm run build        # tsc -b && vite build && 清理构建产物中的 secret
npm run check        # 类型检查 + 构建 + wrangler deploy --dry-run
npm run lint         # eslint
npm test             # vitest（scanner 纯函数单测）
npm run cf-typegen   # 修改绑定后重新生成 worker-configuration.d.ts
npm run deploy       # 部署到 Cloudflare Workers
```

> `GITHUB_TOKEN` 与 `INTERNAL_API_SECRET` 为 Worker secret（本地可用 `.dev.vars`），禁止提交到仓库或暴露给前端。发现与扫描需要 GitHub Token；仅浏览注册表只需要 D1 数据库。

## 部署（GitHub Actions）

推送到 `main` 会通过 `.github/workflows/deploy.yml` 自动部署。该 workflow 会幂等地创建 Cloudflare Queue 与 D1 数据库、注入 `database_id`、应用 D1 迁移，并执行 `wrangler deploy`。

需要的 GitHub 仓库 secret：

- `CLOUDFLARE_API_TOKEN` — 具有 **Workers Scripts: Edit**、**D1: Edit**、**Workers Queues: Edit** 权限的 Cloudflare API Token。
- `CLOUDFLARE_ACCOUNT_ID` — 你的 Cloudflare 账户 ID。

Worker 运行时 secret（一次性配置，禁止提交）：

```bash
wrangler secret put GITHUB_TOKEN        # worker 调用 GitHub API 所用的 GitHub PAT
wrangler secret put INTERNAL_API_SECRET # 守卫 /api/internal/* 接口
```

## 参与贡献

我们欢迎任何形式的贡献：报告问题、改进文档、完善扫描规则、新增前端功能等。

1. Fork 本仓库并创建特性分支。
2. 开发前请阅读 [技术方案](docs/TECHNICAL_DESIGN.md) 与 [开发计划](docs/DEVELOPMENT_PLAN.md)，遵守 Scanner 安全边界。
3. 提交前运行 `npm run check` 与 `npm test`。
4. 提交 Pull Request。

核心原则：

```text
GitHub = Source of Truth for Code

DS Plugin Market
= Source of Truth for Plugin Metadata & Trust Signals
```

我们不托管插件、不复制第三方发布体系，也不试图替代 GitHub / npm。我们的职责是：

> **GitHub 告诉你哪些仓库声称自己是 DSH Plugin；DS Plugin Market 告诉你它到底是什么、是否兼容，以及安装前你应该知道什么。**

## 免责声明

DS Plugin Market 是社区项目，不是 DeepSeek 官方产品，也不代表 DeepSeek 对第三方插件的审核或背书。

所有 Verification、Compatibility 和 Security 结果都基于特定 Scanner 版本、特定时间和特定 commit 的自动化分析，只作为安装决策的辅助信息，不能替代源码审查或其他安全措施。

## 相关链接

- [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)
- [GitHub `dsh-plugin` Topic](https://github.com/topics/dsh-plugin)
- [DSH Plugin Tutorial](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/index.md)
- [DSH Package & Install Guide](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.md)

## License

[MIT](LICENSE)

版权所有 © 2026 0326
