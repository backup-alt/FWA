const getApiBase = () => {
  const url = import.meta.env.VITE_API_URL;
  if (!url) return '/api';
  
  // If running on localhost or 127.0.0.1, ignore the production VITE_API_URL and use local path
  if (typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return '/api';
  }
  
  return `${url}/api`;
};

const API_BASE = getApiBase();

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
  list: (params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
    );
    const query = new URLSearchParams(cleanParams).toString();
    return apiRequest(`/customers${query ? `?${query}` : ''}`);
  },
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
  closeLoan: (id, data) =>
    apiRequest(`/loans/${id}/close`, { method: 'PUT', body: data }),
  restructureLoan: (id, data) =>
    apiRequest(`/loans/${id}/restructure`, { method: 'PUT', body: data }),
  report: (startDate, endDate) =>
    apiRequest(`/loans/report?startDate=${startDate}&endDate=${endDate}`),
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
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateInput(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  } catch (err) {
    return '';
  }
}

export { getToken, setToken, clearToken, apiRequest };
