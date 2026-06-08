const BASE = import.meta.env.VITE_API_URL || '';

// Demo images live in the client's /public/assets; admin-uploaded images live on
// the API under /uploads. Route each to the right origin.
export const assetUrl = (p) => {
  if (!p) return '';
  if (/^https?:\/\//.test(p)) return p;
  const clean = p.replace(/^\//, '');
  if (clean.startsWith('uploads/')) return `${BASE}/${clean}`;
  return `/${clean}`;
};

async function req(path, { method = 'GET', body, token, headers } = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw Object.assign(new Error(data.error || 'Request failed'), {
      status: res.status,
      key: data.error,
    });
  }
  return data;
}

export const api = {
  // public
  config: () => req('/config'),
  categories: () => req('/categories'),
  items: (qs = '') => req('/items' + qs),
  createOrder: (body) => req('/orders', { method: 'POST', body }),
  createEvent: (body) => req('/events', { method: 'POST', body }),
  // auth
  login: (body) => req('/auth/login', { method: 'POST', body }),
  // admin: items
  itemsAll: (token) => req('/items/all', { token }),
  saveItem: (body, token, id) =>
    req(id ? `/items/${id}` : '/items', { method: id ? 'PUT' : 'POST', body, token }),
  deleteItem: (id, token) => req(`/items/${id}`, { method: 'DELETE', token }),
  // admin: categories
  saveCategory: (body, token, id) =>
    req(id ? `/categories/${id}` : '/categories', { method: id ? 'PUT' : 'POST', body, token }),
  deleteCategory: (id, token) => req(`/categories/${id}`, { method: 'DELETE', token }),
  // admin: config
  saveConfig: (body, token) => req('/config', { method: 'PUT', body, token }),
  // admin: dashboard
  overview: (token) => req('/admin/overview', { token }),
  // admin: orders / events
  orders: (token) => req('/orders', { token }),
  setOrderStatus: (id, status, token) =>
    req(`/orders/${id}/status`, { method: 'PATCH', body: { status }, token }),
  events: (token) => req('/events', { token }),
  setEventStatus: (id, status, token) =>
    req(`/events/${id}/status`, { method: 'PATCH', body: { status }, token }),
  // admin: upload
  uploadImage: async (file, token) => {
    const fd = new FormData();
    fd.append('image', file);
    const res = await fetch(`${BASE}/api/uploads`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error || 'Upload failed'), { status: res.status });
    return data; // { path }
  },
};
