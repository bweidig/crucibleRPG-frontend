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

// ─── Debug Mode ───

let _debugMode = false;
let _debugCallback = null;
let _nextActionLabel = null;

export function setDebugMode(enabled) {
  _debugMode = !!enabled;
}

export function getDebugMode() {
  return _debugMode;
}

export function onDebugResponse(callback) {
  _debugCallback = callback;
}

export function setNextActionLabel(label) {
  _nextActionLabel = label;
}

// ─── Fetch Helpers ───

async function request(method, path, body) {
  // Consume action label immediately (prevents stale labels on subsequent requests)
  const actionLabel = _nextActionLabel;
  _nextActionLabel = null;

  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (_debugMode) headers['X-Debug'] = 'true';

  const opts = { method, headers };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const startTime = performance.now();
  const res = await fetch(`${API_URL}${path}`, opts);
  const elapsed = Math.round(performance.now() - startTime);
  const data = await res.json().catch(() => ({}));

  // Strip _debug from response data (prevent leaking into component state)
  const debugPayload = data._debug;
  delete data._debug;

  // Report debug data if callback registered
  if (_debugCallback && debugPayload) {
    const urlLabel = path.replace(/\/api\/game\/\d+\//, '').replace(/\/api\/games\/\d+/, 'games');
    _debugCallback({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date(),
      method,
      url: path,
      status: res.status,
      durationMs: elapsed,
      debug: debugPayload,
      actionLabel: actionLabel || `${method} ${urlLabel}`,
    });
  }

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
export function patch(path, body) { return request('PATCH', path, body); }
export function del(path) { return request('DELETE', path); }

// ─── Public Endpoints ───

export function getAnnouncement() {
  return get('/api/games/announcement');
}

// ─── Snapshot Import ───

export function fetchSnapshotPreview(token) {
  return get(`/api/games/snapshots/${token}`);
}

export function importSharedSnapshot(token) {
  return post(`/api/games/snapshots/${token}/import`);
}

export function importMySnapshot(snapshotId) {
  return post(`/api/games/snapshots/${snapshotId}/import-mine`);
}
