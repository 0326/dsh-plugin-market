---
title: Hooks 与拦截
chapter_id: hooks-interception
slug: hooks-interception
dsh_version: v0.1.5-rc.2
upstream_tag: dsh-v0.1.5-rc.2
upstream_commit: fb2c4b9e698e30edb738bca4cf0618587db7d203
status: verified
verified_at: 2026-09-17
sources:
  - docs/architecture.zh.md
  - packages/hooks/README.zh.md
  - docs/subsystems/tools.zh.md
  - .agents/notes/implemented/feature/2026-06-30-interception-extension-points.zh.md
---
# Hooks 与拦截

DSH 的“原生 Hook”并不是另一套 Hook Framework，而是**普通插件参与 Agent / Tool 生命周期的类型化扩展点**。Claude Code / Codex Hook Bridge 只是把既有 shell hook 协议翻译到这些原生事件上。新插件应优先理解原生扩展点，因为不同阶段被赋予的权力并不相同：有的只能观察，有的可以拒绝，有的可以包装执行，有的可以改变结果。

## 先看每个扩展点能做什么

| 阶段 | 扩展点 | 模式 | 能做什么 | 不能做什么 |
| --- | --- | --- | --- | --- |
| Session 启动 | `agent/session-start` | emit | 观察启动、注入后续上下文 | 阻止 Session 启动 |
| Step 准入 | `agent/pre-step` | waterfall | 接纳或拒绝本次 Step，贡献上下文 | 绕过 Session 记录直接改历史 |
| Tool 执行前 | `tools/pre-execute` | waterfall | allow / reject / ask | 任意改写已封存的 Tool 参数 |
| 终结策略 | `ctx.tools.guard()` | 同步 guard | 拒绝 | 强制放行 |
| Tool 执行层 | `tools/execute` | around waterfall | 超时、重试、指标包装、短路执行 | 改变调用身份 |
| Tool 执行后 | `tools/post-execute` | waterfall | 检查、阻止、替换内容/值、追加上下文 | 伪造另一条 Tool Call 身份 |
| 最终结果 | `tools/result` | emit | 观察冻结后的最终结果 | 再修改结果 |
| Turn 停止 | `agent/turn-stopping` | awaited notification | 通过 steer 请求再执行一步 | 直接重开一套独立 Loop |

这个分层的价值在于：**监听器顺序不能让一个本来只应该观察的插件突然拥有修改权，也不能让后注册插件“复活”已经被 guard 拒绝的调用。**

## 一次 Tool Call 如何穿过拦截链

以一个需要权限检查、超时和结果审计的 Tool 为例：

1. Runtime 先解析并冻结本次 Tool Call 的身份和参数；
2. `tools/pre-execute` 依次运行策略插件，可能 allow、reject 或 ask；
3. 若需要审批，只在得到 `allowed-once` 后继续；
4. `ctx.tools.guard()` 再执行不可被后续监听器推翻的单调拒绝；
5. `tools/execute` 可以包装真正 dispatch，例如设置超时、指标或重试；
6. Tool 主体执行并得到规范化结果；
7. `tools/post-execute` 可以检查或变换结果，并贡献后续上下文；
8. Tool 自己的 `finalizeContent` 做最后一道内容不变量处理；
9. `tools/result` 只观察最终冻结结果。

如果 `pre-execute` 已拒绝，Tool 主体不会运行；如果最终只是 `tools/result` 监听器报错，已完成的 Tool 结果也不会因此被反向改写。

## 为什么 Pre Tool 不允许随意改参数

Tool 参数在进入策略前已经与历史、审计和 UI 展示绑定。如果某个 pre hook 改了参数，但 `tool/call` 记录和界面仍保留旧值，就会出现“日志说执行 A，实际执行 B”的不可审计状态。

因此当前 `PreToolDecision` 不提供参数重写。真正的输入重写必须在调用身份创建之前，同时更新历史、展示和执行输入；这是一条一致性边界，而不是功能缺失。

## Step 拦截与 Tool 拦截是两层问题

`agent/pre-step` 决定的是“本次模型 Step 是否进入”；`tools/pre-execute` 决定的是“某个模型已经提出的 Tool Call 是否执行”。

当 `agent/pre-step` reject 时，当前 Turn 可以被记录为 blocked，但不会打开 Step，也不会错误写入本次模型可见消息。Tool 拦截则发生在模型已经返回 Tool Call 之后，拒绝会形成规范化 Tool 结果，而不是回滚整个 Turn。

把这两层混用，会让策略插件难以回答自己究竟是在限制模型请求，还是限制外部副作用。

## Hook Bridge 解决的是兼容，不是更强的扩展能力

`packages/hooks` 提供共享 `hook-protocol`，以及 Claude Code / Codex Bridge。它们允许已有 `hooks.json` 在 Session 开始、Prompt 到达、Tool 运行和停止阶段继续工作，并把 shell hook 的输出映射成 DSH 可理解的阻断、上下文或继续执行语义。

但 Bridge 存在天然边界：

- 只能覆盖来源工具支持的 command hook 子集；
- shell 进程通过序列化协议与 DSH 通信，没有原生插件完整的 `ctx`；
- 两种外部 Hook 协议不能假设语义完全一致；
- Hook Bridge 自己的 `hook/*` Session Event 属于桥接协议，不代表所有原生插件都需要写一套 Hook 日志。

所以 Bridge 适合复用存量企业 Hook 资产；新 DSH 能力通常直接使用原生 Event / Service 更清晰。

## 横切能力应该放在哪

| 需求 | 推荐扩展点 | 原因 |
| --- | --- | --- |
| 权限 / 是否允许执行 | `tools/pre-execute` + Approval / guard | 在主体执行前形成确定决策 |
| 超时 / 重试 / 指标包装 | `tools/execute` | 需要环绕真实 dispatch |
| 结果过滤或补充上下文 | `tools/post-execute` | 已有执行结果可供判断 |
| 只做审计统计 | `tools/result` | 不需要修改执行结果 |
| 每个模型 Step 注入动态上下文 | `agent/pre-step` / `agent.inject()` | 与 Step 准入和 Session 记录保持一致 |
| Agent 自然停止前继续工作 | `agent/turn-stopping` + `steer()` | 沿原 Loop 继续，而不是私自重启 |

## 失败和诊断边界

| 现象 | 优先检查 |
| --- | --- |
| Tool 根本没执行 | `pre-execute` decision、Approval、guard |
| Tool 执行超时或被重试 | `tools/execute` 包装层 |
| Tool 已执行但结果被改写 | `post-execute` / `finalizeContent` |
| 最终结果正确但审计缺失 | `tools/result` 观察者 |
| 模型没有进入下一 Step | `agent/pre-step` / `turn-stopping` |
| 外部 hooks.json 行为和原工具不同 | Bridge 支持子集与映射规则 |

插件设计时先确定自己需要哪一种“权力”，再选择扩展点。需要只观察，就不要使用可变换 waterfall；需要阻止，就不要把策略塞进最终日志监听器。源码定位优先从 `docs/subsystems/tools.zh.md` 和拦截扩展点 Agent Note 进入，存量 Hook 兼容再看 `packages/hooks/`。