---
title: Workflow 编排
chapter_id: workflow-orchestration
slug: workflow-orchestration
dsh_version: v0.1.5-rc.2
upstream_tag: dsh-v0.1.5-rc.2
upstream_commit: fb2c4b9e698e30edb738bca4cf0618587db7d203
status: verified
verified_at: 2026-09-17
sources:
  - packages/workflow/README.zh.md
  - docs/subsystems/workflow.zh.md
  - packages/sandbox/README.zh.md
---
# Workflow 编排

Workflow 解决的是“如何把多个 Agent 动作组织成一个明确、可取消、可收敛的协调过程”。脚本负责 fan-out、等待、分支和结果组合，实际认知工作仍由 Subagent 完成。真正需要关注的是：**脚本运行由谁持有、子 Agent 归谁、取消如何传播、什么时候才算整个 Workflow 真正结束。**

## Workflow 拥有协调逻辑，不拥有另一套 Agent 语义

| 对象 | 谁拥有 | 负责什么 |
| --- | --- | --- |
| Workflow Script | `WorkflowRun` / Engine | 协调顺序、并发、条件和返回值 |
| Parent Agent | 调用方 | 提供父级身份、cwd、谱系和运行上下文 |
| Child Agent | Subagent Provider / Runtime | 真正执行推理和 Tool 工作 |
| Workflow Events | Runtime | 只做生命周期观测 |
| Tool Chat Record | `tool-workflow` Consumer | 把顶层 Workflow 的可见进度投影到父 Session |

所以 Workflow 不是“更大的 Agent”。脚本只是协调器，Agent 的历史、Tool、权限和 Session 仍属于各自运行时。

## 一次 Workflow 如何启动和结束

以“并行调研三个方案，再汇总”为例：

1. 调用方提交 script、meta、args、parent 和可选运行策略；
2. Engine 在执行脚本前校验 meta、输入和运行限制；
3. Engine 创建一个 `WorkflowRun`；
4. 脚本通过 `agent()` 启动多个 Subagent，父身份始终来自同一个 parent；
5. 脚本等待、组合或按条件继续启动后续工作；
6. 正常结束时返回 JSON 可物化结果；
7. 脚本异常或取消时，同样通过 `WorkflowResult.stopReason` 收敛为 `error` / `cancelled`；
8. 调用方最终执行 `dispose()`，确保脚本和子 Agent 都已经进入有界停稳状态。

这里有两个容易误判的点：`WorkflowRun.result` 本身不会因为脚本错误而 reject；错误被规范化进结果。其次，**拿到 result 不等于可以忘掉生命周期**，持有者仍必须 `dispose()`。

## `WorkflowRun` 是生命周期句柄

`WorkflowRun` 提供 `result`、`cancel()` 和 `dispose()`。调用方持有它，就同时承担 teardown 责任。

| 操作 | 语义 |
| --- | --- |
| `result` | 等待运行收敛到 completed / cancelled / error |
| `cancel()` | 请求停止脚本和已启动子 Agent |
| `dispose()` | 必要时取消，并等待有界结算和子资源停稳 |

官方契约要求取消后即使脚本自身永远不结算，Engine 也会在有界宽限后强制收敛；Worker Thread Provider 随后终止对应 worker。因此消费者不能把“脚本可能死循环”当作允许永久挂住 teardown 的理由。

## Fatal Error 与普通子任务失败必须区分

Workflow 内部有两类失败：

- **编排本身非法**：未知选项、超出 Agent 上限、无效 schema、能力启动失败、取消等，会形成 fatal `WorkflowError`；
- **某个子 Agent 没有成功完成**：可以作为某一项失败，由脚本自己的组合逻辑决定是否降级、跳过或继续。

`parallel()` / `pipeline()` 不会把 fatal 错误偷偷转成 `null`。否则一个拼错的参数可能被伪装成“某个 Agent 没产出”，最终生成表面成功的错误结果。

## Worker Thread 只解决 Host Event Loop 隔离

默认 Provider 为每次 run 使用 Worker Thread，并在其中执行脚本 vm。它的价值是把脚本同步计算移出 Host Event Loop，不代表：

- 文件访问已经隔离；
- 网络访问已经授权；
- 不可信代码拥有安全执行边界；
- 子 Agent 自动继承某种额外安全策略。

脚本或输入不可信时，仍需要 Sandbox、Remote Runtime 或其他真正负责安全边界的能力。

## Workflow Event 只能观察，不能偷偷接管运行

`workflow/start`、`workflow/phase`、`workflow/agent-start`、`workflow/agent-end`、`workflow/end` 等事件携带的是数据快照，不是活跃 `WorkflowRun`。监听器拿不到 `cancel()` / `dispose()`，异常也会被隔离。

这样做是为了保持所有权单一：**真正能控制 run 的只有持有 `WorkflowRun` 的调用方，Telemetry / UI / Progress 插件只能观察。**

## 顶层 Chat 记录为什么在 dispose 后才结束

`tool-workflow` 会把顶层运行的 start、成员和 end 事实写入父 Session。`run-end` 只有在结果已取得、并且 `dispose()` 已经完成后才写入。

这意味着 UI 中显示“Workflow 已结束”对应的是“结果已经收敛且生命周期已经完成”，而不是“脚本刚 return 了一个值但子资源还在退出”。对于调试和回放，这个差异非常关键。

## 失败与诊断

| 现象 | 优先判断 |
| --- | --- |
| Workflow 启动前失败 | meta / args / Provider / 上限等预检 |
| 某个 Agent 失败但脚本继续 | 子任务失败语义，由脚本决定降级 |
| 整个 run 直接 error | fatal 编排错误或脚本错误 |
| cancel 后长时间未结束 | Engine grace / 子资源 teardown |
| UI 缺少最终结束节点 | 检查 result 后的 dispose 与 Session 记录 |
| 监听器异常但 Workflow 正常 | 生命周期 Event 故障隔离生效 |

## 编排设计检查

在写脚本前先回答：

1. 哪些步骤可以并发，哪些必须等待前置结果；
2. 子 Agent 失败时是整体失败、保留部分结果还是降级；
3. 哪些错误属于“脚本写错了”，必须 fatal；
4. 谁持有 `WorkflowRun` 并保证最终 `dispose()`；
5. 安全边界由哪个 Sandbox / Runtime 提供；
6. 最终结果必须在什么资源真正停稳后才对外宣布。

如果只是委派一个独立认知任务，直接使用 Subagent；如果只是长时间执行而不需要脚本协调，使用 Jobs。源码定位优先从 `docs/subsystems/workflow.zh.md` 和 `packages/workflow/` 进入。