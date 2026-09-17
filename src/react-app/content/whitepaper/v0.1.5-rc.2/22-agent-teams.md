---
title: Agent Teams（实验）
chapter_id: agent-teams
slug: agent-teams
dsh_version: v0.1.5-rc.2
upstream_tag: dsh-v0.1.5-rc.2
upstream_commit: fb2c4b9e698e30edb738bca4cf0618587db7d203
status: verified
maturity: experimental
verified_at: 2026-09-17
sources:
  - docs/subsystems/agent-team.zh.md
  - packages/experimental/agent-team/README.zh.md
  - packages/subagent/README.zh.md
  - packages/README.zh.md
---
# Agent Teams（实验）

Agent Teams 解决的是“多个持续角色如何在同一个工作区长期协作，并让消息和任务状态跨崩溃恢复”。它不是多个 Subagent 并排运行，而是一套以 **Lead Session Log 为唯一真源**的实验性协作领域。

## 它比普通委派多了什么

| 机制 | 持久主体 | 协作状态 | 适合的问题 |
| --- | --- | --- | --- |
| Subagent | 独立 child Session | 父子委派与 continuation | 把一项认知任务交给另一个 Agent |
| Workflow | Workflow Run + child runs | 脚本控制并发与收敛 | 确定性协调多个步骤 |
| Jobs | owner Session 下的 Job record | 后台生命周期 | 不阻塞当前 Turn |
| Agent Teams | Lead Session Log + teammate Sessions | roster、durable mailbox、shared task DAG | 多角色持续协作 |

只有最后一项要求成员之间持续交换消息并维护共享任务板。

## 一支 Team 的所有权模型

每个普通 root Session 都可以成为隐式 Team Lead，`TeamId` 就是 Root `SessionId`。Team 没有独立数据库；roster、mailbox 和 task board 都从 Lead Session Log 回放出来。

| 对象 | 谁拥有持久事实 | 谁负责运行时行为 |
| --- | --- | --- |
| Team identity / roster | Lead Session Log | Team Service |
| Teammate identity | child Session + Lead roster event | continuable Subagent owner |
| Peer message | Lead queued/delivered events + target Session source | Team mailbox dispatcher |
| Shared task | Lead Session `team/task` snapshot | Team task board service |
| Teammate 当前 running / idle / inactive | 不写回 roster phase | 运行时从 live Agent 派生 |

这个分离很重要：`active` 是持久成员状态，不等于“此刻正在运行”。

## 一次 teammate 创建怎么提交

创建 teammate 时，Lead 先在自己的 Session Log 写入并 flush `provisioning` 成员记录，再要求配置的 Subagent Provider 创建预留 child。成功后进入 `active`；Provider 失败则追加持久 `failed`。

因此 teammate 名字从第一次 provisioning 就被占用，即使创建失败也不会复用。崩溃恢复时，系统会把未终结的 provisioning 与 child 的持久 Session 对账，再确定 `active` 或 `failed`，而不是仅凭内存状态猜测。

这类设计的目标是让“成员是否存在”成为可回放事实，而不是进程内对象是否还活着。

## Durable Mailbox 怎么避免恢复后重复

任何成员都可以向 Lead 或其他 teammate 发消息。发送流程先把完整消息写入 Lead Log 的 `team/message/queued` 并 flush，然后才尝试即时 Steer 投递。

只有 target Session 的 pending inbox 或已记录 user message 已持久保存同一个 `TeamMessageSource` 后，Lead 才写 `team/message/delivered` acknowledgement。恢复时只重投 `queued - delivered`。

因此要区分两种保证：

- **Team 级保证**：消息可在崩溃后继续恢复投递，并通过 target Session 身份去重；
- **它不是跨进程共识**：保证来自单进程内重试 + 持久 Session 去重，不是分布式 exactly-once 协议。

如果部署需要多个进程共同消费同一个 Team，就已经超出当前边界。

## Task DAG 用 revision 防止静默覆盖

共享 Task 每次更新都写完整 Snapshot，并携带递增的 `revision`。更新使用 compare-and-set；两个成员同时修改同一 Task 时，基于旧 revision 的请求会明确失败，而不是后写覆盖先写。

`blockedBy` 必须维持无环依赖；`writeScopes` 只是规范化的路径提示。两个进行中的任务触及重叠路径时可以给出警告，但 **不会加锁，也不会授予写权限**。

这意味着 Task Board 能协调认知工作，但不能替代 Git、文件锁或并发写控制。

## 中断 teammate 不会释放任务

只有 Lead 能 interrupt teammate。中断只停止当前 live Turn，并保留 pending inbox；Task owner 也不会自动释放。

因此“Agent 已停止”不等于“任务重新可领取”。产品若需要 worker 死亡后自动 lease timeout / requeue，应另行实现任务所有权策略，不能从当前 Team 机制自动推出。

## 当前实验边界

Agent Teams 仍以 experimental 包发布，不在默认 Profile 中启用，并要求持久 Session Storage。采用前必须接受以下限制：

- teammate 共用同一个 workspace，不支持每成员独立工作目录；
- 多进程不能共同协调同一 Team；
- Task owner 不会因为成员中断自动释放；
- `writeScopes` 只是 advisory warning，不是锁或授权；
- Teammate 数、活动 Task、pending message、单消息大小都有显式部署上限；
- API 和持久形式仍可能随实验能力演进。

第三方稳定插件不应把 Agent Teams 当成所有部署必有的基础能力。

## 什么时候值得采用

只有同时满足三点时再考虑：任务确实需要多个长期角色；消息 / Task 状态必须跨 reload 或崩溃恢复；你能接受单进程、共享 workspace 与 experimental stability 的边界。

如果只是“让 reviewer 检查一次 diff”，Subagent 更简单；如果步骤与收敛逻辑是确定的，Workflow 更清晰；如果只是把长任务放后台，Jobs 更匹配。

## 排障顺序

出现协作异常时按事实层定位：

1. roster 是否在 Lead Session Log 中出现 provisioning / active / failed；
2. message 是否有 queued，target Session 是否已有同 message id，Lead 是否已有 delivered；
3. Task 当前 revision、owner、blockedBy 是否与调用方快照一致；
4. teammate 是持久 active 但运行时 inactive，还是创建本身 failed；
5. 最后再看 continuation / Agent runtime 是否能冷恢复 target。

不要只看 UI 上“成员在线/离线”判断持久协作状态。Team 的权威证据始终从 Lead Session Log 与 target Session 的持久消息身份开始。