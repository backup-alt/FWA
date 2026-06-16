const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

function getToken() {
  return localStorage.getItem('token');
}

function setToken(token) {
  localStorage.setItem('token', token);
}

function clearToken() {
  localStorage.removeItem('token');
}

async function apiRequest(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401) {
    clearToken();
    window.location.href = `${import.meta.env.BASE_URL}#/login`;
    return null;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }

  return data;
}

export const Auth = {
  login: (username, password) =>
    apiRequest('/auth/login', { method: 'POST', body: { username, password } }),
  register: (username, password, role) =>
    apiRequest('/auth/register', { method: 'POST', body: { username, password, role } }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
};

export const Customers = {
  list: () => apiRequest('/customers'),
  get: (id) => apiRequest(`/customers/${id}`),
  create: (data) => apiRequest('/customers', { method: 'POST', body: data }),
  update: (id, data) => apiRequest(`/customers/${id}`, { method: 'PUT', body: data }),
  remove: (id) => apiRequest(`/customers/${id}`, { method: 'DELETE' }),
};

export const Loans = {
  list: (params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
    );
    const query = new URLSearchParams(cleanParams).toString();
    return apiRequest(`/loans${query ? `?${query}` : ''}`);
  },
  get: (id) => apiRequest(`/loans/${id}`),
  create: (data) => apiRequest('/loans', { method: 'POST', body: data }),
  update: (id, data) => apiRequest(`/loans/${id}`, { method: 'PUT', body: data }),
  remove: (id) => apiRequest(`/loans/${id}`, { method: 'DELETE' }),
  recordPayment: (id, sNo, data) =>
    apiRequest(`/loans/${id}/installments/${sNo}`, { method: 'PUT', body: data }),
  pendingDues: () => apiRequest('/loans/pending-dues'),
  uploadDocument: (id, data) =>
    apiRequest(`/loans/${id}/documents`, { method: 'POST', body: data }),
  deleteDocument: (id, docId) =>
    apiRequest(`/loans/${id}/documents/${docId}`, { method: 'DELETE' }),
};

export const System = {
  dbStatus: () => apiRequest('/system/db-status'),
};

export function formatCurrency(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateInput(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toISOString().split('T')[0];
}

export { getToken, setToken, clearToken, apiRequest };
