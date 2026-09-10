---
title: Agent Core
chapter_id: agent-core
slug: agent-core
dsh_version: v0.1.5-rc.1
upstream_tag: dsh-v0.1.5-rc.1
upstream_commit: 183f08e9c6dde7e36cd2318eaee70b0da08fb35e
status: verified
verified_at: 2026-09-10
sources:
  - docs/architecture.zh.md
  - docs/subsystems/core.zh.md
  - packages/core/README.zh.md
---
# Agent Core

Core 是 DSH 的产品 API 主干，但它仍然由可替换插件组成。Session、System Prompt、Tools、Agent 与 Agent Loop 各自拥有清晰职责；默认循环只是 `Agent` 约定的一种实现。

## Core 包的职责

| 包 | 公开能力 | 责任 |
| --- | --- | --- |
| `scope` | Agent 作用域原语 | 隔离单个 Agent 的注册与事件路由 |
| `session` | `ctx.sessions` | 仅追加事件日志与模型历史派生 |
| `system-prompt` | `ctx.systemPrompt` | 系统提示词分段组装 |
| `tools` | `ctx.tools` | Tool 注册与受守卫执行流水线 |
| `agent-tool-presentation` | Agent 内工具呈现 | 按 Preset 控制模型看到哪些 Tool |
| `agent` | `ctx.agents` | 公开 `Agent` 句柄、注册表与事件 |
| `agent-default-model` | `ctx.agentDefaultModel` | 新 Agent 的部署级默认模型 |
| `agent-loop` | `ctx.agentLoop` | 默认 Turn / Step 驱动器 |

## Agent API 与 Agent Loop 分离

插件应依赖 `dsh-agent` 提供的公开 `Agent` 契约，而不是导入默认 `agent-loop` 实现。这样循环驱动器可以被替换，UI、Hook、Tool 与业务插件仍然面向相同 Agent 句柄工作。

rc.1 已移除旧的 `ctx.agent` 隐式访问。需要操作具体 Agent 的调用方必须显式持有或接收 `Agent`，避免代码在多 Agent 场景中误用“当前 Agent”这一隐式全局概念。

## 一次 Step 依赖哪些 Core 能力

Agent Loop 在 Step 开始前从多个注册表组装请求面：System Prompt 生成模型可见提示词，Tools 生成当前 Agent 可见 schema，Session 提供派生历史，LLM Adapter 最终准备模型调用。

模型返回后，Assistant settlement 与 Tool Result 继续写入 Session。下一 Step 再从同一日志派生新的模型历史，因此 Core 的数据闭环以 Session Event 为中心，而不是以 Agent Loop 内部内存为中心。

## Scope 解决什么问题

一个进程可以同时运行多个能力集合不同的 Agent。Agent Scope 为每个 Agent 建立隔离的 Cordis 贡献链，Preset、Tool presentation、Prompt 段、Skill 等能力可以只挂载到目标 Agent，而不污染同进程其他会话。

因此“全局 Context”与“Agent Context”需要明确区分：部署 Provider 通常挂在全局 Context；会话个性化能力通常挂在 Agent Scope。

## Core 的稳定边界

新增模型可见能力通常不需要修改 Agent Loop：Tool 注册到 `ctx.tools`，系统上下文进入 Prompt / Session，拦截走 `agent/*` 或 `tools/*` 事件。只有标准 Turn / Step 生命周期本身不满足产品需求时，才需要考虑自定义 Agent 驱动器。
