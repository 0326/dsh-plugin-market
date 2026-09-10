---
title: Subagent / Workflow / Jobs
chapter_id: subagent-workflow-jobs
slug: subagent-workflow-jobs
dsh_version: v0.1.5-rc.1
upstream_tag: dsh-v0.1.5-rc.1
upstream_commit: 183f08e9c6dde7e36cd2318eaee70b0da08fb35e
status: verified
verified_at: 2026-09-10
sources:
  - packages/subagent/README.zh.md
  - docs/subsystems/subagent.zh.md
  - packages/workflow/README.zh.md
  - docs/subsystems/workflow.zh.md
  - packages/jobs/README.zh.md
  - docs/subsystems/jobs.zh.md
---
# Subagent / Workflow / Jobs

Subagent、Workflow 与 Jobs 都能让工作脱离当前同步 Tool Call，但三者解决的问题不同：Subagent 是任务委派，Workflow 是多 Agent 编排，Jobs 是后台任务生命周期。

## 三者怎么选

| 能力 | 核心抽象 | 适合场景 |
| --- | --- | --- |
| Subagent | 子 Agent 会话 | 把一项认知任务交给另一个 Agent |
| Workflow | 编排脚本 | 并行或按规则组织多个 Subagent |
| Jobs | 后台任务 | 长时间执行、无需阻塞当前 Turn 的工作 |

## Subagent

`ctx.subagents` 是委派 Provider 与继续服务。rc.1 支持多种后端：全新进程内 Agent、从父级稳定历史 Fork 的进程内 Agent、ACP、Codex、Claude Code，以及通过 DSH SDK 启动的进程外 Harness Agent。

父 Agent 可以发现自己创建的子级；面向模型的控制工具还支持消息、停止与状态查询。rc.1 的可继续子代理增加了排队、编辑、删除、Steer 与停止语义，因此 Subagent 已不只是一次性函数调用。

## Workflow

`ctx.workflowEngine` 运行由模型编写的编排脚本。脚本本身负责 fan-out、等待与组合返回值，真正的任务执行仍由 Agent 完成。

默认 Worker Thread Provider 把脚本同步计算移出 Host Event Loop，但官方明确指出这只是隔离，不是安全边界。需要安全执行不可信代码时仍应使用 Sandbox / Remote Runtime 等更强隔离能力。

`tool-workflow` 提供通用脚本化编排；`tool-ralph` 提供固定的全新 Agent 迭代循环。

## Jobs

`ctx.jobs` 管理后台任务的 id、归属与生命周期。任务属于启动它的 Agent Session，一个 Agent 不会看到另一个 Agent 的 Job。

长时间 Tool 可以把工作注册为 Job 后立即返回，拥有者继续自己的 Turn。任务完成时通过 Session 内通知送达，不要求模型持续轮询。`tool-jobs` 负责读取、等待、列出与取消。

## 组合原则

Workflow 可以创建 Subagent，Subagent 内部也可以启动 Job，但不要因为“异步”就统一使用某一种机制。是否需要独立 Agent 历史、是否需要脚本化多任务协调、是否需要后台生命周期，是选择三者的主要判断依据。
