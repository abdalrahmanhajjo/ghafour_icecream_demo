import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Icon, Spinner, useToast } from './ui.jsx';

export default function Options({ token, onAuthFail }) {
  const toast = useToast();
  const [groups, setGroups] = useState(null);
  const [prices, setPrices] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .config()
      .then((cfg) => {
        setGroups(JSON.stringify(cfg.optionGroups || {}, null, 2));
        setPrices(JSON.stringify(cfg.optionPrices || {}, null, 2));
      })
      .catch((e) => toast.error(e.message));
  }, []); // eslint-disable-line

  const save = async () => {
    let optionGroups, optionPrices;
    try {
      optionGroups = JSON.parse(groups);
      optionPrices = JSON.parse(prices);
    } catch (e) {
      toast.error('Invalid JSON: ' + e.message);
      return;
    }
    setSaving(true);
    try {
      await api.saveConfig({ optionGroups, optionPrices }, token);
      toast.success('Options saved');
    } catch (e) {
      e.status === 401 ? onAuthFail() : toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (groups === null) return <Spinner />;

  return (
    <div className="adm-panel">
      <div className="adm-panel-head">
        <h3>Customization & pricing</h3>
        <div className="spacer" />
        <button className="btn primary" onClick={save} disabled={saving}>
          <Icon name="check" /> {saving ? 'Saving…' : 'Save options'}
        </button>
      </div>
      <div style={{ padding: 18 }}>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
          Define the customization groups (scoops, serving, toppings, box flavours, cake size/flavour/message)
          and their price add-ons. Label keys map to translations in the storefront. Edit as JSON and save —
          the server re-validates every order against this catalog.
        </p>
        <div className="grid2" style={{ alignItems: 'start' }}>
          <div className="field">
            <label>optionGroups</label>
            <textarea style={{ minHeight: 360, fontFamily: 'ui-monospace, monospace', fontSize: 12.5 }} value={groups} onChange={(e) => setGroups(e.target.value)} />
          </div>
          <div className="field">
            <label>optionPrices</label>
            <textarea style={{ minHeight: 360, fontFamily: 'ui-monospace, monospace', fontSize: 12.5 }} value={prices} onChange={(e) => setPrices(e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  );
}
