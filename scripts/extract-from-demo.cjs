/*
 * Extracts the design + data from the original single-file demo (index.html)
 * so the MERN app stays pixel-identical and the DB is seeded from the same data.
 *
 *  -> client/src/styles.css      (full demo CSS, verbatim)
 *  -> client/src/i18n.js         (i18n strings + category labels)
 *  -> server/src/data/demo.json  (categories, items, optionGroups, optionPrices)
 *
 * Re-run any time the demo changes:  node scripts/extract-from-demo.cjs
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const style = html.match(/<style>([\s\S]*?)<\/style>/)[1];
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

// Everything before the runtime calls is pure declarations (no DOM access),
// so we can safely evaluate it in a sandbox and pull the data structures out.
const cut = script.indexOf("document.addEventListener('keydown'");
const decls = script.slice(0, cut);
const data = new Function(
  decls + ';return {i18n,categoryLabels,categoryKeys,items,optionGroups,optionPrices};'
)();

fs.mkdirSync(path.join(root, 'client', 'src'), { recursive: true });
fs.mkdirSync(path.join(root, 'server', 'src', 'data'), { recursive: true });

// 1) CSS — absolutize relative asset urls so they resolve from the site root
//    (the bundled CSS lives under /assets/, so relative paths would break).
const css = style.trim().replace(/url\((['"]?)assets\//g, 'url($1/assets/');
fs.writeFileSync(path.join(root, 'client', 'src', 'styles.css'), css + '\n');

// 2) i18n module
fs.writeFileSync(
  path.join(root, 'client', 'src', 'i18n.js'),
  '// AUTO-GENERATED from index.html by scripts/extract-from-demo.cjs — do not hand-edit.\n' +
    'export const i18n = ' + JSON.stringify(data.i18n, null, 2) + ';\n\n' +
    'export const categoryLabels = ' + JSON.stringify(data.categoryLabels, null, 2) + ';\n\n' +
    'export const categoryKeys = ' + JSON.stringify(data.categoryKeys) + ';\n\n' +
    'export default i18n;\n'
);

// 3) Seed data for MongoDB
const categories = data.categoryKeys
  .filter((k) => k !== 'all')
  .map((k, i) => ({ key: k, labels: data.categoryLabels[k], sort: i }));

fs.writeFileSync(
  path.join(root, 'server', 'src', 'data', 'demo.json'),
  JSON.stringify(
    { categories, items: data.items, optionGroups: data.optionGroups, optionPrices: data.optionPrices },
    null,
    2
  )
);

console.log('Extracted:', {
  items: data.items.length,
  categories: categories.length,
  languages: Object.keys(data.i18n),
  cssBytes: style.length,
});
