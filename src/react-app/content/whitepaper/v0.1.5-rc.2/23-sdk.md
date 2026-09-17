---
title: SDK 接入
chapter_id: sdk
slug: sdk
dsh_version: v0.1.5-rc.2
upstream_tag: dsh-v0.1.5-rc.2
upstream_commit: fb2c4b9e698e30edb738bca4cf0618587db7d203
status: verified
verified_at: 2026-09-17
sources:
  - packages/sdk/README.zh.md
  - packages/sdk/client/README.zh.md
  - packages/sdk/protocol/README.zh.md
  - docs/subsystems/session.zh.md
  - docs/architecture.zh.md
---
# SDK 接入

SDK 适合“由你的应用主动拥有并驱动一个 DSH Runtime”的场景。判断接入是否正确，不能只看 `run()` 是否返回；要区分 **Runtime 已启动、Prompt 已入队、Agent 再次 idle、Session 事实已提交、子进程已真正退出** 这些不同终态。

## 两层客户端，两个责任范围

| 层 | 负责什么 | 调用方需要承担什么 |
| --- | --- | --- |
| `DeepSeekHarness` | 启动 Runtime、打开 Session、发送输入、收集到下一次 idle、给出 `finalResponse` | 选择 profile / patch / model，并最终 `close()` / `await using` |
| `HarnessClient` | 低层 JSON-RPC 请求、通知订阅、进程握手与关闭 | 自己理解 prompt 回执、事件订阅、超时和协议错误 |

两者驱动的是同一个完整 Harness Runtime，而不是另一套 Agent 实现。

## 一次 `run()` 实际经历什么

高层 `run(input)` 的活动区间大致是：

1. 首次使用时惰性启动 `dsh` 子进程；
2. 完成有界 `initialize`，校验 workspace、provider、model、reasoning effort、max tokens 等路由；
3. 打开指定 Session 或创建新 Session；
4. 把 Prompt 放入 Session Inbox；
5. 等待对应消息 id 出现在持久入队回执中；
6. 继续收集 Session / Agent 通知，直到整个 Agent 下一次进入 `idle`；
7. 从这个活动区间内最后提交的 `assistant/message` 推导 `finalResponse`；
8. Runtime 子进程继续由 `DeepSeekHarness` 持有，供后续 `run()` 复用；
9. 只有 `close()` / dispose 完成后，调用方才证明子进程被回收。

这里最容易误读的是第 7 步：`finalResponse` 是区间内最后提交的 Assistant 文本，**并不保证在因果上只属于刚刚那条 Prompt**。Steering、注入上下文和其他排队工作都可能在 idle 前进入同一活动区间。

## 低层 `prompt()` 只证明“已接受”

`HarnessClient.prompt()` 在 Runtime 接受排队消息后就返回消息 id，不等待 Agent 工作完成。因此：

| 观察结果 | 能证明什么 | 不能证明什么 |
| --- | --- | --- |
| `prompt()` 返回 message id | Prompt 已被 Runtime 接受并进入协议定义的队列路径 | Agent 已完成、工具成功、最终响应已提交 |
| 收到 Session Event | 对应持久事实已经进入 Session Log | 整个 Agent 已 idle |
| Agent 进入 `idle` | 当前 Agent 活动区间已停稳到 idle | 结果只由某一条 Prompt 导致 |
| `close()` 完成 | 客户端关闭阶梯结束，子进程已退出 | 外部副作用一定成功 |

要验证“任务真的完成”，需要同时看 Session 事实、外部副作用和 Agent 生命周期，而不是把一个 RPC 回执当最终结果。

## 错误类型决定处理方式

SDK Client 把主要失败拆成类型化错误：

- `JsonRpcResponseError`：Runtime 返回协议错误，保留 code / data；
- `RequestTimeoutError`：请求超过调用方配置的时间界限；
- `SdkProtocolError`：响应超出文档化协议；
- `TransportClosedError`：Runtime 已消失，并携带退出码与有界 stderr 尾部。

这四类错误的恢复动作不同。协议业务错误通常不应盲目重启；Transport 消失要先确认旧进程已经结束；初始化失败时客户端只会在 cleanup 成功后切换到新客户端，避免旧进程是否退出尚未确认就再启动一个 Runtime。

## 取消与关闭边界

当前协议没有逐 Prompt cancel。低层 Prompt 一旦被接受，放弃这一轮通常意味着关闭 Runtime，而不是发送“取消这个 message id”。因此如果业务需要标准的逐会话 cancel，应优先评估 ACP。

`close()` 是幂等关闭阶梯：先请求协议 `shutdown`，随后按 stdin EOF → SIGTERM → SIGKILL 逐级确保进程真正退出。**关闭请求发出**和**子进程已经退出**不是同一个状态；集成方应等待 close 完成再释放外部 owner。

## 最小验证链

接入完成后至少验证四条路径：

1. **正常路径**：启动 → initialize → Prompt 入队 → Session 出现预期 Assistant / Tool 事实 → Agent idle；
2. **持久路径**：使用同一 Session 继续运行或重新打开，确认历史不是 SDK 本地缓存伪造；
3. **失败路径**：使用无效路由或让 Runtime 异常退出，确认错误类型与 stderr / code 可被上层识别；
4. **teardown 路径**：调用 `close()` 后确认子进程真正退出，不再接受请求。

若任务包含写文件、调用 API 等外部副作用，还应从目标系统重新读取结果。`finalResponse` 说“已完成”不能证明外部事实真的成立。

## 什么时候不要用 SDK

当外部客户端已经围绕 Agent Client Protocol 组织会话、权限请求与取消时，ACP 的标准边界更合适；当系统只需根据一个已验证事件触发新 Session 时，Webhook 的生命周期更轻。

SDK 的优势是调用方拥有 Runtime；代价也是调用方拥有 Runtime。进程、Session、通知、错误和 teardown 都必须被当成正式集成契约。