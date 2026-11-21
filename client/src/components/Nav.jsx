import { useEffect, useRef } from 'react';
import { useApp } from '../state.jsx';
import { assetUrl } from '../api.js';
import Icon from './Icon.jsx';

const LINKS = [
  ['#menu', 'navMenu'],
  ['#events', 'navEvents'],
  ['#about', 'navAbout'],
  ['#location', 'navLocation'],
];

export default function Nav() {
  const { t, lang, toggleLang, cartCount, openCart, menuOpen, setMenuOpen } = useApp();
  const toggleRef = useRef(null);
  const panelRef = useRef(null);
  const close = () => setMenuOpen(false);

  // Mobile panel: focus the first link, close on Escape, return focus to the toggle.
  useEffect(() => {
    if (!menuOpen) return;
    panelRef.current?.querySelector('a,button')?.focus();
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    const toggle = toggleRef.current;
    return () => {
      window.removeEventListener('keydown', onKey);
      toggle?.focus();
    };
  }, [menuOpen, setMenuOpen]);

  return (
    <header className="gh-nav">
      <div className="gh-nav-inner">
        <a className="gh-brand" href="#home" aria-label="Ghafour Original 1919">
          <img src={assetUrl('assets/ghafour-logo.jpg')} alt="" width="52" height="52" />
          <span className="gh-brand-name">
            <b>Ghafour</b>
            <small>Original 1919</small>
          </span>
        </a>

        <nav aria-label={lang === 'ar' ? 'الأقسام' : 'Sections'} className="gh-nav-links">
          {LINKS.map(([href, key]) => (
            <a key={key} href={href}>
              {t(key)}
            </a>
          ))}
        </nav>

        <div className="gh-nav-actions">
          <button type="button" className="gh-lang" onClick={toggleLang} lang={lang === 'ar' ? 'en' : 'ar'}>
            {lang === 'ar' ? 'English' : 'العربية'}
          </button>
          <button
            type="button"
            className="gh-cart-btn"
            onClick={openCart}
            aria-label={`${t('cart')}: ${cartCount}`}
          >
            <Icon name="bag" size={22} />
            <span className="gh-cart-label">{t('cart')}</span>
            {cartCount > 0 && <span className="gh-cart-count">{cartCount}</span>}
          </button>
          <button
            ref={toggleRef}
            type="button"
            className="gh-menu-toggle"
            aria-label={lang === 'ar' ? 'فتح القائمة' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="gh-mobile-panel"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <Icon name="menu" size={22} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <>
          <div className="gh-scrim" onClick={close} />
          <div
            className="gh-sheet"
            id="gh-mobile-panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={lang === 'ar' ? 'القائمة' : 'Menu'}
          >
            <div className="gh-sheet-head">
              <img src={assetUrl('assets/ghafour-logo.jpg')} alt="" width="44" height="44" />
              <button type="button" className="gh-icon-btn" onClick={close} aria-label={t('close')}>
                <Icon name="close" />
              </button>
            </div>
            <nav className="gh-sheet-links" aria-label={lang === 'ar' ? 'الأقسام' : 'Sections'}>
              {LINKS.map(([href, key]) => (
                <a key={key} href={href} onClick={close}>
                  {t(key)}
                </a>
              ))}
            </nav>
            <div className="gh-sheet-foot">
              <a className="gh-btn gh-btn--primary" href="#menu" onClick={close}>
                {t('heroCta')}
              </a>
              <button type="button" className="gh-btn gh-btn--ghost" onClick={toggleLang}>
                <Icon name="globe" size={18} /> {lang === 'ar' ? 'English' : 'العربية'}
              </button>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
