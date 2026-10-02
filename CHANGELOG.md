# Changelog

All notable changes to Voltilt packages are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/). Versions follow [SemVer](https://semver.org/).

GitHub Releases and npm package versions must stay in sync (see [AGENTS.md](./AGENTS.md#versioning--releases)).

## [Unreleased]

### Added (`@voltilt/coverflow`)

- Event API: `flow.on` / `flow.off` for `change`, `open`, `dragstart`, `drag`, `dragend`
- Matching option callbacks: `onChange`, `onOpen`, `onDragStart`, `onDrag`, `onDragEnd`
- Interactive card content: links, buttons, and `[data-vt-nodrag]` no longer start a drag
- Demo and README examples use a real `<a>` inside cards

## [0.1.0] - 2026-09-26

### Added

- `@voltilt/coverflow` — finger-follow 3D coverflow with windowed DOM mounting
- `@voltilt/z-timeline` — virtualized Z-axis scroll timeline
- Static demos with large JSON fixtures and GitHub Pages site
