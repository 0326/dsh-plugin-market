---
title: 扩展能力地图
chapter_id: extension-map
slug: extension-map
dsh_version: v0.1.5-rc.1
upstream_tag: dsh-v0.1.5-rc.1
upstream_commit: 183f08e9c6dde7e36cd2318eaee70b0da08fb35e
status: verified
verified_at: 2026-09-10
sources:
  - docs/architecture.zh.md
  - docs/capability-seams.zh.md
  - packages/extensions/README.zh.md
  - docs/subsystems/extensions.zh.md
---
# 扩展能力地图

DSH 没有一个包办所有功能的“Plugin API”。正确做法是先判断新增行为属于 Provider、模型能力、Agent 作用域、运行时拦截、持久状态、外部接口还是 UI，再进入对应公开 Seam。

## 常见需求与首选扩展点

| 需求 | 首选扩展点 |
| --- | --- |
| 新模型 Provider | `ctx.llm` |
| 新模型可调用能力 | `ctx.tools` |
| 新文件系统 / Shell / Sandbox 后端 | 对应 Service Provider |
| 单个 Agent 增加 Tool / Skill / Prompt | Preset + Agent Scope |
| 修改模型请求 | `agent/request` |
| 拦截 Tool | `tools/pre-execute` / `execute` / `post-execute` |
| 注入模型可见上下文 | Agent Prompt / `agent.inject()` 对应公开机制 |
| 持久化新的会话事实 | `SessionEventMap` |
| 新 Session Projection | Session Projection Seam |
| 新后台任务 | `ctx.jobs` |
| 新 Subagent Provider | `ctx.subagents` |
| 新 Web 全局面板 | `main` + `sidebar.panellist` Slot |
| 新会话内 UI | `main.conversation` 子 Slot |
| 外部程序驱动 Agent | SDK / ACP |
| 外部事件创建 Session | `ctx.webhookRuntime` |

## Dynamic Extensions

`packages/extensions` 允许 Agent 在进程运行中检查并修改实时 Cordis Runtime。模型或浏览器可以定义、运行、更新、停止和移除动态包；包可以有 Host 半、Client 半或两者。

动态包版本不可变，更新通过新版本完成。其定义只存在于进程内存，DSH 重启后消失，因此它适合临时自修改和实验，不替代可部署的 Bundle / Package。

## 运行时检查

`tool-cordis` 向模型提供 Runtime Inspect 与动态包操作；Host Runner 提供 `ctx.dynamicCordisRunner` 和 `ctx.cordisInspect`，Client Runner 负责浏览器半的实际加载。动态能力仍遵守 Cordis 生命周期，不是脱离插件系统的任意脚本注入。

## 判断顺序

设计扩展时可以按四步判断：

1. 是否已有公开 Service Seam；有则扩 Provider 或 Consumer。
2. 是否只影响一次运行过程；是则使用 Event / Waterfall。
3. 是否需要直接暴露给模型；是则注册 Tool 或 Prompt 能力。
4. 是否只影响 Web 表现；是则使用对应 Slot，不改 Host 业务状态。

只有公开 Seam 不足以表达新能力时，才新增 Service Definition。
