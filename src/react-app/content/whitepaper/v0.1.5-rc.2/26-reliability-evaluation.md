---
title: 可靠性与验证
chapter_id: reliability-evaluation
slug: reliability-evaluation
dsh_version: v0.1.5-rc.2
upstream_tag: dsh-v0.1.5-rc.2
upstream_commit: fb2c4b9e698e30edb738bca4cf0618587db7d203
status: verified
verified_at: 2026-09-15
sources:
  - docs/testing.zh.md
  - docs/subsystems/invariants.zh.md
  - docs/subsystems/session-telemetry.zh.md
  - packages/runtime-diagnostics/README.zh.md
---
# 可靠性与验证

DSH 的可靠性不是一个单一指标，而是一组可复核的证据：组合是否真实启动、运行时契约是否成立、持久结果是否可回放、以及真实提供方路径是否能通过验证。

## 官方验证层次

| 层次 | 回答的问题 | 不能单独证明什么 |
| --- | --- | --- |
| 单元测试与覆盖率 | 边界、错误路径、事件顺序、竞态是否被覆盖 | 产品组合是否可交付 |
| 预期输出与快照 | 已录制场景、持久结果和用户可见输出是否回归 | 真实提供方是否可用 |
| 真实 API e2e | 已交付 Profile 能否接入真实模型与外部世界 | 所有极端并发与恢复路径 |
| 性能基准 | 用户路径的耗时、堆和缩放预算是否退化 | 语义正确性 |
| Runtime Invariant / Telemetry | 运行期契约与外部观测是否可诊断 | 替代测试与回放证据 |

## 证据应贴近真实入口

官方测试策略强调：产品可见插件应有经 Loader、app 或 process 启动的真实组合测试；mock 只用于高成本或不确定边界。验证应重新读取外部世界或持久文件，而不是检查 Agent 自己报告“已完成”。

对插件作者而言，最小验证闭环是：挂载预期 Profile → 触发真实 Agent / Tool 路径 → 检查 Session 或外部可见结果 → 用 Invariant 和 Telemetry 辅助定位。只增加日志字符串并不能证明契约正确。

## 发布前检查

1. 新增公开能力是否有真实组合入口测试；
2. 新增持久事件、生命周期或协议行为是否有可回放场景；
3. 失败、取消、超时和 teardown 是否有明确断言；
4. 性能敏感路径是否纳入对应 benchmark；
5. 可观察数据是否与 Session 恢复职责分离并完成脱敏。

这些检查提供可审计的工程证据，不保证模型输出在所有开放环境中的业务正确性。
