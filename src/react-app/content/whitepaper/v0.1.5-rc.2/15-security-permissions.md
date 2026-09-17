---
title: 安全与权限
chapter_id: security-permissions
slug: security-permissions
dsh_version: v0.1.5-rc.2
upstream_tag: dsh-v0.1.5-rc.2
upstream_commit: fb2c4b9e698e30edb738bca4cf0618587db7d203
status: verified
verified_at: 2026-09-16
sources:
  - packages/core/tools/README.zh.md
  - packages/interaction/README.zh.md
  - packages/sandbox/README.zh.md
  - docs/subsystems/approval.zh.md
  - docs/subsystems/permission-presets.zh.md
  - docs/subsystems/sandbox.zh.md
---
# 安全与权限

DSH 的安全模型不是一个“安全模式”开关，而是一条分层决策链：**Tool 是否可见与可执行 → 是否需要审批 → 以什么文件效果边界执行 → 执行结果如何归因**。这些责任分别落在 Tool Pipeline、Approval、Sandbox Policy / Provider 和具体执行方上。理解这条链，比记住几个配置名更重要。

## 先区分四类责任

| 层 | 负责回答的问题 | 不负责什么 |
| --- | --- | --- |
| Tool Pipeline | 这个 Tool Call 是否允许进入执行、谁能拦截或包装它？ | 不提供 OS 隔离 |
| Approval | 这个具体操作是否获得一次性放行？ | 不改变长期权限模型，也不提供隔离 |
| Sandbox Policy | 这次调用应使用什么文件效果策略？ | 不执行命令本身 |
| Sandbox Provider / Consumer | 如何在当前平台施加约束并执行？ | 不替代业务级授权与审计策略 |

因此，“用户点了允许”不等于“命令拥有无限权限”，“跑在 Sandbox 里”也不等于“所有网络、进程和内核能力都被隔离”。

## 一次敏感 Tool Call 如何通过安全链路

以一个会启动进程的 Tool 为例，可以按下面的顺序定位安全责任：

1. Tool Call 先进入 `tools/pre-execute` 和 guards，决定它是否允许进入执行或是否需要询问；
2. 若当前 Tool 策略要求 Approval，`ctx.approval` 对这一个操作给出 `allowed-once`、`rejected`、`cancelled` 或 `unavailable`；
3. 调用方通过 Sandbox Policy 为当前 Session 和本次调用解析执行模式；
4. `danger-full-access` 由消费方直接执行，不进入 `ctx.sandbox`；
5. `read-only` / `workspace-write` 才交给 Sandbox Provider 包装 argv，并同时得到实际 `enforcement`；
6. Executor 执行原始或包装后的 argv，结果再回到统一 Tool Pipeline 结算。

如果受限执行因策略拒绝而支持一次性升权，调用方可以再通过 Approval 获取 `allowed-once`，然后以显式 mode 重新解析一次 Sandbox Policy 并重试。关键点是：**升权是一次新的调用决策，不是修改 Sandbox Provider 的全局状态**。

## Sandbox 只定义文件效果边界

当前版本的 `SandboxMode` 有三类：

| 模式 | 文件效果 |
| --- | --- |
| `read-only` | 只允许后端承诺的只读执行和必要 sink |
| `workspace-write` | 可写当前 Session 工作区及后端承诺的临时区域 |
| `danger-full-access` | 绕过该层 confinement |

本地 Provider 使用 Linux bwrap / Landlock、macOS Seatbelt、Windows 受限令牌与 ACL 等后端。它属于“同世界”隔离：与宿主共享内核和文件系统语义；网络和进程可见性也不在 `SandboxMode` 的定义范围内。需要容器、MicroVM 或远程执行时，应替换更大的执行能力，而不是继续给 `ctx.sandbox` 增加想象中的保证。

### `full` 与 `partial` 必须区别对待

Sandbox Provider 会报告实际 `enforcement`。`full` 表示当前后端覆盖了该模式承诺的文件效果；`partial` 表示只能覆盖子集，例如平台或内核能力不足。要求绝对文件边界的调用方不能把 `partial` 当成 `full` 静默继续。

对于受限模式，Provider 无法建立 confinement 时应 fail closed；静默退化成无隔离执行不是合法结果。`danger-full-access` 则不同：消费方本来就会绕过 confinement，因此必须由更上层策略明确决定是否允许进入该模式。

## Approval 是一次性决策，不是永久授权

`ctx.approval` 的结果集合是闭合的：只有 `allowed-once` 表示这次操作被允许；`rejected`、`cancelled`、`unavailable` 都必须拒绝。没有应答者、应答者异常或返回非法值时同样 fail closed，而不是“默认通过”。

会话级 Approval Policy 只有两个核心语义：

- `ask`：交给已组合的应答者；无人应答最终为 `unavailable`；
- `never`：不询问任何人，确定性返回 `rejected`。

`never` 在应答者分发之前生效，因此后来注册的 UI 或插件监听器不能绕过它。审批的 asked / decided 事件写入 Session Log 用于审计，但不会直接进入模型 transcript。

## Tool Pipeline 才是统一执行门面

工具执行不是插件直接调用任意函数。`dsh-tools` 的固定主链路是：

`tools/pre-execute` → 单调 guards → `tools/execute` → `tools/post-execute` → `tools/result`

`pre-execute` 可以允许、拒绝或触发询问；guard 的拒绝不能被后续监听器重新改成允许；执行层负责超时、重试等包装；最终结果冻结后再进入观测。敏感 Tool 如果绕开这条流水线自行 spawn 进程，就同时绕开了统一的权限、超时、结果归因和扩展拦截面。

## 失败时要先判断失败发生在哪一层

| 失败点 | 可观察结果 | 应如何理解 |
| --- | --- | --- |
| Tool guard / pre-execute 拒绝 | Tool 不进入主体执行 | 策略拒绝，不是 Sandbox 故障 |
| Approval 返回 `rejected` / `unavailable` | 操作被拒绝 | 没有一次性授权 |
| Sandbox Provider 不可用 | 受限调用 fail closed | 隔离基础设施不可用，不应无隔离透传 |
| `enforcement: partial` | 后端只能覆盖部分承诺 | 是否继续由调用方的安全要求决定 |
| Sandbox denial | 命令实际运行但受限文件效果被阻止 | confinement 正常工作 |
| Runner failure | 包装器在真正命令执行前失败 | 基础设施错误，不应误报成业务命令失败 |
| Tool timeout / abort | Tool Pipeline 返回结构化失败 | 资源与取消语义，不等价于权限拒绝 |

这个区分直接影响诊断。把所有非零退出都记成“命令失败”，会丢失“策略拒绝、隔离后端故障、隔离成功阻止操作”之间最重要的差异。

## 部署与插件设计判断

1. **先确定威胁边界。**只需要限制工作区文件写入时，本地 Sandbox 可能足够；需要进程、网络、内核或租户级隔离时，选择容器、MicroVM 或 Remote Runtime。
2. **不要把 Approval 当长期权限。**它只回答一次具体操作能否继续，长期能力边界仍由 Tool、Provider 和部署策略负责。
3. **对 `partial` 做显式策略。**高风险部署应拒绝或上报，不要让不同平台得到悄然不同的安全语义。
4. **敏感 Tool 必须走统一 Pipeline。**这样 Approval、Guard、Sandbox、Telemetry 和审计才能保持一致。
5. **无人值守环境优先 fail closed。**CI / Headless 若不允许交互，使用确定性策略，而不是等待一个不存在的人类应答者。

官方实现入口从 `packages/core/tools/`、`docs/subsystems/approval.zh.md`、`docs/subsystems/sandbox.zh.md` 与 `docs/subsystems/permission-presets.zh.md` 进入。
