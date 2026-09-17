---
title: 外部接入方式选择
chapter_id: sdk-acp-webhook
slug: sdk-acp-webhook
dsh_version: v0.1.5-rc.2
upstream_tag: dsh-v0.1.5-rc.2
upstream_commit: fb2c4b9e698e30edb738bca4cf0618587db7d203
status: verified
verified_at: 2026-09-17
sources:
  - packages/sdk/README.zh.md
  - packages/sdk/client/README.zh.md
  - packages/acp/README.zh.md
  - packages/acp/acp/README.zh.md
  - packages/webhook/README.zh.md
  - docs/subsystems/webhook.zh.md
---
# 外部接入方式选择

SDK、ACP 与 Webhook 都能连接外部系统，但真正的选择维度不是“哪个 API 更方便”，而是：**谁启动工作、谁持有 Session、调用返回代表什么终态、断线与失败由谁负责**。

## 用同一组维度比较

| 维度 | SDK | ACP | Webhook |
| --- | --- | --- | --- |
| 入口方向 | 外部应用主动驱动 Runtime | ACP Client 主动控制 Server | 外部事件被动触发规则 |
| 主要传输 | stdio 换行分帧 JSON-RPC | 标准 ACP v1 / stdio | Provider HTTP → verified delivery |
| Runtime / 连接 owner | SDK Client | ACP Client + Server connection | Host Webhook Runtime |
| Session 模型 | Client 打开 / 恢复并持续观察 | 标准协议创建 / 列出 / 恢复 / 关闭持久 Session | Rule 可创建普通根 Session |
| “请求返回”代表什么 | 低层 prompt 只表示入队；高层 `run()` 等到下一次 idle | `session/prompt` 在所属工作与有序更新结算后返回 | HTTP / `dispatch()` 只表示已验证并开始内存分发 |
| 取消模型 | 协议无逐 prompt cancel；放弃运行通常意味着关闭 Runtime | 标准 session cancel；关闭走停稳式 cleanup | Rule callback 可观察 signal；已创建 Session 后走普通 Agent 生命周期 |
| 持久恢复 | Session / Event 由 Runtime 提供 | 持久 Session 可跨进程恢复 | Runtime 不保存 delivery / rule completion 状态 |
| 可靠投递 | 不是任务队列 | 不是任务队列 | 明确没有队列、重试、去重、崩溃重放 |
| 适合 | 自有后端、CLI、测试工具、服务端控制器 | IDE / 自动化平台 / 标准 Agent Client | GitHub 等事件驱动自动化 |

这三种方式的共同点是：都不会绕过 DSH 的 Profile、Preset、Sandbox、Approval 和 Session 语义。

## 场景一：应用要长期控制一个 Runtime

如果你的服务需要启动 DSH、连续运行多次任务、消费 Session Event，并在最后负责回收子进程，SDK 最直接。TypeScript Client 的高层 `DeepSeekHarness` 和低层 `HarnessClient` 都把 Runtime 子进程生命周期交给调用方。

代价是调用方必须处理进程、初始化、传输关闭、超时和资源释放。并且低层 `prompt()` 返回的是持久入队回执，不是“这个 prompt 的最终答案”；高层 `run()` 只是把一个自己拥有的活动区间收集到下一次 idle。

## 场景二：外部平台已经采用 ACP

如果 IDE、Agent 平台或测试控制器已经围绕 Agent Client Protocol 建模，应优先 ACP。它暴露标准会话生命周期、模型配置、MCP、权限请求、取消与语义更新，不要求 Client 理解 DSH 私有 SDK 协议。

代价是标准化同时意味着边界收窄：ACP 不提供 DSH 专用 Chat 卡片、计划、todo、终端视图、会话 fork / delete / transcript replay 等交互式能力。它适合自动化，不适合拿来复刻完整 Web Client。

## 场景三：外部事件只需要触发工作

GitHub 事件、监控事件或业务回调到达后，只需根据受信规则决定是否创建 DSH Session，此时 Webhook 更匹配入口方向。Provider Adapter 先验证身份并规范化事件，Rule 再决定是否返回 Session Request。

关键风险是不要把 `202`、`dispatch()` 返回或 Rule 被调度理解为任务成功。Webhook Runtime 是 fire-and-forget：没有 delivery database、队列、重试、去重、崩溃重放或 Agent 完成状态。业务若要求至少一次处理、幂等或可靠状态机，应由外部系统先提供这些保证。

## 三个容易选错的情况

| 需求 | 不建议 | 原因 | 更合适 |
| --- | --- | --- | --- |
| 只需事件触发一次 Agent | 长期持有 SDK Runtime | 生命周期和连接成本高于需求 | Webhook |
| 需要标准 IDE / Agent Client 互操作 | 自定义 SDK 包一层协议 | 重复定义会话、权限、取消语义 | ACP |
| 需要可靠队列、重试、去重 | 直接依赖 Webhook | 当前 runtime 明确不提供这些保证 | 外部任务系统 + SDK / ACP / Webhook 触发 |
| 需要 DSH 完整交互式 Web UI | ACP | ACP 刻意只提供标准自动化表面 | Web Client / Remote / Slots |

## 做选择时先回答四个问题

1. 谁创建并持有 Runtime / Connection？
2. 谁拥有 Session 的持久生命周期？
3. 一次调用返回时，究竟只是“已接受”，还是“Agent 已 idle / 已停稳”？
4. 断线、重复交付、取消和进程退出后，谁负责恢复或重试？

如果这四个答案仍然模糊，就还没有完成接入方式选择。选定后再进入“SDK 接入”“ACP 接入”或“Webhook 事件接入”看具体生命周期和验证方法。