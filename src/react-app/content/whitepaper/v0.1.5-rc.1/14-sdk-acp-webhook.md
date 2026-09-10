---
title: SDK / ACP / Webhook
chapter_id: sdk-acp-webhook
slug: sdk-acp-webhook
dsh_version: v0.1.5-rc.1
upstream_tag: dsh-v0.1.5-rc.1
upstream_commit: 183f08e9c6dde7e36cd2318eaee70b0da08fb35e
status: verified
verified_at: 2026-09-10
sources:
  - packages/sdk/README.zh.md
  - packages/acp/README.zh.md
  - packages/webhook/README.zh.md
---
# SDK / ACP / Webhook

SDK、ACP 与 Webhook 都能让 DSH 与外部系统连接，但入口方向不同。SDK / ACP 是外部客户端主动驱动 Agent，Webhook 是外部事件触发受信规则，再由规则创建 Session。

## 三种接入方式

| 方式 | 协议 / 模型 | 适合场景 |
| --- | --- | --- |
| SDK | 换行分帧 JSON-RPC | 应用自己控制 DSH 进程与 Session |
| ACP | Agent Client Protocol | IDE、自动化客户端按标准 Agent 协议接入 |
| Webhook | 已验证 Provider Event + Rule | GitHub 等事件触发自动 Session |

## SDK

SDK 家族包含协议、TypeScript Client 与 stdio Server。Client 可以用具名 Profile 和有序 Patch 启动 DSH 子进程，打开或恢复 Session、发送 Prompt，并观察 Session Event、Agent 状态和 Subagent 完成事件。

Python SDK 与 TypeScript SDK 使用同一协议。SDK 负责“驱动现有 Harness Runtime”，不负责生成开发者项目，也不建立另一套 Agent 模型。

## ACP

ACP Server 面向纯自动化客户端。客户端可以创建、列出、恢复和关闭持久 Agent Session，挂载标准 MCP Server，选择模型选项，发送文本 / 图片 Prompt，接收语义更新，响应权限请求并取消工作。

当外部工具已经采用 Agent Client Protocol 时，ACP 比私有 SDK 协议更合适；DSH 自身的 `subagent-acp` 也可把 ACP Server 作为进程外 Subagent Provider。

## Webhook

Webhook Runtime 接收通过 Provider 验证的外部事件，执行受信任规则，并可在 Web Workspace 中创建普通根 Session。Provider Adapter 负责身份验证与事件规范化，Rule 决定条件与 Session 请求。

rc.1 的 Webhook 分发是进程内 fire-and-forget：它不提供交付数据库、队列、重试、去重或 Agent 完成状态。如果业务要求可靠事件处理，应由外部系统提供这些保证，再调用 DSH。

## 选择原则

需要长期双向控制一个 Agent Runtime，选 SDK / ACP；需要被动响应外部事件，选 Webhook。不要用 Webhook 模拟可靠任务队列，也不要为了一个单向触发场景长期持有 SDK 进程连接。
