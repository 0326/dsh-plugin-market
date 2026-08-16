# DS Plugin Market 技术方案 v1.0

> **定位：面向 DeepSeek Harness 生态的可信插件注册、发现与安装平台。**
>
> 核心价值不是把 GitHub Topic 换一层 UI，而是回答用户安装插件前最关键的几个问题：**它真的是 DSH Plugin 吗？和当前 DSH 兼容吗？还在维护吗？安装时会执行什么？有哪些已知风险？**

- 域名：`ds-plugin.market`
- Repository：`0326/dsh-plugin-market`
- 技术栈：React + Vite + Hono + Cloudflare Workers
- 数据源：GitHub / npm 等公开元数据
- 核心基础设施：Cloudflare Workers + Cron Triggers + Queues + D1
- 文档版本：v1.0

---

## 1. 背景

DeepSeek Harness（DSH）采用“Everything is a Plugin”的架构。官方当前通过 GitHub `dsh-plugin` Topic 提供最基础的社区发现能力，但 Topic 本质上只是一个候选仓库集合：

- 任意仓库都可以添加 Topic；
- Topic 不能证明仓库符合 DSH Plugin / Bundle 规范；
- 无法直接判断 DSH / Cordis 版本兼容性；
- 无法说明安装脚本、权限和供应链风险；
- Stars、更新时间等 GitHub 原始指标不足以回答“能不能放心安装”。

同时，DeepSeek Harness 仍处于快速演进阶段，官方明确说明 Developer Preview 期间可能发生兼容性破坏。因此，“可信发现 + 兼容性判断 + 风险透明”比单纯聚合插件更有长期价值。

DS Plugin Market 的目标是把 GitHub 中的候选仓库转换为**结构化、可验证、可追溯的 Plugin Registry**。

---

## 2. 产品目标

### 2.1 核心目标

DS Plugin Market 需要提供四层能力：

1. **Discover**：持续发现 DSH 生态候选插件。
2. **Verify**：验证仓库是否符合 DSH Plugin / Bundle 结构。
3. **Assess**：分析兼容性、维护状态、安装方式和安全风险。
4. **Install with confidence**：给出可解释、可追溯、尽可能安全的安装建议。

最终用户看到的不只是：

```text
repo + stars + description
```

而是：

```text
Plugin Identity
+ DSH Format Verification
+ Compatibility
+ Maintenance
+ Security / Install Risk
+ Evidence
+ Recommended Installation
```

### 2.2 非目标

v1.0 明确不做：

- 不托管第三方插件源码；
- 不替代 GitHub / npm 发布体系；
- 不执行第三方插件代码；
- 不在 Worker 中 `npm install` / `pnpm install` 未信任仓库；
- 不声称“Verified = 绝对安全”；
- 不做付费交易和插件商业化；
- 不建设独立 Package Registry。

原则：

> **GitHub / npm 是代码和包的 Source of Truth；DS Plugin Market 是 Plugin Metadata、Verification 和 Trust Signals 的 Source of Truth。**

---

## 3. 官方 DSH Plugin 模型

根据 DeepSeek Harness 官方开发文档：

### 3.1 Plugin

DSH Plugin 本质上是一个 TypeScript / JavaScript module，通过 `apply(ctx)` 注册能力：

```ts
import type { Context } from '@deepseek-ai/cordis'

export const name = 'my-plugin'

export function apply(ctx: Context) {
  // register capabilities
}
```

Plugin 还可以声明 `inject`，依赖 Harness 中的其他 service。

### 3.2 Bundle

真正用于分发和安装的 DSH Bundle 是 npm package，并在 `package.json` 中声明：

```json
{
  "dsh": {
    "bundle": {
      "patch": "./cordis.patch.yml"
    }
  }
}
```

Bundle 的 patch 将插件模块注册进 Harness composition。

### 3.3 GitHub 安装的特殊风险

DSH 支持直接从 GitHub 安装 Bundle：

```bash
dsh plugin --profile demo add github:owner/repo
```

如果 GitHub 安装依赖 `prepare` 等构建脚本，用户需要允许包在安装阶段执行代码。官方明确建议只允许可信源码，并推荐 pin commit SHA。

因此，**安装脚本检测和 commit pinning 必须是一等信息，而不是详情页角落里的 metadata。**

---

## 4. 核心设计原则

### 4.1 Verification 与 Security 分离

不能使用一个“Verified”同时代表格式正确和代码安全。

建议拆分为独立维度：

```text
Format Verification
Compatibility
Security Scan
Publisher Trust
Maintenance
```

例如：

```text
✓ Format Verified
✓ Compatible with DSH 0.1.0-rc.6
⚠ Install script detected
○ Publisher not verified
✓ Active maintenance
```

### 4.2 所有分析绑定 commit SHA

扫描结果必须绑定明确的 commit：

```text
repo: owner/plugin
ref: main
commit: 5022cc804955...
scanned_at: 2026-08-16T...
```

仓库更新后旧结果应标记为 stale，直到新 commit 扫描完成。

### 4.3 Evidence-first

每个结论都需要保存证据，而不是只有一个不可解释的分数。

例如：

```text
Finding: INSTALL_SCRIPT
Severity: medium
Evidence:
  package.json -> scripts.prepare
```

### 4.4 v1.0 静态分析优先

为了避免 Scanner 自己变成供应链执行环境：

- 只读取 GitHub API 返回的源码/配置；
- 不执行插件代码；
- 不运行 package scripts；
- 不安装依赖；
- 不运行插件测试；
- 对无法静态判断的内容明确显示 Unknown。

---

## 5. 总体架构

```text
                     ┌───────────────────────────┐
                     │       ds-plugin.market     │
                     │      React + Vite SPA      │
                     └─────────────┬─────────────┘
                                   │
                                   ▼
                     ┌───────────────────────────┐
                     │       Hono API Worker      │
                     └─────────────┬─────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
              ▼                    ▼                    ▼
        ┌──────────┐         ┌──────────┐         ┌──────────┐
        │    D1    │         │   Cache  │         │ GitHub   │
        │ Registry │         │ / KV(*)  │         │ REST API │
        └──────────┘         └──────────┘         └──────────┘
              ▲                                          ▲
              │                                          │
              │                                          │
        ┌─────┴────────┐                           ┌─────┴─────┐
        │ Scan Worker  │◀──────── Queue ──────────│ Discovery │
        └─────┬────────┘                           └─────┬─────┘
              │                                          ▲
              ▼                                          │
    ┌──────────────────┐                            Cron Trigger
    │ Static Analyzer  │
    │ Compatibility    │
    │ Security Signals │
    └──────────────────┘
```

`(*)` KV 不是 v1.0 必需项；优先使用 Cloudflare Cache API + D1。只有后续需要高频独立缓存对象时再引入 KV。

---

## 6. GitHub 数据采集设计

### 6.1 不爬 GitHub HTML

统一使用 GitHub 官方 REST API。

原因：

- API 数据结构稳定；
- 支持认证和标准 rate limit；
- 支持 ETag / Conditional Request；
- 可直接获取 repo、commit、tree、contents、release、topics 等数据；
- HTML 页面结构不是稳定 API，维护和风控成本更高。

### 6.2 GitHub Token

Token 只存放在 Cloudflare Secret：

```bash
wrangler secret put GITHUB_TOKEN
```

前端永远不接触 Token。

v1.0 可以使用最小权限的 Fine-grained PAT；后续如果需要更可控的限额、身份和公开部署治理，迁移为 GitHub App。

### 6.3 Discovery Source

第一数据源：

```text
topic:dsh-plugin
```

但 Topic 只作为 **Candidate Source**，不能直接进入 Verified Plugin 列表。

后续可增加：

- 用户 Submit repo URL；
- DeepSeek 官方 / 社区 curated source；
- npm package metadata；
- 已知 publisher 的新增 repo。

### 6.4 Search 结果分片

GitHub Search API 对单次查询可访问的结果数量存在上限，因此不能假设一次 `topic:dsh-plugin` 可以完整同步所有候选仓库。

Discovery 使用时间窗口分片，例如：

```text
topic:dsh-plugin created:2026-08-01..2026-08-07
topic:dsh-plugin created:2026-08-08..2026-08-14
...
```

如果某时间窗口结果仍过大，则继续二分窗口，直到单个 shard 可完整遍历。

D1 保存 shard cursor / sync state，保证任务可中断恢复。

### 6.5 增量同步

新候选 Repo 首次扫描；已存在 Repo 先进行轻量检查：

```text
repo metadata / default branch SHA
             │
             ├─ SHA unchanged → Skip full scan
             │
             └─ SHA changed   → enqueue rescan
```

同时保存 `ETag` / `Last-Modified`。GitHub 对正确认证的 Conditional GET 返回 `304 Not Modified` 时，不消耗 primary rate limit，非常适合定期轮询。

### 6.6 Rate Limit 策略

基础策略：

- 所有 GitHub API 请求认证；
- 读取响应中的 `x-ratelimit-*`；
- Conditional Request；
- Queue 控制并发；
- 遇到 `403 / 429` 按 `retry-after` / reset time 退避；
- 禁止无限立即重试；
- Discovery 与 Scan 分开预算。

建议阈值：

```text
remaining > 1000   normal
remaining 200~1000 slow down
remaining < 200    pause non-critical scans
```

阈值作为应用策略，不写死为 GitHub 官方限制。

---

## 7. 自动更新与 Cloudflare 调度

### 7.1 Cron 只负责发现工作

不要在一个 Cron invocation 内扫描全部仓库。

```text
Cron Trigger
    ↓
Discovery
    ↓
Find new / changed repos
    ↓
Push Scan Jobs to Queue
```

### 7.2 Queue 负责扫描工作

```text
Queue Consumer
    ↓
Fetch repo metadata
    ↓
Fetch commit/tree/files
    ↓
Static Scan
    ↓
Compatibility Analysis
    ↓
Trust Findings
    ↓
Transaction write D1
```

优势：

- 自动削峰；
- 避免一次 Cron 超时；
- 单个失败 Repo 可独立重试；
- 后续从几百扩展到几万候选 Repo 不改变核心架构。

### 7.3 推荐调度

v1.0：

```text
Discovery incremental sync   every 1 hour
Compatibility baseline       every 6 hours
Full stale rescan            daily / on demand
```

精确频率后续根据 GitHub API 使用量调整。

---

## 8. Plugin 状态机

建议主状态：

```text
CANDIDATE
   │
   ▼
DETECTED
   │
   ▼
FORMAT_VERIFIED
   │
   ├──────────┐
   ▼          ▼
FEATURED    REJECTED / INVALID
```

### 8.1 Candidate

来源于 GitHub Topic / Submit 等发现渠道，但尚未证明是 DSH Plugin。

### 8.2 Detected

发现明确 DSH 特征，例如：

- `package.json.dsh.bundle`；
- `@deepseek-ai/cordis` dependency；
- `cordis.patch.yml`；
- DSH 相关 peerDependencies；
- Plugin module 结构。

### 8.3 Format Verified

满足当前定义的最小可分发 Bundle 规则：

- `package.json` 可解析；
- `dsh.bundle.patch` 存在；
- patch 文件存在并可解析；
- patch 引用的关键 package/module 可合理解析；
- 关键 manifest 不存在明显结构错误。

这里的 Verified 只代表 **格式/结构验证**，不代表代码安全。

### 8.4 Featured

人工精选状态，要求至少：

- Format Verified；
- 兼容当前主流 DSH 版本；
- 文档完整；
- 无阻断级安全发现；
- 有明确维护者和安装方式。

---

## 9. Scanner 设计

### 9.1 Scan Pipeline

```text
Repository
   ↓
Metadata Extractor
   ↓
File Tree Detector
   ↓
Manifest Parser
   ↓
Bundle Validator
   ↓
Capability Detector
   ↓
Compatibility Engine
   ↓
Security Signal Engine
   ↓
Maintenance Analyzer
   ↓
Trust Profile
```

### 9.2 首批扫描文件

优先读取：

```text
package.json
cordis.patch.yml / cordis.patch.yaml
README.md / README.*.md
LICENSE
pnpm-lock.yaml / package-lock.json / yarn.lock
入口文件（由 package.json / patch 推导）
```

必要时再读取少量源码文件，不做全仓库无差别下载。

### 9.3 Manifest 解析

`package.json` 提取：

```text
name
version
description
license
repository
homepage
engines
scripts
main
exports
files
dsh.bundle
dsh.client
dependencies
peerDependencies
optionalDependencies
```

### 9.4 Capability Detection

能力分类由规则优先，LLM 只作为后续增强。

一级分类建议：

```text
Development
Git & GitHub
Browser & Web
Design
Vision
Search
Memory
MCP & Integration
Automation
Data
Productivity
Communication
UI & Themes
Agent & Workflow
Security
```

插件技术类型单独建模：

```text
Tool
Service
Surface
Client UI
Agent
Workflow
Integration
Theme
Bundle
```

“它解决什么问题”和“它在 Harness 哪一层扩展”不能混成一个 taxonomy。

---

## 10. Compatibility Engine

### 10.1 输入

从插件侧读取：

- `peerDependencies`；
- `dependencies`；
- `engines.node`；
- `@deepseek-ai/dsh-*` 版本；
- `@deepseek-ai/cordis` 版本；
- `dsh.client.platform`；
- manifest / patch 结构。

从 Registry baseline 读取：

- 当前 DSH 最新版本；
- 当前 Cordis 版本；
- 已知 breaking compatibility rules。

### 10.2 输出

```text
COMPATIBLE
LIKELY_COMPATIBLE
OUTDATED
INCOMPATIBLE
UNKNOWN
```

同时保存解释：

```text
status: OUTDATED
reason:
  plugin requires @deepseek-ai/dsh-client-runtime ^0.1.0-rc.4
  current baseline is 0.1.0-rc.6
```

### 10.3 版本基线

v1.0 可通过 npm registry / DeepSeek Harness 官方仓库定时同步当前版本，保存为 D1 baseline，而不是每个详情页实时请求外部服务。

由于 DSH 仍在快速迭代，Compatibility 必须展示“基于哪个 baseline 判断”。

---

## 11. Security / Trust Scan

### 11.1 核心原则

**市场提供安全信号，不提供绝对安全保证。**

推荐 UI 文案：

```text
Security Scan Passed
No known high-risk signals were detected by the current static checks.
This is not a guarantee that the plugin is safe.
```

### 11.2 v1.0 静态信号

#### 安装阶段执行

检测：

```text
preinstall
install
postinstall
prepare
```

其中 GitHub 安装 + `prepare` 必须特殊提醒，因为这意味着用户允许第三方代码在安装阶段执行。

#### 依赖风险

检测：

- lockfile 是否存在；
- dependency 数量；
- Git URL / local path dependency；
- native / binary build 特征；
- dependency version 是否过度宽泛；
- 后续接入 OSV 等漏洞数据库。

#### 源码风险信号

只做保守型 heuristic，例如：

- child process / shell execution；
- 文件系统广泛访问；
- 动态代码执行；
- 下载并执行远端内容；
- token / credential 相关读取；
- 高风险混淆代码。

出现信号只代表“需要关注”，不能自动判恶意。

### 11.3 风险级别

```text
LOW
MEDIUM
HIGH
CRITICAL
UNKNOWN
```

Risk level 必须由具体 findings 推导，并允许展开查看证据。

### 11.4 Commit Pin 建议

如果安装来源为 GitHub，详情页优先提供：

```bash
dsh plugin --profile web add github:owner/repo#<scanned_commit_sha>
```

并显示：

```text
Recommended: install the exact commit that was scanned.
```

---

## 12. Maintenance / Quality Signals

首期记录：

- repo archived / disabled；
- last push；
- last release；
- release cadence；
- stars / forks；
- README 是否存在；
- LICENSE；
- issue / discussion 能力（仅作辅助）；
- 默认分支最新 commit 时间。

不要直接用 Stars 排名。

建议把排序拆成：

```text
Featured
Trending
Recently Updated
New & Verified
Most Used / Popular (later)
```

后续可以建立透明的 DS Score，但必须公开权重和证据，且 Security 不应被 Stars 抵消。

---

## 13. 数据模型

v1.0 建议 D1 至少包含以下表。

### 13.1 repositories

```sql
CREATE TABLE repositories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  github_id INTEGER NOT NULL UNIQUE,
  owner TEXT NOT NULL,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL UNIQUE,
  html_url TEXT NOT NULL,
  description TEXT,
  default_branch TEXT,
  default_branch_sha TEXT,
  stars INTEGER NOT NULL DEFAULT 0,
  forks INTEGER NOT NULL DEFAULT 0,
  license_spdx TEXT,
  archived INTEGER NOT NULL DEFAULT 0,
  github_created_at TEXT,
  github_updated_at TEXT,
  github_pushed_at TEXT,
  etag TEXT,
  discovered_at TEXT NOT NULL,
  last_checked_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### 13.2 plugins

```sql
CREATE TABLE plugins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  repository_id INTEGER NOT NULL UNIQUE,
  package_name TEXT,
  package_version TEXT,
  plugin_name TEXT,
  description TEXT,
  verification_status TEXT NOT NULL,
  compatibility_status TEXT NOT NULL,
  security_status TEXT NOT NULL,
  maintenance_status TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  latest_scan_id INTEGER,
  featured INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(repository_id) REFERENCES repositories(id)
);
```

### 13.3 scans

```sql
CREATE TABLE scans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  repository_id INTEGER NOT NULL,
  commit_sha TEXT NOT NULL,
  scanner_version TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  error_code TEXT,
  error_message TEXT,
  UNIQUE(repository_id, commit_sha, scanner_version)
);
```

### 13.4 scan_findings

```sql
CREATE TABLE scan_findings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scan_id INTEGER NOT NULL,
  category TEXT NOT NULL,
  code TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT,
  file_path TEXT,
  evidence_json TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY(scan_id) REFERENCES scans(id)
);
```

### 13.5 plugin_metadata

用于保存结构化 manifest 和兼容性信息：

```text
dsh_bundle_patch
client_platform
node_range
cordis_range
dsh_dependency_ranges
install_scripts
capabilities
plugin_types
install_sources
```

可以先用 JSON 字段，稳定后再拆独立表。

### 13.6 discovery_state

记录 GitHub Search shard / cursor：

```text
source
query
window_start
window_end
page
status
last_run_at
```

---

## 14. API 设计

Hono API 首期：

```text
GET  /api/plugins
GET  /api/plugins/:owner/:repo
GET  /api/plugins/:owner/:repo/scans/latest
GET  /api/categories
GET  /api/search?q=
POST /api/submit
```

内部管理接口：

```text
POST /api/internal/discovery/run
POST /api/internal/scan/:owner/:repo
```

内部接口必须使用独立 secret / Access 策略，不对公网匿名开放。

列表 query：

```text
status
category
type
compatibility
risk
sort
page
```

---

## 15. 前端信息架构

v1.0 只做核心闭环。

### 15.1 首页 `/`

```text
Hero Search
Registry Stats
Featured
Trending
New & Verified
Browse by Capability
Build for DSH / Submit
```

第一屏必须体现：

```text
X candidates
Y format-verified plugins
Z updated this week
```

让用户理解这里不是 GitHub Topic 镜像。

### 15.2 Explore `/plugins`

支持：

- keyword search；
- capability；
- plugin type；
- compatibility；
- risk；
- verified only；
- sort。

### 15.3 Plugin Detail `/plugin/:owner/:repo`

核心 Tabs：

```text
Overview
Install
Compatibility
Security
Versions / Scan History
```

右侧 Sticky Install Card：

```text
Format Verification
Compatibility
Risk
Scanned Commit
Copy Install Command
```

### 15.4 Submit `/submit`

用户只需要提交 GitHub URL。

系统自动：

```text
validate URL
→ create/update candidate
→ enqueue scan
→ return scan status
```

不要求作者重复维护市场专有 metadata。

---

## 16. 搜索设计

### 16.1 v1.0：结构化搜索优先

索引字段：

```text
name
packageName
description
capabilities
pluginTypes
README summary
publisher
```

数据量早期可直接基于 D1 + FTS / 合理索引实现。

### 16.2 AI Search 后置

AI Search 是增强能力，不是市场成立的前提。

未来：

```text
“我想让 DSH 能编辑设计文件”
             ↓
semantic retrieval
             ↓
plugins
             ↓
LLM rerank + explanation
```

返回时仍必须携带 Registry 的 Compatibility / Security 信息，不能让 AI 推荐绕过可信判断。

---

## 17. Cloudflare 配置建议

当前项目已经使用 Workers + Vite + Hono，继续沿用，不换技术栈。

目标 Wrangler 结构示意：

```jsonc
{
  "name": "dsh-plugin-market",
  "main": "./src/worker/index.ts",
  "compatibility_flags": ["nodejs_compat"],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "dsh-plugin-market"
    }
  ],
  "queues": {
    "producers": [
      { "binding": "SCAN_QUEUE", "queue": "dsh-plugin-scan" }
    ],
    "consumers": [
      { "queue": "dsh-plugin-scan" }
    ]
  },
  "triggers": {
    "crons": ["0 * * * *"]
  }
}
```

配置中的 database id 等部署后生成值不应提前硬编码到文档示例。

Secrets：

```text
GITHUB_TOKEN
INTERNAL_API_SECRET
```

后续 AI 分类如启用，再增加模型相关 secret。

---

## 18. Worker 代码结构建议

```text
src/
├── react-app/
│   ├── pages/
│   ├── components/
│   ├── features/
│   │   ├── plugin/
│   │   ├── search/
│   │   └── trust/
│   └── lib/
│
└── worker/
    ├── index.ts
    ├── api/
    ├── github/
    │   ├── client.ts
    │   ├── discovery.ts
    │   └── repository.ts
    ├── scanner/
    │   ├── index.ts
    │   ├── manifest.ts
    │   ├── bundle.ts
    │   ├── compatibility.ts
    │   ├── security.ts
    │   └── maintenance.ts
    ├── queue/
    ├── cron/
    ├── db/
    │   ├── schema/
    │   └── repositories/
    └── domain/
        ├── plugin.ts
        ├── scan.ts
        └── finding.ts
```

Scanner 必须保持纯函数化：输入 GitHub snapshot，输出 findings / metadata，方便单测和未来脱离 Cloudflare 运行。

---

## 19. Scan Job 设计

Queue message：

```ts
interface ScanJob {
  repositoryId: number
  owner: string
  repo: string
  expectedSha?: string
  reason: 'discovery' | 'commit_changed' | 'manual' | 'scanner_upgrade'
}
```

幂等键：

```text
repository_id + commit_sha + scanner_version
```

保证 Queue 重试不会重复生成有效 scan。

失败分类：

```text
GITHUB_RATE_LIMITED
REPO_NOT_FOUND
REPO_PRIVATE
TREE_TOO_LARGE
MANIFEST_INVALID
PATCH_INVALID
SCAN_TIMEOUT
INTERNAL_ERROR
```

对用户展示友好状态，对内部保存原始 diagnostic。

---

## 20. 缓存策略

### 20.1 页面/API

公开列表、详情页适合 Cloudflare Cache：

```text
plugins list      1~5 min
plugin detail     1~5 min
categories        30~60 min
```

Scan 完成后通过版本化 key 或 purge 使数据尽快生效。

### 20.2 GitHub API

不要只依赖 Cloudflare Cache。把 GitHub `ETag` / `Last-Modified` 持久化在 D1，确保跨 Worker invocation 仍可做 Conditional Request。

---

## 21. Observability

当前 Worker 已开启 Cloudflare Observability，保留并补充结构化日志。

核心指标：

```text
discovery_candidates_total
scan_jobs_enqueued_total
scan_success_total
scan_failed_total
scan_duration_ms
github_api_requests_total
github_rate_limit_remaining
verified_plugins_total
stale_plugins_total
```

日志统一带：

```text
request_id
job_id
repo_full_name
commit_sha
scan_id
scanner_version
```

关键报警：

- GitHub rate limit 长时间过低；
- Queue backlog 持续增长；
- scan failure rate 激增；
- Cron 连续失败；
- D1 write failure。

---

## 22. 安全边界

### 22.1 Scanner 自身

v1.0 最重要的安全原则：

> **Never execute untrusted plugin code.**

禁止：

```text
npm install third-party repo
pnpm install third-party repo
node downloaded entry.js
run prepare / postinstall
execute repository shell scripts
```

### 22.2 GitHub Token

- 只存在 Worker secret；
- 使用最小权限；
- 不写日志；
- API 错误信息做脱敏；
- 前端请求不能代理任意 GitHub URL，避免把 Worker 变成 token-enabled SSRF proxy。

### 22.3 README / Markdown

第三方 README 渲染需要：

- 禁止任意 HTML / script；
- Markdown sanitize；
- 外链安全属性；
- 图片走浏览器直连或受控 proxy，避免服务端任意 URL fetch。

---

## 23. 1.0 实施阶段

### Phase 1：Registry MVP

目标：打通真实数据闭环。

- D1 schema；
- GitHub API client；
- Topic discovery；
- Candidate 入库；
- package.json / patch 静态解析；
- Candidate / Detected / Format Verified；
- 首页 / Explore / Detail；
- 基础安装命令。

验收：

> 网站能持续从 GitHub 发现候选 repo，并准确区分明显的非插件仓库和标准 DSH Bundle。

### Phase 2：Trust Layer

- Compatibility Engine；
- install script detection；
- dependency / static risk signals；
- commit-bound scan；
- scan findings UI；
- pinned commit install command；
- maintenance signals。

验收：

> 用户进入详情页后，不看 GitHub 源码也能理解“为什么它被认为是插件、是否兼容、安装有什么风险”。

### Phase 3：Discovery Experience

- capability taxonomy；
- Featured / Trending；
- advanced filters；
- Submit；
- publisher page；
- SEO / Open Graph；
- AI Search（可选）。

---

## 24. 关键技术取舍

| 决策 | 选择 | 原因 |
|---|---|---|
| GitHub 数据 | REST API | 官方稳定接口，避免 HTML 爬虫 |
| 插件代码获取 | API 按需读取 | 不 clone，成本低、风险低 |
| 扫描方式 | 静态扫描 | Worker 适合、避免执行不可信代码 |
| 自动更新 | Cron + Queue | 解耦发现与扫描，支持规模增长 |
| Registry DB | D1 | 当前规模和 Cloudflare 栈匹配 |
| 源码托管 | 不托管 | GitHub/npm 保持 Source of Truth |
| Verified 含义 | 格式验证 | 避免把格式正确误导成安全保证 |
| 安装推荐 | pin scanned SHA | 把扫描结果和实际安装代码对应起来 |
| AI | 后置增强 | 核心价值先来自结构化可信数据 |

---

## 25. 主要风险

### 25.1 DSH 规范变化快

解决：

- Scanner version 化；
- Compatibility baseline 独立存储；
- 所有 scan 绑定版本；
- Scanner 升级后可通过 Queue 批量 re-scan。

### 25.2 Topic 污染

这不是异常，而是产品价值来源。

解决：

```text
Topic → Candidate → Detect → Verify
```

不要直接展示 Topic repo 为“插件”。

### 25.3 安全扫描误报 / 漏报

解决：

- Findings evidence-first；
- Risk 与 Verified 分离；
- 不使用“Safe”绝对文案；
- 明确 Scanner capability / version；
- 后续接第三方漏洞数据源与更深静态分析。

### 25.4 GitHub API 限额

解决：

- authenticated requests；
- ETag；
- SHA incremental；
- query sharding；
- Queue throttling；
- 必要时迁移 GitHub App。

---

## 26. 成功标准

1. **Discovery Coverage**：能够持续发现 GitHub `dsh-plugin` 候选仓库，而不是人工维护列表。
2. **Classification Precision**：非 DSH Plugin 不会因为 Topic 自动获得 Verified。
3. **Freshness**：Repo 更新后能够自动识别 SHA 变化并重新扫描。
4. **Explainability**：每个 Verification / Risk 结论都有 evidence。
5. **Install Traceability**：推荐安装命令可绑定已扫描 commit。
6. **Low Operations Cost**：日常同步不需要人工维护插件 metadata。

---

## 27. 一句话架构原则

> **GitHub tells us what claims to be a DSH plugin. DS Plugin Market verifies what it is, whether it is compatible, and what users should know before installing it.**

---

## 28. 参考资料

- DeepSeek Harness: https://github.com/deepseek-ai/deepseek-harness
- DSH Plugin tutorial: https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/index.md
- DSH package/install guide: https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.md
- GitHub REST API: https://docs.github.com/en/rest
- GitHub REST API rate limits: https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api
- GitHub REST API best practices: https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api
- Cloudflare Cron Triggers: https://developers.cloudflare.com/workers/configuration/cron-triggers/
- Cloudflare Workers limits: https://developers.cloudflare.com/workers/platform/limits/
