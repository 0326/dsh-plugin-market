---
title: Webhook 事件接入
chapter_id: webhook
slug: webhook
dsh_version: v0.1.5-rc.2
upstream_tag: dsh-v0.1.5-rc.2
upstream_commit: fb2c4b9e698e30edb738bca4cf0618587db7d203
status: verified
verified_at: 2026-09-17
sources:
  - packages/webhook/README.zh.md
  - docs/subsystems/webhook.zh.md
  - packages/webhook/webhook-github/README.zh.md
---
# Webhook 事件接入

Webhook 解决的是“经过身份验证的外部事件如何触发一个普通 DSH Session”，不是可靠任务投递。最重要的判断是：**HTTP 已返回、规则已开始、Session 已创建、Prompt 已入队、Agent 已完成**是五个不同状态，当前 Webhook Runtime 只负责其中前半段。

## 一次 Delivery 怎么进入 Session

以 GitHub Webhook 为例，链路是：

1. Provider Adapter 接收请求，并在解析业务 JSON 前验证原始请求身份；
2. Adapter 把请求规范化为 `VerifiedWebhookDelivery`，包含 provider kind、source、delivery id、event 与接收时间；
3. `ctx.webhookRuntime.dispatch()` 快照当前匹配规则，为每条规则启动独立 callback，然后立即返回；
4. Rule 执行受信任程序逻辑，可调用外部系统，并返回 `null` 或 `WebhookSessionRequest`；
5. Runtime 验证 Agent Preset、Permission Preset、Workspace 与可选模型选择；
6. 创建普通根 Agent，并在发布前挂载 Preset；
7. Session 持久附加到 Workspace；
8. 初始 follow-up 以 `source.kind: "webhook"` 写入普通 Session 路径，并携带 provider / source / delivery / rule 来源；
9. Inbox 接受 follow-up 时，本次 Webhook Session 创建操作完成；
10. Runtime **不等待 Agent Turn 完成**，后续完全进入普通 Session / Agent 生命周期。

因此 Provider 返回 `202` 只能说明请求已验证并进入内存分发，不能证明 Rule 成功，更不能证明 Agent 已完成。

## 谁拥有哪一段责任

| 阶段 | Owner | 明确责任 |
| --- | --- | --- |
| HTTP 身份验证 | Provider Adapter | 验签、解析 Provider 凭据、规范化事件 |
| Rule 条件与外部调用 | 受信 Rule | 判断是否创建 Session，并观察 teardown signal |
| Rule 生命周期 | `ctx.webhookRuntime` | 注册、dispatch、卸载时 abort + drain active callback |
| Session 创建 | Webhook Runtime | Workspace、Preset、Permission、Agent、持久 attach、follow-up |
| 后续 Agent 工作 | 普通 DSH Agent / Session | Tool、权限、Sandbox、持久化、Turn 生命周期 |
| 可靠事件交付 | **不由 Webhook Runtime 提供** | 需要外部队列 / 事件系统承担 |

这张表也是失败归因的第一入口。

## `dispatch()` 返回并不代表 Rule 已完成

`dispatch()` 会快照匹配规则并并发启动，然后在任何 callback settle 前返回。每条 Rule 的抛错或 reject 相互隔离，不会把 `dispatch()` 变成一个可等待的“全部处理完成”Promise。

GitHub Adapter 同样在内存分发后立即返回 `202`。所以不能用 HTTP 状态码构建“Webhook 任务已完成”的业务状态机。

## 明确不存在的保证

当前 Runtime 没有：

- delivery database；
- retry；
- dedup；
- execution status；
- crash replay；
- Agent completion listener；
- exactly-once / at-least-once 交付保证。

`deliveryId` 只用于来源信息，Runtime 不存储也不去重。Provider 重复投递时，完全可能创建多个 Session。

如果业务要求“至少一次处理但业务只执行一次”，应先在外部系统以 delivery id 或业务键实现持久去重，再触发 DSH。

## Session 创建过程也有提交边界

Session 创建不是一个不可分割黑盒：

| 失败位置 | 结果 |
| --- | --- |
| Preset / Workspace / Request 预检失败 | 不发布 Agent |
| Agent 已创建但 Session attach 失败 | 在 Prompt 出现前释放新 Agent |
| 已 attach、Prompt 尚未被 Inbox 接受时失败 | 尝试从 Workspace 脱离并释放 Agent，保留原始错误 |
| Follow-up 已被 Inbox 接受 | Webhook 操作已提交，之后走普通 Session 生命周期 |

这意味着排障时要先确认“有没有持久 Session / Webhook source message”，再判断是不是 Agent 执行问题。

## Rule 是受信代码，不是配置解释器

`WebhookRule.run(delivery, signal)` 可以执行任意程序逻辑。外部事件字段应由 Rule 显式验证后使用；不要把未验证 payload 直接拼成 shell、路径、Patch 或可执行配置。

Rule 卸载时，Runtime 会先停止新 Delivery 进入，再 abort 并 drain 已活动 callback。需要在卸载时停止的异步工作必须观察 signal，否则插件 teardown 无法证明真正停稳。

## 最小验证链

Webhook 集成至少要验证：

1. **身份失败**：签名错误时不会进入 Rule；
2. **Rule 过滤**：不匹配事件返回 `null` 时不会创建 Session；
3. **创建成功**：Session Log 中能重新读取带 `source.kind: "webhook"` 的初始消息与来源字段；
4. **失败回滚**：Preset / attach / Prompt 准入失败时没有遗留可运行的半成品 Agent；
5. **重复 Delivery**：确认系统是否接受重复 Session；若不能接受，外部去重必须有独立证据；
6. **teardown**：Rule disposer 后，新请求不再进入该 Rule，活动 callback 能被 signal 停止并 drain。

Agent 最终回复“处理成功”不能证明 Webhook 可靠交付，也不能证明外部副作用成功；后者仍需从目标系统重新读取。

## 什么时候改用 SDK / ACP

如果外部系统需要长连接控制、主动发送多轮 Prompt、观察完整 Session 生命周期或明确取消当前工作，应改用 SDK 或 ACP。Webhook 适合事件触发入口，不能因为 API 形态简单就承担它没有声明的可靠性责任。