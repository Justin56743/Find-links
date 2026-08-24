const RAW_API_URL = import.meta.env.VITE_API_URL || '/api';
const API_BASE = RAW_API_URL.endsWith('/api') 
  ? RAW_API_URL.replace(/\/+$/, '') 
  : `${RAW_API_URL.replace(/\/+$/, '')}/api`;

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('findlinks_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
};

export const api = {
  auth: {
    login: (email, password) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (name, email, password, defaultPincode) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password, defaultPincode }) }),
    me: () => apiRequest('/auth/me'),
    updatePincode: (pincode) => apiRequest('/auth/pincode', { method: 'PUT', body: JSON.stringify({ pincode }) }),
    updateTelegram: (telegramChatId, telegramUsername) => apiRequest('/auth/telegram', { method: 'PUT', body: JSON.stringify({ telegramChatId, telegramUsername }) })
  },
  products: {
    preview: (url) => apiRequest('/products/preview', { method: 'POST', body: JSON.stringify({ url }) }),
    create: (data) => apiRequest('/products', { method: 'POST', body: JSON.stringify(data) }),
    list: () => apiRequest('/products'),
    get: (id) => apiRequest(`/products/${id}`),
    update: (id, data) => apiRequest(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiRequest(`/products/${id}`, { method: 'DELETE' }),
    refresh: (id) => apiRequest(`/products/${id}/refresh`, { method: 'POST' }),
    simulateDrop: (id, dropPercent = 8) => apiRequest(`/products/${id}/simulate-drop`, { method: 'POST', body: JSON.stringify({ dropPercent }) })
  },
  notifications: {
    list: () => apiRequest('/notifications'),
    markRead: (id) => apiRequest(`/notifications/${id}/read`, { method: 'PUT' }),
    markAllRead: () => apiRequest('/notifications/read-all', { method: 'PUT' }),
    delete: (id) => apiRequest(`/notifications/${id}`, { method: 'DELETE' })
  },
  telegram: {
    status: () => apiRequest('/telegram/status'),
    connect: (chatId, username) => apiRequest('/telegram/connect', { method: 'POST', body: JSON.stringify({ chatId, username }) }),
    disconnect: () => apiRequest('/telegram/disconnect', { method: 'POST' }),
    testMessage: () => apiRequest('/telegram/test', { method: 'POST' })
  }
};
