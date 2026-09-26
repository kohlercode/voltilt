/**
 * @voltilt/coverflow — finger-follow 3D coverflow.
 * Drag right → content moves right → previous item.
 */

/**
 * @typedef {object} CoverflowElements
 * @property {HTMLElement} viewport
 * @property {HTMLElement} scene
 * @property {HTMLElement} [wrap] Defaults to viewport
 * @property {HTMLElement} [empty]
 * @property {HTMLButtonElement} [prev]
 * @property {HTMLButtonElement} [next]
 * @property {HTMLElement} [label]
 * @property {HTMLElement} [meta]
 * @property {HTMLElement} [count]
 * @property {HTMLInputElement|HTMLSelectElement} [filter]
 */

/**
 * @typedef {object} CoverflowMetrics
 * @property {number} spacing
 * @property {number} depth
 * @property {number} rot
 * @property {number} maxVisible
 */

/**
 * @typedef {object} CoverflowOptions
 * @property {CoverflowElements} [elements]
 * @property {HTMLElement} [root] Root with data-vt-* hooks (alternative to elements)
 * @property {(item: object, helpers: object) => HTMLElement} buildCard
 * @property {(item: object) => string} titleOf
 * @property {(item: object) => string} [metaOf]
 * @property {(item: object) => void} [openItem]
 * @property {(items: object[], query: string) => object[]} [prepareList]
 * @property {(deck: object[]) => string} [formatCount]
 * @property {() => boolean} [isActive]
 * @property {string} [emptyDefault]
 * @property {string} [emptyFilter]
 * @property {(narrow: boolean) => CoverflowMetrics} [metrics]
 * @property {string} [ignoreSelector] Clicks inside these nodes do not start a drag
 */

/**
 * Resolve element map from explicit refs or a root with data-vt hooks.
 * @param {CoverflowOptions} opts
 * @returns {CoverflowElements}
 */
function resolveElements(opts) {
  if (opts.elements?.viewport && opts.elements?.scene) {
    return {
      wrap: opts.elements.wrap || opts.elements.viewport,
      ...opts.elements,
    };
  }
  const root = opts.root;
  if (!root) {
    throw new Error('@voltilt/coverflow: pass `root` or `elements` with viewport + scene');
  }
  const q = (sel) => root.querySelector(sel);
  const viewport = q('[data-vt-viewport]') || root;
  const scene = q('[data-vt-scene]');
  if (!scene) {
    throw new Error('@voltilt/coverflow: missing [data-vt-scene] under root');
  }
  return {
    viewport,
    scene,
    wrap: q('[data-vt-wrap]') || viewport,
    empty: q('[data-vt-empty]') || undefined,
    prev: q('[data-vt-prev]') || undefined,
    next: q('[data-vt-next]') || undefined,
    label: q('[data-vt-label]') || undefined,
    meta: q('[data-vt-meta]') || undefined,
    count: q('[data-vt-count]') || undefined,
    filter: q('[data-vt-filter]') || undefined,
  };
}

/**
 * @param {boolean} [narrow]
 * @returns {CoverflowMetrics}
 */
export function defaultMetrics(narrow = window.matchMedia('(max-width: 560px)').matches) {
  return {
    spacing: narrow ? 118 : 148,
    depth: narrow ? 110 : 145,
    rot: narrow ? 26 : 32,
    maxVisible: narrow ? 3 : 5,
  };
}

/**
 * Create a coverflow controller.
 * @param {CoverflowOptions} options
 */
export function createCoverflow(options) {
  const els = resolveElements(options);
  const getMetrics = options.metrics
    || (() => defaultMetrics(window.matchMedia('(max-width: 560px)').matches));
  const isActive = options.isActive || (() => true);
  const openItem = options.openItem || (() => {});
  const prepareList = options.prepareList || ((items, q) => {
    if (!q) return items.slice();
    return items.filter((it) => {
      const title = options.titleOf(it).toLowerCase();
      const meta = options.metaOf ? options.metaOf(it).toLowerCase() : '';
      return title.includes(q) || meta.includes(q);
    });
  });
  const emptyDefault = options.emptyDefault || 'Nothing here yet.';
  const emptyFilter = options.emptyFilter || 'No matches.';
  const ignoreSelector = options.ignoreSelector
    || '.vt-coverflow-chrome, [data-vt-chrome], input, textarea, select, button.vt-nav';

  const state = {
    deck: [],
    /** @type {Map<number, HTMLElement>} */
    cards: new Map(),
    active: 0,
    drag: null,
    raf: 0,
    suppressClick: false,
    wired: false,
    ending: false,
    destroyed: false,
    _sourceItems: /** @type {object[]|null} */ (null),
  };

  /** @type {Array<[EventTarget, string, EventListenerOrEventListenerObject, AddEventListenerOptions|boolean|undefined]>} */
  const listeners = [];

  function on(target, type, handler, opts) {
    if (!target) return;
    target.addEventListener(type, handler, opts);
    listeners.push([target, type, handler, opts]);
  }

  function windowRadius(dragSlots = 0) {
    const { maxVisible } = getMetrics();
    return maxVisible + 2 + Math.ceil(Math.abs(dragSlots));
  }

  function buildCardEl(item) {
    const card = options.buildCard(item, {
      isSuppressed: () => state.suppressClick,
      clearSuppress: () => { state.suppressClick = false; },
      onActivate: (it) => {
        const idx = state.deck.findIndex((x) => x.id === it.id);
        if (idx < 0) return;
        if (idx === state.active) openItem(it);
        else setActive(idx);
      },
    });
    if (!card.classList.contains('vt-card')) card.classList.add('vt-card');
    return card;
  }

  function syncCardWindow(dragSlots = 0) {
    if (!state.deck.length) return;
    const r = windowRadius(dragSlots);
    const lo = Math.max(0, state.active - r);
    const hi = Math.min(state.deck.length - 1, state.active + r);
    for (const [i, card] of [...state.cards.entries()]) {
      if (i < lo || i > hi) {
        card.remove();
        state.cards.delete(i);
      }
    }
    for (let i = lo; i <= hi; i++) {
      if (state.cards.has(i)) continue;
      const item = state.deck[i];
      if (!item) continue;
      const card = buildCardEl(item);
      els.scene.appendChild(card);
      state.cards.set(i, card);
    }
  }

  function layout(dragPx = 0) {
    if (!state.deck.length) return;
    const { spacing, depth, rot, maxVisible } = getMetrics();
    const dragSlots = dragPx / spacing;
    syncCardWindow(dragSlots);
    for (const [i, card] of state.cards.entries()) {
      const offset = i - state.active + dragSlots;
      const abs = Math.abs(offset);
      const x = offset * spacing;
      const z = -abs * depth;
      const y = abs * 10 + (abs > 0.2 ? 6 : 0);
      const rotY = offset * -rot;
      const scale = Math.max(0.72, 1 - abs * 0.085);
      const focused = abs < 0.35;
      card.style.transform =
        `translate(-50%, -50%) translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px) ` +
        `rotateY(${rotY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      card.style.zIndex = String(Math.round(200 - abs * 10));
      card.style.opacity = abs > maxVisible + 0.4 ? '0' : String(Math.max(0.15, 1 - abs * 0.12));
      card.classList.toggle('is-focus', focused);
      card.classList.toggle('is-far', abs > maxVisible);
      card.setAttribute('aria-current', focused ? 'true' : 'false');
      card.tabIndex = focused ? 0 : -1;
    }
  }

  function updateChrome() {
    const { label, meta, prev, next, count } = els;
    const item = state.deck[state.active];
    if (!item) {
      if (label) label.textContent = '';
      if (meta) meta.textContent = '';
      if (prev) prev.disabled = true;
      if (next) next.disabled = true;
      if (count && options.formatCount) count.textContent = '';
      return;
    }
    if (label) label.textContent = options.titleOf(item);
    if (meta) {
      const extra = options.metaOf ? options.metaOf(item) : '';
      meta.textContent = `${state.active + 1} / ${state.deck.length}` +
        (extra ? ` · ${extra}` : '');
    }
    if (prev) prev.disabled = state.active <= 0;
    if (next) next.disabled = state.active >= state.deck.length - 1;
    if (count && options.formatCount) count.textContent = options.formatCount(state.deck);
  }

  function setActive(index, { animate = true } = {}) {
    if (!state.deck.length) return;
    state.active = Math.max(0, Math.min(state.deck.length - 1, index));
    if (!animate) els.viewport.classList.add('is-dragging');
    layout(0);
    updateChrome();
    if (!animate) {
      requestAnimationFrame(() => {
        if (!state.drag) els.viewport.classList.remove('is-dragging');
      });
    }
  }

  function step(delta) {
    setActive(state.active + delta);
  }

  function openFocused() {
    const item = state.deck[state.active];
    if (item) openItem(item);
  }

  function focusItemId(id) {
    const idx = state.deck.findIndex((x) => x.id === id);
    if (idx >= 0 && idx !== state.active) setActive(idx);
  }

  function scheduleLayoutFromDrag() {
    if (state.raf) return;
    state.raf = requestAnimationFrame(() => {
      state.raf = 0;
      if (!state.drag) return;
      layout(state.drag.lastX - state.drag.startX);
    });
  }

  function endDrag(e) {
    if (!state.drag) return;
    if (e && e.pointerId != null && state.drag.pointerId !== e.pointerId) return;
    if (state.ending) return;
    state.ending = true;

    const drag = state.drag;
    const dx = (e && e.clientX != null ? e.clientX : drag.lastX) - drag.startX;
    const moved = drag.moved;
    const velocity = drag.velocity || 0;
    state.drag = null;

    els.viewport.classList.remove('is-dragging');

    if (moved) {
      state.suppressClick = true;
      setTimeout(() => { state.suppressClick = false; }, 120);
    }

    const { spacing } = getMetrics();
    let steps = 0;
    if (moved) {
      steps = Math.round(-dx / spacing);
      if (steps === 0 && Math.abs(dx) > spacing * 0.18) {
        steps = dx > 0 ? -1 : 1;
      }
      if (steps === 0 && Math.abs(velocity) > 0.45) {
        steps = velocity > 0 ? -1 : 1;
      }
    }
    if (steps) setActive(state.active + steps);
    else layout(0);

    state.ending = false;
  }

  function clearScene() {
    for (const card of state.cards.values()) card.remove();
    state.cards.clear();
    while (els.scene.firstChild) els.scene.removeChild(els.scene.firstChild);
  }

  function bind() {
    if (state.wired || state.destroyed) return;
    state.wired = true;
    const wrap = els.wrap;
    const viewport = els.viewport;

    on(els.prev, 'click', () => {
      if (isActive()) step(-1);
    });
    on(els.next, 'click', () => {
      if (isActive()) step(1);
    });

    on(wrap, 'pointerdown', (e) => {
      if (!isActive()) return;
      if (e.target.closest(ignoreSelector)) return;
      if (e.button != null && e.button !== 0) return;
      state.ending = false;
      state.drag = {
        pointerId: e.pointerId,
        startX: e.clientX,
        lastX: e.clientX,
        lastT: performance.now(),
        velocity: 0,
        moved: false,
      };
      try { wrap.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
    });

    on(wrap, 'pointermove', (e) => {
      if (!state.drag || state.drag.pointerId !== e.pointerId) return;
      const now = performance.now();
      const dt = Math.max(1, now - state.drag.lastT);
      const instant = (e.clientX - state.drag.lastX) / dt;
      state.drag.velocity = state.drag.velocity * 0.7 + instant * 0.3;
      state.drag.lastX = e.clientX;
      state.drag.lastT = now;
      const dx = e.clientX - state.drag.startX;
      if (!state.drag.moved && Math.abs(dx) > 8) {
        state.drag.moved = true;
        viewport.classList.add('is-dragging');
      }
      if (state.drag.moved) {
        e.preventDefault();
        scheduleLayoutFromDrag();
      }
    });

    on(wrap, 'pointerup', endDrag);
    on(wrap, 'pointercancel', endDrag);

    on(wrap, 'wheel', (e) => {
      if (!isActive()) return;
      if (Math.abs(e.deltaX) < 6 && Math.abs(e.deltaY) < 6) return;
      e.preventDefault();
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      step(delta > 0 ? 1 : -1);
    }, { passive: false });

    on(document, 'keydown', (e) => {
      if (!isActive()) return;
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        step(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        step(1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        setActive(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setActive(state.deck.length - 1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        openFocused();
      }
    });

    on(window, 'resize', () => {
      if (isActive()) layout(0);
    }, { passive: true });

    if (els.filter) {
      on(els.filter, 'input', () => {
        render(state._sourceItems || state.deck);
      });
    }
  }

  /**
   * @param {object[]} items
   * @param {{ preferId?: string|number|null }} [opts]
   */
  function render(items, { preferId = null } = {}) {
    if (state.destroyed) return;
    state._sourceItems = items;
    const filterVal = els.filter?.value || '';
    const q = filterVal.trim().toLowerCase();
    const list = prepareList(items, q);

    if (!items.length || !list.length) {
      clearScene();
      state.deck = [];
      state.active = 0;
      els.empty?.classList.remove('vt-hidden');
      const emptyP = els.empty?.querySelector('p');
      if (emptyP) {
        emptyP.textContent = !items.length ? emptyDefault : emptyFilter;
      }
      els.viewport.classList.add('is-empty');
      updateChrome();
      if (els.count) {
        els.count.textContent = !items.length ? '' : (q ? '0 matches' : '');
      }
      return;
    }

    const emptyP = els.empty?.querySelector('p');
    if (emptyP) emptyP.textContent = emptyDefault;
    els.empty?.classList.add('vt-hidden');
    els.viewport.classList.remove('is-empty');

    const prevId = preferId ?? state.deck[state.active]?.id ?? null;
    state.deck = list;
    clearScene();

    let idx = prevId != null ? state.deck.findIndex((x) => x.id === prevId) : 0;
    if (idx < 0) idx = 0;
    setActive(idx, { animate: false });
  }

  function destroy() {
    if (state.destroyed) return;
    state.destroyed = true;
    if (state.raf) cancelAnimationFrame(state.raf);
    state.drag = null;
    for (const [target, type, handler, opts] of listeners) {
      target.removeEventListener(type, handler, opts);
    }
    listeners.length = 0;
    clearScene();
    state.deck = [];
    state.wired = false;
  }

  return {
    bind,
    render,
    setActive,
    step,
    focusItemId,
    openFocused,
    destroy,
    layout: () => layout(0),
    get activeItem() { return state.deck[state.active] || null; },
    get activeIndex() { return state.active; },
    get deck() { return state.deck; },
  };
}

export default createCoverflow;
