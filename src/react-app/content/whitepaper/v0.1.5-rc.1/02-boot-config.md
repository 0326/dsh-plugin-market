---
title: 启动与配置组装
chapter_id: boot-config
slug: boot-config
dsh_version: v0.1.5-rc.1
upstream_tag: dsh-v0.1.5-rc.1
upstream_commit: 183f08e9c6dde7e36cd2318eaee70b0da08fb35e
status: verified
verified_at: 2026-09-10
sources:
  - docs/architecture.zh.md
  - packages/boot/README.zh.md
  - packages/bundle/README.zh.md
---
# 启动与配置组装

DSH 启动的结果不是一个固定内核加若干插件，而是一棵由 Profile、Bundle 与 Patch 共同组装出的 Cordis Plugin Tree。CLI 总是启动一个具名 Profile，Profile 决定本次进程包含哪些能力。

## 启动层次

`packages/boot` 提供应用启动粘合层。`app-boot` 负责读取环境、解析 Harness Home、加载 Profile 与 Patch，并把最终 `cordis.yml` 交给 Cordis Loader；`cmdline` 让具体应用拥有自己的 CLI 参数与退出语义。

官方 Profile 的基础关系如下：

| Profile | 组合方式 | 主要用途 |
| --- | --- | --- |
| `web` | `dsh-base` + Web bundle | 浏览器产品 |
| `headless` | `dsh-base` + Headless bundle | 一次性命令行任务 |
| `sdk` | `dsh-base` + SDK bundle | JSON-RPC stdio 服务 |
| `acp` | `dsh-base` + ACP bundle | Agent Client Protocol 自动化 |
| `sdk-minimal` | 独立完整 bundle | 最小 SDK 运行时 |

## Bundle 与 Patch

Bundle 是可安装的配置层，不是运行时 Service。每个 Bundle 通过 `dsh.bundle.patch` 贡献 Cordis 配置行；Profile 按顺序叠加 Bundle，再继续应用更高优先级的 Patch。

官方架构给出的层级顺序是：

1. Profile 声明的 Bundles，按顺序应用；
2. Profile 自身 `cordis.patch.yml`；
3. Harness Home 级 Patch；
4. CLI `--patch`。

后层用于定制前层，而不是复制一套完整 Profile。树外 Bundle 可以安装到指定 Profile，使业务能力以组合层方式加入，而不修改 DSH 仓库。

## 启动配置与运行时扩展不是一回事

需要“每次启动都存在”的能力，应进入 Profile / Bundle / Patch。需要“只对一个 Session 或 Agent 生效”的能力，应使用 Agent Preset 或 Agent Scope。需要“进程运行后临时定义、启动、停止”的动态代码，则属于 Extensions 子系统。

这三类机制分别解决部署组合、Agent 组合、实时自修改，生命周期不同，不应互相替代。

## 静态与可重载边界

rc.1 中 Web Profile 支持开发态的实时重载能力；Headless、SDK、SDK Minimal 与 ACP 的启动组合按静态方式建立。生产插件不能把 Web 开发重载当作通用运行时热插拔协议，运行时动态包由 Extensions 子系统负责。

## 开发者落点

新增一个面向所有会话的基础能力时，先判断它是否应该成为独立 Service Definition / Provider，再由 Bundle 把默认 Provider 组合进去。这样业务 Bundle 可以替换 Provider，而 Consumer 仍依赖稳定 Definition。
