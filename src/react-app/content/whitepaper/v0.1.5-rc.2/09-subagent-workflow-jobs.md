---
title: 编排方式选择
chapter_id: subagent-workflow-jobs
slug: subagent-workflow-jobs
dsh_version: v0.1.5-rc.2
upstream_tag: dsh-v0.1.5-rc.2
upstream_commit: fb2c4b9e698e30edb738bca4cf0618587db7d203
status: verified
verified_at: 2026-09-16
sources:
  - packages/subagent/README.zh.md
  - docs/subsystems/subagent.zh.md
  - packages/workflow/README.zh.md
  - docs/subsystems/workflow.zh.md
  - packages/jobs/README.zh.md
  - docs/subsystems/jobs.zh.md
  - docs/subsystems/agent-team.zh.md
---
# 编排方式选择

DSH 没有一个统一的“异步任务”抽象。Subagent、Workflow、Jobs 和 Agent Teams 分别解决**独立推理、确定性协调、后台生命周期、长期多角色协作**四类问题。选择时先判断你需要保存什么状态、由谁拥有它、失败后从哪里继续，而不是先看哪种能力“更强”。

## 先用四个问题做选择

1. **任务是否需要自己的 Agent 历史？**需要独立上下文、工具过程或后续继续时，优先 Subagent。
2. **是否需要显式控制多个步骤的并发、等待和分支？**重点是协调规则时，优先 Workflow。
3. **是否只是一个耗时操作不应阻塞当前 Turn？**不需要另一套推理历史时，优先 Jobs。
4. **是否需要多个持续角色长期交换消息并共享任务状态？**只有这种场景才考虑实验性的 Agent Teams。

如果答案都是否，普通 Tool Call 往往已经足够，不要为了“异步”额外引入编排层。

## 用同一组维度比较

| 维度 | Subagent | Workflow | Jobs | Agent Teams |
| --- | --- | --- | --- | --- |
| 核心对象 | 独立 Agent / Session | 编排脚本 | Session 所属后台任务 | Lead + Teammates + Mailbox + Task DAG |
| 是否拥有独立推理历史 | 是 | 脚本本身没有；通常协调多个 Agent | 否 | 是，多个持续 Agent |
| 谁控制流程 | 父 Agent / 委派接口 | Workflow 脚本 | 启动 Job 的 Agent Session | 多个角色围绕共享任务状态协作 |
| 适合解决 | 一项需要独立上下文的认知任务 | 多任务并发、等待、分支、组合 | 长耗时 Tool 后台化 | 长期多角色协作 |
| 主要失败边界 | 子 Agent / Provider / Session 生命周期 | 分支失败、脚本失败、下游 Agent 失败 | 任务失败、取消、拥有者生命周期 | 实验能力变化、角色/任务状态协调 |
| 不应把它当成 | 后台函数队列 | 安全沙箱 | 跨进程可靠队列 | 稳定的默认编排基础 |

这张表的重点不是功能多少，而是**状态所有权不同**。选错机制后，最常见的问题不是“跑不起来”，而是恢复、取消和诊断时找不到真正的状态拥有者。

## 四个具体场景

### 场景一：让另一个 Agent 做代码审查

代码审查需要自己的上下文、工具调用和可继续历史。父 Agent 只关心委派、状态和最终结果，因此使用 Subagent。若审查中断后还需要继续同一条历史，独立 Session 正是需要保留的状态。

### 场景二：并行调研三个方案，再统一收敛

这里不仅要创建多个 Agent，还要规定“并行启动 → 等待全部或部分结果 → 按条件补充 → 汇总”。需要保存的是**协调逻辑**，因此使用 Workflow；Workflow 可以在内部创建 Subagent，但不应把这套并发和等待规则散落成多次隐式 Tool Call。

### 场景三：导出任务预计执行十分钟

如果导出只是一个长时间 Tool，不需要独立推理历史，当前 Agent 应尽快继续工作，则注册为 Job。Job 属于启动它的 Agent Session，完成后通过 Session 内通知回到拥有者。

若业务要求跨进程持久投递、自动重试、去重、SLA 或重启后继续执行，这些保证不应从 Jobs 推导出来，应由外部可靠任务系统承担，再与 DSH 集成。

### 场景四：多个角色长期维护同一任务板

如果 Lead、研究员、实现者需要持续存在、互相发消息并共同维护 Task DAG，Agent Teams 的模型更贴近问题。但当前版本中它不在默认 Profile 中启用，仍是实验能力；生产系统必须准备禁用或替换后的降级路径。

## 组合不是替代关系

这些机制可以组合，但组合后仍要保持所有权清楚：Workflow 可以按规则创建和等待 Subagent；Subagent 内可以启动 Job；Agent Teams 则维护多个持续角色及共享协作状态。

组合后仍分别保留各自的状态归属：Workflow 拥有协调规则，Subagent 拥有独立推理历史，Job 归启动它的 Session 所有。不要因为它们出现在同一条链路里，就把生命周期混成一个“任务状态”。

## 常见误用

| 误用 | 为什么有问题 | 更合适的处理 |
| --- | --- | --- |
| 用 Subagent 只是为了不阻塞一个 Shell 命令 | 为简单后台执行引入额外 Agent 历史与生命周期 | Jobs |
| 用 Jobs 承担需要持续推理的研究任务 | Job 没有独立 Agent 历史 | Subagent |
| 用多次 Tool Call 隐式模拟复杂 fan-out / join | 协调规则分散，失败和等待难诊断 | Workflow |
| 把 Worker Thread Workflow 当安全边界 | 执行隔离不等于权限或文件系统隔离 | Sandbox / Remote Runtime |
| 把 Jobs 当可靠消息队列 | 当前契约重点是 Session 内后台生命周期 | 外部可靠任务系统 |
| 默认依赖 Agent Teams | 当前版本仍属实验能力且非默认 Profile | 保留 Subagent / Workflow 等稳定降级路径 |

## 最终判断

需要**另一条 Agent 历史**，选 Subagent；需要**明确的协调程序**，选 Workflow；需要**把一个耗时操作放到后台**，选 Jobs；需要**多个持续角色共享协作状态**，才考虑 Agent Teams。

继续阅读时再进入左侧四篇机制文章，分别理解各自的生命周期、失败语义和公开接口；本页不重复它们的实现细节。官方入口集中在 `packages/subagent/`、`packages/workflow/`、`packages/jobs/` 与 `docs/subsystems/agent-team.zh.md`。
