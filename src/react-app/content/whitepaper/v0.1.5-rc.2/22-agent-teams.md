---
title: Agent Teams（实验）
chapter_id: agent-teams
slug: agent-teams
dsh_version: v0.1.5-rc.2
upstream_tag: dsh-v0.1.5-rc.2
upstream_commit: fb2c4b9e698e30edb738bca4cf0618587db7d203
status: experimental
verified_at: 2026-09-15
sources:
  - docs/subsystems/agent-team.zh.md
  - packages/subagent/README.zh.md
  - packages/README.zh.md
---
# Agent Teams（实验）

Agent Teams 用于多个持续角色之间的长期协作。它维护隐式 Lead、具名且可继续的 Teammate、持久 Peer Mailbox 和共享 Task DAG；它不是把多个一次性 Subagent 简单并排执行。

## 与其他机制的区别

| 机制 | 主体 | 关键目标 |
| --- | --- | --- |
| Subagent | 父 Agent 与一个子会话 | 委派一项认知任务 |
| Workflow | 编排脚本与多个动作 | 控制并发、顺序和收敛 |
| Jobs | 拥有者与后台任务 | 不阻塞当前 Turn 的执行 |
| Agent Teams | 多个持续 Agent 角色 | 消息协作与共享任务状态 |

## 使用前提

当前版本中 Agent Teams 可作为独立 npm 包安装，但不在默认 Profile 中启用，仍属于实验能力。第三方插件不应把它作为稳定的基础依赖，也不应假设所有部署都挂载了对应 Provider。

## 采用原则

只有当任务需要多个角色持续交换信息、维护共享 Task DAG、并能接受实验能力的演进风险时才使用 Agent Teams。稳定的单任务委派优先走 Subagent Seam；需要确定性协调时优先走 Workflow；需要后台化单个操作时优先走 Jobs。

将其作为可选增强能力，并在 Profile、权限、恢复和观测链路上提供明确降级方案，才能避免实验特性扩散为不可控的运行时前提。
