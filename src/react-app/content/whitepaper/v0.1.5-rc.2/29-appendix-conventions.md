---
title: 文档约定与证据规则
chapter_id: appendix-conventions
slug: appendix-conventions
dsh_version: v0.1.5-rc.2
upstream_tag: dsh-v0.1.5-rc.2
upstream_commit: fb2c4b9e698e30edb738bca4cf0618587db7d203
status: verified
verified_at: 2026-09-15
sources:
  - README.zh.md
  - docs/architecture.zh.md
  - docs/testing.zh.md
---
# 文档约定与证据规则

本白皮书是 DSH 官方资料的版本化架构导读。它的目标是让读者快速找到权威源码入口，而不是用二次叙述替代原始契约。

## 证据规则

1. 正文事实只依据 DSH 官方仓库、官方文档和官方 Release。
2. 每篇文章的 frontmatter 固定 DSH 版本、tag、commit、核验日期与源码相对路径。
3. 右侧“官方来源”始终链接到当前页面固定 tag；不把不同版本的类型、图或链接混合展示。
4. 不把社区教程、未验证 Issue、模型推断或内部实现猜测写成事实。
5. 没有稳定公开契约的内容，必须明确标为实验、实现细节或不在本文结论范围内。

## 写作约定

| 标记 | 含义 |
| --- | --- |
| `ctx.*` | DSH Cordis Context 上的公开服务或能力入口。 |
| `agent/*` | 运行期 Agent 事件或状态通道；不等同于持久 Session Event。 |
| `packages/...` / `docs/...` | 当前固定 tag 下的官方源码或文档相对路径。 |
| “当前版本” | 本页 frontmatter 中的 `dsh_version`，不是网站部署时的最新版本。 |
| “实验” | 上游未作为默认稳定基础承诺的能力；采用方需承担兼容性与降级策略。 |

## 文章结构

每篇文章优先按“要解决的问题 → 公开边界 → 选择或运行模型 → 设计限制 → 官方入口”展开。左侧只显示篇序与标题；页内细节由正文和右侧目录承载，避免把摘要挤进导航。

## 如何提出修订

发现事实偏差时，应同时提供：受影响的白皮书版本、文章 slug、固定 tag 下的官方路径或 Release 证据，以及期望的文字边界。这样修改可以保持跨版本可审计。
