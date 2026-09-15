---
title: Subagent 委派
chapter_id: subagent-delegation
slug: subagent-delegation
dsh_version: v0.1.5-rc.2
upstream_tag: dsh-v0.1.5-rc.2
upstream_commit: fb2c4b9e698e30edb738bca4cf0618587db7d203
status: verified
verified_at: 2026-09-15
sources:
  - packages/subagent/README.zh.md
  - docs/subsystems/subagent.zh.md
  - packages/sdk/README.zh.md
---
# Subagent 委派

Subagent 解决的是“把一项认知任务交给另一个 Agent，并保留其独立会话”的问题。`ctx.subagents` 提供委派与继续服务；它不是把普通函数放进后台执行的别名。

## 何时选择 Subagent

选择 Subagent 的前提是任务需要自己的上下文、工具过程或可继续历史，例如调研、审查、长链路实施。只需要不阻塞当前 Turn 的执行，优先看 Jobs；需要一个脚本协调多个委派，优先看 Workflow。

## 委派后的边界

当前版本支持进程内新建 Agent、从父级稳定历史 Fork 的 Agent，以及 ACP、Codex、Claude Code 和 DSH SDK 驱动的进程外 Provider。无论 Provider 怎样实现，父 Agent 面向的是稳定的委派接口，而不是某个后端私有进程。

父 Agent 可以发现自己创建的子级，并通过公开控制面查询状态、发消息或停止。可继续子代理还包含排队、编辑、删除、Steer 与停止语义；因此它应被当作受生命周期管理的会话，而非一次性回调。

## 插件设计要点

1. 依赖 `ctx.subagents` 的公开契约，不把某个 Provider 的进程模型写进业务逻辑。
2. 明确谁创建、谁继续、谁停止；不要把子会话当成无主资源。
3. 需要把结果写回当前工作流时，使用公开消息或完成事件，不读取 Provider 内部状态。
4. 子代理的权限、Preset 和 Provider 仍由其组合决定；委派不会自动绕过 Sandbox 或 Approval。

## 与 Session 的关系

Subagent 的价值在于独立 Agent 历史与可恢复控制。需要判断“子代理当时看到了什么”时，仍应回到对应 Session Event Log；实时 `agent/*` 只用于运行期协调，不能替代持久证据。
