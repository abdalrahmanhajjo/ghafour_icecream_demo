import { useApp } from '../state.jsx';
import { assetUrl } from '../api.js';

const HOURS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const MAPS_URL =
  'https://www.google.com/maps/place/%D8%A8%D9%88%D8%B8%D8%A9+%D8%BA%D9%81%D9%88%D8%B1+%D8%A7%D9%88%D8%B1%D9%8A%D8%AC%D9%8A%D9%86%D8%A7%D9%84+%D9%A1%D9%A9%D9%A1%D9%A9%E2%80%AD/@34.4447827,35.8696213,17z';

export function About() {
  const { t, lang } = useApp();
  const ar = lang === 'ar';

  const stats = ar
    ? [
        ['1919', 'سنة التأسيس'],
        ['100%', 'فواكه طبيعية'],
        ['طرابلس', 'دليفري ومناسبات'],
      ]
    : [
        ['1919', 'Established'],
        ['100%', 'Natural fruits'],
        ['Tripoli', 'Delivery & events'],
      ];

  const points = ar
    ? [
        'بوظة عربية أصيلة بوصفة ما تغيّرت من 1919',
        'فواكه طبيعية طازجة، بدون نكهات صناعية',
        'كيك بوظة وكاترينغ لكل المناسبات',
        'دليفري سريع لكل طرابلس عبر واتساب',
      ]
    : [
        'Authentic Arabic ice cream — same recipe since 1919',
        'Fresh natural fruits, no artificial flavors',
        'Ice cream cakes & catering for every occasion',
        'Fast delivery across Tripoli via WhatsApp',
      ];

  const story = ar
    ? 'من جيل لجيل، حافظنا على الطعمة الأصلية اللي كبر عليها أهل طرابلس. كل كرة بوظة عنا معمولة بحب، بفواكه طبيعية ومكوّنات نظيفة — نفس الجودة من 1919 لليوم.'
    : 'From one generation to the next, we have kept the original taste Tripoli grew up on. Every scoop is made with care, real fruit and clean ingredients — the same quality from 1919 until today.';

  return (
    <section className="split-intro" id="about">
      <div className="container split-grid">
        <div>
          <div className="section-label">{t('aboutLabel')}</div>
          <h2 className="big-copy">{t('aboutTitle')}</h2>
          <div className="about-stats">
            {stats.map(([n, l]) => (
              <div className="about-stat" key={l}>
                <b>{n}</b>
                <span>{l}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="body-copy">
          <p>{t('aboutP1')}</p>
          <p>{story}</p>
          <ul className="about-points">
            {points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <a className="btn mint about-cta" href="#menu">
            {ar ? 'شوف المنيو' : 'See the menu'}
          </a>
        </div>
      </div>
    </section>
  );
}

export function Features() {
  const { t } = useApp();
  const cards = [
    ['f1Label', 'f1Title', 'f1Text', 'f1Strong'],
    ['f2Label', 'f2Title', 'f2Text', 'f2Strong'],
    ['f3Label', 'f3Title', 'f3Text', 'f3Strong'],
  ];
  return (
    <section className="features">
      <div className="container feature-grid">
        {cards.map(([l, ti, tx, st]) => (
          <article className="feature-card" key={ti}>
            <small>{t(l)}</small>
            <h3>{t(ti)}</h3>
            <p>{t(tx)}</p>
            <strong>{t(st)}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

export function Gallery() {
  const { t } = useApp();
  return (
    <section className="gallery" id="gallery">
      <div className="container">
        <div className="gallery-head">
          <div className="section-label">{t('galleryLabel')}</div>
          <h2>{t('galleryTitle')}</h2>
        </div>
        <div className="gallery-grid">
          <div className="gallery-card">
            <img src={assetUrl('assets/gallery/real-three-cups.jpg')} alt="Cups of Ghafour Arabic ice cream with natural fruit flavors" loading="lazy" decoding="async" />
          </div>
          <div className="gallery-card">
            <img src={assetUrl('assets/gallery/real-sweet-scoops.jpg')} alt="Scoops of sweet Ghafour ice cream" loading="lazy" decoding="async" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function Location() {
  const { t } = useApp();
  return (
    <section className="map-section" id="location">
      <div className="container map-grid">
        <div className="map-info">
          <div className="section-label">{t('locationLabel')}</div>
          <h2>{t('locationTitle')}</h2>
          <p>{t('locationText')}</p>
          <p className="coords">
            CVVC+WV8, Tripoli
            <br />
            34.4447827, 35.8721962
          </p>
          <div className="hours">
            {HOURS.map((d) => (
              <span key={d}>
                <b>{t(d)}</b>
                <em>10:30 AM–12:30 AM</em>
              </span>
            ))}
          </div>
          <a className="btn mint" href={MAPS_URL} target="_blank" rel="noopener">
            {t('openMaps')}
          </a>
        </div>
        <div className="map-frame">
          <iframe
            title="Ghafour Original 1919 map"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src="https://www.google.com/maps?q=34.4447827,35.8721962&z=17&output=embed"
          />
        </div>
      </div>
    </section>
  );
}

export function Contact() {
  const { t } = useApp();
  return (
    <section className="contact" id="contact">
      <div className="container">
        <div className="section-label">{t('contactLabel')}</div>
        <h2>{t('contactTitle')}</h2>
        <p>{t('contactText')}</p>
        <div className="contact-actions">
          <a className="btn mint" href="#menu">
            {t('startOrder')}
          </a>
          <a className="btn outline" href="tel:+96179167963" dir="ltr">
            <bdi>+961 79 167 963</bdi>
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
      </div>
    </section>
  );
}

export function Footer() {
  const { t } = useApp();
  return (
    <footer>
      <div className="container footer-inner">
        <p>GHAFOUR ORIGINAL 1919 © 2026</p>
        <div className="footer-links">
          <a href="#about">{t('navAbout')}</a>
          <a href="#menu">{t('navMenu')}</a>
          <a href="#location">{t('navLocation')}</a>
          <a href="#contact">{t('navOrder')}</a>
        </div>
      </div>
    </footer>
  );
}
