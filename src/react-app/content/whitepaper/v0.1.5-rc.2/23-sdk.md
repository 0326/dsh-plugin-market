---
title: SDK 接入
chapter_id: sdk
slug: sdk
dsh_version: v0.1.5-rc.2
upstream_tag: dsh-v0.1.5-rc.2
upstream_commit: fb2c4b9e698e30edb738bca4cf0618587db7d203
status: verified
verified_at: 2026-09-15
sources:
  - packages/sdk/README.zh.md
  - docs/subsystems/session.zh.md
  - docs/architecture.zh.md
---
# SDK 接入

SDK 面向“由应用主动驱动 DSH Runtime”的集成。SDK 家族包含协议、TypeScript Client 与 stdio Server；Python SDK 与 TypeScript SDK 使用同一协议。

## 它负责什么

Client 可以使用具名 Profile 与有序 Patch 启动 DSH 子进程，打开或恢复 Session、发送 Prompt，并观察 Session Event、Agent 状态和 Subagent 完成事件。SDK 驱动已有 Harness Runtime，不生成开发者项目，也不建立另一套 Agent 状态模型。

## 适用场景

当你的应用需要控制 DSH 进程、持久 Session 与完整事件流时，SDK 是直接入口。它适合服务端编排、命令行包装、测试工具和自有产品后端。

## 集成边界

1. Profile 与 Patch 决定最终插件树；不要假设默认 Tool、Provider 或 UI 一定存在。
2. 需要可回放事实时消费 `session/event`；`agent/*` 是运行期协调和状态，不是持久 transcript。
3. SDK Client 应处理启动、恢复、取消和资源释放，而不是长期保留无主子进程。
4. SDK 连接不替代安全策略。Tool 的 Sandbox、Approval 与 Provider 权限仍由 DSH 组合决定。

## 选择提示

如果外部客户端已经以 Agent Client Protocol 为主要接口，优先阅读“ACP 接入”；若外部系统只是用受验证事件触发新工作，则使用 Webhook，而不是长期维持 SDK 连接。
