/**
 * @voltilt/z-timeline — virtualized Z-axis scroll timeline.
 * Native scroll → LERP camera → mount only near-clip cards.
 */

/**
 * @typedef {object} ZTimelineElements
 * @property {HTMLElement} viewport
 * @property {HTMLElement} scene
 * @property {HTMLElement} scrollProxy
 * @property {HTMLElement} [sceneWrapper] Defaults to scene parent / viewport
 * @property {HTMLElement} [empty]
 */

/**
 * @typedef {object} ZTimelineOptions
 * @property {ZTimelineElements} [elements]
 * @property {HTMLElement} [root] Root with data-vt-* hooks
 * @property {() => number|Promise<number>} getTotal
 * @property {(offset: number, limit: number) => object[]|Promise<object[]>} fetchPage
 * @property {(item: object, index: number) => HTMLElement} renderItem
 * @property {(item: object) => string|number} [itemId] Defaults to item.id
 * @property {() => boolean} [isActive]
 * @property {number} [spacing] Z gap between cards (default 900)
 * @property {number} [speed] Scroll px → Z multiplier (default 1.5)
 * @property {number} [farClip] (default 2400)
 * @property {number} [nearClip] (default 900)
 * @property {number} [lerp] (default 0.08)
 * @property {number} [pageSize] (default 20)
 * @property {number} [cacheWindow] Extra pages kept (default 2)
 * @property {number} [focusAlign] Focal bias (default 0.42)
 * @property {boolean} [parallax] Mouse parallax + glare (default true)
 * @property {(index: number, item: object|null) => void} [onFocusChange]
 * @property {Window|HTMLElement} [scrollSource] Who emits scroll (default window)
 * @property {() => number} [getScrollY] Override scroll read
 * @property {(y: number) => void} [setScrollY] Override scroll write (jumpTo)
 */

function resolveElements(opts) {
  if (opts.elements?.viewport && opts.elements?.scene && opts.elements?.scrollProxy) {
    const sceneWrapper = opts.elements.sceneWrapper
      || opts.elements.scene.parentElement
      || opts.elements.viewport;
    return { ...opts.elements, sceneWrapper };
  }
  const root = opts.root;
  if (!root) {
    throw new Error('@voltilt/z-timeline: pass `root` or `elements` (viewport, scene, scrollProxy)');
  }
  const q = (sel) => root.querySelector(sel);
  const viewport = q('[data-vt-viewport]') || root;
  const scene = q('[data-vt-scene]');
  const scrollProxy = q('[data-vt-scroll-proxy]');
  if (!scene || !scrollProxy) {
    throw new Error('@voltilt/z-timeline: missing [data-vt-scene] or [data-vt-scroll-proxy]');
  }
  return {
    viewport,
    scene,
    scrollProxy,
    sceneWrapper: q('[data-vt-scene-wrapper]') || scene.parentElement || viewport,
    empty: q('[data-vt-empty]') || undefined,
  };
}

/**
 * In-memory page adapter for a full array (demo / static JSON).
 * @param {object[]} items
 */
export function createArraySource(items) {
  const list = items.slice();
  return {
    getTotal: () => list.length,
    fetchPage: (offset, limit) => list.slice(offset, offset + limit),
  };
}

/**
 * @param {ZTimelineOptions} options
 */
export function createZTimeline(options) {
  const els = resolveElements(options);
  const itemId = options.itemId || ((item) => item.id);
  const isActive = options.isActive || (() => true);
  const spacing = options.spacing ?? 900;
  const speed = options.speed ?? 1.5;
  const farClip = options.farClip ?? 2400;
  const nearClip = options.nearClip ?? 900;
  const lerp = options.lerp ?? 0.08;
  const pageSize = options.pageSize ?? 20;
  const cacheWindow = options.cacheWindow ?? 2;
  const focusAlign = options.focusAlign ?? 0.42;
  const scrollEps = 0.05;
  const parallaxOn = options.parallax !== false;

  const scrollSource = options.scrollSource || window;
  const getScrollY = options.getScrollY || (() => (
    scrollSource === window ? window.scrollY : scrollSource.scrollTop
  ));
  const setScrollY = options.setScrollY || ((y) => {
    if (scrollSource === window) window.scrollTo(0, y);
    else scrollSource.scrollTop = y;
  });

  const state = {
    total: 0,
    targetScroll: 0,
    currentScroll: 0,
    rafRunning: false,
    pointerRaf: 0,
    pointerX: 0,
    pointerY: 0,
    wired: false,
    destroyed: false,
    active: false,
    lastFocusIndex: -1,
  };

  /** @type {Map<number, object[]>} */
  const pageCache = new Map();
  /** @type {Set<number>} */
  const inFlight = new Set();
  /** @type {Map<string|number, { el: HTMLElement, glare: HTMLElement|null, index: number }>} */
  const renderedNodes = new Map();

  /** @type {Array<[EventTarget, string, EventListenerOrEventListenerObject, AddEventListenerOptions|boolean|undefined]>} */
  const listeners = [];

  function on(target, type, handler, opts) {
    if (!target) return;
    target.addEventListener(type, handler, opts);
    listeners.push([target, type, handler, opts]);
  }

  function scrollYForIndex(index) {
    return ((index + focusAlign) * spacing) / speed;
  }

  function focusedIndexFromScroll(scroll) {
    if (state.total <= 0) return -1;
    const cameraZ = scroll * speed;
    return Math.max(
      0,
      Math.min(state.total - 1, Math.round(cameraZ / spacing - focusAlign)),
    );
  }

  function loadPage(pageIndex) {
    if (pageCache.has(pageIndex) || inFlight.has(pageIndex)) return;
    inFlight.add(pageIndex);
    const offset = pageIndex * pageSize;
    Promise.resolve(options.fetchPage(offset, pageSize))
      .then((items) => {
        pageCache.set(pageIndex, items || []);
        updateVirtualScene(state.currentScroll);
      })
      .catch(() => {
        pageCache.set(pageIndex, []);
      })
      .finally(() => {
        inFlight.delete(pageIndex);
      });
  }

  function evictPages(firstVisiblePage, lastVisiblePage) {
    const keepMin = firstVisiblePage - cacheWindow;
    const keepMax = lastVisiblePage + cacheWindow;
    for (const p of [...pageCache.keys()]) {
      if (p < keepMin || p > keepMax) pageCache.delete(p);
    }
  }

  function mountNode(item, index) {
    const el = options.renderItem(item, index);
    el.classList.add('vt-z-card');
    el.style.transform = `translate(-50%, -50%) translateZ(${-(index * spacing)}px)`;

    let glare = el.querySelector('.vt-z-glare');
    if (!glare && parallaxOn) {
      glare = document.createElement('div');
      glare.className = 'vt-z-glare';
      el.insertBefore(glare, el.firstChild);
    }

    els.scene.appendChild(el);
    renderedNodes.set(itemId(item), { el, glare: glare || null, index });
  }

  function mountVisible(startIndex, endIndex) {
    const needed = new Set();

    for (let i = startIndex; i <= endIndex; i++) {
      const pageIndex = Math.floor(i / pageSize);
      const items = pageCache.get(pageIndex);
      if (!items) continue;
      const item = items[i - pageIndex * pageSize];
      if (!item) continue;
      const id = itemId(item);
      needed.add(id);
      const existing = renderedNodes.get(id);
      if (!existing) {
        mountNode(item, i);
      } else if (existing.index !== i) {
        existing.index = i;
        existing.el.style.transform =
          `translate(-50%, -50%) translateZ(${-(i * spacing)}px)`;
      }
    }

    for (const [id, node] of renderedNodes.entries()) {
      if (!needed.has(id)) {
        node.el.remove();
        renderedNodes.delete(id);
      }
    }
  }

  function emitFocus(scroll) {
    if (!options.onFocusChange) return;
    const index = focusedIndexFromScroll(scroll);
    if (index === state.lastFocusIndex) return;
    state.lastFocusIndex = index;
    let item = null;
    if (index >= 0) {
      const pageIndex = Math.floor(index / pageSize);
      const items = pageCache.get(pageIndex);
      item = items?.[index - pageIndex * pageSize] || null;
    }
    options.onFocusChange(index, item);
  }

  function updateVirtualScene(smoothedScroll) {
    const cameraZ = smoothedScroll * speed;
    els.scene.style.transform = `translateZ(${cameraZ}px)`;

    if (state.total === 0) return;

    const startIndex = Math.max(0, Math.floor((cameraZ - farClip) / spacing));
    const endIndex = Math.min(state.total - 1, Math.ceil((cameraZ + nearClip) / spacing));

    const firstPage = Math.floor(startIndex / pageSize);
    const lastPage = Math.floor(endIndex / pageSize);

    for (let p = firstPage; p <= lastPage; p++) loadPage(p);

    mountVisible(startIndex, endIndex);
    evictPages(firstPage, lastPage);
    emitFocus(smoothedScroll);
  }

  function kickRenderLoop() {
    if (!state.active || state.rafRunning || state.destroyed) return;
    state.rafRunning = true;
    requestAnimationFrame(renderLoop);
  }

  function renderLoop() {
    if (!state.active || state.destroyed) {
      state.rafRunning = false;
      return;
    }
    const delta = state.targetScroll - state.currentScroll;
    if (Math.abs(delta) > scrollEps) {
      state.currentScroll += delta * lerp;
      updateVirtualScene(state.currentScroll);
      requestAnimationFrame(renderLoop);
      return;
    }
    if (delta !== 0) {
      state.currentScroll = state.targetScroll;
      updateVirtualScene(state.currentScroll);
    }
    state.rafRunning = false;
  }

  function applyPointerParallax() {
    state.pointerRaf = 0;
    if (!state.active || !parallaxOn) return;
    const xPos = state.pointerX;
    const yPos = state.pointerY;
    els.sceneWrapper.style.transform =
      `rotateY(${xPos * 8}deg) rotateX(${-yPos * 5}deg)`;
    const gx = `${(-xPos * 120).toFixed(1)}px`;
    const gy = `${(-yPos * 120).toFixed(1)}px`;
    const glareTransform = `translate(${gx}, ${gy})`;
    for (const { glare } of renderedNodes.values()) {
      if (glare) glare.style.transform = glareTransform;
    }
  }

  function clearRendered() {
    for (const { el } of renderedNodes.values()) el.remove();
    renderedNodes.clear();
    pageCache.clear();
    inFlight.clear();
  }

  /**
   * Reload totals + proxy height and remount visible range.
   */
  async function refresh() {
    if (state.destroyed) return;
    clearRendered();
    state.lastFocusIndex = -1;
    state.total = Number(await Promise.resolve(options.getTotal())) || 0;
    const height = state.total > 0 ? (state.total * spacing) / speed : 0;
    els.scrollProxy.style.height = `${height}px`;
    els.empty?.classList.toggle('vt-hidden', state.total > 0);
    els.viewport.classList.toggle('is-empty', state.total === 0);
    updateVirtualScene(state.currentScroll);
  }

  function jumpToIndex(index, { smooth = false } = {}) {
    if (state.total <= 0) return;
    const clamped = Math.max(0, Math.min(state.total - 1, index));
    const y = scrollYForIndex(clamped);
    if (smooth && scrollSource === window) {
      window.scrollTo({ top: y, behavior: 'smooth' });
    } else {
      setScrollY(y);
      state.targetScroll = y;
      state.currentScroll = y;
      updateVirtualScene(y);
    }
  }

  function setActive(active) {
    state.active = !!active && !state.destroyed;
    if (state.active) {
      state.targetScroll = getScrollY();
      kickRenderLoop();
    }
  }

  function bind() {
    if (state.wired || state.destroyed) return;
    state.wired = true;
    state.active = true;

    on(scrollSource, 'scroll', () => {
      if (!state.active || !isActive()) return;
      state.targetScroll = getScrollY();
      if (Math.abs(state.targetScroll - state.currentScroll) <= scrollEps) {
        state.currentScroll = state.targetScroll;
        updateVirtualScene(state.currentScroll);
        return;
      }
      kickRenderLoop();
    }, { passive: true });

    if (parallaxOn) {
      on(window, 'mousemove', (e) => {
        if (!state.active || !isActive()) return;
        state.pointerX = (e.clientX / window.innerWidth - 0.5) * 2;
        state.pointerY = (e.clientY / window.innerHeight - 0.5) * 2;
        if (!state.pointerRaf) {
          state.pointerRaf = requestAnimationFrame(applyPointerParallax);
        }
      }, { passive: true });
    }
  }

  function destroy() {
    if (state.destroyed) return;
    state.destroyed = true;
    state.active = false;
    state.rafRunning = false;
    if (state.pointerRaf) cancelAnimationFrame(state.pointerRaf);
    for (const [target, type, handler, opts] of listeners) {
      target.removeEventListener(type, handler, opts);
    }
    listeners.length = 0;
    clearRendered();
    els.scrollProxy.style.height = '0px';
    els.scene.style.transform = '';
    els.sceneWrapper.style.transform = '';
  }

  return {
    bind,
    refresh,
    jumpToIndex,
    setActive,
    destroy,
    focusedIndexFromScroll,
    scrollYForIndex,
    get total() { return state.total; },
    get scrollY() { return state.currentScroll; },
  };
}

export default createZTimeline;
