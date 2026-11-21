import { useMemo, useState } from 'react';
import { useApp } from '../state.jsx';
import { categoryLabels } from '../i18n.js';
import { assetUrl } from '../api.js';

const arNum = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);

export default function Menu() {
  const { t, lang, items, categories, openModal, addToCart, loadError, reload } = useApp();
  const [activeCat, setActiveCat] = useState('all');
  const [search, setSearch] = useState('');

  const catLabel = (key) => {
    if (key === 'all') return (categoryLabels.all && categoryLabels.all[lang]) || 'All';
    const c = categories.find((x) => x.key === key);
    return c ? c.labels[lang] : key;
  };

  const tabs = ['all', ...categories.map((c) => c.key)];
  const term = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    let list = activeCat === 'all' ? items : items.filter((i) => i.category === activeCat);
    if (term) {
      list = list.filter((i) =>
        `${i.ar.name} ${i.ar.desc} ${i.en.name} ${i.en.desc} ${catLabel(i.category)}`
          .toLowerCase()
          .includes(term)
      );
    }
    return list;
  }, [items, activeCat, term, lang, categories]);

  // Detail badges derived from the item data.
  const itemMeta = (i) => {
    const m = [];
    if (i.category === 'boxes' || i.category === 'cakes') {
      if (i.maxFlavors)
        m.push(lang === 'ar' ? `حتى ${arNum(i.maxFlavors)} نكهات` : `Up to ${i.maxFlavors} flavors`);
    } else {
      m.push(lang === 'ar' ? 'قابل للتخصيص' : 'Customizable');
    }
    if (i.leadDays) {
      const h = i.leadDays * 24;
      m.push(lang === 'ar' ? `حجز مسبق ${arNum(h)} ساعة` : `${h}h pre-order`);
    }
    return m;
  };

  const renderCard = (i) => {
    const meta = itemMeta(i);
    return (
      <article className="menu-item" key={i.slug}>
        <div className="menu-photo" style={{ backgroundImage: `url('${assetUrl(i.image)}')` }}>
          <span className="cat-badge">{catLabel(i.category)}</span>
          {i.featured && (
            <span className="menu-fav">★ {lang === 'ar' ? 'الأكثر طلباً' : 'Popular'}</span>
          )}
          <button className="image-btn" onClick={() => openModal(i.slug)}>
            {t('seeImage')}
          </button>
        </div>
        <div className="menu-content">
          <div className="menu-item-body">
            <h3>{i[lang].name}</h3>
            <p>{i[lang].desc}</p>
            {meta.length > 0 && (
              <div className="menu-meta">
                {meta.map((m) => (
                  <span className="menu-tag" key={m}>
                    {m}
                  </span>
                ))}
              </div>
            )}
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
            <button
              className="add"
              onClick={() => addToCart(i)}
              aria-label={`${t('addCart')}: ${i[lang].name}`}
            >
              +
            </button>
          </div>
        </div>
      </article>
    );
  };

  const grouped = activeCat === 'all' && !term;

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
            <span className="menu-search-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <line x1="20" y1="20" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="search"
              autoComplete="off"
              aria-label={t('searchPlaceholder')}
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

        {loadError ? (
          <div className="menu-list">
            <div className="no-results">
              {lang === 'ar' ? 'تعذّر تحميل المنيو حالياً.' : 'Could not load the menu right now.'}
              <br />
              <button className="btn mint" style={{ marginTop: 14 }} onClick={reload}>
                {lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}
              </button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="menu-list">
            <div className="no-results">{t('noResults')}</div>
          </div>
        ) : grouped ? (
          <div className="menu-groups">
            {categories.map((c) => {
              const list = filtered.filter((i) => i.category === c.key);
              if (!list.length) return null;
              return (
                <section className="menu-group" key={c.key}>
                  <div className="menu-group-head">
                    <h3>{c.labels[lang]}</h3>
                    <span className="cnt">{list.length}</span>
                  </div>
                  <div className="menu-list">{list.map(renderCard)}</div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="menu-list">{filtered.map(renderCard)}</div>
        )}
      </div>
    </section>
  );
}
