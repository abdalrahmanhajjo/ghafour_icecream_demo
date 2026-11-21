import { useState } from 'react';
import { useApp } from '../state.jsx';
import { api } from '../api.js';
import { todayStr } from '../lib/menu.js';

const TYPES = ['evBirthday', 'evWedding', 'evCorporate', 'evGraduation', 'evOther'];
const GUESTS = ['g25', 'g50', 'g100', 'g150'];
const SERVICES = ['svCart', 'svCake', 'svBuffet', 'svWaiters'];

export default function Events() {
  const { t, config } = useApp();
  const [eventType, setEventType] = useState('evBirthday');
  const [guests, setGuests] = useState('g25');
  const [services, setServices] = useState([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const minDate = todayStr(3);
  const toggleService = (s) =>
    setServices((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  const submit = async () => {
    if (!name || !phone || !date) return alert(t('evFill'));
    if (date < minDate) return alert(t('evLeadErr'));
    setSubmitting(true);
    try {
      await api.createEvent({ name, phone, eventType, guests, services, date, time, notes });
      const wa = config.business?.whatsapp || '96179167963';
      const L = [
        `${t('evType')}: ${t(eventType)}`,
        `${t('evGuests')}: ${t(guests)}`,
      ];
      if (services.length) L.push(`${t('evServices')}: ${services.map(t).join(', ')}`);
      L.push(`${t('evDateLabel')}: ${[date, time].filter(Boolean).join(' ')}`);
      if (notes) L.push(`${t('notes')}: ${notes}`);
      const msg = encodeURIComponent(
        `${t('evIntro')}\n\n${t('orderName')}: ${name}\n${t('orderPhone')}: ${phone}\n\n${L.join('\n')}`
      );
      window.open(`https://wa.me/${wa}?text=${msg}`, '_blank');
    } catch (e) {
      alert(t(e.key) !== e.key ? t(e.key) : e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const Chips = ({ name: grp, values, value, onPick, multi }) => (
    <div className="option-row">
      {values.map((v) => {
        const checked = multi ? value.includes(v) : value === v;
        return (
          <label className="option-chip" key={v}>
            <input
              type={multi ? 'checkbox' : 'radio'}
              name={grp}
              checked={checked}
              onChange={() => onPick(v)}
            />
            <span>{t(v)}</span>
          </label>
        );
      })}
    </div>
  );

  return (
    <section className="events" id="events">
      <div className="container">
        <div className="events-head">
          <div className="section-label">{t('eventsLabel')}</div>
          <h2>{t('eventsTitle')}</h2>
          <p>{t('eventsDesc')}</p>
        </div>
        <div className="ev-form">
          <div className="option-group">
            <div className="option-title">{t('evType')}</div>
            <Chips name="evType" values={TYPES} value={eventType} onPick={setEventType} />
          </div>
          <div className="option-group">
            <div className="option-title">{t('evGuests')}</div>
            <Chips name="evGuests" values={GUESTS} value={guests} onPick={setGuests} />
          </div>
          <div className="option-group">
            <div className="option-title">{t('evServices')}</div>
            <Chips name="evService" values={SERVICES} value={services} onPick={toggleService} multi />
          </div>
          <div className="ev-grid2">
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
          </div>
          <div className="option-group">
            <div className="option-title">{t('evDateLabel')}</div>
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
          </div>
          <textarea
            className="cart-input cart-textarea"
            placeholder={t('evNotesPlaceholder')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <button className="btn mint" style={{ width: '100%' }} onClick={submit} disabled={submitting}>
            {t('evSend')}
          </button>
        </div>
      </div>
    </section>
  );
}
