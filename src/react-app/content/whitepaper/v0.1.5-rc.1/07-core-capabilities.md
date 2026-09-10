---
title: 核心能力模块
chapter_id: core-capabilities
slug: core-capabilities
dsh_version: v0.1.5-rc.1
upstream_tag: dsh-v0.1.5-rc.1
upstream_commit: 183f08e9c6dde7e36cd2318eaee70b0da08fb35e
status: verified
verified_at: 2026-09-10
sources:
  - packages/README.zh.md
  - docs/capability-seams.zh.md
---
# 核心能力模块

DSH 的 `packages/` 不是按 UI 功能随意拆包，而是按能力家族组织。理解这些家族的职责，比记住全部包名更重要；具体 Provider 和 Tool 可以继续从各组 README 深入。

## 执行与环境

| 能力家族 | 主要职责 | 常见公开 Seam |
| --- | --- | --- |
| `subprocess` | 子进程生命周期 | `ctx.subprocess` |
| `shell` | Bash 执行 | `ctx.shell` |
| `terminal` | 持久 PTY | `ctx.terminals` |
| `sandbox` | 进程限制与策略 | `ctx.sandbox`、`ctx.sandboxPolicy` |
| `fs` | 文件系统 Provider | `ctx.fs` |
| `code-runtime` | 代码执行环境 | `ctx.codeRuntime` |
| `lsp` | Language Server 导航 | `ctx.lsp` |

Shell、Terminal、FS 并不等于本地 OS。它们通过 Seam 与 Provider 分离，因此可以在不同运行环境中替换实现。

## 模型能力

| 能力家族 | 主要职责 |
| --- | --- |
| `llm` | 模型适配器注册与请求准备 |
| `skill` | Skill Provider、发现与模型侧加载 |
| `context` | Workspace 指令、时间、引用等模型上下文 |
| `compaction` | 上下文压缩策略 |
| `web` | 搜索与 Fetch Provider |
| `subagent` | 子 Agent 委派与继续 |
| `workflow` | 多 Agent 脚本化编排 |

模型侧 Tool 通常只是这些能力的 Consumer。例如 `tool-web` 消费 Web Seam，`tool-subagent` 消费 Subagent Seam，File Tool 消费 FS Seam。

## 数据与产品支撑

Session 持久化、Session Query、Settings、Credentials、Storage、Workspace、Attachment、Spill、Feedback、Schedule、Goal 等家族负责 Agent 之外的持久数据、用户配置和产品域。

其中 Session 数据平面与普通 Storage 分开：Session Event Log 有自己的事件语义、迁移和 Projection；非会话业务数据使用 Storage / Domain 能力，不应塞进 Session 事件来代替数据库。

## 稳定性边界

官方包地图把大多数组视为产品稳定 API；`experimental` 不属于默认稳定能力，`e2b` 在 rc.1 中仍是 POC，`test-support`、`runtime-diagnostics` 与 `util` 的兼容性预期也更低。

第三方插件如果追求跨版本可维护性，应尽量依赖公开 Service Definition 与产品组 API，避免把实验包或实现细节当作长期契约。
