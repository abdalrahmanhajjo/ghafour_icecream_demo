import { useApp } from '../state.jsx';
import { assetUrl } from '../api.js';
import Icon from './Icon.jsx';

const MAPS_URL =
  'https://www.google.com/maps/place/%D8%A8%D9%88%D8%B8%D8%A9+%D8%BA%D9%81%D9%88%D8%B1+%D8%A7%D9%88%D8%B1%D9%8A%D8%AC%D9%8A%D9%86%D8%A7%D9%84+%D9%A1%D9%A9%D9%A1%D9%A9%E2%80%AD/@34.4447827,35.8696213,17z';
const INSTAGRAM = 'https://www.instagram.com/ghafour_original1919/';
const PHONE = '+96179167963';
const PHONE_DISPLAY = '+961 79 167 963';

export function Announcement() {
  const { t } = useApp();
  return <p className="gh-announce">{t('announcement')}</p>;
}

export function Facts() {
  const { t } = useApp();
  const facts = [
    ['sparkle', 'f1Title', 'f1Text'],
    ['leaf', 'f2Title', 'f2Text'],
    ['truck', 'f3Title', 'f3Text'],
    ['clock', 'f4Title', 'f4Text'],
  ];
  return (
    <section className="gh-facts" aria-label="Ghafour">
      <ul className="gh-wrap gh-facts-list">
        {facts.map(([icon, title, text]) => (
          <li key={title}>
            <span className="gh-fact-icon">
              <Icon name={icon} size={22} />
            </span>
            <span>
              <b>{t(title)}</b>
              <span>{t(text)}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Story() {
  const { t, lang } = useApp();
  return (
    <section className="gh-story" id="about" aria-labelledby="gh-story-title">
      <div className="gh-wrap gh-story-grid">
        <div className="gh-story-copy">
          <p className="gh-eyebrow">{t('aboutLabel')}</p>
          <h2 id="gh-story-title" className="gh-h2">
            {t('aboutTitle')}
          </h2>
          <p>{t('aboutP1')}</p>
          <p>{t('aboutP2')}</p>
          <img className="gh-story-seal" src={assetUrl('assets/ghafour-logo.jpg')} alt="" width="120" height="120" loading="lazy" />
        </div>
        <div className="gh-story-photos" id="gallery">
          <figure className="gh-photo gh-photo--tall">
            <img
              src={assetUrl('assets/items/real-arabic-mix.jpg')}
              alt={lang === 'ar' ? 'قمع بوظة عربية مشكل من غفور' : 'A Ghafour cone of Arabic mix ice cream'}
              width="678"
              height="900"
              loading="lazy"
              decoding="async"
            />
          </figure>
          <figure className="gh-photo">
            <img
              src={assetUrl('assets/gallery/real-sweet-scoops.jpg')}
              alt={lang === 'ar' ? 'أربع كرات بوظة من غفور' : 'Four scoops of Ghafour ice cream'}
              width="672"
              height="894"
              loading="lazy"
              decoding="async"
            />
          </figure>
        </div>
      </div>
    </section>
  );
}

export function Visit() {
  const { t, lang, config } = useApp();
  const wa = config.business?.whatsapp || '96179167963';
  return (
    <section className="gh-visit" id="location" aria-labelledby="gh-visit-title">
      <span id="contact" className="gh-anchor" aria-hidden="true" />
      <div className="gh-wrap gh-visit-grid">
        <div className="gh-visit-card">
          <p className="gh-eyebrow">{t('locationLabel')}</p>
          <h2 id="gh-visit-title" className="gh-h2">
            {t('visitTitle')}
          </h2>
          <p className="gh-visit-addr">
            <Icon name="pin" /> {t('locationText')}
          </p>
          <div className="gh-hours">
            <h3>{t('hoursTitle')}</h3>
            <p>
              <span>{t('everyDay')}</span>
              <b dir="ltr">10:30 AM – 12:30 AM</b>
            </p>
          </div>
          <div className="gh-visit-actions">
            <a className="gh-btn gh-btn--primary" href={MAPS_URL} target="_blank" rel="noopener noreferrer">
              <Icon name="pin" size={18} /> {t('directions')}
            </a>
            <a className="gh-btn gh-btn--ghost" href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">
              <Icon name="chat" size={18} /> {t('whatsappUs')}
            </a>
            <a className="gh-btn gh-btn--ghost" href={`tel:${PHONE}`}>
              <Icon name="phone" size={18} /> {t('callUs')} <bdi dir="ltr">{PHONE_DISPLAY}</bdi>
            </a>
          </div>
        </div>
        <div className="gh-map">
          <iframe
            title={lang === 'ar' ? 'خريطة موقع غفور اوريجينال 1919' : 'Map: Ghafour Original 1919'}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src="https://www.google.com/maps?q=34.4447827,35.8721962&z=16&output=embed"
          />
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  const { t } = useApp();
  return (
    <footer className="gh-footer">
      <div className="gh-wrap gh-footer-inner">
        <div className="gh-footer-brand">
          <img src={assetUrl('assets/ghafour-logo.jpg')} alt="" width="56" height="56" loading="lazy" />
          <div>
            <b>Ghafour Original 1919</b>
            <span>{t('brandTag')}</span>
          </div>
        </div>
        <nav className="gh-footer-links" aria-label="Footer">
          <a href="#menu">{t('navMenu')}</a>
          <a href="#events">{t('navEvents')}</a>
          <a href="#about">{t('navAbout')}</a>
          <a href="#location">{t('navLocation')}</a>
          <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
        </nav>
        <p className="gh-footer-copy">© {new Date().getFullYear()} Ghafour Original 1919</p>
      </div>
    </footer>
  );
}
