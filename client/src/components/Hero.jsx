import { useEffect, useState } from 'react';
import { useApp } from '../state.jsx';
import { isOpen } from '../lib/hours.js';
import FlavorStage from './FlavorStage.jsx';
import Icon from './Icon.jsx';

export default function Hero() {
  const { t } = useApp();
  // live open/closed status (Beirut time), re-checked every minute
  const [open, setOpen] = useState(() => isOpen());
  useEffect(() => {
    const id = setInterval(() => setOpen(isOpen()), 60_000);
    return () => clearInterval(id);
  }, []);
  return (
    <section className="gh-hero" aria-labelledby="gh-hero-title">
      <div className="gh-wrap gh-hero-grid">
        <div className="gh-hero-copy">
          <p className="gh-eyebrow">{t('heroEyebrow')}</p>
          <h1 id="gh-hero-title" className="gh-hero-title">
            <span>{t('heroTitleA')}</span>
            <span className="gh-accent">{t('heroTitleB')}</span>
          </h1>
          <p className="gh-hero-text">{t('heroText')}</p>
          <div className="gh-hero-actions">
            <a className="gh-btn gh-btn--primary gh-btn--lg" href="#menu">
              {t('heroCta')} <Icon name="arrow" size={18} className="gh-flip-rtl" />
            </a>
            <span className={`gh-hero-hours ${open ? 'is-open' : 'is-closed'}`}>
              <span className="gh-status-dot" aria-hidden="true" />
              {t(open ? 'heroHours' : 'heroClosed')}
            </span>
          </div>
        </div>
        <FlavorStage />
      </div>
    </section>
  );
}
