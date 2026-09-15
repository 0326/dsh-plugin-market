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
  - docs/capability-seams.zh.md
  - docs/subsystems/README.zh.md
  - docs/subsystems/llm-streaming.zh.md
  - docs/subsystems/settings.zh.md
  - docs/subsystems/credentials.zh.md
  - docs/subsystems/attachment.zh.md
  - docs/subsystems/storage.zh.md
  - docs/subsystems/workspace.zh.md
---
# 核心能力模块

DSH 的 `packages/` 不是按 UI 功能随意拆包，而是按能力家族组织。理解这些家族的职责，比记住全部包名更重要；具体 Provider 和 Tool 可以继续从各组 README 与官方 Subsystem Reference 深入。

## 执行与环境

| 能力家族 | 主要职责 | 常见公开 Seam |
| --- | --- | --- |
| `subprocess` | 显式子进程生命周期、输出读取与退出结果 | `ctx.subprocess` |
| `shell` | Bash / Shell 执行 | `ctx.shell` |
| `terminal` | 持久 PTY / Terminal Session | `ctx.terminals` |
| `sandbox` | 进程限制与策略 | `ctx.sandbox`、`ctx.sandboxPolicy` |
| `fs` | 文件系统 Provider | `ctx.fs` |
| `code-runtime` | 带绑定、日志捕获与失败分类的代码执行 | `ctx.codeRuntime` |
| `lsp` | Language Server 导航 | `ctx.lsp` |

Shell、Terminal、FS 并不等于本地 OS。它们通过 Seam 与 Provider 分离，因此可以在不同运行环境中替换实现。

## 模型、上下文与知识能力

| 能力家族 | 主要职责 |
| --- | --- |
| `llm` | `Message` / `ContentBlock`、Prepared Request、`StreamChunk`、Adapter Registry 与流式组装 |
| `system-prompt` / `context` | 逐 Step 组装 System Prompt、Workspace 指令、时间与引用等模型上下文 |
| `skill` | Skill 发现优先级、定义加载与模型侧 `skill` Tool |
| `compaction` | 通过持久 Session Event 改写未来 Model Surface，而不删除原始历史 |
| `web` | Search / Fetch Provider 与稳定错误分类 |
| `token-meter` | 与日志修订位置绑定的 Token / 标量度量 |

这里最重要的边界是：LLM Adapter 负责把已经准备好的模型请求送入具体 Provider；Prompt、Tool Schema、Context 与 Session 历史应在进入 Adapter 前完成组装。业务插件不要把模型上下文规则塞进某个 Provider 实现。

## Agent 任务与产品状态

DSH 还提供一组不属于 Agent Loop 主干、但会参与产品体验的状态能力：

| 子系统 | 解决的问题 |
| --- | --- |
| Goal | 持久 Goal 身份、生命周期、激活与 Round 归属 |
| Schedule | Session 内提醒及普通对话交付 |
| Todo | 整列表 Todo、持久事件与开放轮次不变量 |
| Commands | 不经模型推理的人工命令注册与直接调用 |
| Feedback | 与消息生命周期绑定的反馈、乐观版本与伴随持久记录 |
| Plan | `plan/mode` 状态与 `exit_plan_mode` 审阅流程 |

这些能力与普通 Tool 的差别在于，它们拥有明确的持久状态或 Host / UI 契约；如果插件要表达同类长期业务事实，应先判断是否已有对应子系统，而不是创建临时内存状态。

## 数据与产品基础设施

| 子系统 | 边界 |
| --- | --- |
| Settings | 默认值 → 组合 `base` → 用户文档的分层解析与热提交 |
| Credentials | 配置只保存 `CredentialRef`，敏感值按操作解析，不进入安全的 UI 描述对象 |
| Attachment | 持久附件 ID、元数据、校验输入与 `AttachmentStore` |
| Spill | 大文本等内容的外置存储引用与归属关系 |
| Storage | 非 Session 业务数据的 Backend / Domain 抽象 |
| Workspace | Workspace 注册、解析以及与 Session `cwd` 的关系 |

Session 数据平面与普通 Storage 分开：Session Event Log 有自己的事件语义、迁移和 Projection；非会话业务数据使用 Storage / Domain 能力，不应塞进 Session 事件来代替数据库。

## 官方子系统覆盖矩阵

rc.1 的官方 `docs/subsystems/README.zh.md` 明确声明其目录覆盖 DSH **全部子系统**。按白皮书章节映射后，没有需要另开一级章节的架构空洞；此前的问题主要是若干子系统只被一笔带过。本轮按下面的归属补齐：

| 官方 Subsystem | 白皮书主要落点 |
| --- | --- |
| `core`、`scope`、`llm-streaming`、`system-prompt`、`tools` | Agent Core、Agent 运行机制、核心能力模块 |
| `token-meter`、`session-telemetry`、`invariants` | 调试与观测 |
| `session`、`persistence`、`session-query`、`session-title`、`session-reference`、`session-projection`、`feedback` | Session 与状态、调试与观测 |
| `goal`、`schedule`、`todo`、`commands`、`plan` | 核心能力模块、安全与权限 |
| `settings`、`credentials`、`attachment`、`spill`、`storage`、`workspace` | 核心能力模块、安全与权限 |
| `shell`、`subprocess`、`terminal`、`sandbox`、`code-runtime`、`filesystem`、`lsp`、`skills`、`compaction`、`web` | 核心能力模块、Capability Seam、安全与权限 |
| `subagent`、`agent-team`、`workflow`、`jobs` | Subagent / Workflow / Jobs |
| `approval`、`user-questions`、`permission-presets` | 安全与权限 |
| `extensions` | 扩展能力地图 |
| `typert`、`web-server`、`webhook` | Web Client 架构、SDK / ACP / Webhook |
| `web-client`、`client-modules`、`slots`、`client-resources`、`sidebar-right`、`conversation` | Web Client 架构、插件开发与扩展面 |

这张表是“覆盖检查”，不是建议把所有子系统放进同一层。开发者仍应从目标章节进入，再沿对应 Service Definition、Provider、Consumer 和源码路径下钻。

## 稳定性边界

官方包地图把大多数组视为产品 API；`experimental` 不属于默认稳定能力，`e2b` 在 rc.1 中仍是 POC，`test-support`、`runtime-diagnostics` 与 `util` 的兼容性预期也更低。

第三方插件如果追求跨版本可维护性，应尽量依赖公开 Service Definition 与产品组 API，避免把实验包或实现细节当作长期契约。
