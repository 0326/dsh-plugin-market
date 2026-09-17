---
title: 调试与观测
chapter_id: diagnostics-observability
slug: diagnostics-observability
dsh_version: v0.1.5-rc.2
upstream_tag: dsh-v0.1.5-rc.2
upstream_commit: fb2c4b9e698e30edb738bca4cf0618587db7d203
status: verified
verified_at: 2026-09-17
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

DSH 的诊断不应该从“多打日志”开始，而应该先判断问题属于哪一层：**组合、Agent 运行、持久事实、能力执行，还是外部观测**。不同层有不同的权威证据。最有效的排障方式，是从用户可见症状一路收窄到拥有该事实的组件，而不是在所有插件里搜索同一个错误字符串。

## 先建立证据层级

| 层 | 主要证据 | 能回答什么 | 不能单独证明什么 |
| --- | --- | --- | --- |
| 组合层 | Profile / Bundle / Patch、Config Catalog、Capability Graph | 实际加载了什么 | 运行时是否真的成功执行 |
| Agent 层 | Turn / Step / Request / Inbox / Tool Events | 请求如何推进、在哪里停止 | 持久化之后能否恢复 |
| Session 层 | Event Log、Projection、Request Header / Context | 模型当时看到了什么、哪些事实已提交 | 外部 Sink 是否收到观测数据 |
| 能力层 | Invariant、Provider 状态、Tool Result | 哪个包的契约被破坏 | 全局业务结果是否正确 |
| 度量层 | Token Meter、Benchmark / runtime metrics | 资源与上下文消耗 | 语义正确性 |
| 外部观测层 | Session Telemetry / OTEL 等 Sink | 线上发生了什么趋势和故障 | Session 可恢复事实 |

诊断时先选对证据层，再下钻具体事件。

## 一次“Tool 没有按预期执行”怎么查

不要直接假设 Tool 本身坏了。按下面顺序收窄：

1. **组合层**：目标 Profile 是否真的加载 Tool 与其依赖 Service；
2. **可见性层**：目标 Agent Scope 是否能看到该 Tool，Tool Catalog 是否包含预期 schema；
3. **模型请求层**：对应 Step 的 Request Header / Context 中是否带上该 Tool；
4. **调用层**：Session 是否出现 `tool/call`；没有则问题仍在模型选择或可见性；
5. **策略层**：如果有 call 但没有主体执行，检查 `tools/pre-execute`、Approval、guard；
6. **执行层**：检查规范化 Tool Result、timeout / abort / Provider 错误；
7. **持久层**：确认 Tool Result 和后续上下文已经进入 Session；
8. **外部观测层**：最后再检查 Telemetry 是否正确上报。

这条链的价值是每一步都能排除一类责任层，而不是从日志数量判断问题。

## Runtime Invariant 用于发现“不该存在的状态”

`runtime-diagnostics/invariants` 让各包注册自己拥有的不变量，并通过 `ctx.invariants` 统一执行。失败会归因到拥有该约束的包。

适合用 Invariant 检查的通常是：

- 事件 start/end 是否配对；
- 序列号、生命周期和父子关系是否一致；
- 持久记录之间是否满足结构约束；
- 某个包声明的协议是否出现非法状态。

Invariant 的价值是把错误靠近**拥有规则的包**。它不是业务断言系统，也不能证明“Agent 最终答案正确”。

## Session Log 回答“模型当时实际看到了什么”

当问题是“为什么模型这样回答”“为什么恢复后上下文不同”，首要证据是 Session，而不是 UI 状态或 Telemetry。

重点查看：

| 问题 | Session 证据 |
| --- | --- |
| 这一轮是否真正开始 | `turn/start` / `turn/end` |
| 是否进入模型请求 | `step/start`、Request Header / Context |
| 模型看到哪些消息 | Surface Projection / `deriveMessages()` 结果对应事件 |
| Tool 是否被模型调用 | `tool/call` |
| Tool 返回了什么 | `tool/result` |
| 模型请求是否失败后重试 | `assistant/attempt` / `assistant/message` |
| 是否存在取消或中断 | Turn / Step 结算与 interrupted 事实 |

UI 是这些事实的消费方之一，不应反过来作为唯一真源。

## Token Meter 回答资源问题，不回答语义问题

Token Meter 记录与日志 Revision 对齐的 Token 度量，用于判断某个时刻上下文消费情况。它适合排查：

- 上下文预算为什么突然上升；
- Compaction 前后 Token 如何变化；
- 长 Session 的输入规模如何增长；
- 某类 Prompt / Tool Schema 是否带来固定成本。

但 Token 数量正常并不能证明 Prompt 内容正确，也不能证明模型路由正确。度量只是资源证据。

## Telemetry 与 Session 必须分工

Session Telemetry 把经过分类和脱敏的记录送到外部 Sink；Session Event Log 保存可恢复事实。两者面向不同问题：

- 需要恢复、回放、解释单次会话：查 Session；
- 需要线上趋势、聚合、告警、跨会话观测：查 Telemetry；
- Telemetry 丢失不应导致 Session 无法恢复；
- Session 也不应为了监控方便无限承载所有指标。

把 Telemetry 当数据库，会把可观测性故障升级成恢复故障；把所有监控数据写进 Session，则会污染持久协议。

## 生成 Catalog 是组合事实，不是 README 示例

Config Catalog、Tool Catalog、Capability / Module Graph 从源码生成，并有新鲜度检查。排查以下问题时，应优先使用生成目录：

- 配置字段在当前版本是否真实存在；
- 某 Tool Schema 是否真的进入模型表面；
- 某个 `ctx.*` Service 由哪个 Provider 提供；
- 某个 Consumer 依赖哪些能力。

README 示例可以帮助理解，但不能替代当前版本生成结果。

## 按症状选择第一现场

| 症状 | 第一现场 | 下一步 |
| --- | --- | --- |
| 配置写了但能力不存在 | Config / Capability Catalog | Profile / Patch 装配 |
| 模型说“没有这个 Tool” | Tool Catalog + Request Header | Agent Scope / Tool restriction |
| Tool Call 有记录但没执行 | Tool Pipeline | Approval / guard / Provider |
| UI 内容与恢复结果不同 | Session Projection / Event Log | Client Model / Remote |
| Resume 后行为变化 | Request Header / Context + Session | Provider / Prompt 变化 |
| 长会话突然超预算 | Token Meter | Compaction / Tool Schema / Prompt |
| 线上告警无法定位到会话 | Telemetry correlation | Session id / event evidence |
| Invariant 报错 | 对应 package owner | 相关持久事件和状态关系 |

## 一个插件至少要留下五层可诊断证据

新插件发布前，至少能回答：

1. **有没有挂载？**——组合事实；
2. **Provider 是否生效？**——Capability / Service 事实；
3. **Agent 是否可见？**——Scope / Tool / Prompt 事实；
4. **执行发生了什么？**——Tool / Agent / Session 事实；
5. **线上能否归因？**——Invariant / Telemetry / correlation。

缺任何一层，故障都可能退化成“看起来没工作”。

## 诊断的边界

这些证据可以帮助定位运行时责任层，但不能自动证明模型业务答案正确，也不能用 Telemetry 代替回放测试。性能问题仍需要 benchmark；安全边界仍需要对应 Sandbox / Approval 证据；跨版本问题还要回到版本锁和迁移说明。

源码定位建议从 `packages/runtime-diagnostics/`、`docs/subsystems/invariants.zh.md`、`docs/subsystems/token-meter.zh.md`、`docs/subsystems/session-telemetry.zh.md`、`docs/config-catalog.zh.md` 与 `docs/tool-catalog.zh.md` 进入。