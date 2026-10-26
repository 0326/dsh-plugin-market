---
title: Preset 与 Agent 组装
chapter_id: presets
slug: presets
dsh_version: v0.2.1-rc.3
upstream_tag: dsh-v0.2.1-rc.3
upstream_commit: 1f81c047fc48fa190a683e469daa699857e9afe8
status: draft
verified_at: 2026-10-26
sources:
  - packages/preset/README.zh.md
  - docs/subsystems/scope.zh.md
  - docs/subsystems/system-prompt.zh.md
---
# Preset 与 Agent 组装

> **Preview 状态**：本页由上一已发布白皮书快照迁移到 `v0.2.1-rc.3`，frontmatter 已锁定到官方 Tag/Commit，但正文尚未完成逐段源码复核。跨版本新增与破坏性变化优先以“版本演进”页及本页的 RC 迁移提示为准；完成逐章复核后才可发布。


Agent Preset 解决“同一个 DSH 进程里，不同 Session 使用不同 Agent 能力集合”的问题。它不是启动 Profile：Profile 决定整个进程装什么，Preset 决定某个 Agent 作用域里启用什么。

## Scope 关系

```mermaid id=preset-scope
flowchart TB
  G["全局 Profile / Providers"] --> A1["Agent A Scope"]
  G --> A2["Agent B Scope"]
  P1["Preset：analyst / agent.cordis.yml"] --> A1
  P2["Preset：coder / agent.cordis.yml"] --> A2
  A1 --> T1["Tools / Skills / Prompt / Persona A"]
  A2 --> T2["Tools / Skills / Prompt / Persona B"]
```

## Preset 的基本结构

一个 Agent Preset 是一个目录，核心文件为 `agent.cordis.yml`。从该 Preset 创建的 Session 会在自己的 Agent Scope 中挂载对应 Tool、Prompt 段、Skill 与其他插件贡献；同进程其他 Session 保持各自组合。

`agent-presets` 提供 `ctx.agentPresets`，负责 Preset 发现、名单、挂载与创作；`persona` 提供可组合的人设行，使 Preset 可以改变 Agent 身份，而不仅是 Tool 列表。

## Profile 与 Preset 的边界

| 维度 | Profile | Agent Preset |
| --- | --- | --- |
| 生命周期 | 进程启动级 | Agent / Session 级 |
| 作用范围 | 整棵 Plugin Tree | 单个 Agent Scope |
| 典型内容 | Provider、Host、Web、基础能力 | Tool、Skill、Prompt、Persona |
| 是否可多种并存 | 一个进程启动一个 Profile | 一个进程可同时有多个不同 Preset Agent |

需要新增一个全局 FS Provider 时用 Profile；需要某类 Agent 多一个领域 Skill 时用 Preset。

## Scope 如何保证隔离

Preset 挂载发生在 Agent Context 中。Scope 把该 Agent 的注册加入自己的父链，并让对应 Effect 随 Agent 生命周期销毁。因此 Preset 不需要修改全局注册表，也不会因为一个会话启用了某个 Tool 就让全部会话同时获得该 Tool。

## Tool Presentation

Agent 可用能力与模型最终看到的 Tool Schema 不是同一层。Core 中的 Agent Tool Presentation 可以按 Agent 选择如何呈现已注册 Tool，这使 Preset 能够控制模型表面，而不需要复制底层 Tool 实现。

## 适合业务插件的方式

业务产品通常应把“部署级能力”与“角色级能力”拆开：Provider 和基础 Service 放 Profile / Bundle，领域 Tool、Skill、Prompt 和 Persona 放 Preset。这样同一部署可以运行多个业务 Agent，同时共享底层基础设施。

源码定位建议从 `packages/preset/`、`docs/subsystems/scope.zh.md` 与 `docs/subsystems/system-prompt.zh.md` 进入。


## v0.2.1-rc.3 RC 迁移提示

Preset / Mode 的组合边界在 0.2.x 继续收敛：

- Subagent 可以配置独立 Agent Preset，用于统一角色与工具；
- Official 插件目录可按当前发布版安装 Claude Code / Codex 组合包，并用于 headless、SDK、ACP profile；
- SDK 默认 profile 从固定编程 Agent 调整为通用 AI Agent 身份；
- 工具展示模式不再保留旧的 `both` 混合模式，配置应迁移到 `native` 或 `ptc`。

升级时应显式声明需要的 Preset 与工具展示方式，不再依赖旧默认值。

官方入口：[v0.2.1-rc.3 Release](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.2.1-rc.3)。
