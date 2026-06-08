import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Icon, Badge, Spinner, Empty, money, dateShort } from './ui.jsx';

export default function Dashboard({ token, onAuthFail, goto }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api
      .overview(token)
      .then(setData)
      .catch((e) => (e.status === 401 ? onAuthFail() : setErr(e.message)));
  }, []); // eslint-disable-line

  if (err) return <div className="adm-panel" style={{ padding: 20, color: '#b91c1c' }}>{err}</div>;
  if (!data) return <Spinner />;

  const k = data.kpis;
  const cards = [
    { ic: 'money', tone: 'gold', val: money(k.revenueTotal), lbl: 'Total revenue', sub: 'Excludes cancelled' },
    { ic: 'orders', tone: 'mint', val: k.ordersTotal, lbl: 'Total orders', sub: `${k.ordersNew} new` },
    { ic: 'cart', tone: 'berry', val: k.todayCount, lbl: 'Orders today', sub: money(k.todayRevenue) },
    { ic: 'events', tone: 'blue', val: k.eventsTotal, lbl: 'Event inquiries', sub: `${k.eventsNew} new` },
  ];

  return (
    <>
      <div className="adm-kpis">
        {cards.map((c) => (
          <div className="adm-kpi" key={c.lbl}>
            <div className={`ic ${c.tone}`}>
              <Icon name={c.ic} />
            </div>
            <div className="val">{c.val}</div>
            <div className="lbl">{c.lbl}</div>
            <div className="sub">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid2" style={{ alignItems: 'start' }}>
        <div className="adm-panel">
          <div className="adm-panel-head">
            <h3>Recent orders</h3>
            <div className="spacer" />
            <button className="btn ghost sm" onClick={() => goto('orders')}>
              View all
            </button>
          </div>
          <div className="adm-table-wrap">
            {data.recentOrders.length === 0 ? (
              <Empty icon="orders" title="No orders yet" hint="Orders placed on the site appear here." />
            ) : (
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((o) => (
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
                        <b>{money(o.total)}</b>
                      </td>
                      <td>
                        <Badge kind={o.status}>{o.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="adm-panel">
          <div className="adm-panel-head">
            <h3>Recent events</h3>
            <div className="spacer" />
            <button className="btn ghost sm" onClick={() => goto('events')}>
              View all
            </button>
          </div>
          <div style={{ padding: '6px 18px 14px' }}>
            {data.recentEvents.length === 0 ? (
              <Empty icon="events" title="No inquiries yet" hint="Event/catering requests land here." />
            ) : (
              data.recentEvents.map((e) => (
                <div className="lineitem" key={e._id}>
                  <div>
                    <b>{e.name}</b> <span className="cellmuted">· {e.phone}</span>
                    <small>
                      {e.eventType} · {e.guests} · {e.date}
                      {e.time ? ' ' + e.time : ''}
                    </small>
                  </div>
                  <Badge kind={e.status}>{e.status}</Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
