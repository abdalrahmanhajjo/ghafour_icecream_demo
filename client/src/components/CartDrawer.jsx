import { useState } from 'react';
import { useApp } from '../state.jsx';
import { api } from '../api.js';
import { unitPrice, formatSpecs, validateSchedule, todayStr } from '../lib/menu.js';

export default function CartDrawer() {
  const {
    t,
    lang,
    config,
    cart,
    changeQty,
    clearCart,
    cartTotal,
    cartLeadDays,
    findItem,
    cartOpen,
    closeCart,
  } = useApp();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [fulfillment, setFulfillment] = useState('delivery');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const minDate = todayStr(cartLeadDays);

  const buildWhatsApp = (orderNumber, total) => {
    const lines = cart.map((row) => {
      const item = findItem(row.slug);
      const price = unitPrice(item, row.specs, config);
      return (
        `${row.qty} x ${item[lang].name} - $${(price * row.qty).toFixed(2)}\n` +
        `${t('specs')}: ${formatSpecs(item, row.specs, t, config)}`
      );
    });
    const sched = !date && !time ? `${t(fulfillment)} — ${t('asap')}` : `${t(fulfillment)} — ${[date, time].filter(Boolean).join(' ')}`;
    const info = [`${t('orderName')}: ${name}`, `${t('orderPhone')}: ${phone}`];
    if (fulfillment === 'delivery') info.push(`${t('orderAddress')}: ${address}`);
    info.push(`${t('scheduleLabel')}: ${sched}`);
    const head = orderNumber ? `${t('waIntro')} (#${orderNumber})` : t('waIntro');
    return encodeURIComponent(
      `${head}\n\n${info.join('\n')}\n\n${lines.join('\n\n')}\n\n${t('total')}: $${total.toFixed(2)}`
    );
  };

  const submit = async () => {
    if (!cart.length) return alert(t('addFirst'));
    if (!name || !phone || (fulfillment === 'delivery' && !address)) return alert(t('fillInfo'));
    const schedErr = validateSchedule({ date, time, leadDays: cartLeadDays });
    if (schedErr) return alert(t(schedErr));

    setSubmitting(true);
    try {
      const payload = {
        customer: { name, phone, address },
        fulfillment,
        lang,
        schedule: { date, time },
        lines: cart.map((r) => ({ slug: r.slug, qty: r.qty, specs: r.specs })),
      };
      const res = await api.createOrder(payload);
      const wa = config.business?.whatsapp || res.whatsapp || '96179167963';
      const msg = buildWhatsApp(res.orderNumber, res.total);
      window.open(`https://wa.me/${wa}?text=${msg}`, '_blank');
      clearCart();
      closeCart();
    } catch (e) {
      alert(t(e.key) !== e.key ? t(e.key) : e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className={`overlay ${cartOpen ? 'open' : ''}`} onClick={closeCart} />
      <aside className={`cart-drawer ${cartOpen ? 'open' : ''}`}>
        <div className="cart-top">
          <h3>{t('cartTitle')}</h3>
          <button className="close" onClick={closeCart}>
            ×
          </button>
        </div>
        <div className="cart-scroll">
          <div className="cart-items">
            {cart.length === 0 ? (
              <p style={{ color: 'var(--muted)', padding: '20px 0', lineHeight: 1.6 }}>
                {t('emptyCart')}
              </p>
            ) : (
              cart.map((row) => {
                const item = findItem(row.slug);
                if (!item) return null;
                const price = unitPrice(item, row.specs, config);
                return (
                  <div className="cart-row" key={row.key}>
                    <div>
                      <b>{item[lang].name}</b>
                      <small>
                        ${price.toFixed(2)} {t('each')}
                      </small>
                      <div className="cart-specs">{formatSpecs(item, row.specs, t, config)}</div>
                    </div>
                    <div className="qty">
                      <button onClick={() => changeQty(row.key, -1)}>−</button>
                      <span>{row.qty}</span>
                      <button onClick={() => changeQty(row.key, 1)}>+</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="cart-form">
            <input
              className="cart-input"
              type="text"
              autoComplete="name"
              placeholder={t('namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="cart-input"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder={t('phonePlaceholder')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <textarea
              className={`cart-input cart-textarea ${fulfillment === 'pickup' ? 'field-off' : ''}`}
              autoComplete="street-address"
              placeholder={t('addressPlaceholder')}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <div className="sched">
              <div className="option-title">{t('scheduleLabel')}</div>
              <div className="option-row">
                {['delivery', 'pickup'].map((f) => (
                  <label className="option-chip" key={f}>
                    <input
                      type="radio"
                      name="fulfill"
                      checked={fulfillment === f}
                      onChange={() => setFulfillment(f)}
                    />
                    <span>{t(f)}</span>
                  </label>
                ))}
              </div>
              <div className="ev-grid2">
                <input
                  className="cart-input"
                  type="date"
                  min={minDate}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
                <input
                  className="cart-input"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
              <small className="sched-hint">{cartLeadDays ? t('cakeHint') : t('scheduleHint')}</small>
            </div>
          </div>
        </div>
        <div className="cart-bottom">
          <div className="total">
            <span>{t('total')}</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>
          <button
            className="btn mint"
            style={{ width: '100%' }}
            onClick={submit}
            disabled={submitting}
          >
            {t('sendWhatsapp')}
          </button>
        </div>
      </aside>
    </>
  );
}
