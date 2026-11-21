import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../state.jsx';
import { categoryLabels } from '../i18n.js';
import { assetUrl } from '../api.js';
import { groupsForItem, defaultSpecs, unitPrice, cappedGroups } from '../lib/menu.js';

export default function ItemModal() {
  const { t, lang, config, findItem, modalSlug, closeModal, addToCart, categories } = useApp();
  const item = modalSlug ? findItem(modalSlug) : null;

  const [specs, setSpecs] = useState({});
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (item) {
      setSpecs(defaultSpecs(item, config));
      setQty(1);
    }
  }, [modalSlug]); // eslint-disable-line react-hooks/exhaustive-deps

  const unit = useMemo(
    () => (item ? unitPrice(item, specs, config) : 0),
    [item, specs, config]
  );

  if (!item) return null;

  const groups = config.optionGroups || {};
  const catLabel =
    categories.find((c) => c.key === item.category)?.labels?.[lang] ||
    categoryLabels[item.category]?.[lang] ||
    item.category;

  const setRadio = (g, v) => setSpecs((s) => ({ ...s, [g]: v }));
  const toggleMulti = (g, v, cap) =>
    setSpecs((s) => {
      const cur = s[g] || [];
      if (cur.includes(v)) return { ...s, [g]: cur.filter((x) => x !== v) };
      if (cap && cur.length >= cap) return s;
      return { ...s, [g]: [...cur, v] };
    });

  const onAdd = () => {
    if (item.category === 'boxes' && !(specs.flavors && specs.flavors.length)) {
      alert(t('pickFlavor'));
      return;
    }
    addToCart(item, specs, qty);
    closeModal();
  };

  const renderGroup = (g) => {
    const cfg = groups[g];
    if (!cfg) return null;
    if (cfg.type === 'text') {
      return (
        <div className="option-group" key={g}>
          <div className="option-title">{t(cfg.label)}</div>
          <input
            className="cart-input"
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
    return (
      <div className="option-group" key={g}>
        <div className="option-title">
          {t(cfg.label)}
          {cap ? <span className="opt-hint">{t('chooseUpTo').replace('{n}', cap)}</span> : null}
        </div>
        <div className="option-row">
          {cfg.values.map((v) => {
            const checked = multi ? (selected || []).includes(v) : selected === v;
            const disabled = multi && !checked && atCap;
            return (
              <label className="option-chip" key={v}>
                <input
                  type={multi ? 'checkbox' : 'radio'}
                  name={g}
                  checked={checked}
                  disabled={disabled}
                  onChange={() => (multi ? toggleMulti(g, v, cap) : setRadio(g, v))}
                />
                <span>{t(v)}</span>
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      className="item-modal open"
      role="dialog"
      aria-modal="true"
      aria-label={item[lang].name}
      onClick={(e) => e.target.classList.contains('item-modal') && closeModal()}
    >
      <div className="item-dialog">
        <div className="item-dialog-grid">
          <div
            className="item-dialog-image"
            role="img"
            aria-label={item[lang].name}
            style={{ backgroundImage: `url('${assetUrl(item.image)}')` }}
          />
          <div className="item-dialog-body">
            <div className="item-dialog-top">
              <div>
                <span className="cat-badge">{catLabel}</span>
                <h3>{item[lang].name}</h3>
              </div>
              <button className="modal-close" onClick={closeModal} aria-label={lang === 'ar' ? 'إغلاق' : 'Close'}>
                ×
              </button>
            </div>
            <p>{item[lang].desc}</p>
            <strong className="price">${unit.toFixed(2)}</strong>

            {groupsForItem(item.category).map(renderGroup)}

            <div className="option-group">
              <div className="option-title">{t('notesLabel')}</div>
              <textarea
                className="note-input"
                value={specs.notes || ''}
                placeholder={t('notesPlaceholder')}
                onChange={(e) => setSpecs((s) => ({ ...s, notes: e.target.value }))}
              />
            </div>

            <div className="modal-bottom">
              <div className="modal-qty">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label={lang === 'ar' ? 'إنقاص' : 'Decrease quantity'}>−</button>
                <span aria-live="polite">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} aria-label={lang === 'ar' ? 'زيادة' : 'Increase quantity'}>+</button>
              </div>
              <button className="btn modal-add" onClick={onAdd}>
                {t('addCart')} • ${(unit * qty).toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
