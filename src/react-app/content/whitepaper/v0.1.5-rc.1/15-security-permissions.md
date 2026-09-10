---
title: 安全与权限
chapter_id: security-permissions
slug: security-permissions
dsh_version: v0.1.5-rc.1
upstream_tag: dsh-v0.1.5-rc.1
upstream_commit: 183f08e9c6dde7e36cd2318eaee70b0da08fb35e
status: verified
verified_at: 2026-09-10
sources:
  - packages/interaction/README.zh.md
  - packages/sandbox/README.zh.md
  - docs/subsystems/approval.zh.md
  - docs/subsystems/permission-presets.zh.md
  - docs/subsystems/sandbox.zh.md
---
# 安全与权限

DSH 把“能执行什么”“在哪个隔离级别执行”“是否需要用户批准”拆成多个能力，而不是用一个全局危险模式控制全部 Tool。Sandbox、Approval、Permission Preset 与 Tool Pipeline 分别承担不同责任。

## Sandbox 模式

本地进程 Sandbox 提供三类基础模式：

| 模式 | 文件效果 |
| --- | --- |
| `read-only` | 只读执行 |
| `workspace-write` | 允许写会话工作区与策略允许位置 |
| `danger-full-access` | 不施加该层限制 |

`sandbox-local` 在不同平台使用 Linux bwrap / Landlock、macOS Seatbelt、Windows Restricted Token 等后端；`sandbox-policy` 负责部署默认与逐 Session 覆盖。

官方明确把本地 Sandbox 定义为“同世界”隔离：它仍与宿主共享内核和文件系统。容器、MicroVM、远程执行器需要替换更大的运行能力，而不是把本地 Sandbox 当成完整虚拟化边界。

## Approval 与一次性升权

`ctx.approval` 用于一次性 Allow / Deny 决策。受 Sandbox 策略拒绝的操作可以在用户批准后进行一次性升权重试；没有应答者时，审批以拒绝方式关闭。

权限预设把 Sandbox 模式与 Approval 行为组合成一个面向用户的选择，避免 UI 分别操作多组底层开关后产生不一致状态。

## Human Interaction

`ctx.commands` 提供无需模型往返的 Slash Command；`ctx.userQuestions` 与 `ask_user_question` Tool 允许 Agent 暂停等待人类信息或决定。交互式 Web 产品由 UI 回答这些请求；纯自动化 ACP Client 通过协议处理自己的 Approval。

## Guard 不是权限边界

重复 Tool 提醒、Tool Timeout 等 Guard 用于循环卫生和资源控制，不等价于授权或隔离。安全策略应落在 Sandbox、Approval、Provider 或 Tool 执行流水线，不能依赖模型“听从提醒”。

## 插件设计原则

敏感 Tool 不应自己绕开统一 `tools/*` Pipeline。把权限、审计、升权和执行策略放在公共 Seam，第三方 Tool 和替换 Provider 才能继承相同安全行为。
