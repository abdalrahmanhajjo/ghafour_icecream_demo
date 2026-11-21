import { useApp } from '../state.jsx';
import { assetUrl } from '../api.js';

export default function Hero() {
  const { t, config } = useApp();
  const wa = config.business?.whatsapp || '96179167963';
  return (
    <section className="hero">
      <div className="container hero-grid">
        <div>
          <div className="hero-badge">{t('heroBadge')}</div>
          <h1>
            <span>{t('heroTitleA')}</span>
            <span>{t('heroTitleB')}</span>
          </h1>
          <p>{t('heroText')}</p>
          <div className="hero-actions">
            <a className="btn mint" href="#menu">
              {t('heroMenu')}
            </a>
            <a
              className="btn outline"
              href="https://www.instagram.com/ghafour_original1919/"
              target="_blank"
              rel="noopener"
            >
              Instagram
            </a>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <b>1919</b>
              <span>{t('statSince')}</span>
            </div>
            <div className="hero-stat">
              <b>10:30</b>
              <span>{t('statOpen')}</span>
            </div>
            <a className="hero-stat" href={`https://wa.me/${wa}`} target="_blank" rel="noopener">
              <b style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>79 167 963</b>
              <span>{t('statPhone')}</span>
            </a>
          </div>
        </div>
        <div className="hero-card">
          <img
            src={assetUrl('assets/hero-cone.png')}
            alt="Ghafour ice cream cone"
            decoding="async"
            fetchpriority="high"
            width="600"
            height="760"
          />
        </div>
      </div>
    </section>
  );
}
