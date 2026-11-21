import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../state.jsx';
import { categoryLabels } from '../i18n.js';
import { assetUrl } from '../api.js';
import { groupsForItem, defaultSpecs, unitPrice, cappedGroups } from '../lib/menu.js';
import Icon from './Icon.jsx';

export default function ItemModal() {
  const { t, lang, config, findItem, modalSlug, closeModal, addToCart, categories } = useApp();
  const item = modalSlug ? findItem(modalSlug) : null;

  const [specs, setSpecs] = useState({});
  const [qty, setQty] = useState(1);
  const [error, setError] = useState('');
  const closeRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!item) return;
    setSpecs(defaultSpecs(item, config));
    setQty(1);
    setError('');
  }, [modalSlug]); // eslint-disable-line react-hooks/exhaustive-deps

  // focus management: focus the close button, trap Tab, Escape closes, restore focus on close
  useEffect(() => {
    if (!modalSlug) return;
    const opener = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') closeModal();
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const f = dialogRef.current.querySelectorAll('button:not([disabled]),input:not([disabled]),textarea,[href]');
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (opener && opener.focus && document.contains(opener)) opener.focus();
    };
  }, [modalSlug, closeModal]);

  const unit = useMemo(() => (item ? unitPrice(item, specs, config) : 0), [item, specs, config]);

  if (!item) return null;

  const groups = config.optionGroups || {};
  const catLabel =
    categories.find((c) => c.key === item.category)?.labels?.[lang] || categoryLabels[item.category]?.[lang] || item.category;

  const setRadio = (g, v) => setSpecs((s) => ({ ...s, [g]: v }));
  const toggleMulti = (g, v, cap) => {
    setError('');
    setSpecs((s) => {
      const cur = s[g] || [];
      if (cur.includes(v)) return { ...s, [g]: cur.filter((x) => x !== v) };
      if (cap && cur.length >= cap) return s;
      return { ...s, [g]: [...cur, v] };
    });
  };

  const onAdd = () => {
    if (item.category === 'boxes' && !(specs.flavors && specs.flavors.length)) {
      setError(t('pickFlavor'));
      dialogRef.current?.querySelector('[data-group="flavors"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    addToCart(item, specs, qty);
    closeModal();
  };

  const renderGroup = (g) => {
    const cfg = groups[g];
    if (!cfg) return null;
    const label = t(cfg.label);
    if (cfg.type === 'text') {
      return (
        <div className="gh-opt" key={g}>
          <label className="gh-opt-title" htmlFor={`opt-${g}`}>
            {label}
          </label>
          <input
            id={`opt-${g}`}
            className="gh-input"
            type="text"
            maxLength={40}
            value={specs[g] || ''}
            placeholder={t(cfg.placeholder)}
            onChange={(e) => setSpecs((s) => ({ ...s, [g]: e.target.value }))}
          />
        </div>
      );
    }
    const multi = cfg.type === 'multi';
    const cap = cappedGroups.includes(g) ? item.maxFlavors || 0 : 0;
    const selected = specs[g];
    const atCap = cap && (selected?.length || 0) >= cap;
    const prices = (config.optionPrices || {})[g] || {};
    return (
      <fieldset className="gh-opt" key={g} data-group={g}>
        <legend className="gh-opt-title">
          {label}
          {cap ? <span className="gh-opt-hint">{t('chooseUpTo').replace('{n}', cap)}</span> : null}
        </legend>
        <div className="gh-chips">
          {cfg.values.map((v) => {
            const checked = multi ? (selected || []).includes(v) : selected === v;
            const disabled = multi && !checked && atCap;
            const extra = prices[v];
            return (
              <label className="gh-chip" key={v}>
                <input
                  type={multi ? 'checkbox' : 'radio'}
                  name={`${item.slug}-${g}`}
                  checked={checked}
                  disabled={disabled}
                  onChange={() => (multi ? toggleMulti(g, v, cap) : setRadio(g, v))}
                />
                <span>
                  {t(v)}
                  {extra > 0 && <small dir="ltr">+${extra.toFixed(2)}</small>}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
    );
  };

  return (
    <div className="gh-modal" onClick={(e) => e.target === e.currentTarget && closeModal()}>
      <div className="gh-dialog" role="dialog" aria-modal="true" aria-labelledby="gh-item-title" ref={dialogRef}>
        <div className="gh-dialog-photo">
          <img src={assetUrl(item.image)} alt={item[lang].name} decoding="async" />
        </div>
        <div className="gh-dialog-body">
          <div className="gh-dialog-head">
            <div>
              <p className="gh-eyebrow">{catLabel}</p>
              <h2 id="gh-item-title" className="gh-dialog-title">
                {item[lang].name}
              </h2>
            </div>
            <button type="button" ref={closeRef} className="gh-icon-btn" onClick={closeModal} aria-label={t('close')}>
              <Icon name="close" />
            </button>
          </div>
          <p className="gh-dialog-desc">{item[lang].desc}</p>
          {item.leadDays > 0 && (
            <p className="gh-note">
              <Icon name="calendar" size={18} /> {t('cakeHint')}
            </p>
          )}

          {groupsForItem(item.category).map(renderGroup)}

          <div className="gh-opt">
            <label className="gh-opt-title" htmlFor="opt-notes">
              {t('notesLabel')}
            </label>
            <textarea
              id="opt-notes"
              className="gh-input gh-textarea"
              value={specs.notes || ''}
              placeholder={t('notesPlaceholder')}
              onChange={(e) => setSpecs((s) => ({ ...s, notes: e.target.value }))}
            />
          </div>

          {error && (
            <p className="gh-error" role="alert">
              <Icon name="alert" size={18} /> {error}
            </p>
          )}
        </div>
        <div className="gh-dialog-bar">
          <div className="gh-qty" role="group" aria-label={t('qtyLabel')}>
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label={lang === 'ar' ? 'إنقاص' : 'Decrease quantity'}>
              <Icon name="minus" size={18} />
            </button>
            <span aria-live="polite">{qty}</span>
            <button type="button" onClick={() => setQty((q) => Math.min(99, q + 1))} aria-label={lang === 'ar' ? 'زيادة' : 'Increase quantity'}>
              <Icon name="plus" size={18} />
            </button>
          </div>
          <button type="button" className="gh-btn gh-btn--primary gh-dialog-add" onClick={onAdd}>
            {t('addCart')} · <span dir="ltr">${(unit * qty).toFixed(2)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
