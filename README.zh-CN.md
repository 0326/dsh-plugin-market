# DS Plugin Market

[English](README.md) | **简体中文**

> **Discover. Verify. Install with confidence.**
>
> 面向 DeepSeek Harness 生态的可信插件注册、发现与安装平台。

🌐 **https://ds-plugin.market**

> 项目处于早期开发阶段。DeepSeek Harness 本身也处于 Developer Preview，插件规范和兼容性规则可能快速变化。

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

自动分析插件结构，例如：

- `package.json`
- `dsh.bundle.patch`
- `cordis.patch.yml`
- DSH / Cordis dependencies 与 peerDependencies
- Plugin entry / exports
- Node.js engine
- Client / Web platform metadata

并区分：

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
Publisher Trust (later)
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

这样用户实际安装的代码可以和市场展示的扫描结果对应起来。

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
Cloudflare Cron
      ↓
Discover new / changed repos
      ↓
Cloudflare Queue
      ↓
Static Scan
      ↓
D1
```

不会通过高频爬取 GitHub HTML 页面获取数据。

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

对于无法静态判断的内容，结果应明确标记为 `Unknown`，而不是猜测为安全。

## 技术架构

当前项目技术栈：

```text
Frontend
React 19 + TypeScript + Vite

API
Hono

Runtime
Cloudflare Workers

Registry
Cloudflare D1

Scheduling
Cloudflare Cron Triggers

Scan Jobs
Cloudflare Queues

Source
GitHub REST API
```

详细架构、数据模型、扫描规则和分期方案请阅读：

**[技术方案 v1.0](docs/TECHNICAL_DESIGN.md)**

## v1.0 范围

### Registry MVP

- [ ] GitHub `dsh-plugin` candidate discovery
- [ ] GitHub API 增量同步
- [ ] D1 Registry
- [ ] `package.json` / `cordis.patch.yml` parser
- [ ] Candidate / Detected / Format Verified 状态
- [ ] 首页 / Explore / Plugin Detail
- [ ] 基础安装命令

### Trust Layer

- [ ] DSH / Cordis compatibility analysis
- [ ] Install script detection
- [ ] Static security signals
- [ ] Maintenance signals
- [ ] Commit-bound scan history
- [ ] Pinned commit install command

### Discovery Experience

- [ ] Capability taxonomy
- [ ] Advanced filters
- [ ] Featured / Trending / New & Verified
- [ ] Submit Plugin
- [ ] Publisher pages
- [ ] AI-assisted search（增强能力，不作为基础依赖）

## 开发

```bash
npm install
npm run dev
```

构建：

```bash
npm run build
```

部署到 Cloudflare Workers：

```bash
npm run deploy
```

> GitHub Token、D1、Queue 和 Cron 配置会随着 Registry MVP 实现逐步接入。GitHub Token 必须以 Cloudflare Secret 存储，禁止写入前端代码或仓库。

## 核心原则

```text
GitHub = Source of Truth for Code

DS Plugin Market
= Source of Truth for Plugin Metadata & Trust Signals
```

我们不托管插件、不复制第三方发布体系，也不试图替代 GitHub / npm。

我们的职责是：

> **GitHub 告诉你哪些仓库声称自己是 DSH Plugin；DS Plugin Market 告诉你它到底是什么、是否兼容，以及安装前你应该知道什么。**

## 免责声明

DS Plugin Market 是社区项目，不是 DeepSeek 官方产品，也不代表 DeepSeek 对第三方插件的审核或背书。

所有 Verification、Compatibility 和 Security 结果都基于特定 Scanner 版本、特定时间和特定 commit 的自动化分析，只作为安装决策的辅助信息，不能替代源码审查或其他安全措施。

## 相关链接

- [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)
- [GitHub `dsh-plugin` Topic](https://github.com/topics/dsh-plugin)
- [DSH Plugin Tutorial](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/index.md)
- [DSH Package & Install Guide](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.md)
