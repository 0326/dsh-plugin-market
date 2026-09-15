---
title: 版本演进
chapter_id: evolution
slug: evolution
dsh_version: v0.1.5-rc.2
upstream_tag: dsh-v0.1.5-rc.2
upstream_commit: fb2c4b9e698e30edb738bca4cf0618587db7d203
status: verified
verified_at: 2026-09-15
sources:
  - docs/subsystems/feedback.zh.md
  - packages/client/ui-message-feedback/README.zh.md
  - packages/client/ui-deliverables/README.zh.md
  - packages/client/ui-chat/README.zh.md
  - packages/client/ui-primitives/README.zh.md
---
# 版本演进

官方 `v0.1.5-rc.2` 于 2026-09-10 发布，是 `rc.1` 之后的第二个 `0.1.5` 候选版本。官方 Compare 显示它只领先 `rc.1` 4 个提交，变化集中在 Feedback 提交体验、交付文件卡片、Conversation 间距与代码文件图标；Agent Core、Session、Capability Seam 与插件扩展主干没有新的架构迁移。

## rc.1 → rc.2 变化

| 领域 | rc.2 变化 | 开发者影响 |
| --- | --- | --- |
| Message Feedback | 好评和差评都先打开反馈弹窗并确认后提交 | 自定义 Feedback UI 应与新的确认/失败语义保持一致 |
| Feedback 失败处理 | 提交失败保留已填写内容并显示提示 | 不应在失败时提前清空本地草稿 |
| Feedback 撤回 | 再次点击已记录评分直接撤回 | UI 状态需要区分“未记录评分”和“已记录评分” |
| Deliverables | 调整交付文件卡片排版 | 依赖内部 DOM/CSS 的自定义样式需要复核 |
| Conversation | 调整消息/交付区域间距 | 不影响 Conversation 数据模型和 Slot 契约 |
| Code File Icons | 刷新代码文件图标实现 | 不应依赖旧图标内部 artwork 结构 |

## 没有变化的架构契约

rc.2 没有新增 Agent / Session / Plugin 层面的 breaking change。rc.1 引入的以下契约在 rc.2 中保持：

- Session V3 与生命周期持有的 `SessionHandle`；
- 显式 `Agent` API 与异步 `ctx.agents.create()` / `resume()`；
- `agent.inbox` 与驱动器内部 claim 边界；
- `main` / `sidebar.panellist` / `main.conversation` 的 Web Slot 层次；
- 可继续 Subagent、动态 System Prompt 与实验性 Agent Teams。

因此，从 rc.1 升级到 rc.2 不需要重新迁移 Session 格式、Agent API 或 Slot 拓扑。

## Feedback 在 rc.2 的最终交互语义

逐消息 Feedback 的 Host 契约仍以 `messageFeedback.list / put / delete` 为主，采用 opaque version 做乐观并发。浏览器侧在首次 hover/focus 后按 Session 拉取反馈；未记录的正向或负向评分都会打开反馈弹窗，提交成功关闭弹窗并提示，失败则保留弹窗和草稿。

Feedback 事件只写 Session Log，不进入模型上下文。rc.2 的变化主要是 Consumer/UI 交互对称化，不应误解为 Agent Runtime 新增了一条 Feedback 推理链。

## 升级检查清单

从 rc.1 升到 rc.2 重点检查三件事：

1. 自定义 Message Feedback UI 是否假设“点赞立即提交、点踩才弹窗”；
2. Feedback 请求失败时是否错误清空本地输入；
3. 是否对 Deliverables 卡片、Conversation 间距或 Code File Icon 使用了未公开的 DOM/CSS/内部实现依赖。

如果插件只依赖公开 Service、Remote、Slot 与 Agent API，rc.2 基本不需要额外迁移。

## 官方变更入口

- [v0.1.5-rc.2 Release](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.1.5-rc.2)
- [v0.1.5-rc.1...v0.1.5-rc.2 Compare](https://github.com/deepseek-ai/deepseek-harness/compare/dsh-v0.1.5-rc.1...dsh-v0.1.5-rc.2)

白皮书只维护 RC 与正式版本。`v0.1.6-alpha.1` 虽然已经发布，但 Alpha 不进入版本链；只有后续 `v0.1.6-rc.x` 或 Stable Release 才会生成新快照。
