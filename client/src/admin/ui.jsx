import { createContext, useCallback, useContext, useState } from 'react';

/* ---------- Icons (inline stroke SVG, currentColor) ---------- */
const PATHS = {
  dashboard: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
  orders: 'M9 5h6M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 00-2 2v0M7 7H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-2M9 13h6M9 17h6',
  events: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z',
  items: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16zM3.27 6.96L12 12l8.73-5.04M12 22V12',
  categories: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  options: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
  logout: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  search: 'M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z',
  plus: 'M12 5v14M5 12h14',
  edit: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
  trash: 'M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h2a2 2 0 012 2v2',
  external: 'M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3',
  menu: 'M3 12h18M3 6h18M3 18h18',
  money: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  bell: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0',
  image: 'M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zM8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21',
  check: 'M20 6L9 17l-5-5',
  cart: 'M9 22a1 1 0 100-2 1 1 0 000 2zM20 22a1 1 0 100-2 1 1 0 000 2zM1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6',
};
export function Icon({ name, ...rest }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...rest}>
      <path d={PATHS[name] || ''} />
    </svg>
  );
}

/* ---------- Toast ---------- */
const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, type = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  const api = {
    success: (m) => push(m, 'ok'),
    error: (m) => push(m, 'err'),
    info: (m) => push(m, 'info'),
  };
  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="adm-toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------- Badge ---------- */
export const Badge = ({ kind, children }) => <span className={`badge ${kind || 'muted'}`}>{children}</span>;

/* ---------- Spinner / states ---------- */
export const Spinner = () => (
  <div className="adm-loading">
    <div className="adm-spinner" />
  </div>
);
export const Empty = ({ icon = 'orders', title, hint }) => (
  <div className="adm-empty">
    <div className="ic">
      <Icon name={icon} style={{ width: 22, height: 22, color: '#94a3b8' }} />
    </div>
    <div style={{ fontWeight: 700, color: '#475569' }}>{title}</div>
    {hint && <div style={{ fontSize: 13, marginTop: 4 }}>{hint}</div>}
  </div>
);

/* ---------- Modal ---------- */
export function Modal({ title, onClose, children, footer, wide }) {
  return (
    <div className="adm-overlay" onClick={(e) => e.target.classList.contains('adm-overlay') && onClose()}>
      <div className="adm-modal" style={wide ? { width: 'min(820px, calc(100% - 32px))' } : undefined}>
        <div className="adm-modal-head">
          <h3>{title}</h3>
          <button className="x-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="adm-modal-body">{children}</div>
        {footer && <div className="adm-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------- Drawer (right side) ---------- */
export function Drawer({ title, onClose, children }) {
  return (
    <div className="adm-overlay" onClick={(e) => e.target.classList.contains('adm-overlay') && onClose()}>
      <div className="adm-drawer">
        <div className="adm-drawer-head">
          <h3>{title}</h3>
          <button className="x-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="adm-drawer-body">{children}</div>
      </div>
    </div>
  );
}

export const money = (n) => '$' + Number(n || 0).toFixed(2);
export const dateShort = (d) => new Date(d).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
