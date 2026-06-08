import { readFileSync } from 'node:fs';
import { unitPrice, normalizeSpecs, validateSchedule, groupsForItem } from '../src/lib/pricing.js';

const demo = JSON.parse(readFileSync(new URL('../src/data/demo.json', import.meta.url), 'utf8'));
const config = { optionGroups: demo.optionGroups, optionPrices: demo.optionPrices };

// shape items like the Mongoose docs (category, price, maxFlavors, leadDays)
const items = Object.fromEntries(
  demo.items.map((it) => [
    it.id,
    { category: it.cat, price: it.price, maxFlavors: it.maxFlavors || 0, leadDays: it.leadDays || 0 },
  ])
);

let pass = 0, fail = 0;
const f = (n) => '$' + n.toFixed(2);
const chk = (label, got, exp) => {
  const ok = String(got) === String(exp);
  console.log((ok ? 'PASS' : 'FAIL') + ' | ' + label + ' => ' + got + (ok ? '' : '  (exp ' + exp + ')'));
  ok ? pass++ : fail++;
};

// pricing parity with the demo
chk('arabic 2 scoops/cone/nuts', f(unitPrice(items.arabic_mix, { scoops: 'twoScoops', serving: 'cone', toppings: ['nuts'] }, config)), '$5.25');
chk('cake classic 10 persons', f(unitPrice(items.classic_ice_cake, { cakeSize: 'cake10', cakeFlavor: [] }, config)), '$26.00');
chk('half box base (flavors free)', f(unitPrice(items.half_box, { flavors: ['fStrawberry', 'fChocolate'] }, config)), '$8.00');

// normalizeSpecs strips junk + enforces cap
const norm = normalizeSpecs({ category: 'cakes', maxFlavors: 2 }, { cakeSize: 'BOGUS', cakeFlavor: ['fOreo', 'fBerry', 'fMango'], cakeMsg: 'x'.repeat(99) }, config);
chk('cake size falls back to default', norm.cakeSize, 'cake6');
chk('cake flavors capped at 2', norm.cakeFlavor.length, 2);
chk('cake message truncated to 40', norm.cakeMsg.length, 40);

// schedule validation
chk('cake needs date (lead 2)', validateSchedule({ date: '', time: '', leadDays: 2 }), 'cakeLead');
chk('09:00 before open', validateSchedule({ date: '2999-01-01', time: '09:00', leadDays: 0 }), 'outsideHours');
chk('23:00 ok', validateSchedule({ date: '2999-01-01', time: '23:00', leadDays: 0 }), 'null');
chk('groupsForItem cakes', groupsForItem('cakes').join(','), 'cakeSize,cakeFlavor,cakeMsg');

// every model + route module loads cleanly under mongoose/express
for (const m of ['Category', 'Item', 'Config', 'Order', 'EventInquiry', 'User', 'Counter']) {
  await import(`../src/models/${m}.js`);
}
for (const r of ['auth', 'categories', 'items', 'config', 'orders', 'events']) {
  await import(`../src/routes/${r}.js`);
}
console.log('PASS | all models + routes import cleanly');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
