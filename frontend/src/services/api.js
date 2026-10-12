/**
 * Path: frontend/src/services/api.js
 * Responsibility: Central REST client with cookie-based demo sessions and integer-paise helpers.
 * Integration: Vite proxy forwards /api to Express on Mac port 5050.
 */
async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch { throw new Error('Cannot connect to the backend. Check Express and MongoDB.'); }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || `Request failed (${response.status})`);
  return payload.data;
}
export const api = {
  me: () => request('/auth/me'),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  register: (body) => request('/auth/register', { method: 'POST', body }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  updateProfile: (body) => request('/auth/profile', { method: 'PATCH', body }),
  overview: () => request('/dashboard/overview'),
  menu: () => request('/menu'),
  createMenuItem: (body) => request('/menu', { method: 'POST', body }),
  updateMenuItem: (id, body) => request(`/menu/${id}`, { method: 'PUT', body }),
  deleteMenuItem: (id) => request(`/menu/${id}`, { method: 'DELETE' }),
  orders: (status = '') => request(`/orders${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  order: (id) => request(`/orders/${id}`),
  createOrder: (body) => request('/orders', { method: 'POST', body }),
  updateOrder: (id, body) => request(`/orders/${id}`, { method: 'PUT', body }),
  cancelOrder: (id) => request(`/orders/${id}/cancel`, { method: 'PATCH' }),
  previewBill: (id, body) => request(`/orders/${id}/bill-preview`, { method: 'POST', body }),
  checkout: (id, body) => request(`/orders/${id}/checkout`, { method: 'POST', body }),
  bills: (q = '') => request(`/bills${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  bill: (id) => request(`/bills/${id}`),
  dailyReport: (date) => request(`/reports/daily${date ? `?date=${encodeURIComponent(date)}` : ''}`),
  customerOrders: () => request('/customer/orders'),
  customerOrder: (id) => request(`/customer/orders/${id}`),
  customerCheckout: (body) => request('/customer/orders', { method: 'POST', body }),
  customerDemoPay: (id) => request(`/customer/orders/${id}/demo-pay`, { method: 'POST' }),
  customerStats: () => request('/customer/stats'),
};
export function parseRupeesToPaise(value) {
  const text = String(value).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;
  const [rupees, decimals = ''] = text.split('.');
  const result = Number(rupees) * 100 + Number(decimals.padEnd(2, '0'));
  return Number.isSafeInteger(result) ? result : null;
}
export function currency(paise = 0) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((paise || 0) / 100);
}
export function shortDate(value) {
  return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' });
}
export function businessDateToday() {
  return new Date(Date.now() + 330 * 60 * 1000).toISOString().slice(0, 10);
}
