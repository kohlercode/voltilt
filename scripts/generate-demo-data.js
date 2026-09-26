'use strict';

/**
 * Regenerate examples/data/*.json demo fixtures.
 *   node scripts/generate-demo-data.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'examples', 'data');
fs.mkdirSync(root, { recursive: true });

const first = ['Ada', 'Grace', 'Katherine', 'Alan', 'Hedy', 'Tim', 'Margaret', 'Donald', 'Barbara', 'Linus', 'Guido', 'Bjarne', 'Ken', 'Dennis', 'Radia', 'Sophie', 'Edsger', 'John', 'Leslie', 'Frances'];
const last = ['Lovelace', 'Hopper', 'Johnson', 'Turing', 'Lamarr', 'Berners-Lee', 'Hamilton', 'Knuth', 'Liskov', 'Torvalds', 'van Rossum', 'Stroustrup', 'Thompson', 'Ritchie', 'Perlman', 'Wilson', 'Dijkstra', 'von Neumann', 'Lamport', 'Allen'];
const roles = ['Engineer', 'Scientist', 'Inventor', 'Mathematician', 'Designer', 'Researcher', 'Architect', 'Pioneer'];
const types = ['milestone', 'travel', 'work', 'family', 'health', 'idea', 'note'];

const pick = (a, i) => a[i % a.length];

const people = [];
for (let i = 1; i <= 2500; i++) {
  const f = pick(first, i);
  const l = pick(last, i * 3);
  people.push({
    id: i,
    title: `${f} ${l} #${i}`,
    role: pick(roles, i),
    initials: f[0] + l[0],
    hue: (i * 37) % 360,
  });
}

const events = [];
const start = Date.UTC(1970, 0, 1);
for (let i = 1; i <= 5000; i++) {
  const d = new Date(start + i * 86400000 * 3.2);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  events.push({
    id: i,
    title: `Event ${i}: ${pick(first, i)} ${pick(last, i)}`,
    event_type: pick(types, i),
    event_date: `${y}-${m}-${day}`,
    description: `Synthetic demo entry #${i}. Scroll the Z-timeline — only nearby cards stay in the DOM.`,
  });
}

fs.writeFileSync(path.join(root, 'people-2500.json'), JSON.stringify(people));
fs.writeFileSync(path.join(root, 'events-5000.json'), JSON.stringify(events));
console.log(`Wrote ${people.length} people + ${events.length} events → examples/data/`);
