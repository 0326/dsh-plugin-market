---
title: 版本演进
chapter_id: evolution
slug: evolution
dsh_version: v0.1.5-rc.2
upstream_tag: dsh-v0.1.5-rc.2
upstream_commit: fb2c4b9e698e30edb738bca4cf0618587db7d203
status: verified
verified_at: 2026-09-16
sources:
  - docs/subsystems/feedback.zh.md
  - packages/client/ui-message-feedback/README.zh.md
  - packages/client/ui-deliverables/README.zh.md
  - packages/client/ui-chat/README.zh.md
  - packages/client/ui-primitives/README.zh.md
---
# 版本演进

`v0.1.5-rc.2` 相对 `v0.1.5-rc.1` 是一次**低迁移成本的 UI / Feedback 行为修订**。官方 Compare 显示 rc.2 领先 rc.1 4 个提交，变化主要集中在 Feedback 提交流程、Deliverables 展示、Conversation 间距和代码文件图标；没有发现需要重新迁移 Agent Core、Session V3、Capability Seam 或 Web Slot 主干的变化。

升级时不要先问“改了多少文件”，而要先问：**公开契约变了吗、持久格式变了吗、我是否依赖了内部 UI 实现。**

## 先判断迁移等级

| 检查维度 | rc.1 → rc.2 | 迁移判断 |
| --- | --- | --- |
| Agent / Session 公共主干 | 未发现新的 breaking change | 无需重新迁移核心运行时 |
| 持久 Session 格式 | 仍为 V3 | 无数据格式迁移 |
| Capability / Plugin 主干 | 保持 rc.1 基线 | 正常公开扩展点无需重做 |
| Web Slot 拓扑 | 保持 rc.1 基线 | 依赖公开 Slot 的插件影响低 |
| Message Feedback UI 语义 | 有变化 | 自定义 Feedback UI 需要复核 |
| Deliverables / Conversation / Icons | 有视觉与内部实现调整 | 依赖 DOM/CSS/内部组件时需要复核 |

因此这不是“零变化”，但主要风险在 **Consumer/UI 假设**，而不是 Agent Runtime 或持久数据层。

## 变化要按“旧行为 → 新行为 → 动作”看

| 领域 | rc.1 行为/假设 | rc.2 行为 | 开发者动作 | 如何验证 |
| --- | --- | --- | --- | --- |
| Message Feedback | 正负反馈交互不完全对称 | 正负反馈都先进入弹窗确认后提交 | 检查自定义 Feedback UI 的提交时机 | 正向/负向各走一次提交 |
| Feedback 失败 | UI 可能按旧流程提前结束交互 | 失败保留草稿并显示错误 | 不要失败后清空本地输入 | 模拟失败并确认草稿仍在 |
| Feedback 撤回 | 旧代码可能只处理新增评分 | 再次点击已记录评分可撤回 | 区分 create / remove 状态 | 已有评分再次点击后确认删除 |
| Deliverables | 旧卡片布局 | 卡片排版调整 | 检查是否依赖内部 DOM/CSS | 用真实 deliverable 回归自定义样式 |
| Conversation | 旧消息/交付间距 | 间距调整 | 避免写死内部 spacing | 检查不同消息组合布局 |
| Code File Icons | 旧图标 artwork | 图标实现刷新 | 不依赖内部 SVG/artwork 结构 | 检查自定义覆盖是否仍成立 |

这类迁移表比 Release 列表更重要，因为它直接告诉你“什么代码需要动、怎么证明已经适配”。

## Feedback 是本次最值得关注的行为变化

Host 侧契约仍围绕 `messageFeedback.list / put / delete`，并通过 opaque version 处理并发。rc.2 主要改变 Consumer/UI 交互：未记录的正向或负向评分都会进入确认弹窗，提交成功后关闭，失败时保留当前输入和弹窗状态。

如果你维护自定义 Feedback UI，最容易出现三种兼容问题：

1. 仍假设“点赞立即提交、点踩才弹窗”；
2. 请求失败后清空用户已经填写的反馈；
3. 把再次点击已存在评分继续当成新增，而不是撤回。

Feedback 事件仍写入 Session Log，但不进入模型上下文。本次变化属于 UI/Consumer 交互，不代表 Agent Runtime 新增了“模型会读取用户评分”的推理链。

## 哪些 rc.1 契约继续有效

rc.2 没有要求重新处理下面这些 rc.1 迁移项：

- Session V3 与生命周期持有的 `SessionHandle`；
- 显式 `Agent` API 与异步 `ctx.agents.create()` / `resume()`；
- `agent.inbox` 与驱动器内部 claim 边界；
- `main` / `sidebar.panellist` / `main.conversation` 的 Web Slot 层次；
- 可继续 Subagent、动态 System Prompt 与实验性 Agent Teams。

这里的含义是“从 rc.1 升 rc.2 不需要再次迁移这些契约”，不是承诺它们在未来所有版本中都不变。

## 三类项目的升级动作不同

### 只使用公开 Agent / Service / Slot API

风险最低。重点跑现有集成测试和 Web smoke，确认版本升级没有破坏组合即可。

### 自定义 Message Feedback UI

需要专项回归正向、负向、失败保留和撤回四条路径。只验证“请求能成功”不足以覆盖 rc.2 的交互语义变化。

### 覆盖内部 DOM / CSS / Icon artwork

风险最高，因为本次变更正好集中在内部 UI 表现。应把这些依赖视为实现耦合，升级时逐项重新确认；若能迁回公开 Slot、组件契约或稳定 class/token，应优先降低这种耦合。

## 升级验证顺序

1. **锁定版本**：确认从 `dsh-v0.1.5-rc.1` 升到 `dsh-v0.1.5-rc.2`，不要混入后续 Alpha 代码；
2. **检查公开契约**：Agent / Session / Capability / Slot 是否真的发生 breaking change；
3. **检查自定义 UI 假设**：Feedback、Deliverables、Conversation、Icon 是否有内部依赖；
4. **跑专项行为测试**：尤其是 Feedback 四条关键路径；
5. **跑已有集成/构建**：确保 Profile、插件和站点仍可交付；
6. **记录剩余内部依赖**：无法迁掉的 DOM/CSS 覆盖进入下一次升级清单。

## 不要把“没有核心 breaking change”理解成“无需验证”

本次升级的核心运行时风险较低，但 UI 内部依赖仍可能直接破坏产品。版本迁移的判断单位应该是“你的依赖面”，不是 Release 的营销级别。

如果你的插件只依赖公开 Service、Remote、Slot 与 Agent API，rc.2 的额外迁移工作很少；如果直接覆盖 Feedback 交互或内部 DOM/CSS，则需要针对本次实际改动做回归。

## 官方变更入口

- [v0.1.5-rc.2 Release](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.1.5-rc.2)
- [v0.1.5-rc.1...v0.1.5-rc.2 Compare](https://github.com/deepseek-ai/deepseek-harness/compare/dsh-v0.1.5-rc.1...dsh-v0.1.5-rc.2)

白皮书只维护 RC 与正式版本。`v0.1.6-alpha.1` 已发布，但按当前策略不进入版本链；后续只有 `v0.1.6-rc.x` 或 Stable Release 才生成新快照。
