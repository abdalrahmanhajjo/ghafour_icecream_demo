import { useMemo, useState } from 'react';
import { useApp } from '../state.jsx';
import { categoryLabels } from '../i18n.js';
import { assetUrl } from '../api.js';
import Icon from './Icon.jsx';

const arNum = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
const NEEDS_CHOICES = ['boxes', 'cakes']; // flavors / size must be picked in the item sheet

export default function Menu() {
  const { t, lang, items, categories, openModal, addToCart, loaded, loadError, reload, config } = useApp();
  const [activeCat, setActiveCat] = useState('all');
  const [search, setSearch] = useState('');

  const catLabel = (key) => {
    if (key === 'all') return categoryLabels.all?.[lang] || 'All';
    const c = categories.find((x) => x.key === key);
    return c ? c.labels[lang] : key;
  };
  const num = (n) => (lang === 'ar' ? arNum(n) : String(n));

  const tabs = ['all', ...categories.map((c) => c.key)];
  const term = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    let list = activeCat === 'all' ? items : items.filter((i) => i.category === activeCat);
    if (term) {
      list = list.filter((i) =>
        `${i.ar.name} ${i.ar.desc} ${i.en.name} ${i.en.desc} ${catLabel(i.category)}`.toLowerCase().includes(term)
      );
    }
    return list;
  }, [items, activeCat, term, lang, categories]); // eslint-disable-line react-hooks/exhaustive-deps

  const meta = (i) => {
    const m = [];
    if (NEEDS_CHOICES.includes(i.category) && i.maxFlavors) m.push(t('upToFlavors').replace('{n}', num(i.maxFlavors)));
    if (i.leadDays) m.push(t('preorder48'));
    return m;
  };

  const renderCard = (i) => {
    const needsChoices = NEEDS_CHOICES.includes(i.category);
    const name = i[lang].name;
    return (
      <li className="gh-card" key={i.slug}>
        <button type="button" className="gh-card-photo" onClick={() => openModal(i.slug)} aria-label={`${t('detailsBtn')}: ${name}`}>
          <img src={assetUrl(i.image)} alt="" loading="lazy" decoding="async" width="400" height="500" />
        </button>
        <div className="gh-card-body">
          <h3 className="gh-card-name">{name}</h3>
          <p className="gh-card-desc">{i[lang].desc}</p>
          {meta(i).length > 0 && (
            <ul className="gh-card-meta">
              {meta(i).map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          )}
          <div className="gh-card-foot">
            <span className="gh-price">
              {i.category !== 'boxes' && <small>{t('from')}</small>} <bdi dir="ltr">${i.price.toFixed(2)}</bdi>
            </span>
            {needsChoices ? (
              <button type="button" className="gh-btn gh-btn--soft gh-btn--sm" onClick={() => openModal(i.slug)}>
                {t('customize')}
              </button>
            ) : (
              <span className="gh-card-actions">
                <button type="button" className="gh-link-btn" onClick={() => openModal(i.slug)}>
                  {t('customize')}
                </button>
                <button
                  type="button"
                  className="gh-add"
                  onClick={() => addToCart(i)}
                  aria-label={`${t('addCart')}: ${name}`}
                >
                  <Icon name="plus" size={20} strokeWidth={2.25} />
                </button>
              </span>
            )}
          </div>
        </div>
      </li>
    );
  };

  const grouped = activeCat === 'all' && !term;

  let body;
  if (!loaded) {
    body = (
      <ul className="gh-grid" aria-busy="true" aria-label={t('loadingMenu')}>
        {Array.from({ length: 6 }, (_, k) => (
          <li className="gh-card gh-card--skeleton" key={k} aria-hidden="true">
            <div className="gh-card-photo" />
            <div className="gh-card-body">
              <span className="gh-sk gh-sk--title" />
              <span className="gh-sk" />
              <span className="gh-sk gh-sk--short" />
            </div>
          </li>
        ))}
      </ul>
    );
  } else if (loadError) {
    body = (
      <div className="gh-state" role="alert">
        <Icon name="alert" size={28} />
        <p>{t('menuError')}</p>
        <div className="gh-state-actions">
          <button type="button" className="gh-btn gh-btn--primary" onClick={reload}>
            {t('retry')}
          </button>
          <a
            className="gh-btn gh-btn--ghost"
            href={`https://wa.me/${config.business?.whatsapp || '96179167963'}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="chat" size={18} /> {t('orderOnWhatsapp')}
          </a>
        </div>
      </div>
    );
  } else if (filtered.length === 0) {
    body = (
      <div className="gh-state">
        <Icon name="search" size={28} />
        <p>{t('noResults')}</p>
        {term && (
          <button type="button" className="gh-btn gh-btn--ghost" onClick={() => setSearch('')}>
            {t('clearSearch')}
          </button>
        )}
      </div>
    );
  } else if (grouped) {
    body = categories.map((c) => {
      const list = filtered.filter((i) => i.category === c.key);
      if (!list.length) return null;
      return (
        <section className="gh-group" key={c.key} aria-labelledby={`gh-cat-${c.key}`}>
          <h3 className="gh-group-title" id={`gh-cat-${c.key}`}>
            {c.labels[lang]} <span>{num(list.length)}</span>
          </h3>
          <ul className="gh-grid">{list.map(renderCard)}</ul>
        </section>
      );
    });
  } else {
    body = <ul className="gh-grid">{filtered.map(renderCard)}</ul>;
  }

  return (
    <section className="gh-menu" id="menu" aria-labelledby="gh-menu-title">
      <div className="gh-wrap">
        <div className="gh-section-head">
          <p className="gh-eyebrow">{t('menuLabel')}</p>
          <h2 id="gh-menu-title" className="gh-h2">
            {t('menuTitle')}
          </h2>
          <p>{t('menuDesc')}</p>
        </div>

        <div className="gh-menu-bar">
          <div className="gh-tabs" role="group" aria-label={t('menuLabel')}>
            {tabs.map((c) => (
              <button
                key={c}
                type="button"
                className={`gh-tab ${c === activeCat ? 'is-on' : ''}`}
                aria-pressed={c === activeCat}
                onClick={() => setActiveCat(c)}
              >
                {catLabel(c)}
              </button>
            ))}
          </div>
          <label className="gh-search">
            <Icon name="search" size={18} />
            <input
              type="search"
              autoComplete="off"
              aria-label={t('searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
            />
          </label>
        </div>
        <p className="gh-menu-count" aria-live="polite">
          {loaded && !loadError ? t('itemsCount').replace('{n}', num(filtered.length)) : ''}
        </p>

        {body}
      </div>
    </section>
  );
}
