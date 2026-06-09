import { useApp } from '../state.jsx';
import { assetUrl } from '../api.js';

const LINKS = [
  ['#about', 'navAbout'],
  ['#menu', 'navMenu'],
  ['#events', 'navEvents'],
  ['#gallery', 'navGallery'],
  ['#location', 'navLocation'],
];

export default function Nav() {
  const { t, lang, toggleLang, cartCount, openCart, menuOpen, setMenuOpen } = useApp();
  const close = () => setMenuOpen(false);

  return (
    <nav className="nav">
      <div className="nav-inner">
        <a className="brand" href="#home" aria-label="Ghafour home">
          <div className="brand-mark">
            <img src={assetUrl('assets/ghafour-logo.jpg')} alt="Ghafour Original 1919 logo" />
          </div>
          <span className="brand-copy">
            <b>Ghafour Original 1919</b>
            <span>{t('brandTag')}</span>
          </span>
        </a>
        <ul className="desktop-nav">
          {LINKS.map(([href, key]) => (
            <li key={key}>
              <a href={href}>{t(key)}</a>
            </li>
          ))}
        </ul>
        <div className="nav-actions">
          <button className="lang-toggle" onClick={toggleLang}>
            {lang === 'ar' ? 'EN' : 'AR'}
          </button>
          <a className="nav-cta" href="#contact">
            {t('navOrder')}
          </a>
          <button className="cart-pill" onClick={openCart} aria-label={`${t('cart')}: ${cartCount}`}>
            <span className="cart-word">{t('cart')}</span> <span>{cartCount}</span>
          </button>
          <button
            className="menu-toggle"
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="hamb">
              <span />
            </span>
          </button>
        </div>
      </div>
      <div className="nav-scrim" onClick={close} />
      <div className="mobile-panel">
        <div className="mobile-panel-head">
          <span className="mobile-panel-title">{t('navMenu')}</span>
          <button className="mobile-close" onClick={close}>
            ×
          </button>
        </div>
        <nav className="mobile-links">
          {LINKS.filter(([, key]) => key !== 'navAbout').map(([href, key]) => (
            <a key={key} href={href} onClick={close}>
              {t(key)}
            </a>
          ))}
        </nav>
        <div className="mobile-panel-foot">
          <a className="btn mint" href="#contact" onClick={close}>
            {t('navOrder')}
          </a>
          <button className="btn outline mobile-lang" onClick={toggleLang}>
            {lang === 'ar' ? 'English' : 'العربية'}
          </button>
        </div>
      </div>
    </nav>
  );
}
