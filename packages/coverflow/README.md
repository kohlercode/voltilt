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

### CDN (jsDelivr)

[Package page](https://www.jsdelivr.com/package/npm/@voltilt/coverflow) · pin a version in production:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@voltilt/coverflow@0.2.0/src/style.css" />
<script type="module">
  import { createCoverflow } from 'https://cdn.jsdelivr.net/npm/@voltilt/coverflow@0.2.0/+esm';
</script>
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

## Quick start

```js
const flow = createCoverflow({
  root: document.querySelector('#demo'),
  titleOf: (item) => item.title,
  metaOf: (item) => item.role, // optional
  buildCard(item, { onActivate, isSuppressed, clearSuppress }) {
    const card = document.createElement('div');
    card.className = 'vt-card';
    card.innerHTML = `
      <div class="vt-card-face"></div>
      <div class="vt-card-body">
        <h3>${item.title}</h3>
        <a class="vt-card-open-hint" href="/people/${item.id}">Open</a>
      </div>
    `;
    card.addEventListener('click', (e) => {
      // Let real links / buttons work on their own
      if (e.target.closest('a[href], button, [data-vt-nodrag]')) return;
      if (isSuppressed()) { clearSuppress(); return; }
      onActivate(item);
    });
    return card;
  },
});

flow.on('change', ({ index, item }) => {
  console.log('focused', index, item);
});

flow.on('open', ({ item }) => {
  console.log('opened', item);
});

flow.bind();
flow.render(items);
```

Items need a stable `id`.

## Events

Subscribe with `flow.on(name, handler)`. Handlers receive a plain object. `flow.off(name, handler)` removes a listener. `on()` also returns an unsubscribe function.

| Event | When | Detail |
|-------|------|--------|
| `change` | Focused index changes (also once after each `render`) | `{ index, item, previousIndex }` |
| `open` | Card opened (Enter, `openFocused()`, or activate while focused) | `{ index, item }` |
| `dragstart` | Drag moved past the threshold | `{ index, item }` |
| `drag` | Drag position updated (animation-frame throttled) | `{ index, item, dx }` |
| `dragend` | Pointer released | `{ index, item, dx, steps, moved }` |

You can also pass one-shot option callbacks: `onChange`, `onOpen`, `onDragStart`, `onDrag`, `onDragEnd`. The older `openItem(item)` option still runs when a card is opened.

```js
flow.on('change', ({ index, item }) => { /* … */ });
const stop = flow.on('open', ({ item }) => { /* … */ });
stop(); // or flow.off('open', handler)
```

## Interactive content inside cards

**Drag and links can coexist.** Coverflow does **not** start a drag when the pointer goes down on:

- chrome (`.vt-coverflow-chrome` / `[data-vt-chrome]`)
- links, buttons, inputs, and other controls **inside** a card
- anything matching `[data-vt-nodrag]`
- anything matching your extra `ignoreSelector`

Practical rules:

1. Prefer a **`<div class="vt-card">`** when the card contains links or controls (a root `<button>` cannot legally wrap an `<a>`).
2. Put real `<a href="…">` (or buttons) in the card — clicks on them will navigate / run as usual.
3. On the card’s own click handler, ignore clicks that came from those controls (see the quick-start example).
4. After a drag, coverflow briefly suppresses the following click so a swipe does not accidentally “open” the card — use `isSuppressed()` / `clearSuppress()` from `buildCard` helpers.

## API

```js
const flow = createCoverflow({ /* options */ });

flow.bind();
flow.render(items, { preferId: 2 });
flow.step(1);
flow.setActive(10);
flow.focusItemId(3);
flow.openFocused();
flow.on('change', handler);
flow.off('change', handler);
flow.destroy();

flow.activeIndex; // number
flow.activeItem;  // object | null
flow.deck;        // current filtered list
```

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
