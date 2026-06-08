import { useEffect, useState } from 'react';
import { api, assetUrl } from '../api.js';
import { Icon, ToastProvider } from './ui.jsx';
import Dashboard from './Dashboard.jsx';
import Orders from './Orders.jsx';
import Events from './Events.jsx';
import Items from './Items.jsx';
import Categories from './Categories.jsx';
import Options from './Options.jsx';
import './admin.css';

const TOKEN_KEY = 'ghafour_admin_token';
const USER_KEY = 'ghafour_admin_user';

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { key: 'orders', label: 'Orders', icon: 'orders', badge: 'ordersNew' },
  { key: 'events', label: 'Events', icon: 'events', badge: 'eventsNew' },
  { key: 'items', label: 'Menu items', icon: 'items' },
  { key: 'categories', label: 'Categories', icon: 'categories' },
  { key: 'options', label: 'Options & pricing', icon: 'options' },
];
const TITLES = {
  dashboard: ['Dashboard', 'Overview of your shop'],
  orders: ['Orders', 'Manage and track customer orders'],
  events: ['Events', 'Catering & event inquiries'],
  items: ['Menu items', 'Add, edit and organise products'],
  categories: ['Categories', 'Organise the menu'],
  options: ['Options & pricing', 'Customization catalog and add-on prices'],
};

export default function Admin() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    } catch {
      return null;
    }
  });
  const [view, setView] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [badges, setBadges] = useState({});

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken('');
    setUser(null);
  };
  const onLogin = (tk, usr) => {
    localStorage.setItem(TOKEN_KEY, tk);
    if (usr) localStorage.setItem(USER_KEY, JSON.stringify(usr));
    setToken(tk);
    setUser(usr);
  };

  const refreshBadges = () => {
    if (!token) return;
    api
      .overview(token)
      .then((d) => setBadges(d.kpis))
      .catch((e) => e.status === 401 && logout());
  };
  useEffect(() => {
    refreshBadges();
  }, [token, view]); // eslint-disable-line

  if (!token) return <Login onLogin={onLogin} />;

  const goto = (v) => {
    setView(v);
    setMenuOpen(false);
  };
  const [title, sub] = TITLES[view];
  const initials = (user?.name || 'A').split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase();

  return (
    <ToastProvider>
      <div className={`adm ${menuOpen ? 'menu-open' : ''}`}>
        <div className="adm-shell">
          <aside className="adm-side" onClick={(e) => e.target.tagName === 'A' && setMenuOpen(false)}>
            <div className="adm-brand">
              <div className="logo">
                <img src={assetUrl('assets/ghafour-logo.jpg')} alt="" />
              </div>
              <div>
                <b>Ghafour 1919</b>
                <br />
                <span>Admin panel</span>
              </div>
            </div>
            <nav className="adm-nav">
              {NAV.map((n) => (
                <a
                  key={n.key}
                  className={view === n.key ? 'active' : ''}
                  onClick={() => goto(n.key)}
                  href="#"
                  onClickCapture={(e) => e.preventDefault()}
                >
                  <Icon name={n.icon} />
                  {n.label}
                  {n.badge && badges[n.badge] > 0 && <span className="badge-dot">{badges[n.badge]}</span>}
                </a>
              ))}
            </nav>
            <div className="adm-side-foot">
              <div className="adm-userline">
                <div className="av">{initials}</div>
                <div>
                  <div className="nm">{user?.name || 'Admin'}</div>
                  <div className="rl">{user?.email || 'administrator'}</div>
                </div>
              </div>
              <button className="adm-logout" onClick={logout}>
                <Icon name="logout" /> Log out
              </button>
            </div>
          </aside>

          <main className="adm-main">
            <header className="adm-top">
              <button className="mobile-toggle" onClick={() => setMenuOpen((o) => !o)}>
                <Icon name="menu" />
              </button>
              <div>
                <h1>{title}</h1>
                <div className="sub">{sub}</div>
              </div>
              <div className="spacer" />
              <a className="view-site" href="/" target="_blank" rel="noreferrer">
                <Icon name="external" /> View site
              </a>
            </header>
            <div className="adm-content">
              {view === 'dashboard' && <Dashboard token={token} onAuthFail={logout} goto={goto} />}
              {view === 'orders' && <Orders token={token} onAuthFail={logout} />}
              {view === 'events' && <Events token={token} onAuthFail={logout} />}
              {view === 'items' && <Items token={token} onAuthFail={logout} />}
              {view === 'categories' && <Categories token={token} onAuthFail={logout} />}
              {view === 'options' && <Options token={token} onAuthFail={logout} />}
            </div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const res = await api.login({ email, password });
      onLogin(res.token, res.user);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="adm">
      <div className="adm-login-wrap">
        <form className="adm-login" onSubmit={submit}>
          <div className="logo">
            <img src={assetUrl('assets/ghafour-logo.jpg')} alt="" />
          </div>
          <h1>Welcome back</h1>
          <p>Ghafour Original 1919 — Admin</p>
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="btn primary" type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
          {err && <div className="err">{err}</div>}
        </form>
      </div>
    </div>
  );
}
