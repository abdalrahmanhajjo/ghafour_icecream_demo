// Server-side mirror of the demo's pricing/validation logic. The client computes
// the same numbers for display, but the server is the source of truth: it
// re-normalizes specs and recomputes every total before saving an order.

export function groupsForItem(category) {
  if (category === 'boxes') return ['flavors'];
  if (category === 'cakes') return ['cakeSize', 'cakeFlavor', 'cakeMsg'];
  return ['scoops', 'serving', 'toppings'];
}

const CAPPED_GROUPS = ['flavors', 'cakeFlavor'];

// Coerce arbitrary client specs into a clean, allowed-values-only object.
export function normalizeSpecs(item, rawSpecs = {}, config) {
  const groups = config.optionGroups || {};
  const clean = {
    notes: typeof rawSpecs.notes === 'string' ? rawSpecs.notes.trim().slice(0, 300) : '',
  };
  for (const g of groupsForItem(item.category)) {
    const grp = groups[g];
    if (!grp) continue;
    const allowed = grp.values || [];
    const raw = rawSpecs[g];
    if (grp.type === 'multi') {
      let arr = Array.isArray(raw) ? raw.filter((v) => allowed.includes(v)) : [];
      const cap = CAPPED_GROUPS.includes(g) ? item.maxFlavors || 0 : 0;
      if (cap) arr = arr.slice(0, cap);
      clean[g] = arr;
    } else if (grp.type === 'text') {
      clean[g] = typeof raw === 'string' ? raw.trim().slice(0, 40) : '';
    } else {
      clean[g] = allowed.includes(raw) ? raw : grp.def;
    }
  }
  return clean;
}

export function unitPrice(item, specs, config) {
  let p = Number(item.price) || 0;
  const prices = config.optionPrices || {};
  const groups = config.optionGroups || {};
  for (const g of groupsForItem(item.category)) {
    const pr = prices[g];
    if (!pr) continue;
    if (groups[g] && groups[g].type === 'multi') {
      (specs[g] || []).forEach((v) => {
        p += pr[v] || 0;
      });
    } else {
      p += pr[specs[g]] || 0;
    }
  }
  return Math.round(p * 100) / 100;
}

function toDateStr(d) {
  const z = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate());
}

// Opening hours: 10:30 (630) .. 00:30 next day (<=30). Mirrors the demo.
// Returns null if valid, otherwise an i18n error key.
export function validateSchedule({ date, time, leadDays = 0 }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const min = new Date(today);
  min.setDate(min.getDate() + leadDays);
  const minStr = toDateStr(min);

  if (leadDays && !date) return 'cakeLead';
  if (date && date < minStr) return leadDays ? 'cakeLead' : 'pastDate';
  if (date && !time) return 'needTime';
  if (time) {
    const [h, m] = time.split(':').map(Number);
    const mins = h * 60 + m;
    const open = (mins >= 630 && mins <= 1439) || mins <= 30;
    if (!open) return 'outsideHours';
  }
  return null;
}
