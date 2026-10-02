# Voltilt

**High-performance CSS-3D navigation for the web.**

<p align="center">
  <a href="https://kohlercode.github.io/voltilt/examples/coverflow/">
    <img src="./media/voltilt-coverflow.gif" alt="Voltilt coverflow demo" width="49%" />
  </a>
  <a href="https://kohlercode.github.io/voltilt/examples/z-timeline/">
    <img src="./media/voltilt-ztimeline.gif" alt="Voltilt Z-timeline demo" width="49%" />
  </a>
</p>

<p align="center">
  <a href="https://kohlercode.github.io/voltilt/examples/coverflow/">Coverflow</a>
  ·
  <a href="https://kohlercode.github.io/voltilt/examples/z-timeline/">Z-Timeline</a>
  ·
  <a href="https://kohlercode.github.io/voltilt/">Live demos</a>
</p>

Vanilla JS primitives — no Three.js, no GSAP. Finger-follow coverflows and virtualized Z-axis timelines that stay smooth with thousands of items.

A [KohlerCode](https://kohlercode.com) project.

## Packages

| Package | Status | Description |
|---------|--------|-------------|
| [`@voltilt/coverflow`](./packages/coverflow) | Ready | 3D card coverflow (drag, wheel, keyboard, events, windowed DOM) |
| [`@voltilt/z-timeline`](./packages/z-timeline) | Ready | Virtualized Z-scroll timeline |

## Quick start

```bash
npm install @voltilt/coverflow @voltilt/z-timeline
```

```js
import { createCoverflow } from '@voltilt/coverflow';
import '@voltilt/coverflow/style.css';

import { createZTimeline, createArraySource } from '@voltilt/z-timeline';
import '@voltilt/z-timeline/style.css';
```

See each package README for markup + API. Agents and tools: start with [AGENTS.md](./AGENTS.md). Releases: [CHANGELOG.md](./CHANGELOG.md).

## CDN (jsDelivr)

Packages on npm are mirrored for free. Prefer a **pinned version** (not `@latest`) in production.

| Package | jsDelivr | ESM | CSS |
|---------|----------|-----|-----|
| `@voltilt/coverflow` | [Package page](https://www.jsdelivr.com/package/npm/@voltilt/coverflow) | [`/+esm`](https://cdn.jsdelivr.net/npm/@voltilt/coverflow@0.2.0/+esm) | [`style.css`](https://cdn.jsdelivr.net/npm/@voltilt/coverflow@0.2.0/src/style.css) |
| `@voltilt/z-timeline` | [Package page](https://www.jsdelivr.com/package/npm/@voltilt/z-timeline) | [`/+esm`](https://cdn.jsdelivr.net/npm/@voltilt/z-timeline@0.2.0/+esm) | [`style.css`](https://cdn.jsdelivr.net/npm/@voltilt/z-timeline@0.2.0/src/style.css) |

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@voltilt/coverflow@0.2.0/src/style.css" />
<script type="module">
  import { createCoverflow } from 'https://cdn.jsdelivr.net/npm/@voltilt/coverflow@0.2.0/+esm';
</script>
```

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@voltilt/z-timeline@0.2.0/src/style.css" />
<script type="module">
  import { createZTimeline, createArraySource } from 'https://cdn.jsdelivr.net/npm/@voltilt/z-timeline@0.2.0/+esm';
</script>
```

## Demos (thousands of JSON items)

**Live:** [kohlercode.github.io/voltilt](https://kohlercode.github.io/voltilt/)

| Demo | Data | Live | Source |
|------|------|------|--------|
| Coverflow | [`people-2500.json`](./examples/data/people-2500.json) | [Open](https://kohlercode.github.io/voltilt/examples/coverflow/) | [`examples/coverflow/`](./examples/coverflow/) |
| Z-Timeline | [`events-5000.json`](./examples/data/events-5000.json) | [Open](https://kohlercode.github.io/voltilt/examples/z-timeline/) | [`examples/z-timeline/`](./examples/z-timeline/) |

```bash
npm install
npm run demo
```

For local runs, open the server URL printed in the terminal (default port **4173**) and pick a demo from the hub page. Serve the **repo root** so demos can import package sources and shared JSON.

Regenerate fixtures: `npm run generate:data`

## License

MIT © [KohlerCode](https://kohlercode.com)
