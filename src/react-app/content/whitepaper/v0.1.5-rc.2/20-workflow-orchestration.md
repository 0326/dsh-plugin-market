---
title: Workflow 编排
chapter_id: workflow-orchestration
slug: workflow-orchestration
dsh_version: v0.1.5-rc.2
upstream_tag: dsh-v0.1.5-rc.2
upstream_commit: fb2c4b9e698e30edb738bca4cf0618587db7d203
status: verified
verified_at: 2026-09-15
sources:
  - packages/workflow/README.zh.md
  - docs/subsystems/workflow.zh.md
  - packages/sandbox/README.zh.md
---
# Workflow 编排

Workflow 是把多个 Agent 动作组织成一个明确协调过程的机制。`ctx.workflowEngine` 运行编排脚本；脚本负责 fan-out、等待、分支和结果组合，实际认知工作仍由 Agent 完成。

## 适用边界

当任务的重点是“多个子任务如何被确定地安排”时，选择 Workflow。它适合并行调研、按条件收敛、固定循环或在多个 Subagent 结果之间做组合。若只有一个任务要交给另一个 Agent，应直接使用 Subagent；若只是后台等待，则使用 Jobs。

## 运行模型

默认 Worker Thread Provider 将脚本的同步计算移出 Host Event Loop，但这只是执行隔离，不是安全边界。脚本或其输入不可信时，仍需要 Sandbox、Remote Runtime 或其他受控执行能力；不能把 Worker Thread 当作授权、审计或文件系统隔离。

`tool-workflow` 暴露通用脚本化编排，`tool-ralph` 提供固定的全新 Agent 迭代循环。二者都应通过公开引擎和 Tool 表面组合，不应由插件直接依赖内部 worker 实现。

## 编排设计检查

| 检查项 | 需要明确的事实 |
| --- | --- |
| 并行度 | 哪些任务可并发，哪些步骤必须等待前置结果？ |
| 失败语义 | 一个分支失败时，是取消、重试、降级还是保留部分结果？ |
| 会话边界 | 哪些工作需要独立 Subagent 历史，哪些只是当前 Agent 的控制流？ |
| 安全边界 | 脚本、文件和网络操作由哪个 Provider / Sandbox 约束？ |

把这些约束写成编排逻辑，能避免用“多次 Tool Call”隐式模拟一个难以诊断的工作流。
