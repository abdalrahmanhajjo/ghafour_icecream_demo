import { useState } from 'react';
import { useApp } from '../state.jsx';
import { api, assetUrl } from '../api.js';
import { todayStr } from '../lib/menu.js';
import Icon from './Icon.jsx';

const TYPES = ['evBirthday', 'evWedding', 'evCorporate', 'evGraduation', 'evOther'];
const GUESTS = ['g25', 'g50', 'g100', 'g150'];
const SERVICES = ['svCart', 'svCake', 'svBuffet', 'svWaiters'];

export default function Events() {
  const { t, lang, config } = useApp();
  const [eventType, setEventType] = useState('evBirthday');
  const [guests, setGuests] = useState('g25');
  const [services, setServices] = useState([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(false);

  const minDate = todayStr(3);
  const toggleService = (s) => setServices((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  const submit = async (e) => {
    e.preventDefault();
    const err = {};
    if (!name.trim()) err.name = t('required');
    if (!phone.trim()) err.phone = t('required');
    if (!date) err.date = t('required');
    else if (date < minDate) err.date = t('evLeadErr');
    setErrors(err);
    if (Object.keys(err).length) {
      e.currentTarget.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    const waWindow = window.open('', '_blank'); // opened inside the click so pop-up blockers allow it
    setSubmitting(true);
    try {
      await api.createEvent({ name, phone, eventType, guests, services, date, time, notes });
      const wa = config.business?.whatsapp || '96179167963';
      const L = [`${t('evType')}: ${t(eventType)}`, `${t('evGuests')}: ${t(guests)}`];
      if (services.length) L.push(`${t('evServices')}: ${services.map(t).join(', ')}`);
      L.push(`${t('evDateLabel')}: ${[date, time].filter(Boolean).join(' ')}`);
      if (notes) L.push(`${t('notes')}: ${notes}`);
      const msg = encodeURIComponent(`${t('evIntro')}\n\n${t('orderName')}: ${name}\n${t('orderPhone')}: ${phone}\n\n${L.join('\n')}`);
      const url = `https://wa.me/${wa}?text=${msg}`;
      if (waWindow) waWindow.location.href = url;
      else window.location.href = url;
      setDone(true);
    } catch (ex) {
      waWindow?.close();
      setErrors({ form: t(ex.key) !== ex.key ? t(ex.key) : ex.message });
    } finally {
      setSubmitting(false);
    }
  };

  const Chips = ({ group, values, value, onPick, multi, legend }) => (
    <fieldset className="gh-opt">
      <legend className="gh-opt-title">{legend}</legend>
      <div className="gh-chips">
        {values.map((v) => {
          const checked = multi ? value.includes(v) : value === v;
          return (
            <label className="gh-chip" key={v}>
              <input type={multi ? 'checkbox' : 'radio'} name={group} checked={checked} onChange={() => onPick(v)} />
              <span>{t(v)}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );

  const inv = (k) => (errors[k] ? { 'aria-invalid': true, 'aria-describedby': `ev-err-${k}` } : {});
  const errText = (k) =>
    errors[k] ? (
      <span className="gh-field-error" id={`ev-err-${k}`}>
        {errors[k]}
      </span>
    ) : null;

  return (
    <section className="gh-events" id="events" aria-labelledby="gh-events-title">
      <div className="gh-wrap gh-events-grid">
        <div className="gh-events-intro">
          <p className="gh-eyebrow">{t('eventsLabel')}</p>
          <h2 id="gh-events-title" className="gh-h2">
            {t('eventsTitle')}
          </h2>
          <p>{t('eventsDesc')}</p>
          <figure className="gh-photo gh-events-photo">
            <img src={assetUrl('assets/items/real-fruit-cups.jpg')} alt="" width="676" height="899" loading="lazy" decoding="async" />
          </figure>
        </div>

        <form className="gh-panel gh-events-form" onSubmit={submit} noValidate>
          {done ? (
            <div className="gh-state gh-state--ok" role="status">
              <Icon name="check" size={30} />
              <p>{t('sent')}</p>
              <button type="button" className="gh-btn gh-btn--ghost" onClick={() => setDone(false)}>
                {lang === 'ar' ? 'طلب جديد' : 'New inquiry'}
              </button>
            </div>
          ) : (
            <>
              <Chips group="evType" legend={t('evType')} values={TYPES} value={eventType} onPick={setEventType} />
              <Chips group="evGuests" legend={t('evGuests')} values={GUESTS} value={guests} onPick={setGuests} />
              <Chips group="evService" legend={t('evServices')} values={SERVICES} value={services} onPick={toggleService} multi />
              <div className="gh-two">
                <label className="gh-field">
                  <span>{t('namePlaceholder')}</span>
                  <input className="gh-input" type="text" autoComplete="name" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} {...inv('name')} />
                  {errText('name')}
                </label>
                <label className="gh-field">
                  <span>{t('phonePlaceholder')}</span>
                  <input className="gh-input" type="tel" inputMode="tel" autoComplete="tel" maxLength={30} dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} {...inv('phone')} />
                  {errText('phone')}
                </label>
              </div>
              <div className="gh-field">
                <span>{t('evDateLabel')}</span>
                <div className="gh-two">
                  <input className="gh-input" type="date" min={minDate} value={date} onChange={(e) => setDate(e.target.value)} aria-label={lang === 'ar' ? 'التاريخ' : 'Date'} {...inv('date')} />
                  <input className="gh-input" type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label={lang === 'ar' ? 'الوقت' : 'Time'} />
                </div>
                {errText('date')}
              </div>
              <label className="gh-field">
                <span>{t('notesLabel')}</span>
                <textarea className="gh-input gh-textarea" placeholder={t('evNotesPlaceholder')} value={notes} maxLength={500} onChange={(e) => setNotes(e.target.value)} />
              </label>
              {errors.form && (
                <p className="gh-error" role="alert">
                  <Icon name="alert" size={18} /> {errors.form}
                </p>
              )}
              <button type="submit" className="gh-btn gh-btn--primary gh-btn--block" disabled={submitting} aria-busy={submitting}>
                <Icon name="chat" size={18} /> {submitting ? t('sending') : t('evSend')}
              </button>
            </>
          )}
        </form>
      </div>
    </section>
  );
}
