---
title: 核心能力模块
chapter_id: core-capabilities
slug: core-capabilities
dsh_version: v0.1.5-rc.1
upstream_tag: dsh-v0.1.5-rc.1
upstream_commit: 183f08e9c6dde7e36cd2318eaee70b0da08fb35e
status: verified
verified_at: 2026-09-15
sources:
  - packages/README.zh.md
  - docs/subsystems/README.zh.md
  - docs/capability-seams.zh.md
---
# 核心能力模块

DSH 的 `packages/` 不是按 UI 功能随意拆包，而是按能力家族组织。理解这些家族的职责，比记住全部包名更重要；具体 Provider、Consumer、事件与 Tool 再从各组 README 和 subsystem 页面深入。

## 执行与环境

| 能力家族 | 主要职责 | 常见公开 Seam |
| --- | --- | --- |
| `subprocess` | 子进程生命周期与输出读取 | `ctx.subprocess` |
| `shell` | Bash 执行 | `ctx.shell` |
| `terminal` | 持久 PTY | `ctx.terminals` |
| `sandbox` | 进程限制与文件效果策略 | `ctx.sandbox`、`ctx.sandboxPolicy` |
| `fs` | 文件系统 Provider | `ctx.fs` |
| `code-runtime` | 代码执行环境 | `ctx.codeRuntime` |
| `lsp` | Language Server 导航 | `ctx.lsp` |
| `e2b` | 远程执行环境 Provider | 对应远程 Provider |

Shell、Terminal、FS 并不等于本地 OS。它们通过 Seam 与 Provider 分离，因此可以在不同运行环境中替换实现。

## 模型与推理能力

| 能力家族 | 主要职责 |
| --- | --- |
| `llm` | 模型适配器注册、请求准备与 Streaming |
| `skill` | Skill Provider、发现与模型侧加载 |
| `context` | Workspace 指令、时间、引用等模型上下文 |
| `compaction` | 上下文压缩与替换 Surface |
| `web` | Search / Fetch Provider |
| `subagent` | 子 Agent 委派、继续与控制 |
| `workflow` | 多 Agent 脚本化编排 |
| `jobs` | 后台任务生命周期 |
| `guard` | 重复调用提醒、执行截止时间等循环卫生 |

模型侧 Tool 通常只是这些能力的 Consumer。例如 Web Tool 消费 Web Seam，Subagent Tool 消费 Subagent Seam，File Tool 消费 FS Seam。

## Session 内产品状态

以下能力虽然不是 Agent Loop 本体，但都围绕“一个 Session 的持续协作状态”工作：

| 能力家族 | 负责什么 | 典型边界 |
| --- | --- | --- |
| `goal` | 持久 Goal 生命周期与 Round 归属 | 目标状态进入 Session 生命周期 |
| `schedule` | Session 内定时后续动作 | 只负责会话内提醒，不是通用任务调度平台 |
| `todo` | Todo 列表与开放 Turn 不变量 | 面向模型的协作清单 |
| `plan` | Plan Mode 与退出评审 | 协作模式状态，不等同于 Workflow |
| `feedback` | 逐消息人类反馈 | 反馈记录与 Host Remote 契约 |
| `session-title` | 会话标题快照 | 标题与来源消息保持可追踪 |
| `session-reference` | 跨 Session 结构化引用 | 不把跨会话上下文退化成匿名文本拼接 |

这些状态不应因为“需要持久化”就统一塞进普通数据库，也不应因为“模型能看到”就绕过 Session 语义。先判断它是否属于会话事实、会话投影，还是独立业务域。

## 数据平面怎么选

| 数据类型 | 首选能力 | 不应该做什么 |
| --- | --- | --- |
| 对话、Turn、Step、Tool Result、模型可见历史 | Session Event Log | 用普通 KV/DB 替代可恢复日志 |
| Session 当前视图、标题、派生状态 | Session Projection / Session 子系统 | 把 Projection 当权威事实源 |
| 跨 Session 检索、血缘、全文搜索 | `session-query` | 扫描所有 JSONL 自己拼检索层 |
| 非 Session 业务数据 | `storage` | 为了复用日志而伪造 Session Event |
| Workspace 身份与 cwd 关系 | `workspace` | 只用路径字符串替代 Workspace 实体 |
| 图片/文件等持久附件 | `attachment` | 把二进制直接塞入 Session Event |
| 大体积 Tool 输出 | `spill` | 把超大结果完整塞回模型历史 |

`packages/session/` 是持久会话数据平面；`packages/storage/` 是非 Session 存储中枢；`packages/workspace/` 管理 Workspace 实体；`packages/attachment/` 与 `packages/spill/` 分别处理持久附件和大结果外溢。这几个边界对插件设计非常关键。

## 用户配置、凭据与身份

| 能力家族 | 主要职责 |
| --- | --- |
| `settings` | 用户设置命名空间、默认值/组合值/用户值分层解析与热提交 |
| `credentials` | `CredentialRef`、凭据解析、来源层与授权流程 |
| `identity` | 共享匿名身份 |
| `interaction` | Approval、User Question、Commands、Permission Preset 等人机协作面 |

配置里应该保存 `CredentialRef`，而不是凭据值本身。需要人类批准或补充信息时，应进入 Interaction Seam，而不是由每个 Tool 自建私有弹窗或权限协议。

## Host / API / Client 基础设施

`api`、`typert`、`host`、`client` 共同构成 Web 产品与 Remote 调用基础设施：

- `api`：Remote BFF 装配与 API Gateway；
- `typert`：远程调用描述符、类型图、Host/Client 契约；
- `host`：Web GUI Host 半侧，拥有 HTTP 路由与 API Gateway；
- `client`：浏览器侧 Cordis、Client Model、Conversation、Slots 与 UI 插件。

这部分不是“展示层附属代码”，而是 DSH 产品扩展的重要公开边界，详见 **Web Client 架构**。

## 支撑与兼容性边界

官方包地图把大多数组视为产品稳定 API；`experimental` 不属于默认稳定能力，`e2b` 在 rc.1 中仍是 POC，`test-support`、`runtime-diagnostics` 与 `util` 的兼容性预期也更低。

第三方插件如果追求跨版本可维护性，应尽量依赖公开 Service Definition 与产品组 API，避免把实验包或实现细节当作长期契约。

源码定位优先从 `packages/README.zh.md` 和 `docs/subsystems/README.zh.md` 找到能力组，再进入对应 `packages/.../README.zh.md` 或 subsystem 页面。
