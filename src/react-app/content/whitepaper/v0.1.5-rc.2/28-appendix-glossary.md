---
title: 术语表
chapter_id: appendix-glossary
slug: appendix-glossary
dsh_version: v0.1.5-rc.2
upstream_tag: dsh-v0.1.5-rc.2
upstream_commit: fb2c4b9e698e30edb738bca4cf0618587db7d203
status: verified
verified_at: 2026-09-15
sources:
  - README.zh.md
  - docs/architecture.zh.md
  - docs/capability-seams.zh.md
  - docs/subsystems/session.zh.md
  - docs/subsystems/slots.zh.md
---
# 术语表

本表采用当前版本官方文档中的用法。术语用于定位职责边界，不替代源码中的精确类型定义。

| 术语 | 本白皮书中的含义 |
| --- | --- |
| Cordis Context | 插件注册 Service、Event Listener 和 Effect 的组合上下文；生命周期可逆。 |
| Plugin Tree | 启动后由 Profile、Bundle 和 Patch 形成的插件组合树。 |
| Profile | 一次 DSH 应用启动采用的组合模板。 |
| Bundle / Patch | Bundle 提供成组组合，Patch 以更高优先级覆盖或补充配置。 |
| Agent | 运行中的公开句柄；默认驱动可由 `agent-loop` 提供，但扩展依赖公开 Agent API。 |
| Session Event Log | 持久事实层；历史、Turn、Step、消息与 Tool 结果可由它派生和回放。 |
| Capability Seam | 将能力拆为 Definition、Provider、Consumer 的可替换边界。 |
| Provider / Consumer | Provider 实现能力，Consumer 依赖稳定接口使用能力。 |
| Preset / Agent Scope | 面向单个 Agent 组合 Tool、Skill、Prompt、Persona 等能力的范围。 |
| Tool Pipeline | Tool 执行前、中、后的统一路径；权限、审计与拦截应在此类公共边界处理。 |
| Projection | 从 Host 权威状态或 Session Event 派生、供 Client/UI 消费的投影。 |
| Slot | Web UI 的类型化组合点，定义 cardinality、scope、owner props 与生命周期。 |
| Subagent | 由父 Agent 委派、拥有独立会话和可继续控制面的 Agent。 |
| Workflow | 编排脚本驱动的多步骤或多 Agent 协调过程。 |
| Job | 属于某个 Agent Session 的后台任务生命周期。 |

## 容易混淆的三组词

**Session Event 与 `agent/*`**：前者是持久、可回放的事实；后者是实时协调、状态和流式事件。

**Service Seam 与 Tool**：Service Seam 是插件间可替换能力边界；Tool 是模型可调用表面。一个 Tool 可以消费 Service，但两者不是同一个抽象。

**Host State 与 Client Model**：Host 保留权威 Mutation 与持久化责任；Client Model 是可重连、可替换的浏览器投影。
