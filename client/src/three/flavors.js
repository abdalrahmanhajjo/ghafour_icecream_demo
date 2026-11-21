// How each REAL scoop flavor from the Ghafour menu looks in the 3D cup.
// Keys are the menu item slugs (server/src/data/demo.json). Colors are sampled
// from the shop's own product photos. Boxes and cakes are not single scoops,
// so they are not part of the picker.

export const FLAVOR_LOOKS = {
  // Arabic mix: ashta, pistachio and strawberry in one cup (as in the hero photo)
  arabic_mix: {
    seed: 0.3,
    scoops: [
      { color: '#f3e8d0', sheen: '#fffaf0' },
      { color: '#e7849a', sheen: '#ffd9e2' },
      { color: '#cdbf7d', sheen: '#f4ecc4', bits: { color: '#7d8f3c', count: 34, top: true, size: 0.75, depth: 0.98 } },
    ],
  },
  ashta_pistachio: {
    seed: 1.1,
    scoops: [
      { color: '#c9bd78', sheen: '#efe7bd', bits: { color: '#6f8a2e', count: 60, top: true, size: 0.8, depth: 0.98 } },
    ],
  },
  // natural fruit cup: strawberry, lemon and the blue-mint scoop from the photo
  fruit_cup: {
    seed: 2.4,
    scoops: [
      { color: '#f08aa3', sheen: '#ffe0e8' },
      { color: '#f3e58a', sheen: '#fff8cf' },
      { color: '#86d7d4', sheen: '#e2fbfa' },
    ],
  },
  strawberry_scoop: {
    seed: 3.2,
    scoops: [{ color: '#f190a8', sheen: '#ffe3ea' }, { color: '#ec8aa2', sheen: '#ffe3ea' }],
  },
  lemon_mint: {
    seed: 4.1,
    scoops: [{ color: '#f4ea94', sheen: '#fffbd8' }, { color: '#f1e48a', sheen: '#fffbd8' }],
  },
  chocolate_scoop: {
    seed: 5.3,
    scoops: [
      { color: '#6a3a2a', sheen: '#a86f58', roughness: 0.5, clearcoat: 0.25 },
      { color: '#633526', sheen: '#a86f58', roughness: 0.5, clearcoat: 0.25 },
    ],
  },
  oreo_cream: {
    seed: 6.7,
    scoops: [
      { color: '#efe2cc', sheen: '#fffaf0', bits: { color: '#2a2220', count: 70, size: 0.85, flat: true, depth: 0.95 } },
      { color: '#ecdfc8', sheen: '#fffaf0', bits: { color: '#2a2220', count: 60, size: 0.85, flat: true, depth: 0.95 } },
    ],
  },
  berry_sorbet: {
    seed: 7.9,
    scoops: [
      { color: '#9c1d3e', sheen: '#e07a95', roughness: 0.45, clearcoat: 0.3 },
      { color: '#951a3a', sheen: '#e07a95', roughness: 0.45, clearcoat: 0.3 },
    ],
  },
};

export const SCOOP_CATEGORIES = ['arabic', 'fruits', 'sweet'];

/** Real scoop items that the 3D cup can show, in menu order. */
export function pickerFlavors(items) {
  return items.filter((i) => SCOOP_CATEGORIES.includes(i.category) && FLAVOR_LOOKS[i.slug]);
}
