import { createZTimeline, createArraySource } from '../../packages/z-timeline/src/index.js';

const loadingEl = document.getElementById('loading');
const hud = document.getElementById('hud');

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

const events = await fetch('../data/events-5000.json').then((r) => {
  if (!r.ok) throw new Error('Failed to load events-5000.json');
  return r.json();
});

loadingEl.remove();

const source = createArraySource(events);

const timeline = createZTimeline({
  root: document.getElementById('root'),
  getTotal: source.getTotal,
  fetchPage: source.fetchPage,
  parallax: true,
  onFocusChange(index, item) {
    if (!item) {
      hud.textContent = `${events.length.toLocaleString()} loaded · focusing…`;
      return;
    }
    hud.textContent =
      `${(index + 1).toLocaleString()} / ${events.length.toLocaleString()} · ${item.event_date} · ${item.event_type}`;
  },
  renderItem(item) {
    const el = document.createElement('article');
    el.className = 'vt-z-card';
    el.innerHTML = `
      <div class="vt-z-card-content">
        <div class="vt-z-card-head">
          <span class="vt-z-card-type">${escapeHtml(item.event_type)}</span>
          <span class="vt-z-card-date">${escapeHtml(item.event_date)}</span>
        </div>
        <h2>${escapeHtml(item.title)}</h2>
        <p class="vt-z-card-desc">${escapeHtml(item.description)}</p>
      </div>
    `;
    return el;
  },
});

timeline.bind();
await timeline.refresh();

document.getElementById('jump').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-jump]');
  if (!btn) return;
  timeline.jumpToIndex(Number(btn.dataset.jump));
});
