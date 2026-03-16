// =============================================================================
// API Client — shared fetch helpers for all pages
// =============================================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ─── Auth Token Helpers ───

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('crucible_token');
}

export function setToken(token) {
  localStorage.setItem('crucible_token', token);
}

export function clearToken() {
  localStorage.removeItem('crucible_token');
  localStorage.removeItem('crucible_user');
}

export function setUser(user) {
  localStorage.setItem('crucible_user', JSON.stringify(user));
}

export function getUser() {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem('crucible_user')); } catch { return null; }
}

export function isAuthenticated() {
  return !!getToken();
}

// ─── Fetch Helpers ───

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res = await fetch(`${API_URL}${path}`, opts);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || data.message || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }

  return data;
}

export function get(path) { return request('GET', path); }
export function post(path, body) { return request('POST', path, body); }
export function put(path, body) { return request('PUT', path, body); }
export function del(path) { return request('DELETE', path); }
