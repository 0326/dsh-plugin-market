---
title: 已知边界与不适用场景
chapter_id: limits
slug: limits
dsh_version: v0.1.5-rc.1
upstream_tag: dsh-v0.1.5-rc.1
upstream_commit: 183f08e9c6dde7e36cd2318eaee70b0da08fb35e
status: verified
verified_at: 2026-09-15
sources:
  - packages/sandbox/README.zh.md
  - packages/webhook/README.zh.md
  - packages/workflow/README.zh.md
  - docs/subsystems/agent-team.zh.md
  - docs/testing.zh.md
---
# 已知边界与不适用场景

本页记录当前版本已经明确的边界，避免把工程便利误解为安全、可靠或稳定承诺。它不罗列猜测性的限制；每条均对应本版本官方文档或包说明。

## 运行与安全边界

| 机制 | 明确边界 | 应对方式 |
| --- | --- | --- |
| 本地 Sandbox | 是“同世界”隔离，仍共享宿主内核和文件系统 | 需要更强边界时替换为容器、MicroVM 或远程执行能力 |
| Workflow Worker Thread | 将同步计算移出 Host Event Loop，不是安全边界 | 对不可信代码使用 Sandbox / Remote Runtime |
| Approval | 是一次性 Allow / Deny 决策，不是全局策略替代 | 把稳定权限约束放在 Sandbox、Provider 和 Tool Pipeline |

## 交付与生命周期边界

| 机制 | 明确边界 | 不适用的需求 |
| --- | --- | --- |
| Webhook | 进程内 fire-and-forget，没有交付库、队列、重试、去重或完成状态 | 可靠事件处理与跨进程任务队列 |
| Jobs | Agent Session 内后台生命周期 | 跨会话、跨重启的可靠队列 |
| Agent Teams | 可安装但不在默认 Profile 启用，仍属实验能力 | 作为第三方插件的稳定基础依赖 |

## 评估边界

覆盖率、快照、真实 API e2e、基准和运行时诊断各自提供不同证据；它们不能互相替代。尤其是，行覆盖率不等价于功能交付正确，真实 API 冒烟也不等价于所有并发、恢复和业务规则都被证明。

## 采用原则

在产品设计中把每项保证写成“由谁、在什么范围、以什么证据提供”。一旦需求超出上述边界，应先选择补充的外部系统或替换 Provider，而不是依赖模型提示、重复重试或未公开内部实现。
