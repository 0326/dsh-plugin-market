---
title: Hooks 与拦截
chapter_id: hooks-interception
slug: hooks-interception
dsh_version: v0.1.5-rc.1
upstream_tag: dsh-v0.1.5-rc.1
upstream_commit: 183f08e9c6dde7e36cd2318eaee70b0da08fb35e
status: verified
verified_at: 2026-09-10
sources:
  - docs/architecture.zh.md
  - packages/hooks/README.zh.md
  - docs/subsystems/tools.zh.md
---
# Hooks 与拦截

DSH 原生扩展面以类型化 Event / Waterfall 为主；Hooks 组的主要作用，是把已有 Claude Code 或 Codex `hooks.json` command hook 接入这些原生生命周期，而不是建立另一套平行 Agent 内核。

## 原生拦截点

Agent 与 Tool 主链路提供多处可参与决策的事件：

| 阶段 | 主要扩展点 | 典型用途 |
| --- | --- | --- |
| Step 组装前 | `agent/pre-step` | 调整本 Step 是否继续、准备上下文 |
| 模型请求前 | `agent/request` | 修改或补全请求配置 |
| Tool 执行前 | `tools/pre-execute` | 权限、策略、参数检查 |
| Tool 执行 | `tools/execute` | 包装或替代执行 |
| Tool 执行后 | `tools/post-execute` | 结果处理、Telemetry |
| Turn 停止 | `agent/turn-stopping` | 判断是否仍欠后续工作 |

其中请求与 Tool 相关的关键点采用 Waterfall，使多个插件可以按顺序参与并返回 Decision，而不是让调用方硬编码所有策略。

## Hook Bridge

`packages/hooks` 提供共享 `hook-protocol`，以及 `hooks-claude-code`、`hooks-codex` 两个桥接插件。它们读取现有 Hook 配置，并在 Session 开始、Prompt 到达、Tool 运行或停止阶段执行受支持的 shell command hook。

Hook 可以产生模型可见阻断消息、追加上下文或要求 Agent 继续运行。支持范围以来源工具的 command hook 子集为准，并不保证两套外部 Hook 协议完全等价。

## 新插件优先使用原生事件

已有企业 Hook 资产需要迁移时，Bridge 可以降低接入成本；新开发的 DSH 插件则应优先依赖 `agent/*`、`tools/*` 和 Service Seam。这样类型、生命周期、Agent Scope 与错误语义都由 DSH 运行时统一管理。

## 不要修改具体 Tool 绕过流水线

权限、Guard、Telemetry 等横切能力应进入 `tools/pre-execute → tools/execute → tools/post-execute`。如果每个 Tool 自己实现审批或审计，会导致 Provider 替换后行为不一致，也让第三方 Tool 无法自动获得统一策略。
