---
title: 官方源码入口索引
chapter_id: appendix-source-index
slug: appendix-source-index
dsh_version: v0.1.5-rc.1
upstream_tag: dsh-v0.1.5-rc.1
upstream_commit: 183f08e9c6dde7e36cd2318eaee70b0da08fb35e
status: verified
verified_at: 2026-09-15
sources:
  - README.zh.md
  - docs/architecture.zh.md
  - packages/README.zh.md
  - docs/capability-seams.zh.md
  - docs/testing.zh.md
---
# 官方源码入口索引

从问题进入官方资料。所有路径均相对于本页固定的 `dsh-v0.1.5-rc.1` tag；右侧链接会自动展开为对应 GitHub 地址。

| 问题 | 首选官方入口 |
| --- | --- |
| 产品定位、Profile 与包地图 | `README.zh.md`、`packages/README.zh.md` |
| 组合、运行时总览与层次边界 | `docs/architecture.zh.md` |
| Cordis 与启动组合 | `docs/cordis-primer.zh.md`、`packages/boot/README.zh.md`、`packages/bundle/README.zh.md` |
| Agent 生命周期与驱动 | `docs/agent-lifecycle.zh.md`、`packages/core/agent-loop/README.zh.md` |
| Session、持久化与格式 | `docs/subsystems/session.zh.md`、`docs/subsystems/persistence.zh.md` |
| 能力替换与包职责 | `docs/capability-seams.zh.md`、`packages/README.zh.md` |
| Subagent、Workflow、Jobs、Teams | `docs/subsystems/subagent.zh.md`、`docs/subsystems/workflow.zh.md`、`docs/subsystems/jobs.zh.md`、`docs/subsystems/agent-team.zh.md` |
| Web Client、Remote、Slots | `docs/subsystems/web-client.zh.md`、`docs/subsystems/slots.zh.md`、`docs/api-gateway.zh.md` |
| SDK、ACP、Webhook | `packages/sdk/README.zh.md`、`packages/acp/README.zh.md`、`packages/webhook/README.zh.md` |
| Sandbox、Approval 与权限预设 | `packages/sandbox/README.zh.md`、`docs/subsystems/approval.zh.md`、`docs/subsystems/permission-presets.zh.md` |
| 测试、基准与证据 | `docs/testing.zh.md`、`packages/runtime-diagnostics/README.zh.md` |

## 追踪原则

优先从架构文档确定层次，再进入包 README 或子系统文档确认职责，最后再查看实现与生成目录。这样可以避免把某个内部文件的偶然结构误读成跨版本承诺。
