# DSH Whitepaper Release Policy

> 本文件定义 DSH Living Whitepaper 当前生效的版本同步策略。若与早期技术方案中的 `next` / prerelease 描述冲突，以本文件、canonical manifest 与 `scripts/whitepaper/release-policy.mjs` 为准。

## 支持的版本

白皮书只跟踪 DeepSeek Harness 官方发布的两类版本：

| 类型 | Tag 形式 | 是否同步 |
|---|---|---|
| Release Candidate | `dsh-vX.Y.Z-rc.N` | 是 |
| 正式版本 | `dsh-vX.Y.Z` | 是 |

当前首个基线版本为 `dsh-v0.1.5-rc.1`。

## 忽略的版本

以下版本不进入检测后的文档生成、版本列表和 `latestPublished` 候选：

- alpha
- beta
- canary
- dev
- nightly
- `master` / `next` 开发快照
- 其他不符合 RC 或正式版本 Tag 规则的预发布版本

忽略意味着“不创建白皮书版本”，而不是创建隐藏或草稿版本。

## 同步规则

1. GitHub Action 获取 DeepSeek Harness 官方 Releases。
2. 先用 `release-policy.mjs` 过滤 Tag，只保留 RC 与正式版本。
3. 对尚未收录的支持版本生成同步任务和官方 Diff 输入。
4. Codex 基于对应 Tag / Commit 的官方源码与官方文档生成或修订完整版本快照。
5. 将版本锁、导航、文章类型、读者结果和发布状态写入 `src/react-app/content/whitepaper/manifest.json`；站点与构建工具只从该 canonical manifest 投影。
6. CI 校验官方来源策略、版本固定、文章注册、Markdown、Shiki、Mermaid 与构建结果。
7. Review 通过后发布；只有 `published` 状态可以成为 `policy.latestPublished`。

## RC 与正式版本关系

RC 和正式版本都是独立、完整的白皮书版本，不覆盖彼此内容。

正式版本发布后：

- 新增正式版本完整快照；
- 默认入口在正式版本白皮书完成验证后切换到正式版本；
- 对应 RC 保留可访问，用于版本差异与历史定位；
- 不把 RC 页面动态映射到正式版本内容。

## 元数据唯一事实源

项目级 canonical manifest：

- `src/react-app/content/whitepaper/manifest.json`

它统一维护：

- `policy`：同步通道、忽略通道、`upstreamLatest`、`latestPublished`、正文分组约束和必备附件；
- `sources`：官方事实来源身份；
- `articles`：稳定文章 ID、slug、主类型、目标读者、Reader Outcome、权威级别与核验状态；
- `versions`：Tag / Commit 锁、文档修订号、内容根目录、图资产根目录、来源锁和每个版本的分组顺序。

站点菜单、版本选择、Sitemap、Markdown 编译、Mermaid 渲染和内容验收都应从该 manifest 投影。不要再维护第二份 `versions.json`、`nav.json` 或版本级 `manifest.json`。

## 实现约束

版本 Tag 分类逻辑由：

- `scripts/whitepaper/release-policy.mjs`

维护；版本与白皮书内容状态由 canonical manifest 维护。任何后续 GitHub Action、Codex 定时任务或人工同步脚本都必须复用这两个入口，不自行维护另一套 prerelease 判断或导航注册表。

检测到上游新版本不代表白皮书已经发布。`upstreamLatest` 表示策略范围内已发现的最新上游版本，`latestPublished` 只有在内容与工程门禁完成后才能前移。
