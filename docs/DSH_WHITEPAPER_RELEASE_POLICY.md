# DSH Whitepaper Release Policy

> 本文件定义 DSH Living Whitepaper 当前生效的版本同步策略。若与早期技术方案中的 `next` / prerelease 描述冲突，以本文件与 `scripts/whitepaper/release-policy.mjs` 为准。

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
5. CI 校验官方来源、版本固定、Markdown、Shiki、Mermaid 与构建结果。
6. Review 通过后发布；只有 `published` 状态可以成为 `latestPublished`。

## RC 与正式版本关系

RC 和正式版本都是独立、完整的白皮书版本，不覆盖彼此内容。

正式版本发布后：

- 新增正式版本完整快照；
- 默认入口在正式版本白皮书完成验证后切换到正式版本；
- 对应 RC 保留可访问，用于版本差异与历史定位；
- 不把 RC 页面动态映射到正式版本内容。

## 实现约束

版本判断的唯一工程入口：

- `scripts/whitepaper/release-policy.mjs`
- `src/react-app/content/whitepaper/versions.json`

任何后续 GitHub Action、Codex 定时任务或人工同步脚本都必须复用同一版本判断规则，不自行维护另一套 prerelease 判断逻辑。
