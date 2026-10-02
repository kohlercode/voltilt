import { createCoverflow } from '../../packages/coverflow/src/index.js';

const toastEl = document.getElementById('toast');
const statusEl = document.getElementById('status');
const loadingEl = document.getElementById('loading');
let toastTimer = 0;

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 1800);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

const people = await fetch('../data/people-2500.json').then((r) => {
  if (!r.ok) throw new Error('Failed to load people-2500.json');
  return r.json();
});

loadingEl.remove();

const flow = createCoverflow({
  root: document.getElementById('app'),
  titleOf: (p) => p.title,
  metaOf: (p) => p.role,
  // Prefer events (below). openItem still works for simple one-off handlers.
  buildCard(item, { onActivate, isSuppressed, clearSuppress }) {
    // Use a <div> (not <button>) so the card can hold a real link.
    const card = document.createElement('div');
    card.className = 'vt-card';
    card.setAttribute('role', 'group');
    card.setAttribute('aria-label', item.title);
    card.innerHTML = `
      <div class="vt-card-face">
        <span class="vt-card-initials">${escapeHtml(item.initials)}</span>
      </div>
      <div class="vt-card-body">
        <span class="vt-card-kicker">${escapeHtml(item.role)}</span>
        <h3>${escapeHtml(item.title)}</h3>
        <a class="vt-card-open-hint" href="#person-${escapeHtml(item.id)}">Open details</a>
      </div>
    `;
    card.querySelector('.vt-card-face').style.background =
      `radial-gradient(circle at 35% 30%, hsla(${item.hue}, 70%, 62%, 0.35), transparent 55%),` +
      `linear-gradient(160deg, hsl(${item.hue}, 28%, 22%), #12182a)`;

    // Card body click → focus or open. Links inside the card keep their own behavior.
    card.addEventListener('click', (e) => {
      if (e.target.closest('a[href], button, [data-vt-nodrag]')) return;
      if (isSuppressed()) {
        clearSuppress();
        return;
      }
      onActivate(item);
    });

    return card;
  },
});

flow.on('change', ({ index, item }) => {
  statusEl.textContent = item
    ? `${people.length.toLocaleString()} items · focus #${index + 1} · ${item.title}`
    : `${people.length.toLocaleString()} items loaded`;
});

flow.on('open', ({ item }) => {
  toast(`Opened ${item.title}`);
});

flow.bind();
flow.render(people);
flow.focusItemId(Math.floor(people.length / 2));
