import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { Icon, Badge, Spinner, Empty, Drawer, useToast, money, dateShort } from './ui.jsx';

const STATUSES = ['new', 'confirmed', 'preparing', 'delivered', 'cancelled'];

export default function Orders({ token, onAuthFail }) {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState(null);

  const load = () =>
    api
      .orders(token)
      .then(setData)
      .catch((e) => (e.status === 401 ? onAuthFail() : toast.error(e.message)));
  useEffect(() => {
    load();
  }, []); // eslint-disable-line

  const setStatus = async (id, status) => {
    try {
      const updated = await api.setOrderStatus(id, status, token);
      setData((d) => d.map((o) => (o._id === id ? updated : o)));
      setOpen((o) => (o && o._id === id ? updated : o));
      toast.success(`Order ${updated.orderNumber} → ${status}`);
    } catch (e) {
      e.status === 401 ? onAuthFail() : toast.error(e.message);
    }
  };

  const rows = useMemo(() => {
    if (!data) return [];
    const term = q.trim().toLowerCase();
    return data.filter((o) => {
      if (filter !== 'all' && o.status !== filter) return false;
      if (!term) return true;
      return `${o.orderNumber} ${o.customer.name} ${o.customer.phone}`.toLowerCase().includes(term);
    });
  }, [data, q, filter]);

  if (!data) return <Spinner />;

  return (
    <>
      <div className="adm-toolbar">
        <div className="adm-search">
          <Icon name="search" />
          <input placeholder="Search order #, name, phone…" value={q} onChange={(e) => setQ(e.target.value)} />
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
            <Empty icon="orders" title="No orders" hint="Try a different filter or search." />
          ) : (
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Fulfilment</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o._id}>
                    <td>
                      <b>{o.orderNumber}</b>
                      <div className="cellmuted">{dateShort(o.createdAt)}</div>
                    </td>
                    <td>
                      {o.customer.name}
                      <div className="cellmuted">{o.customer.phone}</div>
                    </td>
                    <td className="nowrap">
                      <Badge kind={o.fulfillment === 'pickup' ? 'gold' : 'muted'}>{o.fulfillment}</Badge>
                      <div className="cellmuted">
                        {o.schedule?.type === 'scheduled' ? `${o.schedule.date} ${o.schedule.time}` : 'ASAP'}
                      </div>
                    </td>
                    <td className="nowrap">
                      <b>{money(o.total)}</b>
                      <div className="cellmuted">{o.lines.reduce((n, l) => n + l.qty, 0)} items</div>
                    </td>
                    <td>
                      <Badge kind={o.status}>{o.status}</Badge>
                    </td>
                    <td className="nowrap">
                      <button className="btn ghost sm" onClick={() => setOpen(o)}>
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
        <Drawer title={`Order ${open.orderNumber}`} onClose={() => setOpen(null)}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <Badge kind={open.status}>{open.status}</Badge>
            <span className="cellmuted">{new Date(open.createdAt).toLocaleString()}</span>
          </div>

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
            <div className="drow">
              <span className="k">Customer</span>
              <span className="v">{open.customer.name}</span>
            </div>
            <div className="drow">
              <span className="k">Phone</span>
              <span className="v">
                <a href={`https://wa.me/${open.customer.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ color: 'var(--mint)' }}>
                  {open.customer.phone}
                </a>
              </span>
            </div>
            <div className="drow">
              <span className="k">Fulfilment</span>
              <span className="v">{open.fulfillment}</span>
            </div>
            {open.fulfillment === 'delivery' && (
              <div className="drow">
                <span className="k">Address</span>
                <span className="v" style={{ maxWidth: 240 }}>{open.customer.address}</span>
              </div>
            )}
            <div className="drow">
              <span className="k">When</span>
              <span className="v">
                {open.schedule?.type === 'scheduled' ? `${open.schedule.date} ${open.schedule.time}` : 'As soon as possible'}
              </span>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>Items</label>
            {open.lines.map((l, i) => (
              <div className="lineitem" key={i}>
                <div>
                  <b>{l.qty}× {l.name.en}</b>
                  <small>{specStr(l.specs)}</small>
                </div>
                <b className="nowrap">{money(l.lineTotal)}</b>
              </div>
            ))}
            <div className="drow" style={{ marginTop: 6 }}>
              <span className="k" style={{ fontSize: 15 }}>Total</span>
              <span className="v" style={{ fontSize: 17, color: 'var(--berry)' }}>{money(open.total)}</span>
            </div>
          </div>
        </Drawer>
      )}
    </>
  );
}

function specStr(specs = {}) {
  const parts = [];
  for (const [k, v] of Object.entries(specs)) {
    if (k === 'notes') continue;
    if (Array.isArray(v)) {
      if (v.length) parts.push(v.join(', '));
    } else if (v) parts.push(v);
  }
  if (specs.notes) parts.push('Note: ' + specs.notes);
  return parts.join(' • ');
}
