




const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

function setToken(token) {
  localStorage.setItem('token', token);
}

function clearToken() {
  localStorage.removeItem('token');
}

function requireAuth() {
  if (!getToken()) {
    window.location.href = '/pages/login.html';
  }
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
    window.location.href = '/pages/login.html';
    return null;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }

  return data;
}


const Auth = {
  login: (username, password) =>
    apiRequest('/auth/login', { method: 'POST', body: { username, password } }),
  register: (username, password, role) =>
    apiRequest('/auth/register', { method: 'POST', body: { username, password, role } }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
};


const Loans = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/loans${query ? `?${query}` : ''}`);
  },
  get: (id) => apiRequest(`/loans/${id}`),
  create: (data) => apiRequest('/loans', { method: 'POST', body: data }),
  update: (id, data) => apiRequest(`/loans/${id}`, { method: 'PUT', body: data }),
  remove: (id) => apiRequest(`/loans/${id}`, { method: 'DELETE' }),
  recordPayment: (id, sNo, data) =>
    apiRequest(`/loans/${id}/installments/${sNo}`, { method: 'PUT', body: data }),
  pendingDues: () => apiRequest('/loans/pending-dues'),
};


function formatCurrency(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateInput(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toISOString().split('T')[0];
}
