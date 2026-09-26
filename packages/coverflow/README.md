# @voltilt/coverflow

Finger-follow **3D card coverflow** — vanilla JS + CSS `perspective`. Drag, wheel, and keyboard.

## Install

```bash
npm install @voltilt/coverflow
```

```js
import { createCoverflow } from '@voltilt/coverflow';
import '@voltilt/coverflow/style.css';
```

## Markup

Use a root with `data-vt-*` hooks (or pass `elements` refs):

```html
<div class="vt-coverflow" id="demo" data-vt-viewport>
  <div class="vt-coverflow-ambient" aria-hidden="true"></div>
  <div class="vt-coverflow-wrap" data-vt-wrap>
    <div class="vt-coverflow-scene" data-vt-scene></div>
  </div>
  <div class="vt-coverflow-chrome" data-vt-chrome>
    <button type="button" class="vt-nav" data-vt-prev aria-label="Previous">‹</button>
    <div class="vt-coverflow-status">
      <span data-vt-label class="vt-coverflow-label"></span>
      <span data-vt-meta class="vt-coverflow-meta"></span>
    </div>
    <button type="button" class="vt-nav" data-vt-next aria-label="Next">›</button>
  </div>
  <div class="vt-empty vt-hidden" data-vt-empty><p></p></div>
</div>
```

## API

```js
const flow = createCoverflow({
  root: document.querySelector('#demo'),
  buildCard(item, { onActivate, isSuppressed, clearSuppress }) { /* return HTMLElement */ },
  titleOf: (item) => item.title,
  metaOf: (item) => item.role,       // optional
  openItem: (item) => { /* … */ },   // optional
  prepareList: (items, q) => …,      // optional filter
  isActive: () => true,              // gate input when hidden
});

flow.bind();
flow.render(items, { preferId: 2 });
flow.step(1);
flow.focusItemId(3);
flow.destroy();
```

Items should have a stable `id`.

## Theming

Override CSS variables on `.vt-coverflow`:

```css
.vt-coverflow {
  --vt-accent: #ff7a59;
  --vt-bg: #120c0a;
}
```

## License

MIT · [KohlerCode](https://kohlercode.com)
