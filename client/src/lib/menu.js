// Client mirror of the server pricing/validation (for live display). The server
// re-validates on order, so these never need to be "trusted" — just consistent.

export const cappedGroups = ['flavors', 'cakeFlavor'];

export function groupsForItem(category) {
  if (category === 'boxes') return ['flavors'];
  if (category === 'cakes') return ['cakeSize', 'cakeFlavor', 'cakeMsg'];
  return ['scoops', 'serving', 'toppings'];
}

export function defaultSpecs(item, config) {
  const g = config.optionGroups || {};
  const s = { notes: '' };
  for (const k of groupsForItem(item.category)) {
    const grp = g[k];
    if (!grp) continue;
    s[k] = grp.type === 'multi' ? [] : grp.type === 'text' ? '' : grp.def;
  }
  return s;
}

export function unitPrice(item, specs, config) {
  let p = Number(item.price) || 0;
  const pr = config.optionPrices || {};
  const g = config.optionGroups || {};
  for (const k of groupsForItem(item.category)) {
    const m = pr[k];
    if (!m) continue;
    if (g[k] && g[k].type === 'multi') (specs[k] || []).forEach((v) => (p += m[v] || 0));
    else p += m[specs[k]] || 0;
  }
  return Math.round(p * 100) / 100;
}

export function formatSpecs(item, specs, t, config) {
  const g = config.optionGroups || {};
  const parts = [];
  for (const k of groupsForItem(item.category)) {
    const grp = g[k];
    if (!grp) continue;
    const v = specs[k];
    if (grp.type === 'multi') {
      if (v && v.length) parts.push(`${t(grp.label)}: ${v.map(t).join(', ')}`);
    } else if (grp.type === 'text') {
      if (v) parts.push(`${t(grp.label)}: ${v}`);
    } else if (v) {
      parts.push(t(v));
    }
  }
  const fl = specs.flavors || specs.cakeFlavor;
  if ((item.category === 'boxes' || item.category === 'cakes') && !(fl && fl.length))
    parts.push(t('assorted'));
  if (specs.notes) parts.push(`${t('notes')}: ${specs.notes}`);
  return parts.join(' • ');
}

export function specKey(slug, s) {
  const o = { slug };
  Object.keys(s)
    .sort()
    .forEach((k) => {
      o[k] = Array.isArray(s[k]) ? [...s[k]].sort() : s[k];
    });
  return JSON.stringify(o);
}

export function todayStr(off = 0) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + off);
  const z = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

export function validateSchedule({ date, time, leadDays = 0 }) {
  const min = todayStr(leadDays);
  if (leadDays && !date) return 'cakeLead';
  if (date && date < min) return leadDays ? 'cakeLead' : 'pastDate';
  if (date && !time) return 'needTime';
  if (time) {
    const [h, m] = time.split(':').map(Number);
    const mins = h * 60 + m;
    if (!((mins >= 630 && mins <= 1439) || mins <= 30)) return 'outsideHours';
  }
  return null;
}
