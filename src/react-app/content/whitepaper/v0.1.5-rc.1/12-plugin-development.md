---
title: 插件开发与扩展面
chapter_id: plugin-development
slug: plugin-development
dsh_version: v0.1.5-rc.1
upstream_tag: dsh-v0.1.5-rc.1
upstream_commit: 183f08e9c6dde7e36cd2318eaee70b0da08fb35e
status: verified
verified_at: 2026-09-10
sources:
  - docs/architecture.zh.md
  - docs/cookbook/extension-cookbook.zh.md
  - docs/subsystems/slots.zh.md
  - packages/client/ui-slots/README.zh.md
  - packages/core/agent-loop/README.zh.md
---
# 插件开发与扩展面

DSH 扩展的关键是先确定行为属于哪个 seam。Tool、LLM Provider、Session State、Request Interceptor 与 Web UI 分别有不同的公开挂载点。

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

扩展插件应优先依赖 Definition。这样 Local FS 与 Remote FS、Local Shell 与受限执行环境可以在组合层替换，而 Tool Consumer 不需要分叉实现。

## Event 用于在途扩展

Session Event 是持久事实；`agent/*`、`tools/*` 等运行时 Event 用于观察或拦截正在发生的工作。

需要改变一次请求怎样执行时优先选择 Event；需要增加长期可替换能力时设计 Service Seam；需要让模型直接调用能力时注册 Tool。

## Agent API：显式传递 Agent

rc.1 已移除旧的 `ctx.agent`。插件不能再假设 Context 上隐含一个当前 Agent；需要 Agent 的 API 应显式接收或持有 `Agent`，创建与恢复则通过 `ctx.agents` 完成。

`ctx.agents.create()` / `resume()` 返回 `AgentHandle`，因此创建 Agent 的插件也应明确处理其异步创建和 teardown 所有权。

## Inbox API：通过 agent.inbox 访问

rc.1 中 `Inbox` 是类型接口，不再作为可构造的运行时类导出。插件通过 `agent.inbox` 读写待处理消息；领取等驱动器内部操作不属于公共接口。

这进一步明确了边界：插件可以操作公开 Inbox，Agent Loop 负责内部 claim 与持久化投影的一致性。

## Web UI 也是插件面

Web Client 使用 Client Module 与类型化 UI Slot 组合界面。Slot 支持 `single`、`list`、`keyed`、`chain` 四种组合形态，注册项随插件生命周期撤销。

rc.1 的主区域使用 root-scoped keyed `main` Slot：`conversation` 是其中的保留 key，并由 `main.conversation` 子 Slot 承载会话区域。侧栏面板入口使用 `sidebar.panellist` list；条目的 id 与对应 `main` 面板 key 匹配。

因此，需要新增全局工作面板时，应同时考虑 `main` 内容注册与 `sidebar.panellist` 导航入口；需要增强现有对话区域时，则进入 `main.conversation` 下已开放的子 Slot，而不是依赖旧的顶层 `conversation` Slot。

## 插件开发的依赖原则

官方 package map 要求扩展插件依赖 Service Definition，避免直接依赖具体 Provider；`agent-loop` 也属于可替换驱动，因此面向 Agent 行为的插件应依赖公开 `agent` / `ctx.agents` API。

这条规则使插件能够在不同 Profile、Preset 与 Provider 组合中复用。
