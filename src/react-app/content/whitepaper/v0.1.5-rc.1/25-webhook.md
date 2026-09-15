---
title: Webhook 事件接入
chapter_id: webhook
slug: webhook
dsh_version: v0.1.5-rc.1
upstream_tag: dsh-v0.1.5-rc.1
upstream_commit: 183f08e9c6dde7e36cd2318eaee70b0da08fb35e
status: verified
verified_at: 2026-09-15
sources:
  - packages/webhook/README.zh.md
  - docs/subsystems/webhook.zh.md
  - packages/webhook/webhook-github/README.zh.md
---
# Webhook 事件接入

Webhook 用于把经过身份验证的外部事件转为 DSH Session 创建请求。它的入口方向与 SDK / ACP 相反：外部事件到达，受信任规则决定是否创建普通根 Session。

## 处理链路

Provider Adapter 负责验证身份并规范化交付；Rule 负责任意条件和外部调用，随后返回 `null` 或 Session 请求；`ctx.webhookRuntime` 负责规则注册、回调生命周期和基于 Workspace 的 Session 创建。GitHub 适配器是这一模型的具体消费者。

## 明确的非目标

当前分发只存在于进程内，且为 fire-and-forget。它不拥有交付数据库、队列、重试、去重或 Agent 完成状态。因此 Webhook 不是可靠任务队列，也不能单独提供业务审计与至少一次交付保证。

## 集成原则

1. 先在 Provider Adapter 验证事件身份，再让 Rule 处理业务条件。
2. 把可靠投递、去重、重试与状态机放在外部系统；确认后再调用 DSH。
3. Rule 是受信任程序化逻辑，不把任意外部载荷直接当作可执行配置。
4. 需要长连接控制和持续事件观察时，改用 SDK 或 ACP。

## 运行时边界

Webhook 创建的是普通 DSH Session，后续 Tool、权限和 Sandbox 行为仍由该 Session 的 Profile、Preset 和 Provider 决定。事件触发本身不构成授权提升。
