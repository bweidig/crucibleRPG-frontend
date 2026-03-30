// =============================================================================
// Admin API — endpoint wrappers for the /admin dashboard
// =============================================================================

import { get, patch, put, del } from '@/lib/api';

// ─── Users ───

export function getAdminUsers() {
  return get('/api/admin/users');
}

export function getAdminUser(userId) {
  return get(`/api/admin/users/${userId}`);
}

export function togglePlaytester(userId, isPlaytester) {
  return patch(`/api/admin/users/${userId}/playtester`, { isPlaytester });
}

// ─── Games ───

export function getAdminGames({ status, search } = {}) {
  const params = new URLSearchParams();
  if (status && status !== 'all') params.set('status', status);
  if (search) params.set('search', search);
  const qs = params.toString();
  return get(`/api/admin/games${qs ? `?${qs}` : ''}`);
}

export function getAdminGameDetail(gameId) {
  return get(`/api/admin/games/${gameId}`);
}

export function deleteAdminGame(gameId) {
  return del(`/api/admin/games/${gameId}`);
}

export function getAdminGameNarrative(gameId) {
  return get(`/api/admin/games/${gameId}/narrative`);
}

// ─── Costs ───

export function getAdminCosts() {
  return get('/api/admin/costs');
}

// ─── Health ───

export function getAdminHealth() {
  return get('/api/admin/health');
}

// ─── Errors ───

export function getAdminErrors({ limit, offset } = {}) {
  const params = new URLSearchParams();
  if (limit) params.set('limit', limit);
  if (offset) params.set('offset', offset);
  const qs = params.toString();
  return get(`/api/admin/errors${qs ? `?${qs}` : ''}`);
}

// ─── Invite Code ───

export function getInviteCode() {
  return get('/api/admin/invite-code');
}

export function updateInviteCode(code) {
  return put('/api/admin/invite-code', { code });
}
