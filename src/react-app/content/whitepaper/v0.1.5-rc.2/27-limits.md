---
title: 已知边界与不适用场景
chapter_id: limits
slug: limits
dsh_version: v0.1.5-rc.2
upstream_tag: dsh-v0.1.5-rc.2
upstream_commit: fb2c4b9e698e30edb738bca4cf0618587db7d203
status: verified
verified_at: 2026-09-17
sources:
  - packages/sandbox/README.zh.md
  - packages/webhook/README.zh.md
  - docs/subsystems/webhook.zh.md
  - packages/jobs/README.zh.md
  - packages/workflow/README.zh.md
  - docs/subsystems/agent-team.zh.md
  - packages/experimental/agent-team/README.zh.md
  - packages/sdk/client/README.zh.md
  - packages/acp/acp/README.zh.md
  - docs/testing.zh.md
---
# 已知边界与不适用场景

这页不是“缺点列表”，而是采用 DSH 时的边界决策表：**你需要的保证由谁提供、DSH 当前能提供到哪里、超出后该换 Provider 还是补外部系统**。只记录 rc.2 官方资料已经明确的限制，不补猜测。

## 先从需要的保证出发

| 你真正需要的保证 | rc.2 当前能提供什么 | 明确缺少什么 | 应对方式 |
| --- | --- | --- | --- |
| 强进程隔离 | Local Sandbox / Policy 可约束本地执行 | 与宿主仍是“同世界”边界 | 换容器、MicroVM、E2B 或远程 Runtime Provider |
| 不可信脚本安全执行 | Workflow Worker Thread 隔离 Host Event Loop | Worker Thread 不是安全边界 | 额外套 Sandbox / Remote Runtime |
| 人工审批 | Tool Pipeline + Approval 一次性 Allow / Deny | 不等于长期安全策略 | 稳定约束放 Sandbox、Provider、Guard、Permission Preset |
| Webhook 可靠交付 | 已验证 Delivery → Rule → Session 创建 | 无队列、retry、dedup、crash replay、completion status | 外部事件系统持久化、重试、幂等，再触发 DSH |
| 后台任务跨重启 | Jobs 管理 owner Session 内后台生命周期 | 不是跨 Session / 跨进程可靠队列 | 外部任务系统 + DSH Consumer |
| 多角色持久协作 | Agent Teams 持久 roster / mailbox / task DAG | experimental、单进程、共享 workspace、owner 不自动释放 | 仅可选采用；更强协调交给外部系统 |
| 标准 Agent Client 自动化 | ACP v1 会话、权限、取消、持久恢复 | 无完整 DSH 交互式 UI、fork/delete/transcript replay 等 | 自动化用 ACP，产品 UI 用 Web Client |
| SDK 逐 Prompt cancel | SDK 可驱动 Runtime / Session / Event | 当前协议无逐 Prompt cancel | 需要标准 cancel 时评估 ACP；否则关闭 Runtime |
| “测试通过 = 功能正确” | 多层测试、Invariant、真实 API、Telemetry | 任一单一证据都不能覆盖所有保证 | 按目标结论设计证据链 |

真正的风险不是“存在限制”，而是把某层提供的便利误解成更强保证。

## 安全：隔离、审批、Tool 策略是三条轴

### 本地 Sandbox 不是 VM

Local Sandbox 能限制进程行为，但仍与 Host 共享内核和宿主环境。若威胁模型包含恶意代码、强租户隔离或需要把 Host 视作不可信边界，本地 sandbox 不应被描述成“容器级隔离”。

### Approval 不替代 Policy

Approval 解决某一次 Tool Call 是否继续；Guard、Sandbox、Provider 与 Permission Preset 才负责稳定约束。把“用户点过一次允许”解释成长期授权，会把一次性控制面升级成未声明的权限模型。

### Worker Thread 只解决执行位置

Workflow 默认 worker-thread Provider 把脚本同步计算移出 Host Event Loop，能改善隔离执行和 cancellation 管理，但它不是安全沙箱。对于不可信 Workflow 脚本，仍要选择真正的受控执行环境。

## 可靠性：不要把内存生命周期当持久队列

Webhook 与 Jobs 都容易被误用成“任务系统”，但两者回答的问题不同。

Webhook 的 `dispatch()` 是 fire-and-forget，重复 Delivery 可能创建重复 Session；Jobs 只管理 owner Session 内的后台任务、状态和通知。它们都没有自动提供跨进程持久队列、业务幂等、失败重试与 exactly-once 语义。

一个典型场景是 GitHub 事件触发长时间构建：如果业务要求进程崩溃后仍能重试、同一 delivery 只执行一次、能查询业务状态，就应该先由外部队列持久化事件和状态，再让 worker 调 SDK / ACP / Webhook。不能靠“再发一次 Prompt”补出可靠系统语义。

## Agent Teams：持久不等于分布式

Agent Teams 的 mailbox 和 task board 能从 Lead Session Log 恢复，消息有 queued / delivered 去重路径，Task 有 CAS revision；但所有协作仍属于单进程模型。

它不支持多个进程共同协调同一 Team，teammate 不能有独立 workspace，Task owner 也不会因为 Agent interrupt 自动释放。`writeScopes` 只是 warning，不是文件锁。需要 worker lease、跨节点调度或强写冲突控制时，应使用专门的协调系统。

## 接入协议：标准化也会收窄能力

ACP 提供标准自动化表面，但故意不暴露 DSH 完整 Web UI 的展示模型；SDK 给予调用方更直接的 Runtime ownership，但调用方也因此要负责进程和 teardown；Webhook 生命周期最轻，但可靠交付能力也最少。

所以“哪个协议功能最多”不是正确问题。应该问：**我愿意让谁拥有 Runtime、Session、取消、恢复和资源释放？**

## 测试：每类证据只能证明自己的范围

| 证据 | 擅长证明 | 不能单独证明 |
| --- | --- | --- |
| Unit test | 局部函数 / 状态转换 | Profile 接线、真实 Provider 行为 |
| 组合 / integration test | 插件组合与生命周期 | 真实外部 API 一定可用 |
| 真实 API e2e | 一条真实链路 | 所有并发、恢复、失败分支 |
| Invariant | 运行时内部约束未被破坏 | 用户目标或外部副作用正确 |
| Replay / Session evidence | 持久事实可恢复 | 当前外部系统仍保持相同状态 |
| Benchmark | 特定方法和环境下的性能 | 其他机器 / 数据规模的普遍性能 |
| Telemetry | 趋势与异常观测 | 单次业务结果必然正确 |

因此“CI 全绿”不能自动推出“这个集成满足生产 SLA”。保证必须绑定目标、范围和证据。

## 三类采用判断

### 可以直接依赖公开契约

稳定 Service Definition、Tool Pipeline、Session Event、正式 SDK / ACP 接口等已有清晰公开契约，可以作为插件和产品集成基础，但仍要遵守各自生命周期。

### 只能把它当可选能力

Agent Teams 等 experimental 包，应显式做 feature detection / Profile 依赖，并准备没有该能力时的降级路径。

### 必须外部补齐

可靠队列、业务幂等、跨进程 Team 共识、强租户隔离等超出 rc.2 声明范围的保证，应由专门系统提供。不要通过模型提示、无限重试或依赖内部实现来“模拟”这些保证。

## 最终判断方法

遇到生产需求时，把它写成一句可验证的话，例如：“同一 GitHub delivery 在进程崩溃后至少会处理一次，但业务副作用最多发生一次。”然后逐项标注：谁持久化 delivery、谁重试、谁去重、谁创建 Session、谁验证外部副作用。

如果其中某一项只能回答“Agent 应该会处理”或“目前实现看起来如此”，就说明保证还没有闭环。边界页的作用就是让这些未被正式提供的责任尽早暴露，而不是上线后再从日志里发现。