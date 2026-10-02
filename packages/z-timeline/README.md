# @voltilt/z-timeline

Virtualized **Z-axis scroll timeline** — thousands of cards, flat DOM memory. Vanilla JS + CSS 3D.

## Install

```bash
npm install @voltilt/z-timeline
```

```js
import { createZTimeline, createArraySource } from '@voltilt/z-timeline';
import '@voltilt/z-timeline/style.css';
```

### CDN (jsDelivr)

[Package page](https://www.jsdelivr.com/package/npm/@voltilt/z-timeline) · pin a version in production:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@voltilt/z-timeline@0.2.0/src/style.css" />
<script type="module">
  import { createZTimeline, createArraySource } from 'https://cdn.jsdelivr.net/npm/@voltilt/z-timeline@0.2.0/+esm';
</script>
```

## Markup

```html
<div class="vt-z-root">
  <div class="vt-z-scroll-proxy" data-vt-scroll-proxy></div>
  <div class="vt-z-viewport" data-vt-viewport>
    <div class="vt-z-scene-wrapper" data-vt-scene-wrapper>
      <div class="vt-z-scene" data-vt-scene></div>
    </div>
    <div class="vt-z-empty vt-hidden" data-vt-empty><p>No items</p></div>
  </div>
</div>
```

The scroll-proxy must live in **document flow** (not inside the fixed viewport) so `window` scroll height drives the camera.

## API

```js
const source = createArraySource(items); // or your own getTotal / fetchPage

const timeline = createZTimeline({
  root: document.querySelector('.vt-z-root'),
  getTotal: source.getTotal,
  fetchPage: source.fetchPage,
  renderItem(item, index) {
    const el = document.createElement('article');
    el.innerHTML = `<div class="vt-z-card-content"><h2>${item.title}</h2></div>`;
    return el;
  },
  onFocusChange(index, item) { /* … */ },
});

timeline.bind();
await timeline.refresh();
timeline.jumpToIndex(100);
timeline.destroy();
```

Items need a stable `id` (or pass `itemId`).

## License

MIT · [KohlerCode](https://kohlercode.com)
