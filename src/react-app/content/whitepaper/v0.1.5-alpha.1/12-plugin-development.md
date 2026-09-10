---
title: 插件开发与扩展面
chapter_id: plugin-development
slug: plugin-development
dsh_version: v0.1.5-alpha.1
upstream_tag: dsh-v0.1.5-alpha.1
upstream_commit: 5dda764ed3aa172535a7967b06ff95d9cbfe536a
status: verified
verified_at: 2026-09-10
sources:
  - docs/architecture.zh.md
  - docs/cookbook/extension-cookbook.zh.md
  - packages/client/ui-slots/README.zh.md
---
# 插件开发与扩展面

DSH 扩展的关键不是找到一个统一 Plugin API，而是先确定行为属于哪个 seam。Tool、LLM Provider、Session State、Request Interceptor 与 Web UI 分别有不同的公开挂载点。

## 扩展能力地图

| 目标 | 首选扩展点 |
| --- | --- |
| 增加模型 Provider | `ctx.llm` Adapter |
| 增加模型可调用能力 | `ctx.tools` |
| 拦截模型请求 | `agent/request` |
| 拦截 Tool 执行 | `tools/pre-execute` / `tools/execute` / `tools/post-execute` |
| 增加文件系统实现 | `ctx.fs` Provider |
| 增加 Shell / Terminal 实现 | 对应 Capability Provider |
| 增加持久会话事实 | `SessionEventMap` |
| 为单个 Agent 改能力集合 | Agent Preset + Agent Scope |
| 增加 Web UI | Client Module + UI Slot |
| 接外部系统 | SDK / ACP / Webhook |

## Service Definition、Provider、Consumer

一个可替换能力通常包含三种角色：

**Service Definition** 定义接口与 Context Key；**Provider** 提供具体实现；**Consumer** 使用接口完成面向 Agent 或用户的能力。

扩展插件应尽量依赖 Definition。这样 Local FS 与 Remote FS、Local Shell 与受限执行环境可以在组合层替换，而 Tool Consumer 不需要分叉实现。

## Event 用于在途扩展

Session Event 是持久事实；`agent/*`、`tools/*` 等运行时 Event 用于观察或拦截正在发生的工作。

需要“改变一次请求怎样执行”时优先选择 Event；需要“增加长期可替换能力”时优先设计 Service Seam；需要“让模型直接调用能力”时注册 Tool。

## Web UI 也是插件面

Web Client 使用 Client Module 与类型化 UI Slot 组合界面。Slot 支持 `single`、`list`、`keyed`、`chain` 等组合形态，注册项随插件生命周期撤销。

因此业务插件可以在不 Fork 主站 UI 的情况下贡献会话区域、设置区域或其他已开放 Slot。具体能挂在哪里，以目标版本的 Client Slot 定义为准。

## 插件开发的依赖原则

官方 package map 明确要求扩展插件依赖 Service Definition，避免直接依赖具体 Provider；`agent-loop` 也属于可替换驱动，因此面向 Agent 行为的插件应依赖公开 `agent` API。

这条规则是保持插件跨组合可用的基础。
