---
title: Cordis 与组合模型
chapter_id: composition
slug: composition
dsh_version: v0.1.5-alpha.1
upstream_tag: dsh-v0.1.5-alpha.1
upstream_commit: 5dda764ed3aa172535a7967b06ff95d9cbfe536a
status: verified
verified_at: 2026-09-10
sources:
  - docs/architecture.zh.md
  - docs/cordis-primer.zh.md
---
# Cordis 与组合模型

DSH 没有需要集中修改的特权业务内核。运行中的应用是一棵 Cordis Plugin Tree，插件通过共享 Context 提供 Service、监听类型化 Event，并把注册行为纳入可逆生命周期。

## Profile、Bundle、Patch

Profile 是启动组合的入口；Bundle 是一组可分发的 Cordis 配置和代码；Patch 在更高层覆盖或插入配置行。

官方架构规定的应用层叠顺序为：

1. Profile 声明的 Bundle，按顺序应用；
2. Profile 自己的 `cordis.patch.yml`；
3. Harness Home 级 Patch；
4. 命令行 `--patch` Overlay。

同一个 Row ID 被更高层 Patch 命中时，整份配置由更高层替换。这个规则使官方默认组合与用户扩展保持同一套装配机制。

## 为什么插件可以卸载

Cordis 把注册行为作为 Effect 管理。插件创建的监听器、Service Registration 等副作用与插件生命周期绑定，卸载时对应 Effect 被撤销。

这直接影响插件设计：

- 注册能力时不应绕开 Context 生命周期维护全局单例；
- 扩展包依赖 Service Definition，而不是绑定具体 Provider；
- 热更新或按 Agent 挂载时，旧注册必须能够完整退出。

## Profile 与 Agent Preset 不同

Profile 决定**整个 DSH 应用进程**如何组合。Agent Preset 决定**单个 Session/Agent**挂载哪些 Tool、Prompt、Skill 与 Persona。

因此需要修改部署级模型适配器、Persistence、Host 能力时看 Profile；需要让不同会话运行不同能力组合时看 Preset。

## 源码定位

组合问题优先从以下入口查：

- `docs/architecture.zh.md`：Profile / Bundle / Patch 的总体规则；
- `packages/boot/`：应用启动与 Profile 装配；
- `packages/bundle/`：官方可运行组合；
- `packages/preset/`：按 Agent 的会话级组合。
