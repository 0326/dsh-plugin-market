# DS Plugin Market

**English** | [简体中文](README.md)

> **Discover. Verify. Install with confidence.**
>
> A trusted plugin registry, discovery, and installation experience for the DeepSeek Harness ecosystem.

🌐 **https://ds-plugin.market**

> This project is in early development. DeepSeek Harness itself is currently in Developer Preview, so plugin specifications and compatibility rules may evolve quickly.

## Why DS Plugin Market?

DeepSeek Harness is built around the idea that **Everything is a Plugin**. Today, the community can discover related repositories through the GitHub [`dsh-plugin`](https://github.com/topics/dsh-plugin) topic.

But a GitHub topic can only answer:

> “Which repositories claim to be related to DSH plugins?”

Before installing third-party code, users need better answers:

- Is this repository actually a valid DSH Plugin / Bundle?
- Is it compatible with the current DSH / Cordis versions?
- Is it still actively maintained?
- Does installation execute `prepare`, `postinstall`, or other scripts?
- What security and supply-chain signals should I know about?
- Which exact version or commit should I install to match the code that was scanned?

**DS Plugin Market is not just a nicer UI for a GitHub Topic. It turns candidate repositories into a structured, verifiable, and traceable plugin registry.**

## What it provides

### Discover

Continuously discover candidate DSH plugin repositories from public sources such as GitHub instead of maintaining a static list by hand.

### Verify

Analyze plugin structure, including signals such as:

- `package.json`
- `dsh.bundle.patch`
- `cordis.patch.yml`
- DSH / Cordis dependencies and peer dependencies
- plugin entry points and exports
- Node.js engine requirements
- client / web platform metadata

Repositories move through an explicit lifecycle:

```text
Candidate
   ↓
Detected
   ↓
Format Verified
   ↓
Featured (curated)
```

### Assess

Build an independent Trust Profile for every plugin:

```text
Format Verification
Compatibility
Security Scan
Maintenance
Publisher Trust (later)
```

For example:

```text
✓ Format Verified
✓ Compatible with current DSH baseline
⚠ prepare script detected
✓ Active maintenance
○ Publisher not verified
```

### Install with confidence

Scan results are bound to an exact commit SHA. For GitHub installs, DS Plugin Market should prefer a pinned command such as:

```bash
dsh plugin --profile web add github:owner/repo#<scanned_commit_sha>
```

This makes the code users install traceable to the code represented by the displayed scan result.

## What does “Verified” mean?

This distinction is fundamental:

> **Format Verified ≠ Safe**

`Format Verified` only means that a repository matches the DSH Plugin / Bundle structure understood by the current scanner version.

Security signals are evaluated and displayed separately, including:

- install scripts;
- dependency risk signals;
- shell / process execution;
- filesystem / network access patterns;
- dynamic code execution heuristics;
- public vulnerability sources added in later stages.

Even when no high-risk signal is detected, **a security scan is not a guarantee that third-party code is safe**.

## Why install scripts matter

DeepSeek Harness can install plugins directly from GitHub:

```bash
dsh plugin --profile web add github:owner/repo
```

A Git dependency may use a `prepare` script to build artifacts after download. Allowing that build means third-party code can execute during installation.

DS Plugin Market therefore treats these as first-class trust signals:

```text
Install scripts
Build required
Scanned commit
Recommended pinned install
```

—not as hidden repository metadata behind stars, language, or license.

## How it works

```text
GitHub dsh-plugin Topic / Submit
              │
              ▼
        Candidate Discovery
              │
              ▼
       GitHub REST API
              │
      ┌───────┴────────┐
      │                │
      ▼                ▼
Repository         Commit / Tree
Metadata              Files
      │                │
      └───────┬────────┘
              ▼
        Static Scanner
              │
      ┌───────┼──────────┐
      ▼       ▼          ▼
   Format  Compatibility Security
      │       │          │
      └───────┼──────────┘
              ▼
        Trust Profile
              │
              ▼
      Cloudflare D1 Registry
              │
              ▼
        ds-plugin.market
```

Automatic updates are designed around:

```text
Cloudflare Cron
      ↓
Discover new / changed repos
      ↓
Cloudflare Queue
      ↓
Static Scan
      ↓
D1
```

The project does not rely on high-frequency scraping of GitHub HTML pages.

## Scanner security boundary

The v1.0 scanner follows one hard rule:

> **Never execute untrusted plugin code.**

It reads and statically analyzes repository files through APIs. It does not:

```text
npm install third-party repo
pnpm install third-party repo
run prepare / postinstall
execute plugin entry
execute repository shell scripts
```

If something cannot be determined safely through static analysis, the correct result is `Unknown`, not an invented safety claim.

## Architecture

Current project stack:

```text
Frontend
React 19 + TypeScript + Vite

API
Hono

Runtime
Cloudflare Workers

Registry
Cloudflare D1

Scheduling
Cloudflare Cron Triggers

Scan Jobs
Cloudflare Queues

Source
GitHub REST API
```

For architecture, data models, scanner rules, trust semantics, and implementation phases, see:

**[Technical Design v1.0](docs/TECHNICAL_DESIGN.md)**

## v1.0 roadmap

### Registry MVP

- [ ] GitHub `dsh-plugin` candidate discovery
- [ ] Incremental GitHub API sync
- [ ] D1 registry
- [ ] `package.json` / `cordis.patch.yml` parsing
- [ ] Candidate / Detected / Format Verified states
- [ ] Home / Explore / Plugin Detail pages
- [ ] Basic installation commands

### Trust Layer

- [ ] DSH / Cordis compatibility analysis
- [ ] Install-script detection
- [ ] Static security signals
- [ ] Maintenance signals
- [ ] Commit-bound scan history
- [ ] Pinned-commit install commands

### Discovery Experience

- [ ] Capability taxonomy
- [ ] Advanced filters
- [ ] Featured / Trending / New & Verified
- [ ] Submit Plugin
- [ ] Publisher pages
- [ ] AI-assisted search as an enhancement, not a core dependency

## Development

Install dependencies:

```bash
npm install
```

Configure local secrets (optional for browsing; required for discovery/scan):

```bash
cp .dev.vars.example .dev.vars
```

Create and migrate the local D1 database:

```bash
wrangler d1 migrations apply DB --local
```

Start locally:

```bash
npm run dev
```

Common scripts:

```bash
npm run build        # tsc -b && vite build
npm run check        # type-check + build + wrangler deploy --dry-run
npm run lint         # eslint
npm test             # vitest (scanner unit tests)
npm run cf-typegen   # regenerate worker-configuration.d.ts after binding changes
npm run deploy       # deploy to Cloudflare Workers
```

> `GITHUB_TOKEN` and `INTERNAL_API_SECRET` are Worker secrets (or local `.dev.vars`), and must never be committed or exposed to frontend code. Discovery and scanning require a GitHub token; browsing the registry only needs the D1 database.

## Deployment (GitHub Actions)

Pushing to `main` auto-deploys via `.github/workflows/deploy.yml`. The workflow
provisions the Cloudflare Queue and D1 database (idempotently), applies D1
migrations, and runs `wrangler deploy`.

Required GitHub repository secrets:

- `CLOUDFLARE_API_TOKEN` — a Cloudflare API token with **Workers Scripts: Edit**,
  **D1: Edit**, and **Workers Queues: Edit** permissions.
- `CLOUDFLARE_ACCOUNT_ID` — your Cloudflare account ID.

Worker runtime secrets (set once, never committed):

```bash
wrangler secret put GITHUB_TOKEN        # GitHub PAT the worker uses to call the GitHub API
wrangler secret put INTERNAL_API_SECRET # guards /api/internal/* endpoints
```

## Core principle

```text
GitHub = Source of Truth for Code

DS Plugin Market
= Source of Truth for Plugin Metadata & Trust Signals
```

We do not host third-party plugins, mirror their release systems, or replace GitHub / npm.

Our job is simpler and more focused:

> **GitHub tells you what claims to be a DSH plugin. DS Plugin Market tells you what it actually is, whether it is compatible, and what you should know before installing it.**

## Disclaimer

DS Plugin Market is a community project. It is not an official DeepSeek product and does not represent DeepSeek review, approval, or endorsement of third-party plugins.

Verification, compatibility, and security results are automated observations tied to a specific scanner version, time, and commit. They are decision-support signals, not a substitute for source review or other security controls.

## Links

- [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)
- [GitHub `dsh-plugin` Topic](https://github.com/topics/dsh-plugin)
- [DSH Plugin Tutorial](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/index.md)
- [DSH Package & Install Guide](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.md)
