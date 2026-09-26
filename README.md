# Voltilt

**High-performance CSS-3D navigation for the web.**

Vanilla JS primitives — no Three.js, no GSAP. Finger-follow coverflows and virtualized Z-axis timelines that stay smooth with thousands of items.

A [KohlerCode](https://kohlercode.com) project.

## Packages

| Package | Status | Description |
|---------|--------|-------------|
| [`@voltilt/coverflow`](./packages/coverflow) | Ready | 3D card coverflow (drag, wheel, keyboard, windowed DOM) |
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

See each package README for markup + API. Agents and tools: start with [AGENTS.md](./AGENTS.md).

## Demos (thousands of JSON items)

| Demo | Data | Path |
|------|------|------|
| Coverflow | [`people-2500.json`](./examples/data/people-2500.json) | [`examples/coverflow/`](./examples/coverflow/) |
| Z-Timeline | [`events-5000.json`](./examples/data/events-5000.json) | [`examples/z-timeline/`](./examples/z-timeline/) |

```bash
npm install
npm run demo
```

Then open the local server root shown in the terminal (default port **4173**) and pick a demo from the hub page. Serve the **repo root** so demos can import package sources and shared JSON.

Regenerate fixtures: `npm run generate:data`

## License

MIT © [KohlerCode](https://kohlercode.com)
