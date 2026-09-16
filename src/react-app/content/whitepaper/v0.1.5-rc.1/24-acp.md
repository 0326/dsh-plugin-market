---
title: ACP 接入
chapter_id: acp
slug: acp
dsh_version: v0.1.5-rc.1
upstream_tag: dsh-v0.1.5-rc.1
upstream_commit: 183f08e9c6dde7e36cd2318eaee70b0da08fb35e
status: verified
verified_at: 2026-09-15
sources:
  - packages/acp/README.zh.md
  - packages/subagent/README.zh.md
  - docs/subsystems/session.zh.md
---
# ACP 接入

ACP Server 面向采用 Agent Client Protocol 的自动化客户端。它让外部 Client 使用标准 Agent 协议控制 DSH 的持久会话，而不要求 Client 了解 DSH 私有 SDK 的进程协议。

## Client 能做什么

当前版本的 ACP Server 支持创建、列出、恢复和关闭持久 Agent Session；挂载标准 MCP Server；选择模型选项；发送文本或图片 Prompt；接收语义更新；响应权限请求并取消工作。

## 何时选择 ACP

当 IDE、自动化平台或其他 Agent Client 已经以 ACP 为互操作协议时，优先使用 ACP。DSH 自身的 `subagent-acp` 也可以把 ACP Server 作为进程外 Subagent Provider，说明 ACP 同时适合外部集成和受控委派。

## 不应混淆的层次

| 目标 | 负责层 |
| --- | --- |
| 让外部 Client 控制 Agent | ACP 协议与 Server |
| 是否允许工具执行 | Sandbox、Approval、Permission Preset |
| 会话的可回放事实 | Session Event Log |
| 浏览器界面的权威状态 | Host / Remote / Client Model |

ACP 提供协议边界，并不绕过 DSH 的安全、持久化或运行时组合。集成方仍应正确处理权限请求、取消和会话关闭。
