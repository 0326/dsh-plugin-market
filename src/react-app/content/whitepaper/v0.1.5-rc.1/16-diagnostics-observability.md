---
title: 调试与观测
chapter_id: diagnostics-observability
slug: diagnostics-observability
dsh_version: v0.1.5-rc.1
upstream_tag: dsh-v0.1.5-rc.1
upstream_commit: 183f08e9c6dde7e36cd2318eaee70b0da08fb35e
status: verified
verified_at: 2026-09-10
sources:
  - packages/runtime-diagnostics/README.zh.md
  - docs/subsystems/invariants.zh.md
  - docs/architecture.zh.md
  - docs/config-catalog.zh.md
  - docs/tool-catalog.zh.md
---
# 调试与观测

DSH 的调试入口分成三层：组合是否正确、运行事件是否正确、持久事实是否正确。rc.1 还提供包级 Runtime Invariant，使包可以声明并验证自己拥有的数据关系。

## Runtime Invariants

`runtime-diagnostics/invariants` 运行各包提供的 Invariant Companion，并通过 `ctx.invariants` 统一注册。检查失败会归因到拥有该约束的包，而不是只抛出一个全局“Session 损坏”错误。

Invariant 适合验证事件配对、序列边界、持久数据关系等运行时契约。全局开关与包过滤器可以控制启用范围，便于开发与故障定位。

## 官方生成目录

DSH 的 Config Catalog、Tool Catalog、Capability / Module Graph 都由源码生成，并有新鲜度校验。排查“配置是否真的支持某字段”“模型当前到底看到哪个 Tool Schema”时，应优先查这些生成目录，而不是凭 README 示例推断。

Tool Catalog 会从实际插件注册结果提取 schema，因此它比手写接口列表更接近模型实际运行表面。

## Session 是最重要的运行证据

一次 Agent 行为出现异常时，可以按以下顺序定位：

1. 查看最终 Profile / Patch 是否挂载了预期插件与 Provider；
2. 确认目标 Agent Scope / Preset 是否包含预期 Tool、Prompt、Skill；
3. 查看 Session Event 的 Turn、Step、Request Header / Context；
4. 查看 Assistant Attempt、Tool Call / Result 与取消原因；
5. Web 问题再沿 Remote → Client Model → Conversation → Slot 检查投影。

由于模型历史和 Request Envelope 都可从 Session 重建，Session Log 是判断“模型当时实际看到了什么”的首要证据。

## Diagnostics 与 Telemetry

Invariant 用于断言运行时契约是否成立，Telemetry 用于记录性能与行为数据，两者职责不同。新增观测插件应消费公开事件或 Telemetry Seam，不要通过修改 Agent Loop 私有状态抓取指标。

## 插件开发时的最小诊断面

至少应能够回答四个问题：插件是否挂载、Service Provider 是否生效、目标 Agent 是否可见、执行结果是否进入 Session / Event。把这四层证据打通，通常比增加更多日志字符串更有效。
