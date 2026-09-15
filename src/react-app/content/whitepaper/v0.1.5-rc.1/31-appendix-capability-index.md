---
title: 能力与扩展点索引
chapter_id: appendix-capability-index
slug: appendix-capability-index
dsh_version: v0.1.5-rc.1
upstream_tag: dsh-v0.1.5-rc.1
upstream_commit: 183f08e9c6dde7e36cd2318eaee70b0da08fb35e
status: verified
verified_at: 2026-09-15
sources:
  - docs/architecture.zh.md
  - docs/capability-seams.zh.md
  - docs/subsystems/slots.zh.md
  - docs/subsystems/session.zh.md
  - packages/extensions/README.zh.md
---
# 能力与扩展点索引

用需求反查公开边界。此表是导航索引；落地前仍应阅读对应正文和固定 tag 下的精确接口。

| 想新增或改变什么 | 首选公开边界 | 相关正文 |
| --- | --- | --- |
| 模型 Provider | `ctx.llm` Adapter | Capability Seam、插件开发 |
| 模型可调用能力 | `ctx.tools` | 核心能力、插件开发 |
| 文件系统、Shell、Sandbox 后端 | 对应 Capability Provider | Capability Seam、安全与权限 |
| Agent 可见的 Tool、Skill、Prompt | Preset 与 Agent Scope | Preset 与 Agent 组装 |
| 一次请求的构造或处理 | `agent/*` Waterfall | Agent 运行机制、Hooks 与拦截 |
| Tool 执行前后行为 | `tools/pre-execute` / `execute` / `post-execute` | Hooks 与拦截 |
| 持久会话事实 | `SessionEventMap` 与 Session 相关公开边界 | Session 与状态 |
| 浏览器全局工作面板 | `main` + `sidebar.panellist` Slot | Web Client 架构 |
| 会话区域 UI | `main.conversation` 子 Slot | Web Client 架构 |
| 临时运行时插件组合 | Dynamic Extensions | 扩展能力地图 |
| 外部程序驱动 Agent | SDK 或 ACP | SDK 接入、ACP 接入 |
| 外部事件触发 Session | `ctx.webhookRuntime` | Webhook 事件接入 |

## 选择顺序

先找已有 Service Seam；若改变的只是一段在途流程，再考虑 Event / Waterfall；若需要让模型直接调用，再定义 Tool 或 Prompt 能力；若只影响 Web 展现，再选择对应 Slot。只有这些公开边界不能表达需求时，才考虑新增 Service Definition。

不要通过运行时导入另一个功能插件的私有组件或状态来“接入”能力。跨功能行为使用 Service，跨功能 UI 使用 Slot，持久事实使用 Session 公开模型。
