# AGENTS.md

Instructions for AI coding agents and automated tools working in this repository.

## What this is

**Voltilt** — vanilla JS + CSS 3D navigation primitives (`@voltilt/coverflow`, `@voltilt/z-timeline`). No React/Vue in core. No Three.js / GSAP.

Project by [KohlerCode](https://kohlercode.com).

## Read first

| Doc | Why |
|-----|-----|
| [README.md](./README.md) | Install, demos, package map |
| [packages/coverflow/README.md](./packages/coverflow/README.md) | Coverflow markup + API |
| [packages/z-timeline/README.md](./packages/z-timeline/README.md) | Z-timeline markup + API |

## Layout

```text
packages/coverflow/     → @voltilt/coverflow
packages/z-timeline/    → @voltilt/z-timeline
examples/coverflow/     → demo (2.5k JSON cards)
examples/z-timeline/    → demo (5k JSON cards)
examples/data/          → shared JSON fixtures
scripts/                → generate-demo-data.js
```

## Fast path

```bash
npm install
npm run demo          # serve repo ROOT (see terminal for host/port)
```

Open the printed local URL, then `/examples/coverflow/` or `/examples/z-timeline/`.

Import sources in demos via relative paths into `packages/*/src` (no bundler required).

## API shape (stable intent)

- Factories: `createCoverflow`, `createZTimeline`, helper `createArraySource`
- Host DOM via element refs **or** `data-vt-*` hooks — never app-specific IDs
- Lifecycle: `bind` → render/refresh → `destroy`
- Coverflow events: `flow.on` / `flow.off` (`change`, `open`, `dragstart`, `drag`, `dragend`)
- Gate input with `isActive()` when embedding in multi-view apps
- Theme with CSS variables `--vt-*`

## Public clarity

This repo is public. Prefer APIs, demos, and README sections that a newcomer can copy without tribal knowledge. Name events and options plainly; show working links/controls in demos when documenting interaction.

## Coding norms

- Vanilla ESM (`"type": "module"`); keep packages side-effect free except CSS
- Prefer windowed / virtualized DOM for large datasets
- Do not add framework wrappers until vanilla APIs are solid
- Do not invent ad-hoc animation libs; stick to CSS 3D + rAF

## Versioning & releases

**Practice:** SemVer in each package ↔ matching **GitHub Release / git tag** ↔ **npm publish**. Keep those three aligned for every ship.

| Channel | Rule |
|---------|------|
| `packages/*/package.json` `"version"` | Source of truth for that package |
| Git tag / GitHub Release | Same version (`vX.Y.Z` when shipping together, or package-specific tags if independent) |
| npm | `npm publish --access public` at that exact version |

### Bumps (agents must apply in the same change set)

| Change | Version |
|--------|---------|
| Fix / perf / docs in a package | **patch** |
| Backward-compatible feature / API | **minor** |
| Breaking API or CSS contract | **major** |

Bump **only packages that changed**. Update [`CHANGELOG.md`](./CHANGELOG.md) in the same commit. Propose a **ship** (tag + GitHub Release + npm) when the user wants it public; do not leave publishable package edits unversioned.

Root workspace package stays private (not on npm).

## Public-repo security (mandatory)

This repository is **public**. Never commit:

- Credentials, API keys, tokens, passphrases, private URLs with secrets
- Links to private / non-public apps or internal hostnames
- `.env`, `config.php`, key files, certificates
- Absolute local machine paths (`C:\…`, `/Users/…`, home directories)
- Secrets or unlock material from other KohlerCode projects

Also never commit `.cursor/` (local agent rules/state — gitignored).

If a change would require a secret, use env vars documented as placeholders only (`YOUR_API_KEY`), never real values.

## Out of scope

- Private KohlerCode application backends (Voltilt is the extracted UI kit only)
