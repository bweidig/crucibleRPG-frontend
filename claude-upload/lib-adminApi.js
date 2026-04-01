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

export function toggleDebug(userId, isDebug) {
  return patch(`/api/admin/users/${userId}/debug`, { isDebug });
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

// ─── Reports ───

export function getAdminReports({ type, status, limit, offset } = {}) {
  const params = new URLSearchParams();
  if (type && type !== 'all') params.set('type', type);
  if (status) params.set('status', status);
  if (limit) params.set('limit', limit);
  if (offset) params.set('offset', offset);
  const qs = params.toString();
  return get(`/api/admin/reports${qs ? `?${qs}` : ''}`);
}

export function updateReport(reportId, data) {
  return patch(`/api/admin/reports/${reportId}`, data);
}

export function getReportSummary() {
  return get('/api/admin/reports/summary');
}

// ─── Invite Code ───

export function getInviteCode() {
  return get('/api/admin/invite-code');
}

export function updateInviteCode(inviteCode) {
  return put('/api/admin/invite-code', { inviteCode });
}
