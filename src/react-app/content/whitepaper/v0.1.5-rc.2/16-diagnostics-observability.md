---
title: 调试与观测
chapter_id: diagnostics-observability
slug: diagnostics-observability
dsh_version: v0.1.5-rc.2
upstream_tag: dsh-v0.1.5-rc.2
upstream_commit: fb2c4b9e698e30edb738bca4cf0618587db7d203
status: verified
verified_at: 2026-09-15
sources:
  - packages/runtime-diagnostics/README.zh.md
  - docs/subsystems/invariants.zh.md
  - docs/subsystems/token-meter.zh.md
  - docs/subsystems/session-telemetry.zh.md
  - docs/architecture.zh.md
  - docs/config-catalog.zh.md
  - docs/tool-catalog.zh.md
---
# 调试与观测

DSH 的调试入口分成四层：组合是否正确、运行事件是否正确、持久事实是否正确、外部观测是否正确。当前版本提供包级 Runtime Invariant、Token Meter 与 Session Telemetry，使“断言正确性”和“记录运行数据”保持分离。

## Runtime Invariants

`runtime-diagnostics/invariants` 运行各包提供的 Invariant Companion，并通过 `ctx.invariants` 统一注册。检查失败会归因到拥有该约束的包，而不是只抛出一个全局“Session 损坏”错误。

Invariant 适合验证事件配对、序列边界、持久数据关系等运行时契约。全局开关与包过滤器可以控制启用范围，便于开发与故障定位。

## Token Meter

Token Meter 记录不可变的 Token 标量与位置回放度量，并绑定已消费的日志 Revision。它的意义不是再造一套 Session 状态，而是给“某个时刻模型上下文消费了多少 Token”提供可追踪测量基础。

涉及上下文预算、Compaction 触发或模型成本分析时，应优先使用这一类明确的度量数据，而不是从字符串长度或 UI 文本估算。

## Session Telemetry

Session Telemetry 通过独立 Sink 向外部系统上报经过分类和脱敏的记录。它与 Event Log 的关系是：

- Session Event Log：用于恢复、回放和解释 Agent 当时发生了什么；
- Session Telemetry：用于把运行时指标、严重级别和诊断记录输出到外部观测系统。

Telemetry 不应成为 Session 恢复依赖；Session Event 也不应承担所有外部监控数据。

## 官方生成目录

DSH 的 Config Catalog、Tool Catalog、Capability / Module Graph 都由源码生成，并有新鲜度校验。排查“配置是否真的支持某字段”“模型当前到底看到哪个 Tool Schema”时，应优先查这些生成目录，而不是凭 README 示例推断。

Tool Catalog 会从实际插件注册结果提取 schema，因此它比手写接口列表更接近模型实际运行表面。

## Session 是最重要的运行证据

一次 Agent 行为出现异常时，可以按以下顺序定位：

1. 查看最终 Profile / Patch 是否挂载了预期插件与 Provider；
2. 确认目标 Agent Scope / Preset 是否包含预期 Tool、Prompt、Skill；
3. 查看 Session Event 的 Turn、Step、Request Header / Context；
4. 查看 Assistant Attempt、Tool Call / Result 与取消原因；
5. 对 Token/Compaction 问题查看 Token Meter 与 Surface 变化；
6. Web 问题再沿 Remote → Client Model → Conversation → Slot 检查投影；
7. 外部监控问题最后检查 Session Telemetry Sink 与脱敏流水线。

由于模型历史和 Request Envelope 都可从 Session 重建，Session Log 是判断“模型当时实际看到了什么”的首要证据。

## 组合诊断与运行诊断不要混淆

配置层问题优先看 Profile、Bundle、Patch 与生成 Catalog；运行期问题看 Agent/Tool Event、Session Event 与 Invariant；性能或行为趋势看 Telemetry / Token Meter。把三类问题混成“多打日志”会让定位成本更高。

## 插件开发时的最小诊断面

至少应能够回答五个问题：插件是否挂载、Service Provider 是否生效、目标 Agent 是否可见、执行结果是否进入 Session / Event、外部观测是否成功上报。把这五层证据打通，通常比增加更多日志字符串更有效。

源码定位建议从 `packages/runtime-diagnostics/`、`docs/subsystems/invariants.zh.md`、`docs/subsystems/token-meter.zh.md`、`docs/subsystems/session-telemetry.zh.md`、`docs/config-catalog.zh.md` 与 `docs/tool-catalog.zh.md` 进入。
