import { useApp } from '../state.jsx';
import { assetUrl } from '../api.js';

export default function Featured() {
  const { t, lang, items, addToCart } = useApp();
  const featured = items.filter((i) => i.featured).slice(0, 3);
  if (featured.length === 0) return null;

  return (
    <section className="shop" id="featured">
      <div className="container">
        <div className="shop-head">
          <div>
            <div className="section-label" style={{ color: '#f8bfd0' }}>
              {t('featuredLabel')}
            </div>
            <h2>{t('featuredTitle')}</h2>
          </div>
          <a className="btn light" href="#menu">
            {t('featuredBtn')}
          </a>
        </div>
        <div className="shop-grid">
          {featured.map((i) => (
            <article className="product" key={i.slug}>
              <div className="product-img" style={{ backgroundImage: `url('${assetUrl(i.image)}')` }} />
              <div className="product-body">
                <h3>{i[lang].name}</h3>
                <p>{i[lang].desc}</p>
                <button className="btn" onClick={() => addToCart(i)}>
                  {t('addCart')}
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
