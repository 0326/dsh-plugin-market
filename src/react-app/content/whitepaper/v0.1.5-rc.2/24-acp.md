---
title: ACP 接入
chapter_id: acp
slug: acp
dsh_version: v0.1.5-rc.2
upstream_tag: dsh-v0.1.5-rc.2
upstream_commit: fb2c4b9e698e30edb738bca4cf0618587db7d203
status: verified
verified_at: 2026-09-17
sources:
  - packages/acp/README.zh.md
  - packages/acp/acp/README.zh.md
  - packages/subagent/README.zh.md
  - docs/subsystems/session.zh.md
---
# ACP 接入

ACP 适合已经采用 Agent Client Protocol 的自动化客户端。它的核心价值不是“再提供一套 API”，而是把 DSH 的持久 Agent Session、权限请求、取消和模型配置映射到标准 ACP v1 表面，同时保持 DSH 自己的 Session、安全和生命周期语义。

## ACP Client 实际拥有哪一段生命周期

一个典型自动化会话经历：

1. 启动 `dsh --profile acp` 并完成 `initialize`；
2. Client 通过 `session/new` 创建持久 Session，或 `session/resume` 恢复一个非活跃 Session；
3. 如有需要，挂载标准 MCP Server、选择 model / reasoning effort；
4. `session/prompt` 准入完整输入并固定本轮路由；
5. Server 按会话串行发布 Assistant、Tool、配置与上下文用量等语义更新；
6. 权限需要人工逻辑时，Server 发出 `session/request_permission`，Client 负责一次性回答；
7. Prompt 只在所属工作与有序更新达到规定终态后结算；
8. `session/close` 会停止新工作、取消活动、drain 更新、释放后代、flush 持久化并释放该 Agent scope。

因此 ACP 的“Prompt 返回”比 SDK 低层入队回执更强，但仍不能替代外部副作用验证。

## 会话所有权与并发边界

一个 ACP 连接可以同时管理多个 Session，各自拥有独立 Agent、Prompt slot、更新链、模型选择和关闭流程。每个 Session 同时只允许一个正在处理的 Prompt；模型配置更新串行化，并从后续轮次开始生效。

| 对象 | Owner | 关键保证 |
| --- | --- | --- |
| 持久 Session | DSH Session / persistence | 可列出、恢复、关闭；关闭后持久状态仍可再次恢复 |
| ACP connection | Server / Client transport | 一个连接可复用多个 Session |
| Prompt 生命周期 | 对应 ACP Session | 单 Session 同时一个 Prompt，取消只作用于其定义范围 |
| MCP 挂载 | 对应 Session module | 随 Session cleanup 一起释放 |
| 权限回答 | ACP Client | 一次性 Allow / Deny，不替代 Sandbox / Permission Policy |

`session/close` 只释放指定 Agent scope，不应影响同一进程中的其他 Session 或 Web 前端。

## 能力声明必须“诚实”

`initialize` 只公布当前组合真正支持的 ACP 能力。例如图片 Prompt 只有在持久附件存储和确切模型路由支持时才应公布。Client 不应因为 ACP 规范存在某能力就假设本次 Server 组合一定实现。

同样，ACP 当前明确不支持会话 delete、fork、`session/load`、附加目录、mode、命令、计划、终端、客户端文件系统操作与 elicitation。标准协议边界比 DSH Web UI 更窄，这是设计目标，不是缺少一个前端组件。

## Prompt 的成功与失败怎么判断

`session/prompt` 在准入时先校验完整输入、固定路由、验证 Agent 身份与图片能力，再持久化附件并入队。显式取消、输出失败、Agent 失败和关联轮次结束具有明确结算优先级。

建议把验证拆成三层：

| 层 | 首选证据 | 能回答什么 |
| --- | --- | --- |
| 协议层 | Prompt result / typed error / update stream | ACP 调用是否按协议结算 |
| Session 层 | 持久 Session Event / resume 后重新读取 | 关键事实是否真正持久化 |
| 外部效果层 | 文件、API、数据库等目标系统重新读取 | Agent 声称的副作用是否真实发生 |

只收到 `session/update` 或 Assistant 文本，不能证明外部副作用成功；只看到持久 Session，也不能证明外部 Client 正确处理了权限或取消。

## 取消与关闭是两个动作

`session/cancel` / `$/cancel_request` 用于当前 Prompt 或活动工作；`session/close` 则是 Session owner 的停稳式 teardown。关闭会阻止新工作、取消活动、等待已提交更新、释放可继续后代、flush persistence，并最终释放 Agent scope。

集成测试需要覆盖“取消后 Session 仍可继续使用”和“关闭后该 live Agent scope 不再存在”两条不同路径，不应把 cancel 当 dispose。

## ACP 适合什么，不适合什么

适合：IDE、测试运行器、Agent 平台、进程外 Subagent 等需要标准自动化控制面的场景。

不适合：需要 DSH 专用 Chat 卡片、计划、todo、终端、完整浏览器资源模型和其他交互式 UI 的产品。ACP 刻意只提供标准语义更新，也不等于一个可靠任务队列。

## 最小验证清单

接入完成后至少证明：`initialize` 能力与实际组合一致；新建 Session 能持久化并在新进程恢复；一个 Session 的更新不会串到另一个 Session；权限请求能由 Client 明确回答；Prompt cancel 后不会继续把旧工作当成功；`session/close` 后资源真正停稳；不支持的 ACP 界面会明确拒绝而不是静默降级。

如果这些事实只能从 UI 表象推断，而不能从协议结果、Session 持久事实和 teardown 状态中重新读取，就还没有形成完整的 ACP 集成证据链。