---
title: Subagent 委派
chapter_id: subagent-delegation
slug: subagent-delegation
dsh_version: v0.1.5-rc.2
upstream_tag: dsh-v0.1.5-rc.2
upstream_commit: fb2c4b9e698e30edb738bca4cf0618587db7d203
status: verified
verified_at: 2026-09-17
sources:
  - packages/subagent/README.zh.md
  - docs/subsystems/subagent.zh.md
  - packages/sdk/README.zh.md
---
# Subagent 委派

Subagent 解决的是“把一项需要独立推理历史的任务交给另一个 Agent，并让它拥有自己的生命周期”。真正需要理解的不是启动接口，而是三件事：**子 Session 由谁创建和拥有、消息如何进入子 Agent、取消和恢复发生在哪个边界。**

## 先区分两种 Subagent

| 类型 | 主要用途 | 生命周期 | 结果方式 |
| --- | --- | --- | --- |
| One-shot Subagent | 一次性委派并等待结果 | Provider 启动一次 run，完成后结束 | 返回本次委派结果 |
| Continuable Subagent | 需要后续继续、发消息或冷恢复 | 持久子 Session + 可选 live Activation | 通过持续消息与 Session 状态推进 |

两者都通过 `ctx.subagents` 暴露，但内部生命周期不同。把可继续 Subagent 当成“一次 Tool Call 多传几个参数”，会忽略它真正保存的是一条独立会话。

## Provider 是可并存注册表，不是单一实现

与只允许一个实现的普通 Service 不同，同一 Context 下可以按名称注册多个 Subagent Provider，例如进程内 Spawn / Fork、ACP、Codex、Claude Code、DSH SDK。

调用方选择 Provider 后，`ctx.subagents` 会先检查该 Provider 声明的能力。`agentOptions`、`outputSchema`、`maxDepth`、`toolFilter`、`persona` 等请求若 Provider 不支持，会明确报 `UNSUPPORTED_CAPABILITY`，而不是启动后静默忽略。

这个规则很重要：**跨 Provider 的可移植性来自显式能力检查，而不是假设所有后端行为一样。**

## 一次 one-shot 委派如何发生

以“让子 Agent 审查一个代码目录”为例：

1. 父 Agent 选择 Provider，并提交 prompt、parent、取消信号和可选能力；
2. Subagent Runtime 根据 parent 确定 cwd、谱系和委派深度；
3. Runtime 在真正启动前检查 Provider 能力；
4. Provider 创建子运行时或外部 Harness，并建立子会话描述；
5. 子 Agent 独立执行模型和 Tool 链路；
6. 子运行结束后，结果通过稳定的 `SubagentResult` 返回父调用方；
7. 调用方不读取 Provider 私有进程或内部缓存来判断结果。

如果取消发生在 run 发布前，Provider 必须清理已部分创建的资源后拒绝启动；发布后取消则沿已发布 run 的取消通道终止剩余工作。

## Continuable Subagent 的核心是 Session，不是 Task

可继续模式里，持久对象是一份**子 Session**；进程内只在需要运行时维护一个对应的 **Activation**。Activation 可以经历多轮 Inbox 工作，空闲后释放；下一次消息到达时再从持久 Session 冷恢复。

可以把它理解成：

| 层 | 持有什么 | 生命周期 |
| --- | --- | --- |
| Persisted Session | 历史、描述、谱系、已提交事实 | 可跨 Activation 存在 |
| Activation | 当前驻留的 AgentHandle 与运行所有权 | 运行/等待期间存在，稳定后释放 |
| Agent Inbox | 下一轮消息 FIFO | 由 Agent Loop 领取 |
| Parent/Child ownership | 哪个 live Agent 可以控制哪个子级 | 只允许明确的直接关系 |

继续执行层不会再创建第二套 Task 状态机。真正的轮次排序仍由 Agent Inbox 和 Agent Loop 负责。

## 消息为什么只允许相邻 Agent

`sendMessage()` 使用确切在线 sender 做授权：直接 parent 可以发给 direct child，direct continuable child 可以回给 parent；self、sibling、跨多层 ancestor、陈旧 Agent 对象或 one-shot child 都会被拒绝。

这避免“知道一个 child id 就能控制它”。Subagent id 用于定位，真正的权限来自运行时所有权关系。

消息被 Inbox 接受后，调用方的取消信号不再撤销这条已接受消息。之后由 Activation 和 Agent Loop 自己负责执行；否则一次网络请求取消就可能把已经进入持久队列的工作悄悄抹掉。

## Fork 和 Spawn 解决的是不同上下文来源

- **Spawn**：子 Agent 从新的独立上下文开始；
- **Fork**：子 Agent 从父 Session 的稳定历史前缀派生。

Fork 适合“基于当前已确认上下文继续探索”，但它复制的是稳定前缀，不代表父子之后共享一份可变历史。创建后仍是两个独立 Session，后续状态各自追加。

## 失败发生在哪一层

| 失败点 | 典型表现 | 责任层 |
| --- | --- | --- |
| Provider 不支持请求能力 | 启动前明确拒绝 | `ctx.subagents` 能力检查 |
| 启动过程中取消 | 不发布不完整 run，清理部分资源 | Provider |
| 子 Agent Tool / Model 失败 | 子 Session 中形成自己的运行证据 | 子 Agent Runtime |
| Continuable child 当前未驻留 | 冷恢复 Activation 后投递 | continuation manager |
| 非相邻 Agent 发消息 | 拒绝投递 | 所有权授权 |
| 父级 / Service teardown | 释放受其拥有的 live Activation | 生命周期管理 |

排障时先判断是“没有创建成功”“子运行失败”“消息没有准入”还是“Activation 恢复失败”，不要统一归为“Subagent 没响应”。

## 插件开发判断

1. 只需要一个长耗时函数后台执行，不需要独立历史：使用 Jobs。
2. 需要多个委派的确定性 fan-out / join：让 Workflow 协调 Subagent。
3. 需要后续继续同一条认知历史：使用 Continuable Subagent，而不是反复新建 one-shot。
4. 业务不要依赖某个 Provider 的进程模型；通过能力声明判断可用特性。
5. 判断“子 Agent 当时看到什么”时，以子 Session Event Log 为证据，不以父 Agent 的实时内存对象推断。

源码定位优先从 `docs/subsystems/subagent.zh.md` 进入，再按具体 Provider 下钻到 `packages/subagent/`。