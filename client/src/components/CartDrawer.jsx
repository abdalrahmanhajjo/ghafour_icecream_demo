import { useEffect, useRef, useState } from 'react';
import { useApp } from '../state.jsx';
import { api, assetUrl } from '../api.js';
import { unitPrice, formatSpecs, validateSchedule, todayStr } from '../lib/menu.js';
import Icon from './Icon.jsx';

export default function CartDrawer() {
  const { t, lang, config, cart, changeQty, clearCart, cartTotal, cartLeadDays, findItem, cartOpen, closeCart } = useApp();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [fulfillment, setFulfillment] = useState('delivery');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);
  const closeRef = useRef(null);
  const panelRef = useRef(null);

  const minDate = todayStr(cartLeadDays);

  useEffect(() => {
    if (!cartOpen) return;
    const opener = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') closeCart();
      if (e.key !== 'Tab' || !panelRef.current) return;
      const f = panelRef.current.querySelectorAll('button:not([disabled]),input,textarea,[href]');
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
      if (opener?.focus && document.contains(opener)) opener.focus();
    };
  }, [cartOpen, closeCart]);

  useEffect(() => {
    if (cartOpen && cart.length) setSent(false);
  }, [cartOpen, cart.length]);

  const buildWhatsApp = (orderNumber, total) => {
    const lines = cart.map((row) => {
      const item = findItem(row.slug);
      const price = unitPrice(item, row.specs, config);
      return `${row.qty} x ${item[lang].name} - $${(price * row.qty).toFixed(2)}\n${t('specs')}: ${formatSpecs(item, row.specs, t, config)}`;
    });
    const sched =
      !date && !time ? `${t(fulfillment)} — ${t('asap')}` : `${t(fulfillment)} — ${[date, time].filter(Boolean).join(' ')}`;
    const info = [`${t('orderName')}: ${name}`, `${t('orderPhone')}: ${phone}`];
    if (fulfillment === 'delivery') info.push(`${t('orderAddress')}: ${address}`);
    info.push(`${t('scheduleLabel')}: ${sched}`);
    const head = orderNumber ? `${t('waIntro')} (#${orderNumber})` : t('waIntro');
    return encodeURIComponent(`${head}\n\n${info.join('\n')}\n\n${lines.join('\n\n')}\n\n${t('total')}: $${total.toFixed(2)}`);
  };

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = t('required');
    if (!phone.trim()) e.phone = t('required');
    if (fulfillment === 'delivery' && !address.trim()) e.address = t('required');
    const schedErr = validateSchedule({ date, time, leadDays: cartLeadDays });
    if (schedErr) e.schedule = t(schedErr);
    return e;
  };

  const submit = async () => {
    if (!cart.length) return;
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      const firstKey = ['name', 'phone', 'address', 'schedule'].find((k) => e[k]);
      panelRef.current?.querySelector(`[data-field="${firstKey}"]`)?.focus();
      return;
    }
    // Open the WhatsApp tab synchronously (inside the click) so pop-up blockers allow it.
    const waWindow = window.open('', '_blank');
    setSubmitting(true);
    try {
      const res = await api.createOrder({
        customer: { name, phone, address },
        fulfillment,
        lang,
        schedule: { date, time },
        lines: cart.map((r) => ({ slug: r.slug, qty: r.qty, specs: r.specs })),
      });
      const wa = config.business?.whatsapp || res.whatsapp || '96179167963';
      const url = `https://wa.me/${wa}?text=${buildWhatsApp(res.orderNumber, res.total)}`;
      if (waWindow) waWindow.location.href = url;
      else window.location.href = url;
      clearCart();
      setSent(true);
    } catch (err) {
      waWindow?.close();
      setErrors({ form: t(err.key) !== err.key ? t(err.key) : err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const field = (key) => (errors[key] ? { 'aria-invalid': true, 'aria-describedby': `cart-err-${key}` } : {});
  const errText = (key) =>
    errors[key] ? (
      <span className="gh-field-error" id={`cart-err-${key}`}>
        {errors[key]}
      </span>
    ) : null;

  if (!cartOpen) return null;

  return (
    <>
      <div className="gh-scrim gh-scrim--cart" onClick={closeCart} />
      <aside className="gh-drawer" role="dialog" aria-modal="true" aria-labelledby="gh-cart-title" ref={panelRef}>
        <div className="gh-drawer-head">
          <h2 id="gh-cart-title">{t('cartTitle')}</h2>
          <button type="button" ref={closeRef} className="gh-icon-btn" onClick={closeCart} aria-label={t('close')}>
            <Icon name="close" />
          </button>
        </div>

        <div className="gh-drawer-scroll">
          {sent ? (
            <div className="gh-state gh-state--ok" role="status">
              <Icon name="check" size={30} />
              <p>{t('sent')}</p>
            </div>
          ) : cart.length === 0 ? (
            <div className="gh-state">
              <Icon name="bag" size={30} />
              <p>{t('emptyCart')}</p>
              <a className="gh-btn gh-btn--primary" href="#menu" onClick={closeCart}>
                {t('heroCta')}
              </a>
            </div>
          ) : (
            <>
              <ul className="gh-lines">
                {cart.map((row) => {
                  const item = findItem(row.slug);
                  if (!item) return null;
                  const price = unitPrice(item, row.specs, config);
                  return (
                    <li className="gh-line" key={row.key}>
                      <img src={assetUrl(item.image)} alt="" width="56" height="56" loading="lazy" />
                      <div className="gh-line-info">
                        <b>{item[lang].name}</b>
                        <small>{formatSpecs(item, row.specs, t, config)}</small>
                        <span className="gh-line-price" dir="ltr">${(price * row.qty).toFixed(2)}</span>
                      </div>
                      <div className="gh-qty gh-qty--sm" role="group" aria-label={`${t('qtyLabel')}: ${item[lang].name}`}>
                        <button type="button" onClick={() => changeQty(row.key, -1)} aria-label={lang === 'ar' ? 'إنقاص' : 'Decrease quantity'}>
                          <Icon name="minus" size={16} />
                        </button>
                        <span aria-live="polite">{row.qty}</span>
                        <button
                          type="button"
                          onClick={() => changeQty(row.key, 1)}
                          disabled={row.qty >= 99}
                          aria-label={lang === 'ar' ? 'زيادة' : 'Increase quantity'}
                        >
                          <Icon name="plus" size={16} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="gh-form">
                <fieldset className="gh-opt">
                  <legend className="gh-opt-title">{t('scheduleLabel')}</legend>
                  <div className="gh-seg">
                    {['delivery', 'pickup'].map((f) => (
                      <label key={f}>
                        <input type="radio" name="fulfill" checked={fulfillment === f} onChange={() => setFulfillment(f)} />
                        <span>{t(f)}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <label className="gh-field">
                  <span>{t('namePlaceholder')}</span>
                  <input className="gh-input" data-field="name" type="text" autoComplete="name" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} {...field('name')} />
                  {errText('name')}
                </label>
                <label className="gh-field">
                  <span>{t('phonePlaceholder')}</span>
                  <input className="gh-input" data-field="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={30} dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} {...field('phone')} />
                  {errText('phone')}
                </label>
                {fulfillment === 'delivery' && (
                  <label className="gh-field">
                    <span>{t('addressPlaceholder')}</span>
                    <textarea className="gh-input gh-textarea" data-field="address" autoComplete="street-address" maxLength={300} value={address} onChange={(e) => setAddress(e.target.value)} {...field('address')} />
                    {errText('address')}
                  </label>
                )}
                <div className="gh-field">
                  <span>{lang === 'ar' ? 'الموعد (اختياري)' : 'Date & time (optional)'}</span>
                  <div className="gh-two">
                    <input className="gh-input" data-field="schedule" type="date" min={minDate} value={date} onChange={(e) => setDate(e.target.value)} aria-label={lang === 'ar' ? 'التاريخ' : 'Date'} {...field('schedule')} />
                    <input className="gh-input" type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label={lang === 'ar' ? 'الوقت' : 'Time'} />
                  </div>
                  <small className="gh-hint">{cartLeadDays ? t('cakeHint') : t('scheduleHint')}</small>
                  {errText('schedule')}
                </div>
              </div>
            </>
          )}
        </div>

        {!sent && cart.length > 0 && (
          <div className="gh-drawer-foot">
            {errors.form && (
              <p className="gh-error" role="alert">
                <Icon name="alert" size={18} /> {errors.form}
              </p>
            )}
            <div className="gh-total">
              <span>{t('total')}</span>
              <b dir="ltr">${cartTotal.toFixed(2)}</b>
            </div>
            <button type="button" className="gh-btn gh-btn--primary gh-btn--block" onClick={submit} disabled={submitting} aria-busy={submitting}>
              <Icon name="chat" size={18} /> {submitting ? t('sending') : t('sendWhatsapp')}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
