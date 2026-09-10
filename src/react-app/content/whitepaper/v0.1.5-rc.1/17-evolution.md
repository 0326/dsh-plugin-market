---
title: 版本演进
chapter_id: evolution
slug: evolution
dsh_version: v0.1.5-rc.1
upstream_tag: dsh-v0.1.5-rc.1
upstream_commit: 183f08e9c6dde7e36cd2318eaee70b0da08fb35e
status: verified
verified_at: 2026-09-10
sources:
  - packages/session/session-format-v2-to-v3/README.zh.md
  - packages/core/agent-loop/README.zh.md
  - docs/subsystems/slots.zh.md
  - packages/subagent/README.zh.md
---
# 版本演进

官方 `v0.1.5-rc.1` Release 将本版本定义为 `0.1.5` 系列首个候选版本，并汇总自 `v0.1.2-rc.1` 以来的主要用户与开发者变化。因此本页以 `v0.1.2-rc.1 → v0.1.5-rc.1` 为比较区间，不自行选择其他测试版本作为基线。

## 主要开发者变化

| 领域 | rc.1 变化 | 迁移影响 |
| --- | --- | --- |
| Session | 数据格式升级 V3 | 自定义日志 Reader / Exporter 需要适配；升级后不可降级读取 |
| Persistence | 引入生命周期持有的 `SessionHandle` 和 Session Lock | 创建 / 恢复路径需要遵守独占写所有权 |
| Agent API | 移除 `ctx.agent` | 插件显式传递 `Agent` |
| Agent Loop | `create()` 异步化 | 调用方需要 `await` Agent 创建 / 恢复 |
| Inbox | `Inbox` 改为类型接口 | 通过 `agent.inbox` 操作；`hasPending` / `claim` 不再是公共 API |
| Web Slots | 新增 `main`、`sidebar.panellist` | 全局面板使用新 Slot；Conversation 成为 `main` 的 `conversation` key |
| Subagent | 可继续会话增加 Queue / Edit / Delete / Steer / Stop | 子代理从一次性委派扩展为可持续控制会话 |
| System Prompt | 支持不破坏 KV Cache 的动态提示词更新 | 仅在模型 Adapter 显式声明支持时使用对应模式 |

## 产品能力变化

rc.1 新增通用文件上传与后台进度；Web 右侧 Sidebar 支持多标签、分栏、全屏以及 Markdown、代码、HTML、PDF、图片预览，并移除旧 Detail Panel。模型可以显式交付文件到 Sidebar。

DeepSeek Adapter 新增 `DeepSeek-V41-Flash`（`deepseek-flash`），支持文本、图片与会话历史中的系统提示词更新，并成为新 Session 默认模型；显式配置仍优先。

SDK、Headless 与 ACP 默认文件工具也发生调整；Web `minimal` 与 Python `sdk-minimal` 的默认能力更收敛，依赖旧默认 Tool 集合的业务 Profile 需要显式检查组合结果。

## 插件开发迁移清单

升级到 rc.1 时优先检查：

1. 是否仍引用 `ctx.agent` 或直接构造 Inbox；
2. `ctx.agents.create()` / `resume()` 是否正确 `await`；
3. 自定义 Session Persistence / Reader 是否适配 V3 与 `SessionHandle`；
4. Web 插件是否仍注册旧顶层 Conversation Slot；
5. Subagent 控制逻辑是否假设委派只能一次性完成；
6. 是否依赖 Profile 中旧的默认 Tool 集合。

## 官方变更入口

- [v0.1.5-rc.1 Release](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.1.5-rc.1)
- [v0.1.2-rc.1...v0.1.5-rc.1 Compare](https://github.com/deepseek-ai/deepseek-harness/compare/dsh-v0.1.2-rc.1...dsh-v0.1.5-rc.1)

白皮书只维护 RC 与正式版本。Alpha、Beta、Canary、Nightly 与 Master 变化不会形成独立白皮书快照；只有进入新的 RC 或 Stable Release 后才进入版本生成链。
