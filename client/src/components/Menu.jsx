import { useMemo, useState } from 'react';
import { useApp } from '../state.jsx';
import { categoryLabels } from '../i18n.js';
import { assetUrl } from '../api.js';

export default function Menu() {
  const { t, lang, items, categories, openModal, addToCart } = useApp();
  const [activeCat, setActiveCat] = useState('all');
  const [search, setSearch] = useState('');

  const catLabel = (key) => {
    if (key === 'all') return (categoryLabels.all && categoryLabels.all[lang]) || 'All';
    const c = categories.find((x) => x.key === key);
    return c ? c.labels[lang] : key;
  };

  const tabs = ['all', ...categories.map((c) => c.key)];

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = activeCat === 'all' ? items : items.filter((i) => i.category === activeCat);
    if (term) {
      list = list.filter((i) =>
        `${i.ar.name} ${i.ar.desc} ${i.en.name} ${i.en.desc} ${catLabel(i.category)}`
          .toLowerCase()
          .includes(term)
      );
    }
    return list;
  }, [items, activeCat, search, lang, categories]);

  return (
    <section className="menu-section" id="menu">
      <div className="container">
        <div className="menu-head">
          <div className="section-label">{t('menuLabel')}</div>
          <h2>{t('menuTitle')}</h2>
          <p>{t('menuDesc')}</p>
        </div>
        <div className="menu-controls">
          <label className="menu-search">
            <span className="menu-search-icon">⌕</span>
            <input
              type="search"
              autoComplete="off"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
            />
          </label>
          <div className="menu-count">
            {filtered.length} {filtered.length === 1 ? t('menuCount') : t('menuCountPlural')}
          </div>
        </div>
        <div className="tabs">
          {tabs.map((c) => (
            <button
              key={c}
              className={`tab ${c === activeCat ? 'active' : ''}`}
              onClick={() => setActiveCat(c)}
            >
              {catLabel(c)}
            </button>
          ))}
        </div>
        <div className="menu-list">
          {filtered.length === 0 ? (
            <div className="no-results">{t('noResults')}</div>
          ) : (
            filtered.map((i) => (
              <article className="menu-item" key={i.slug}>
                <div
                  className="menu-photo"
                  style={{ backgroundImage: `url('${assetUrl(i.image)}')` }}
                >
                  <span className="cat-badge">{catLabel(i.category)}</span>
                  <button className="image-btn" onClick={() => openModal(i.slug)}>
                    {t('seeImage')}
                  </button>
                </div>
                <div className="menu-content">
                  <div className="menu-item-body">
                    <h3>{i[lang].name}</h3>
                    <p>{i[lang].desc}</p>
                  </div>
                  <div>
                    <strong className="price">
                      {i.category === 'boxes' ? '' : t('from') + ' '}${i.price.toFixed(2)}
                    </strong>
                  </div>
                  <div className="menu-actions">
                    <button className="details-btn" onClick={() => openModal(i.slug)}>
                      {t('detailsBtn')}
                    </button>
                    <button className="add" onClick={() => addToCart(i)}>
                      +
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
