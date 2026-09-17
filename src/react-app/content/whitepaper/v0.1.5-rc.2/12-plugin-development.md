---
title: 插件开发与扩展面
chapter_id: plugin-development
slug: plugin-development
dsh_version: v0.1.5-rc.2
upstream_tag: dsh-v0.1.5-rc.2
upstream_commit: fb2c4b9e698e30edb738bca4cf0618587db7d203
status: verified
verified_at: 2026-09-17
sources:
  - docs/architecture.zh.md
  - docs/cookbook/extension-cookbook.zh.md
  - docs/subsystems/slots.zh.md
  - packages/client/ui-slots/README.zh.md
  - packages/core/agent-loop/README.zh.md
---
# 插件开发与扩展面

开发 DSH 插件最重要的验证对象不是“代码能不能挂上去”，而是：**你是否选对了公开扩展面，并且这个扩展在组合、失败和 teardown 后仍保持正确**。Tool、Service、Event、Session Event、Preset 与 Web Slot 拥有不同责任，选错入口通常比实现错误更难维护。

## 先决定要改变哪一种事实

| 你要改变什么 | 首选扩展面 | 需要证明什么 |
| --- | --- | --- |
| 增加长期可替换能力 | Service Definition + Provider | Consumer 只依赖契约，Provider 可替换 |
| 增加模型可主动调用能力 | `ctx.tools` | Tool 可见、可执行，并经过统一 Guard / Approval / Result 流水线 |
| 改变一次运行中的策略 | `agent/*` / `tools/*` Event | 监听器只拥有该阶段允许的控制权 |
| 增加可恢复的会话事实 | `SessionEventMap` | append、回放、恢复后语义一致 |
| 改变单个 Agent 的能力组合 | Preset / Agent Scope | 变化只影响目标 Agent，不污染其他 Session |
| 增加浏览器 UI | Client Module + Conversation / Slot | Host 状态仍是权威，UI 生命周期随 scope 撤销 |
| 接入外部系统 | SDK / ACP / Webhook | 协议生命周期、取消、持久化与交付边界明确 |

如果只是因为“这里能拿到 `ctx`”就注册监听器，通常还没有完成扩展面设计。

## Service、Event、Tool 与 Session Event 不可互换

**Service** 表达长期存在、可替换的能力；**运行时 Event** 表达正在发生的工作及有限控制权；**Tool** 是模型可见的调用入口；**Session Event** 是需要恢复和回放的持久事实。

例如要增加一个受限文件系统实现，应扩展 `ctx.fs` Provider；要拒绝某次写文件，可进入 `tools/pre-execute` 或 Guard；要让模型主动调用文件功能，注册 Tool；要记录一个需要跨重启解释的领域事实，才进入 Session Log。把四种责任合并到一个插件内部私有状态，后续很难替换、审计或恢复。

## 一次插件生命周期怎么走

以“新增一个 Tool，并对执行做策略限制”为例：

1. 插件在自己的 Cordis scope 注册 Tool；
2. Tool schema 进入可见工具集合，并参与 Prompt / Tool Catalog；
3. 模型发起调用后，统一流水线先经过 `tools/pre-execute` 与 Guard；
4. 允许后进入 `tools/execute` 和具体 Tool body；
5. 规范化结果经过 `tools/post-execute`、finalize 与 `tools/result`；
6. 所需持久事实由 Session 记录，不由插件自己维护另一份 transcript；
7. scope dispose 时，Tool、监听器和其他 effect 一起撤销。

这条链要验证的是“插件进入了既有生命周期”，而不只是调用函数返回成功。

## Agent API 必须显式处理所有权

当前版本已经移除旧的 `ctx.agent`。插件不能假设 Context 上有隐式当前 Agent；需要 Agent 的接口应显式接收 `Agent`，创建和恢复通过 `ctx.agents` 完成。

`ctx.agents.create()` / `resume()` 返回 `AgentHandle`。创建者如果持有 Handle，就要明确谁负责 dispose，以及取消发生后何时才算完全停稳。只保存 `Agent` 引用而忽略 Handle，会把生命周期所有权变成隐式状态。

`Inbox` 同样通过 `agent.inbox` 使用；claim、driver 内部顺序与持久投影由 Agent Loop 负责。插件可以使用公开入口，但不应复制内部调度器。

## Web 插件先分清数据与展示

新增 Web 能力时先判断：

- Host 是否需要新增权威 Service / Remote；
- 浏览器是否需要新的 Client Model；
- Session 事件是否需要新的 Conversation Definition；
- 只是增加布局贡献，还是需要新的 Slot owner。

主区域使用 keyed `main` Slot，`conversation` 是保留的会话面板；导航入口使用 `sidebar.panellist`。增强会话内部 UI 应进入 `main.conversation` 下的公开 Slot，而不是替换整个主区或运行时导入别的功能插件组件。

## 最小验证链

插件合入前，至少要能用外部可观察事实回答以下问题：

| 验证对象 | 首选证据 |
| --- | --- |
| 插件是否真的挂载 | Profile / Bundle / Patch 的最终组合，或生成 Catalog |
| Service Provider 是否生效 | `ctx.*` 注册结果与对应 Consumer 的真实调用 |
| Tool 是否对目标 Agent 可见 | Tool Catalog / 目标 Preset 下实际 Tool schema |
| 策略是否作用在正确阶段 | Tool / Agent Event 顺序与最终规范化结果 |
| 持久事实能否恢复 | Session Event Log → reload / replay 后重新读取 |
| UI 扩展是否正确撤销 | Slot 注册、scope dispose 后实际界面状态 |
| teardown 是否完成 | Handle / effect dispose 后资源不再可访问或运行 |

“单元测试通过”只能证明对应代码路径；不能自动证明插件在真实 Profile、目标 Agent Scope 和 Web / Session 生命周期里接线正确。

## 失败路径也必须验证

至少补一条与插件风险相匹配的失败验证：未知 Provider 应明确失败；Tool 被 Guard 拒绝后不能继续执行；Agent 创建中止后不能留下无主 Handle；Session append 失败不能伪造已提交状态；Client Module / Slot 卸载后不能残留 UI；外部协议断开时要进入该协议规定的清理路径。

官方 Extension Cookbook 中的代码片段是扩展形态说明，明确不是可直接复制运行的完整示例。真正的验证应回到目标包 README、生成 Catalog、集成测试与运行结果。

## 什么时候说明扩展面选错了

出现以下信号时应先重构边界，而不是继续补测试：运行时导入具体 Provider；组件直接持有 transport；多个 Tool 分别实现同一权限策略；插件复制 Session 状态机；为了一个 Agent 的变化修改全局 Context；资源只能靠进程退出回收。

这些做法即使当前能工作，也不能证明在 Provider 替换、Session 恢复、Preset 变化或插件卸载后仍正确。扩展开发的完成条件，应是**公开契约、生命周期和失败证据都闭环**。