---
title: 调试与观测
chapter_id: diagnostics-observability
slug: diagnostics-observability
dsh_version: v0.1.5-rc.1
upstream_tag: dsh-v0.1.5-rc.1
upstream_commit: 183f08e9c6dde7e36cd2318eaee70b0da08fb35e
status: verified
verified_at: 2026-09-15
sources:
  - packages/runtime-diagnostics/README.zh.md
  - packages/identity/README.zh.md
  - docs/subsystems/invariants.zh.md
  - docs/subsystems/token-meter.zh.md
  - docs/subsystems/session-telemetry.zh.md
  - docs/architecture.zh.md
  - docs/config-catalog.zh.md
  - docs/tool-catalog.zh.md
---
# 调试与观测

DSH 的调试入口分成三层：组合是否正确、运行事件是否正确、持久事实是否正确。rc.1 还提供包级 Runtime Invariant、Token Meter 与 Session Telemetry，使结构验证、用量度量和对外遥测拥有不同的职责边界。

## Runtime Invariants

`runtime-diagnostics/invariants` 运行各包提供的 Invariant Companion，并通过 `ctx.invariants` 统一注册。检查失败会归因到拥有该约束的包，而不是只抛出一个全局“Session 损坏”错误。

Invariant 适合验证事件配对、序列边界、持久数据关系等运行时契约。全局开关与包过滤器可以控制启用范围，便于开发与故障定位。

## Token Meter

Token Meter 记录不可变的标量与位置回放度量，并把读数与已消费的 Session Log 修订位置关联。它解决的是“截至哪个日志位置，已经累计了多少可度量资源”这一类问题，而不是替代模型 Provider 自己的 Billing 数据。

把位置与数值一起记录，可以避免 Resume / Replay 后把同一段历史重复累计；做 Token、成本或上下文容量观测时，应优先复用这类可回放度量，而不是从 UI 消息数量反推。

## Session Telemetry

Session Telemetry 是面向外部观测系统的能力 Seam。它定义统一的 `SessionTelemetryRecord` / Severity 词汇和 `SessionTelemetrySink`，并通过 `session-telemetry/record` waterfall 在发送前提供脱敏与过滤机会。

这条链路适合输出运行状态、诊断和产品观测记录；敏感 Session 内容不应绕过该 Seam 直接上报。Telemetry 是“记录发生了什么”，Invariant 是“断言什么必须成立”，两者不能互相替代。

## 匿名安装 Identity

`packages/identity` 为每个 Harness Home 维护一个匿名、稳定的安装 ID。Telemetry、Feedback 与 DeepSeek Provider Request 可以携带这个 ID，从而把同一安装产生的记录关联起来，但它不是用户身份，也不要求配置真实个人信息。

这一层要和 Session ID、Workspace ID、账号身份区分开：它表达“来自同一套 Harness Home”，不表达“是谁”。做自定义遥测时不要把它升级成用户标识，也不要把额外敏感信息拼接进该 ID。

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

## 插件开发时的最小诊断面

至少应能够回答四个问题：插件是否挂载、Service Provider 是否生效、目标 Agent 是否可见、执行结果是否进入 Session / Event。把这四层证据打通，通常比增加更多日志字符串更有效。
