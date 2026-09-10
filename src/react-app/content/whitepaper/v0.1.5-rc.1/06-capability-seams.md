---
title: Capability Seam
chapter_id: capability-seams
slug: capability-seams
dsh_version: v0.1.5-rc.1
upstream_tag: dsh-v0.1.5-rc.1
upstream_commit: 183f08e9c6dde7e36cd2318eaee70b0da08fb35e
status: verified
verified_at: 2026-09-10
sources:
  - docs/capability-seams.zh.md
  - docs/architecture.zh.md
  - packages/README.zh.md
---
# Capability Seam

Capability Seam 是 DSH 保持开放性的核心边界：能力的接口、默认实现与消费方分离，使同一个 Agent 能在不同组合中使用本地、远程、受限或第三方 Provider，而 Consumer 不需要改写业务逻辑。

## Definition、Provider、Consumer

一个典型 Seam 包含三种角色：

| 角色 | 负责什么 | 例子 |
| --- | --- | --- |
| Service Definition | 定义 Context Key、类型与稳定接口 | `ctx.fs`、`ctx.llm`、`ctx.sandbox` |
| Provider | 注册具体实现 | Local FS、E2B FS、DeepSeek LLM Adapter |
| Consumer | 使用能力完成面向模型或用户的功能 | File Tool、Bash Tool、Web UI |

扩展插件应依赖 Definition，而不是具体 Provider。这样 Provider 可以在 Profile / Bundle 层替换，Consumer 仍保持可复用。

## 哪些能力适合做 Seam

当能力需要满足以下任一条件时，应优先使用 Service Seam：

- 存在多种后端实现；
- 需要本地与远程环境切换；
- 需要按部署选择安全策略；
- 多个 Tool 或模块共享同一能力；
- 希望第三方扩展提供新实现。

rc.1 中典型 Seam 包括 LLM、Filesystem、Shell、Terminal、Sandbox、Subprocess、Code Runtime、Web、Skills、Subagents、Jobs、Session Persistence、Storage、Credentials 等。

## Service、Event、Tool 的边界

**Service** 表达“长期存在且可被替换的能力”。**Event** 表达“某件事正在发生，观察者可以监听或参与决策”。**Tool** 表达“模型可以主动调用的能力”。

同一功能可能同时经过三层：例如文件工具是模型可见 Tool，它调用 `ctx.fs` Service，而执行前后又经过 `tools/*` Event 流水线。把三者混成一个插件 API，会失去替换与拦截能力。

## Capability Map 的用途

官方 `capability-seams` 文档由模块图生成，能直接看到某个 `ctx.*` Service 的定义包、Provider 与 Consumer。开发新插件时，应先在该图确认现有 Seam，再决定扩展 Provider、增加 Consumer，还是定义新的 Service。

## 不要从 Provider 反向定义业务

例如需要限制文件访问时，不应让 Tool 直接依赖某个 Local FS 实现；应通过 FS / Sandbox / Policy 的公开接口完成。这样同一 Tool 才能在本地、E2B 或后续远程 Provider 下保持一致行为。
