---
title: Jobs 后台执行
chapter_id: jobs-background
slug: jobs-background
dsh_version: v0.1.5-rc.2
upstream_tag: dsh-v0.1.5-rc.2
upstream_commit: fb2c4b9e698e30edb738bca4cf0618587db7d203
status: verified
verified_at: 2026-09-15
sources:
  - packages/jobs/README.zh.md
  - docs/subsystems/jobs.zh.md
  - docs/subsystems/session.zh.md
---
# Jobs 后台执行

Jobs 管理长时间任务的 id、归属与生命周期。它的目标是让 Tool 把工作登记为后台任务后立即返回，让拥有者继续当前 Turn，而不是阻塞等待执行结束。

## 所有权模型

`ctx.jobs` 的任务属于启动它的 Agent Session；一个 Agent 不会看到另一个 Agent 的 Job。这条边界使等待、列举和取消始终由明确的拥有者处理，也避免把后台任务误用成跨会话全局队列。

任务完成时，结果通过 Session 内通知送达，不要求模型持续轮询。`tool-jobs` 提供读取、等待、列出和取消等面向模型的控制面。

## 何时应该用 Jobs

| 情况 | 选择 |
| --- | --- |
| 单个长时间 Tool 不应占用当前 Turn | Jobs |
| 需要另一个 Agent 的独立推理历史 | Subagent |
| 需要脚本协调多个 Agent 或步骤 | Workflow |
| 需要可靠交付、重试、去重和跨进程队列 | 外部可靠任务系统，再与 DSH 集成 |

## 设计注意事项

Jobs 解决的是会话内后台生命周期，不声明持久交付队列语义。插件应明确取消、超时、资源释放和完成通知的行为；若业务需要跨重启、去重、重试或审计，必须由持久化的外部系统提供这些保证。
