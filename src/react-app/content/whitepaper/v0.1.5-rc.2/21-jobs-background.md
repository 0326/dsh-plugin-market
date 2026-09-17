---
title: Jobs 后台执行
chapter_id: jobs-background
slug: jobs-background
dsh_version: v0.1.5-rc.2
upstream_tag: dsh-v0.1.5-rc.2
upstream_commit: fb2c4b9e698e30edb738bca4cf0618587db7d203
status: verified
verified_at: 2026-09-17
sources:
  - packages/jobs/README.zh.md
  - docs/subsystems/jobs.zh.md
  - docs/subsystems/session.zh.md
---
# Jobs 后台执行

Jobs 解决的是“一个长时间操作如何脱离当前同步等待，但仍保持明确的拥有者、取消和完成语义”。它不是通用消息队列，也不是另一个 Agent。理解 Jobs 最重要的三件事是：**谁拥有任务、什么时候算真正完成、完成结果由谁消费。**

## Job Registry 与 Producer 分工

| 角色 | 拥有什么 | 不负责什么 |
| --- | --- | --- |
| Producer | 实际执行资源、`cancel()`、`done`、可选输出读取 | Job id、访问授权、生命周期状态 |
| `ctx.jobs` Registry | id、owner、状态、wait/read/kill、通知与结算 | 执行具体业务工作 |
| Job Controller / Tool | 给拥有者提供读取、等待、停止能力 | 改写 Producer 的资源生命周期 |
| Agent Session | Owned Job 的访问边界 | 全局共享其他 Session 的 Job |

这种拆分让 Bash、Subagent 或后续其他长任务可以复用同一后台生命周期，而不要求 Registry 知道每种任务如何执行。

## 一次 Job 从启动到完成

以一个耗时文件导出 Tool 为例：

1. Producer 向 `ctx.jobs.start()` 提交 kind、label、owner 和同步 `run()`；
2. Registry 先检查 owner、Controller、并发容量和清理条件；
3. 只有预检通过后才调用 Producer 的 `run()`；
4. `run()` 同步返回 `cancel()`、`done` 和可选 `readOutput()`；
5. Registry 原子登记 Job id，调用方可以立即把 id 返回给 Agent；
6. Producer 在后台继续执行；
7. `read()` / `wait()` / `kill()` 始终通过 owner 授权访问；
8. `done` 在 Producer **释放资源之后**结算；
9. Registry 提交唯一终态，再通知 waiter 和完成监听器。

启动阶段采用“预检在前、注册在后”的原因很直接：不能先把一个 Job id 暴露给模型，再发现没有 Controller、没有容量或资源根本没启动成功。

## `done` 表示资源已经释放，而不只是业务代码跑完

`JobHooks.done` 的契约比普通 Promise 更强：它应在 Producer 已经释放执行资源后 resolve，而不是一得到业务结果就 resolve。

因此：

- 子进程退出但清理句柄尚未完成，Job 还不能宣称完全结束；
- 取消请求发出后，状态可以进入 `stopping`，但最终终态要等 `done`；
- owner teardown 会取消 live Job，并等待遵守契约的 Producer 停稳。

这让“Job completed”成为可依赖的生命周期事实，而不是一个过早的 UI 状态。

## Owned Job 的边界是 Session，不是 id 保密性

Job id 形如 `<kind>-N`，本身可预测，因此安全边界从来不是“别人猜不到 id”。Owned Job 通过 owner Session 做访问控制：其他 Agent 即使知道 id，也不能读取、等待或取消不属于自己的 Job。

`list()` 同样只返回调用者可见的 Job，不会泄漏其他 Session 的 label。插件不应自行绕过 Registry 缓存一份全局 Job Map，否则会破坏这条所有权边界。

## 为什么启动 Job 需要 Controller

Registry 在 owner 没有可用 Job Controller 时拒绝启动工作。理由是：一个后台任务如果启动后没有任何控制面可以读取、停止或接收完成结果，就会成为无主资源。

这条约束把“能生产后台任务”和“系统能够管理后台任务”绑定起来。对于业务插件，启动成功意味着至少存在一条可收集、可停止的控制路径。

## 状态不是简单的 running / done

Job 状态包括 `running`、`stopping`、`completed`、`killed`、`failed`。

| 状态 | 含义 |
| --- | --- |
| `running` | Producer 正在工作 |
| `stopping` | 已请求停止，但资源尚未完成 teardown |
| `completed` | 正常结束且资源已释放 |
| `killed` | 取消后结束 |
| `failed` | Producer 或生命周期失败 |

`kill()` 只请求取消，不应伪装成“已经停止”。这也是 `stopping` 独立存在的原因。

## First-wins settlement 防止双终态

Job 结算采用 first-wins：一旦 Registry 提交终态，后到的 Producer 结果不能再次改写它。这样取消、Producer 自然结束、异常和 teardown 竞争时，系统仍只有一个最终记录、一轮 waiter 释放和一轮完成通知。

完成通知发生在终态记录提交之后。监听器即使立刻打开新的模型 Turn，也只能看到已经稳定的 Job 状态。

## `read()`、`wait()` 和通知不是一回事

- `read()`：读取当前输出；流式 Producer 可以有消费游标；
- `wait()`：等待 Job 结算或超时，不会自动取消 Job；
- 完成通知：告诉拥有者任务已经进入终态；
- `reported`：避免同一个终态被 read / wait / kill / teardown 与自动通知重复报告。

因此模型不需要持续轮询才能知道完成，但主动 `wait()` 也不会改变 Job 的执行所有权。

## 失败和恢复边界

| 失败点 | 结果 | 该怎么理解 |
| --- | --- | --- |
| start 预检失败 | 不产生 Job id，也不应留下执行资源 | 准入失败 |
| Producer `run()` 抛错 | 不注册 Job，Producer 清理部分资源 | 启动失败 |
| `cancel()` 抛错 | 取消请求失败，不能宣称任务已停 | Producer 生命周期错误 |
| `done` reject | Registry 转成 failed | Producer 违反完成约定 |
| owner dispose | Registry 请求取消并等待 Job | 生命周期清理 |
| wait 超时 | 只结束本次等待，Job 继续运行 | 观察超时，不是任务超时 |
| 服务进程重启 | 当前 Local Registry 不提供持久队列保证 | 需要外部可靠任务系统 |

## 什么时候不要用 Jobs

如果需求包含跨进程持久投递、自动重试、去重、延迟队列、SLA、灾难恢复或多 Worker 抢占，应该由外部可靠任务系统提供这些保证，再把控制结果接回 DSH。

Jobs 的核心价值是**Agent Session 内的后台生命周期管理**。需要独立推理历史用 Subagent；需要确定性协调多个 Agent 用 Workflow；只需要把一个长时间操作放到后台并让拥有者可控、可收敛时，才使用 Jobs。

源码定位优先从 `docs/subsystems/jobs.zh.md`、`packages/jobs/jobs/` 与 `packages/jobs/jobs-local/` 进入。