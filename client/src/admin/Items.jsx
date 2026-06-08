import { useEffect, useMemo, useState } from 'react';
import { api, assetUrl } from '../api.js';
import { Icon, Badge, Spinner, Empty, Modal, useToast, money } from './ui.jsx';

const BLANK = {
  slug: '', category: 'arabic', price: 0, image: '', maxFlavors: 0, leadDays: 0,
  featured: false, available: true, ar: { name: '', desc: '' }, en: { name: '', desc: '' },
};

export default function Items({ token, onAuthFail }) {
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [cats, setCats] = useState([]);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null);

  const load = () =>
    Promise.all([api.itemsAll(token), api.categories()])
      .then(([its, cs]) => {
        setItems(its);
        setCats(cs);
      })
      .catch((e) => (e.status === 401 ? onAuthFail() : toast.error(e.message)));
  useEffect(() => {
    load();
  }, []); // eslint-disable-line

  const rows = useMemo(() => {
    if (!items) return [];
    const term = q.trim().toLowerCase();
    return items.filter((i) => {
      if (filter !== 'all' && i.category !== filter) return false;
      if (!term) return true;
      return `${i.slug} ${i.en.name} ${i.ar.name}`.toLowerCase().includes(term);
    });
  }, [items, q, filter]);

  const save = async (item) => {
    try {
      await api.saveItem(item, token, item._id);
      toast.success(item._id ? 'Item updated' : 'Item created');
      setEditing(null);
      load();
    } catch (e) {
      e.status === 401 ? onAuthFail() : toast.error(e.message);
    }
  };
  const remove = async (item) => {
    if (!confirm(`Delete "${item.en.name}"? This cannot be undone.`)) return;
    try {
      await api.deleteItem(item._id, token);
      toast.success('Item deleted');
      load();
    } catch (e) {
      e.status === 401 ? onAuthFail() : toast.error(e.message);
    }
  };

  if (!items) return <Spinner />;

  return (
    <>
      <div className="adm-toolbar">
        <div className="adm-search">
          <Icon name="search" />
          <input placeholder="Search items…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="seg">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>all</button>
          {cats.map((c) => (
            <button key={c.key} className={filter === c.key ? 'active' : ''} onClick={() => setFilter(c.key)}>
              {c.labels.en}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <button className="btn primary" onClick={() => setEditing({ ...BLANK })}>
          <Icon name="plus" /> New item
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="adm-panel">
          <Empty icon="items" title="No items" hint="Create your first product." />
        </div>
      ) : (
        <div className="items-grid">
          {rows.map((i) => (
            <div className="item-card" key={i._id}>
              <div className="ph" style={{ backgroundImage: `url('${assetUrl(i.image)}')` }}>
                <div className="flags">
                  {i.featured && <Badge kind="gold">Featured</Badge>}
                  {!i.available && <Badge kind="cancelled">Hidden</Badge>}
                </div>
              </div>
              <div className="bd">
                <h4>{i.en.name}</h4>
                <div className="meta">{i.slug} · {i.category}</div>
                <div className="price">{money(i.price)}</div>
              </div>
              <div className="acts">
                <button className="btn ghost sm" style={{ flex: 1 }} onClick={() => setEditing(i)}>
                  <Icon name="edit" /> Edit
                </button>
                <button className="btn danger sm" onClick={() => remove(i)}>
                  <Icon name="trash" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <ItemEditor
          item={editing}
          cats={cats}
          token={token}
          toast={toast}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </>
  );
}

function ItemEditor({ item, cats, token, toast, onClose, onSave }) {
  const [f, setF] = useState(item);
  const [uploading, setUploading] = useState(false);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const setLoc = (lng, k, v) => setF((s) => ({ ...s, [lng]: { ...s[lng], [k]: v } }));

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { path } = await api.uploadImage(file, token);
      set('image', path);
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const valid = f.slug && f.en.name && f.ar.name && f.category;

  return (
    <Modal
      wide
      title={item._id ? 'Edit item' : 'New item'}
      onClose={onClose}
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={!valid} onClick={() => onSave(f)}>
            <Icon name="check" /> Save item
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ width: 130, flex: '0 0 auto' }}>
          <div
            style={{
              width: 130, height: 130, borderRadius: 12, border: '1px solid var(--line)',
              backgroundImage: `url('${assetUrl(f.image)}')`, backgroundSize: 'cover',
              backgroundPosition: 'center', backgroundColor: '#f1f5f9', display: 'grid', placeItems: 'center',
            }}
          >
            {!f.image && <Icon name="image" style={{ width: 26, height: 26, color: '#94a3b8' }} />}
          </div>
          <label className="btn ghost sm" style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}>
            <Icon name="image" /> {uploading ? 'Uploading…' : 'Upload'}
            <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={upload} />
          </label>
        </div>
        <div style={{ flex: 1 }}>
          <div className="grid2">
            <div className="field">
              <label>Slug (unique id)</label>
              <input value={f.slug} onChange={(e) => set('slug', e.target.value)} placeholder="arabic_mix" />
            </div>
            <div className="field">
              <label>Category</label>
              <select value={f.category} onChange={(e) => set('category', e.target.value)}>
                {cats.map((c) => (
                  <option key={c.key} value={c.key}>{c.labels.en}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Base price ($)</label>
              <input type="number" step="0.25" value={f.price} onChange={(e) => set('price', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="field">
              <label>Image path</label>
              <input value={f.image} onChange={(e) => set('image', e.target.value)} placeholder="assets/items/…" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid2">
        <div className="field">
          <label>Name (EN)</label>
          <input value={f.en.name} onChange={(e) => setLoc('en', 'name', e.target.value)} />
        </div>
        <div className="field">
          <label>الاسم (AR)</label>
          <input dir="rtl" value={f.ar.name} onChange={(e) => setLoc('ar', 'name', e.target.value)} />
        </div>
        <div className="field">
          <label>Description (EN)</label>
          <input value={f.en.desc} onChange={(e) => setLoc('en', 'desc', e.target.value)} />
        </div>
        <div className="field">
          <label>الوصف (AR)</label>
          <input dir="rtl" value={f.ar.desc} onChange={(e) => setLoc('ar', 'desc', e.target.value)} />
        </div>
      </div>

      <div className="grid3">
        <div className="field">
          <label>Max flavors (boxes/cakes)</label>
          <input type="number" value={f.maxFlavors} onChange={(e) => set('maxFlavors', parseInt(e.target.value, 10) || 0)} />
        </div>
        <div className="field">
          <label>Lead days (advance notice)</label>
          <input type="number" value={f.leadDays} onChange={(e) => set('leadDays', parseInt(e.target.value, 10) || 0)} />
        </div>
        <div className="field">
          <label>Flags</label>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', paddingTop: 8 }}>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'var(--ink)', fontWeight: 600 }}>
              <input type="checkbox" style={{ width: 'auto' }} checked={f.featured} onChange={(e) => set('featured', e.target.checked)} /> Featured
            </label>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'var(--ink)', fontWeight: 600 }}>
              <input type="checkbox" style={{ width: 'auto' }} checked={f.available} onChange={(e) => set('available', e.target.checked)} /> Available
            </label>
          </div>
        </div>
      </div>
    </Modal>
  );
}
