import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { i18n } from './i18n.js';
import { api } from './api.js';
import { unitPrice, specKey, defaultSpecs, groupsForItem } from './lib/menu.js';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'ar');
  const [config, setConfig] = useState({ optionGroups: {}, optionPrices: {}, business: {} });
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // UI state (shared so Nav / Menu / Cart don't prop-drill)
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalSlug, setModalSlug] = useState(null);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('lang', lang);
  }, [lang]);

  useEffect(() => {
    (async () => {
      try {
        const [cfg, cats, its] = await Promise.all([api.config(), api.categories(), api.items()]);
        setConfig(cfg);
        setCategories(cats);
        setItems(its);
      } catch (e) {
        console.error('Initial load failed:', e);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    const lock = cartOpen || menuOpen || modalSlug;
    document.body.classList.toggle('no-scroll', !!lock);
    document.body.classList.toggle('mobile-open', menuOpen);
  }, [cartOpen, menuOpen, modalSlug]);

  const t = useCallback((k) => (i18n[lang] && i18n[lang][k]) || k, [lang]);
  const findItem = useCallback((slug) => items.find((i) => i.slug === slug), [items]);

  const addToCart = useCallback(
    (item, specs, qty = 1) => {
      const clean = { ...defaultSpecs(item, config), notes: specs?.notes || '' };
      for (const g of groupsForItem(item.category)) if (specs && specs[g] != null) clean[g] = specs[g];
      const key = specKey(item.slug, clean);
      setCart((prev) => {
        const found = prev.find((r) => r.key === key);
        if (found) return prev.map((r) => (r.key === key ? { ...r, qty: r.qty + qty } : r));
        return [...prev, { key, slug: item.slug, qty, specs: clean }];
      });
      setCartOpen(true);
    },
    [config]
  );

  const changeQty = useCallback(
    (key, d) =>
      setCart((prev) => prev.map((r) => (r.key === key ? { ...r, qty: r.qty + d } : r)).filter((r) => r.qty > 0)),
    []
  );
  const clearCart = useCallback(() => setCart([]), []);

  const cartCount = cart.reduce((s, r) => s + r.qty, 0);
  const cartTotal = cart.reduce((s, r) => {
    const it = findItem(r.slug);
    return s + (it ? unitPrice(it, r.specs, config) * r.qty : 0);
  }, 0);
  const cartLeadDays = cart.reduce((m, r) => {
    const it = findItem(r.slug);
    return Math.max(m, (it && it.leadDays) || 0);
  }, 0);

  const value = {
    lang,
    setLang,
    toggleLang: () => setLang((l) => (l === 'ar' ? 'en' : 'ar')),
    t,
    config,
    items,
    categories,
    cart,
    addToCart,
    changeQty,
    clearCart,
    cartCount,
    cartTotal,
    cartLeadDays,
    findItem,
    loaded,
    // ui
    cartOpen,
    openCart: () => {
      setMenuOpen(false);
      setCartOpen(true);
    },
    closeCart: () => setCartOpen(false),
    menuOpen,
    setMenuOpen,
    modalSlug,
    openModal: (slug) => setModalSlug(slug),
    closeModal: () => setModalSlug(null),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
