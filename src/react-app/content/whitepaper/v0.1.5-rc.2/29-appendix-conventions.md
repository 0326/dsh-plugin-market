---
title: 文档约定与证据规则
chapter_id: appendix-conventions
slug: appendix-conventions
dsh_version: v0.1.5-rc.2
upstream_tag: dsh-v0.1.5-rc.2
upstream_commit: fb2c4b9e698e30edb738bca4cf0618587db7d203
status: verified
verified_at: 2026-09-16
sources:
  - README.zh.md
  - docs/architecture.zh.md
  - docs/testing.zh.md
---
# 文档约定与证据规则

本白皮书是 DSH 官方资料的版本化架构导读。它的目标是让读者快速找到权威源码入口，而不是用二次叙述替代原始契约。

## 证据规则

1. 正文事实只依据 DSH 官方仓库、官方文档和官方 Release。
2. 项目级 canonical manifest 维护版本锁、导航、文章类型、目标读者、Reader Outcome 与文档核验状态；每篇文章的 frontmatter 保留 DSH 版本、tag、commit、核验日期与源码相对路径，并由 CI 与 manifest 交叉校验。
3. 右侧“官方来源”始终链接到当前页面固定 tag；不把不同版本的类型、图或链接混合展示。
4. 不把社区教程、未验证 Issue、模型推断或内部实现猜测写成事实。
5. 没有稳定公开契约的内容，必须明确标为实验、实现细节或不在本文结论范围内。

## 状态维度

文档核验状态与产品能力成熟度必须分开：

- `status: verified` 表示本页已经按当前白皮书流程核验，不代表页面描述的能力本身是稳定能力；
- `maturity: experimental` / `deprecated` 等用于表达上游明确给出的能力成熟度；
- 一个实验能力可以有已核验文章，一个已发布页面也仍可能在后续发现事实错误并修订。

没有官方成熟度声明时，不根据版本号、包名或页面是否发布自行推断 `stable`。

## 写作约定

| 标记 | 含义 |
| --- | --- |
| `ctx.*` | DSH Cordis Context 上的公开服务或能力入口。 |
| `agent/*` | 运行期 Agent 事件或状态通道；不等同于持久 Session Event。 |
| `packages/...` / `docs/...` | 当前固定 tag 下的官方源码或文档相对路径。 |
| “当前版本” | 本页 frontmatter 中的 `dsh_version`，不是网站部署时的最新版本。 |
| “实验” | 上游明确标为实验或未进入默认稳定组合的能力；采用方需承担兼容性与降级策略。 |

## 文章结构

每篇文章先在 canonical manifest 中声明主类型、目标读者和 Reader Outcome，再按“要解决的问题 → 公开边界 → 选择或运行模型 → 设计限制 → 官方入口”展开。左侧只显示篇序与标题；页内细节由正文和右侧目录承载，避免把摘要挤进导航。

## 如何提出修订

发现事实偏差时，应同时提供：受影响的白皮书版本、文章 slug、固定 tag 下的官方路径或 Release 证据，以及期望的文字边界。这样修改可以保持跨版本可审计。
