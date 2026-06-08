import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Icon, Spinner, Empty, Modal, useToast } from './ui.jsx';

const BLANK = { key: '', labels: { ar: '', en: '' }, sort: 0, active: true };

export default function Categories({ token, onAuthFail }) {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [editing, setEditing] = useState(null);

  const load = () =>
    api
      .categories()
      .then(setData)
      .catch((e) => (e.status === 401 ? onAuthFail() : toast.error(e.message)));
  useEffect(() => {
    load();
  }, []); // eslint-disable-line

  const save = async (c) => {
    try {
      await api.saveCategory(c, token, c._id);
      toast.success(c._id ? 'Category updated' : 'Category created');
      setEditing(null);
      load();
    } catch (e) {
      e.status === 401 ? onAuthFail() : toast.error(e.message);
    }
  };
  const remove = async (c) => {
    if (!confirm(`Delete category "${c.labels.en}"?`)) return;
    try {
      await api.deleteCategory(c._id, token);
      toast.success('Category deleted');
      load();
    } catch (e) {
      e.status === 401 ? onAuthFail() : toast.error(e.message);
    }
  };

  if (!data) return <Spinner />;

  return (
    <>
      <div className="adm-toolbar">
        <div style={{ flex: 1 }} />
        <button className="btn primary" onClick={() => setEditing({ ...BLANK })}>
          <Icon name="plus" /> New category
        </button>
      </div>
      <div className="adm-panel">
        <div className="adm-table-wrap">
          {data.length === 0 ? (
            <Empty icon="categories" title="No categories" />
          ) : (
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Label (EN)</th>
                  <th>Label (AR)</th>
                  <th>Sort</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.map((c) => (
                  <tr key={c._id}>
                    <td><b>{c.key}</b></td>
                    <td>{c.labels.en}</td>
                    <td dir="rtl">{c.labels.ar}</td>
                    <td>{c.sort}</td>
                    <td className="nowrap">
                      <button className="btn ghost sm" onClick={() => setEditing(c)}>
                        <Icon name="edit" /> Edit
                      </button>{' '}
                      <button className="btn danger sm" onClick={() => remove(c)}>
                        <Icon name="trash" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {editing && (
        <Modal
          title={editing._id ? 'Edit category' : 'New category'}
          onClose={() => setEditing(null)}
          footer={
            <>
              <button className="btn ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn primary" disabled={!editing.key || !editing.labels.en} onClick={() => save(editing)}>
                <Icon name="check" /> Save
              </button>
            </>
          }
        >
          <div className="grid2">
            <div className="field">
              <label>Key (used by items)</label>
              <input value={editing.key} onChange={(e) => setEditing({ ...editing, key: e.target.value })} placeholder="cakes" />
            </div>
            <div className="field">
              <label>Sort order</label>
              <input type="number" value={editing.sort} onChange={(e) => setEditing({ ...editing, sort: parseInt(e.target.value, 10) || 0 })} />
            </div>
            <div className="field">
              <label>Label (EN)</label>
              <input value={editing.labels.en} onChange={(e) => setEditing({ ...editing, labels: { ...editing.labels, en: e.target.value } })} />
            </div>
            <div className="field">
              <label>الاسم (AR)</label>
              <input dir="rtl" value={editing.labels.ar} onChange={(e) => setEditing({ ...editing, labels: { ...editing.labels, ar: e.target.value } })} />
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
