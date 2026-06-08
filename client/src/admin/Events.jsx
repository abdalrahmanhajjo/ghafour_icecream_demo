import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { Icon, Badge, Spinner, Empty, Drawer, useToast, dateShort } from './ui.jsx';

const STATUSES = ['new', 'quoted', 'booked', 'closed'];

export default function Events({ token, onAuthFail }) {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState(null);

  const load = () =>
    api
      .events(token)
      .then(setData)
      .catch((e) => (e.status === 401 ? onAuthFail() : toast.error(e.message)));
  useEffect(() => {
    load();
  }, []); // eslint-disable-line

  const setStatus = async (id, status) => {
    try {
      const u = await api.setEventStatus(id, status, token);
      setData((d) => d.map((x) => (x._id === id ? u : x)));
      setOpen((o) => (o && o._id === id ? u : o));
      toast.success(`Inquiry → ${status}`);
    } catch (e) {
      e.status === 401 ? onAuthFail() : toast.error(e.message);
    }
  };

  const rows = useMemo(() => {
    if (!data) return [];
    const term = q.trim().toLowerCase();
    return data.filter((e) => {
      if (filter !== 'all' && e.status !== filter) return false;
      if (!term) return true;
      return `${e.name} ${e.phone} ${e.eventType}`.toLowerCase().includes(term);
    });
  }, [data, q, filter]);

  if (!data) return <Spinner />;

  return (
    <>
      <div className="adm-toolbar">
        <div className="adm-search">
          <Icon name="search" />
          <input placeholder="Search name, phone, type…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="seg">
          {['all', ...STATUSES].map((s) => (
            <button key={s} className={filter === s ? 'active' : ''} onClick={() => setFilter(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="adm-panel">
        <div className="adm-table-wrap">
          {rows.length === 0 ? (
            <Empty icon="events" title="No inquiries" hint="Event/catering requests appear here." />
          ) : (
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Contact</th>
                  <th>Type</th>
                  <th>Guests</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e._id}>
                    <td>
                      <b>{e.name}</b>
                      <div className="cellmuted">{e.phone}</div>
                    </td>
                    <td className="nowrap">{e.eventType?.replace('ev', '') || '—'}</td>
                    <td className="nowrap">{e.guests?.replace('g', '') || '—'}</td>
                    <td className="nowrap">
                      {e.date}
                      <div className="cellmuted">{dateShort(e.createdAt)}</div>
                    </td>
                    <td>
                      <Badge kind={e.status}>{e.status}</Badge>
                    </td>
                    <td className="nowrap">
                      <button className="btn ghost sm" onClick={() => setOpen(e)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {open && (
        <Drawer title="Event inquiry" onClose={() => setOpen(null)}>
          <div className="field">
            <label>Update status</label>
            <select value={open.status} onChange={(e) => setStatus(open._id, e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="adm-panel" style={{ padding: '4px 16px' }}>
            <div className="drow"><span className="k">Name</span><span className="v">{open.name}</span></div>
            <div className="drow"><span className="k">Phone</span><span className="v">
              <a href={`https://wa.me/${open.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ color: 'var(--mint)' }}>{open.phone}</a>
            </span></div>
            <div className="drow"><span className="k">Type</span><span className="v">{open.eventType}</span></div>
            <div className="drow"><span className="k">Guests</span><span className="v">{open.guests}</span></div>
            <div className="drow"><span className="k">Date</span><span className="v">{open.date} {open.time}</span></div>
            <div className="drow"><span className="k">Services</span><span className="v" style={{ maxWidth: 240 }}>{open.services?.join(', ') || '—'}</span></div>
          </div>
          {open.notes && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>Notes</label>
              <p style={{ fontSize: 13.5, lineHeight: 1.6 }}>{open.notes}</p>
            </div>
          )}
        </Drawer>
      )}
    </>
  );
}
