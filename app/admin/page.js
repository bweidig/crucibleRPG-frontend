'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getUser } from '@/lib/api';
import {
  getAdminUsers, getAdminUser, togglePlaytester, toggleDebug,
  getAdminGames, getAdminGameDetail, deleteAdminGame, getAdminGameNarrative,
  getAdminCosts, getAdminHealth,
  getAdminReports, updateReport,
  getAdminAnalytics, distillReports, distillGmQuestions, getAdminGmQuestions,
  getInviteCode, updateInviteCode,
  getAnnouncement as getAdminAnnouncement, setAnnouncement as setAdminAnnouncement, clearAnnouncement as clearAdminAnnouncement,
  getGameLog, getGameLogSnapshot, getGameLogSnapshots,
  getServerLogs, toggleGameLogging,
} from '@/lib/adminApi';
import styles from './page.module.css';

// ═════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═════════════════════════════════════════════════════════════════════════════

function timeAgo(dateStr) {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCost(val) {
  if (val == null) return '$0.00';
  return `$${Number(val).toFixed(4)}`;
}

function formatCostShort(val) {
  if (val == null) return '$0.00';
  return `$${Number(val).toFixed(2)}`;
}

function groupNarrative(entries) {
  const turns = new Map();
  for (const entry of entries) {
    if (!turns.has(entry.turnNumber)) {
      turns.set(entry.turnNumber, { turnNumber: entry.turnNumber, narratorText: null, playerAction: null, significanceScore: 0 });
    }
    const turn = turns.get(entry.turnNumber);
    if (entry.role === 'ai' || entry.role === 'narrator' || entry.role === 'assistant') {
      turn.narratorText = turn.narratorText ? turn.narratorText + '\n\n' + entry.content : entry.content;
      if ((entry.significanceScore || 0) > turn.significanceScore) turn.significanceScore = entry.significanceScore;
    } else if (entry.role === 'player' || entry.role === 'user') {
      turn.playerAction = entry.content;
    }
  }
  return Array.from(turns.values()).sort((a, b) => a.turnNumber - b.turnNumber);
}

function sortData(data, field, direction) {
  return [...data].sort((a, b) => {
    let valA = a[field];
    let valB = b[field];
    if (valA == null && valB == null) return 0;
    if (valA == null) return 1;
    if (valB == null) return -1;
    if (typeof valA === 'string' && typeof valB === 'string') {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }
    let result = valA < valB ? -1 : valA > valB ? 1 : 0;
    return direction === 'desc' ? -result : result;
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═════════════════════════════════════════════════════════════════════════════

function SortHeader({ label, field, sortField, sortDirection, onSort }) {
  const active = sortField === field;
  return (
    <span
      onClick={() => onSort(field)}
      style={{
        fontFamily: 'var(--font-cinzel)', fontSize: 11, fontWeight: 600,
        color: active ? '#c9a84c' : '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase',
        cursor: 'pointer', userSelect: 'none', transition: 'color 0.15s',
      }}
      className={styles.sortHeader}
    >
      {label}
      {active && (
        <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 10, color: '#c9a84c', marginLeft: 4 }}>
          {sortDirection === 'asc' ? '\u25B2' : '\u25BC'}
        </span>
      )}
    </span>
  );
}

function StatusBadge({ status }) {
  const s = (status || '').toLowerCase();
  let cls = styles.badge;
  let label = status || 'Unknown';
  if (s === 'active') cls = styles.badgeActive;
  else if (s === 'initializing') { cls = styles.badgeInitializing; label = 'Init'; }
  else if (s === 'completed') cls = styles.badgeCompleted;
  else if (s === 'abandoned') cls = styles.badgeAbandoned;
  return <span className={cls}>{label}</span>;
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function StatCard({ label, value, valueColor, sub, accent, onClick, compact }) {
  return (
    <div
      className={styles.statCard}
      onClick={onClick}
      style={{
        borderLeft: accent ? `3px solid ${accent}` : undefined,
        cursor: onClick ? 'pointer' : undefined,
      }}
    >
      <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 11, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: compact ? 18 : 24, fontWeight: 700, color: valueColor || '#d0c098', marginBottom: sub ? 4 : 0 }}>
        {value}
      </div>
      {sub && <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#7082a4' }}>{sub}</div>}
    </div>
  );
}

function Toggle({ value, onToggle }) {
  const [status, setStatus] = useState(null);

  async function handleClick(e) {
    e.stopPropagation();
    setStatus('saving');
    try {
      await onToggle();
      setStatus('saved');
      setTimeout(() => setStatus(null), 2000);
    } catch {
      setStatus('failed');
      setTimeout(() => setStatus(null), 3000);
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <button
        className={value ? styles.toggleOn : styles.toggleOff}
        style={{ opacity: status === 'saving' ? 0.5 : 1 }}
        onClick={handleClick}
      />
      {status === 'saved' && <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 11, color: '#8aba7a' }}>Saved</span>}
      {status === 'failed' && <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 11, color: '#e85a5a' }}>Failed</span>}
    </div>
  );
}

function DeleteGameModal({ game, onConfirm, onCancel }) {
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [shaking, setShaking] = useState(false);

  const confirmWord = game.characterName || `game-${game.id}`;
  const matches = confirmText === confirmWord;

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onCancel]);

  async function handleDelete() {
    if (!matches) {
      setShaking(true);
      setTimeout(() => setShaking(false), 400);
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      await onConfirm(game.id);
    } catch (err) {
      setError(err.message || 'Failed to delete game');
      setDeleting(false);
    }
  }

  return (
    <div className={styles.deleteModal}>
      <div onClick={e => e.stopPropagation()} className={styles.deleteModalCard}>
        <h3 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 16, fontWeight: 700, color: '#d0c098', marginBottom: 12 }}>
          Delete Game
        </h3>
        <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#c8c0b0', marginBottom: 4, lineHeight: 1.6 }}>
          This will permanently delete <strong>{game.characterName || `Game #${game.id}`}</strong> &mdash; {game.turnCount ?? 0} turns of data. This cannot be undone.
        </p>
        <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#7082a4', marginTop: 16, marginBottom: 6 }}>
          Type <strong style={{ color: '#c8c0b0' }}>{confirmWord}</strong> to confirm
        </p>
        <input
          value={confirmText}
          onChange={e => setConfirmText(e.target.value)}
          className={shaking ? styles.inputShake : undefined}
          style={{
            width: '100%', boxSizing: 'border-box',
            fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#c8c0b0',
            background: '#0a0e1a', border: `1px solid ${shaking ? '#e85a5a' : '#1e2540'}`,
            borderRadius: 4, padding: '10px 14px', outline: 'none',
            transition: 'border-color 0.2s ease',
          }}
          autoFocus
        />
        {error && (
          <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#e85a5a', marginTop: 8 }}>{error}</p>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
          <button className={styles.ghostBtn} onClick={onCancel} disabled={deleting}>Cancel</button>
          <button
            onClick={handleDelete}
            disabled={!matches || deleting}
            style={{
              fontFamily: 'var(--font-cinzel)', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: matches && !deleting ? '#ffffff' : '#5a4a4a',
              background: matches && !deleting ? '#b83a3a' : '#2a1a1a',
              border: 'none', borderRadius: 4, padding: '10px 20px',
              cursor: matches && !deleting ? 'pointer' : 'default',
              opacity: matches && !deleting ? 1 : 0.5,
              transition: 'all 0.2s ease',
            }}
          >
            {deleting ? 'Deleting...' : 'Delete Forever'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailPanel({ children, onClose }) {
  return (
    <div className={styles.pushPanel}>
      <button className={styles.panelClose} onClick={onClose}>&times;</button>
      <div style={{ padding: '24px 28px' }}>{children}</div>
    </div>
  );
}

function TurnBlock({ entry }) {
  const [open, setOpen] = useState(false);
  const sig = entry.significanceScore;
  const stars = sig >= 5 ? '\u2605\u2605\u2605\u2605\u2605' : sig >= 4 ? '\u2605\u2605\u2605\u2605' : sig >= 3 ? '\u2605\u2605\u2605' : sig >= 2 ? '\u2605\u2605' : sig >= 1 ? '\u2605' : '';
  const preview = !open && entry.narratorText ? entry.narratorText.substring(0, 100) + (entry.narratorText.length > 100 ? '...' : '') : '';
  return (
    <div style={{ borderBottom: '1px solid #2a2622' }}>
      <div
        className={styles.turnHeader}
        onClick={() => setOpen(!open)}
        style={{ padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: '#7082a4' }}>
            Turn {entry.turnNumber}
          </span>
          {stars && <span style={{ fontSize: 10, color: '#c9a84c', marginLeft: 6 }}>{stars}</span>}
          {preview && <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#5a6a88', marginLeft: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preview}</span>}
        </div>
        <span style={{ color: '#7082a4', fontSize: 11, flexShrink: 0 }}>{open ? '\u25B2' : '\u25BC'}</span>
      </div>
      {open && (
        <div style={{ padding: '8px 10px 14px' }}>
          {entry.narratorText && (
            <p style={{ fontFamily: 'var(--font-alegreya)', fontStyle: 'italic', fontSize: 14, color: '#d4c4a0', lineHeight: 1.7, marginBottom: 8 }}>
              {entry.narratorText}
            </p>
          )}
          {entry.playerAction && (
            <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#c8c0b0', lineHeight: 1.6 }}>
              <strong style={{ color: '#9a8545' }}>Action:</strong> {entry.playerAction}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// USERS TAB
// ═════════════════════════════════════════════════════════════════════════════

function UsersTab({ data, loading, onRefresh, onGameDeleted, onViewGame, onNavigateToGames }) {
  const [search, setSearch] = useState('');
  const [pendingOnly, setPendingOnly] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const currentUser = getUser();

  useEffect(() => { if (data?.users) setUsers(data.users); }, [data]);

  const filtered = users.filter(u => {
    if (pendingOnly && u.isPlaytester) return false;
    if (pendingOnly && !u.playtestAbout && !u.playtestSource) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.displayName || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
  });

  const sorted = useMemo(() => sortData(filtered, sortField, sortDirection), [filtered, sortField, sortDirection]);

  function handleSort(field) {
    if (sortField === field) setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('asc'); }
  }

  async function openUserDetail(user) {
    setSelectedUser(user);
    setDetailLoading(true);
    try { setUserDetail(await getAdminUser(user.id)); }
    catch { setUserDetail(null); }
    setDetailLoading(false);
  }

  async function handleDeleteGame(gameId) {
    await deleteAdminGame(gameId);
    setUserDetail(prev => {
      if (!prev) return prev;
      return { ...prev, games: (prev.games || []).filter(g => g.id !== gameId) };
    });
    setUsers(prev => prev.map(u =>
      u.id === selectedUser?.id ? { ...u, gameCount: Math.max(0, (u.gameCount ?? 1) - 1) } : u
    ));
    if (onGameDeleted) onGameDeleted(gameId);
    setDeleteTarget(null);
  }

  const gridCols = '1.5fr 2fr 70px 90px 90px 100px';

  if (loading) return <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4', textAlign: 'center', padding: 40 }}>Loading...</p>;

  return (
    <div style={{ display: 'flex', gap: 0 }}>
      {/* User Detail Panel */}
      {selectedUser && (
        <DetailPanel onClose={() => { setSelectedUser(null); setUserDetail(null); setDeleteTarget(null); }}>
          {detailLoading ? (
            <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4' }}>Loading...</p>
          ) : userDetail ? (
            <div>
              <h3 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 18, fontWeight: 700, color: '#d0c098', marginBottom: 4 }}>
                {userDetail.user?.displayName || selectedUser.displayName}
              </h3>
              <p style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: '#7082a4', marginBottom: 4 }}>
                {userDetail.user?.email || selectedUser.email}
              </p>
              <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4', marginBottom: 20 }}>
                Joined {formatDate(userDetail.user?.createdAt)} &middot; Playtester: {userDetail.user?.isPlaytester ? 'Yes' : 'No'} &middot; Debug: {userDetail.user?.isDebug ? 'Yes' : 'No'}
              </p>

              {(userDetail.user?.playtestAbout || userDetail.user?.playtestSource) && (
                <div style={{ marginBottom: 24 }}>
                  <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 11, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
                    Playtest Request
                  </span>
                  {userDetail.user.playtestAbout && (
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#6b83a3' }}>About: </span>
                      <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#8a94a8' }}>{userDetail.user.playtestAbout}</span>
                    </div>
                  )}
                  {userDetail.user.playtestSource && (
                    <div>
                      <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#6b83a3' }}>Source: </span>
                      <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#8a94a8' }}>{userDetail.user.playtestSource}</span>
                    </div>
                  )}
                </div>
              )}

              <div style={{ marginBottom: 24 }}>
                <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 11, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Total AI Spend
                </span>
                <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 18, color: '#d0c098', marginTop: 4 }}>
                  {formatCostShort(userDetail.totalCost)}
                </div>
              </div>

              <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 11, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
                Games ({userDetail.games?.length || 0})
              </span>
              <div className={styles.tableCard}>
                {(userDetail.games || []).map(g => (
                  <div key={g.id} className={styles.clickableRow} onClick={() => {
                    setSelectedUser(null); setUserDetail(null); setDeleteTarget(null);
                    onViewGame?.(g.id);
                  }} style={{
                    display: 'grid', gridTemplateColumns: '1.5fr 1fr 65px 55px 75px 28px',
                    padding: '8px 12px', borderBottom: '1px solid #2a2622', alignItems: 'center',
                  }}>
                    <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#c8c0b0' }}>
                      {g.characterName || <em style={{ color: '#7082a4' }}>No character yet</em>}
                    </span>
                    <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#8a94a8' }}>{g.setting || '—'}</span>
                    <StatusBadge status={g.status} />
                    <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: '#c8c0b0' }}>{g.turnCount ?? 0}</span>
                    <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: '#c8c0b0' }}>{formatCost(g.totalCost)}</span>
                    <button
                      className={styles.deleteIcon}
                      aria-label="Delete game"
                      onClick={e => { e.stopPropagation(); setDeleteTarget(g); }}
                    ><TrashIcon /></button>
                  </div>
                ))}
                {(!userDetail.games || userDetail.games.length === 0) && (
                  <div style={{ padding: 14, textAlign: 'center', fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#7082a4' }}>No games.</div>
                )}
              </div>
            </div>
          ) : (
            <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4' }}>Failed to load user details.</p>
          )}
        </DetailPanel>
      )}

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 18, fontWeight: 700, color: '#d0c098', margin: 0 }}>Users</h2>
            <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 14, color: '#7082a4' }}>{filtered.length}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input className={styles.searchInput} placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
            <button className={pendingOnly ? styles.filterPillActive : styles.filterPill} onClick={() => setPendingOnly(!pendingOnly)} style={{ fontSize: 11, padding: '4px 10px' }}>Pending Requests</button>
            <button className={styles.refreshBtn} onClick={onRefresh}>Refresh</button>
          </div>
        </div>

        <div className={styles.tableCard}>
          <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 12, padding: '10px 16px', borderBottom: '1px solid #2a2622' }}>
            <SortHeader label="Name" field="displayName" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
            <SortHeader label="Email" field="email" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
            <SortHeader label="Games" field="gameCount" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
            <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 11, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Playtester</span>
            <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 11, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Debug</span>
            <SortHeader label="Joined" field="createdAt" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
          </div>
          {sorted.map(user => (
            <div key={user.id} className={styles.clickableRow} onClick={() => openUserDetail(user)} style={{
              display: 'grid', gridTemplateColumns: gridCols, gap: 12,
              padding: '10px 16px', borderBottom: '1px solid #2a2622', alignItems: 'center',
            }}>
              <div>
                <span className={styles.nameLink}>{user.displayName || 'No name'}</span>
                {currentUser?.email === user.email && <span className={styles.badgeAdmin}>ADMIN</span>}
              </div>
              <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: '#7082a4' }}>{user.email}</span>
              <span
                onClick={e => { e.stopPropagation(); if (user.gameCount > 0) onNavigateToGames?.(user.displayName || user.email); }}
                style={{
                  fontFamily: 'var(--font-jetbrains-mono)', fontSize: 13, color: '#c8c0b0',
                  cursor: user.gameCount > 0 ? 'pointer' : 'default', transition: 'color 0.15s',
                }}
                onMouseEnter={e => { if (user.gameCount > 0) e.currentTarget.style.color = '#c9a84c'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#c8c0b0'; }}
              >{user.gameCount ?? 0}</span>
              <Toggle
                value={user.isPlaytester}
                onToggle={async () => {
                  const newVal = !user.isPlaytester;
                  setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isPlaytester: newVal } : u));
                  try { await togglePlaytester(user.id, newVal); }
                  catch (err) { setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isPlaytester: !newVal } : u)); throw err; }
                }}
              />
              <Toggle
                value={user.isDebug}
                onToggle={async () => {
                  const newVal = !user.isDebug;
                  setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isDebug: newVal } : u));
                  try { await toggleDebug(user.id, newVal); }
                  catch (err) { setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isDebug: !newVal } : u)); throw err; }
                }}
              />
              <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4' }}>{formatDate(user.createdAt)}</span>
            </div>
          ))}
          {sorted.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4' }}>No users found.</div>
          )}
        </div>
        <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4', fontStyle: 'italic', marginTop: 8 }}>
          Last active tracking coming soon
        </div>
      </div>

      {deleteTarget && (
        <DeleteGameModal game={deleteTarget} onConfirm={handleDeleteGame} onCancel={() => setDeleteTarget(null)} />
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// GAMES TAB
// ═════════════════════════════════════════════════════════════════════════════

function GamesTab({ data, loading, onRefresh, pendingGameId, onClearPending, pendingSearch, onClearPendingSearch, onViewGameLog }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedGame, setSelectedGame] = useState(null);
  const [gameDetail, setGameDetail] = useState(null);
  const [narrative, setNarrative] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [localGames, setLocalGames] = useState(null);
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkDeleteText, setBulkDeleteText] = useState('');
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState(null);
  const [backstoryExpanded, setBackstoryExpanded] = useState(false);

  useEffect(() => {
    if (pendingSearch) {
      setSearch(pendingSearch);
      if (onClearPendingSearch) onClearPendingSearch();
    }
  }, [pendingSearch]);

  const games = localGames || data?.games || [];

  const filtered = games.filter(g => {
    if (statusFilter !== 'all' && (g.status || '').toLowerCase() !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (g.characterName || '').toLowerCase().includes(q)
      || (g.playerName || '').toLowerCase().includes(q)
      || (g.setting || '').toLowerCase().includes(q);
  });

  const sorted = useMemo(() => sortData(filtered, sortField, sortDirection), [filtered, sortField, sortDirection]);

  function handleSort(field) {
    if (sortField === field) setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('asc'); }
  }

  function toggleSelect(id) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    const visibleIds = sorted.map(g => g.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(prev => { const next = new Set(prev); visibleIds.forEach(id => next.delete(id)); return next; });
    } else {
      setSelectedIds(prev => { const next = new Set(prev); visibleIds.forEach(id => next.add(id)); return next; });
    }
  }

  useEffect(() => {
    if (pendingGameId) {
      openGameDetail({ id: pendingGameId });
      if (onClearPending) onClearPending();
    }
  }, [pendingGameId]);

  async function openGameDetail(game) {
    setSelectedGame(game);
    setDetailLoading(true);
    setNarrative(null);
    setBackstoryExpanded(false);
    try {
      const detail = await getAdminGameDetail(game.id);
      if (detail.narrative) detail.narrative = groupNarrative(detail.narrative);
      setGameDetail(detail);
    } catch { setGameDetail(null); }
    setDetailLoading(false);
  }

  async function loadFullNarrative() {
    if (!selectedGame) return;
    try {
      const narr = await getAdminGameNarrative(selectedGame.id);
      if (narr?.entries) narr.entries = groupNarrative(narr.entries);
      else if (narr?.narrative) narr.entries = groupNarrative(narr.narrative);
      setNarrative(narr);
    } catch { /* ignore */ }
  }

  async function handleDelete(gameId) {
    await deleteAdminGame(gameId);
    setSelectedGame(null);
    setGameDetail(null);
    setDeleteTarget(null);
    setLocalGames(prev => (prev || data?.games || []).filter(g => g.id !== gameId));
  }

  async function handleRowDelete(gameId) {
    await deleteAdminGame(gameId);
    setLocalGames(prev => (prev || data?.games || []).filter(g => g.id !== gameId));
    setDeleteTarget(null);
  }

  const statuses = ['all', 'active', 'initializing', 'completed', 'abandoned'];
  const gameCols = '35px 45px 1fr 1fr 1fr 90px 60px 85px 75px 85px 35px';

  if (loading) return <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4', textAlign: 'center', padding: 40 }}>Loading...</p>;

  return (
    <div style={{ display: 'flex', gap: 0 }}>
      {/* Game Detail Panel */}
      {selectedGame && (
        <DetailPanel onClose={() => { setSelectedGame(null); setGameDetail(null); setNarrative(null); setDeleteTarget(null); }}>
          {detailLoading ? (
            <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4' }}>Loading...</p>
          ) : gameDetail ? (
            <div>
              {/* Header */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <h3 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 18, fontWeight: 700, color: '#d0c098', margin: 0 }}>
                    Game #{gameDetail.game?.id ?? selectedGame.id}
                  </h3>
                  <StatusBadge status={gameDetail.game?.status || selectedGame.status} />
                </div>
                <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#c8c0b0', marginBottom: 2 }}>
                  {gameDetail.game?.characterName || 'No character'} &middot; {gameDetail.game?.setting || 'No setting'}
                </p>
                <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#8a94a8', marginBottom: 6 }}>
                  {gameDetail.game?.playerName || '—'} ({gameDetail.game?.playerEmail || '—'})
                </p>
                <p style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 13, color: '#d0c098', marginBottom: 2 }}>
                  Total: {formatCost(gameDetail.game?.totalCost)}
                </p>
                {(gameDetail.game?.initCost > 0 || gameDetail.game?.gameplayCost > 0) && (
                  <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4', marginBottom: 4 }}>
                    Init: {formatCost(gameDetail.game?.initCost)} &middot; Gameplay: {formatCost(gameDetail.game?.gameplayCost)}
                  </p>
                )}
                <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4' }}>
                  {gameDetail.game?.turnCount ?? 0} turns &middot; Created {formatDate(gameDetail.game?.createdAt)} &middot; Last played {timeAgo(gameDetail.game?.lastPlayedAt || gameDetail.game?.lastPlayed)}
                </p>
              </div>

              {/* Character */}
              {gameDetail.character && (
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 11, fontWeight: 700, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Character</h4>
                  <div style={{ background: '#111528', border: '1px solid #3a3328', borderRadius: 6, padding: 16 }}>
                    <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#c8c0b0', marginBottom: 8 }}>
                      <strong style={{ color: '#d0c098' }}>{gameDetail.character.name}</strong>
                    </p>
                    {gameDetail.character.backstory && (
                      <div style={{ marginBottom: 12 }}>
                        <p style={{ fontFamily: 'var(--font-alegreya)', fontStyle: 'italic', fontSize: 13, color: '#8a94a8', lineHeight: 1.6, margin: 0 }}>
                          {!backstoryExpanded && gameDetail.character.backstory.length > 300
                            ? gameDetail.character.backstory.slice(0, 300) + '...'
                            : gameDetail.character.backstory}
                        </p>
                        {gameDetail.character.backstory.length > 300 && (
                          <button onClick={() => setBackstoryExpanded(!backstoryExpanded)} style={{
                            background: 'none', border: 'none', color: '#c9a84c', fontSize: 12,
                            fontFamily: 'var(--font-alegreya-sans)', cursor: 'pointer', padding: 0, marginTop: 4,
                          }}>{backstoryExpanded ? 'Show less' : 'Show more'}</button>
                        )}
                      </div>
                    )}
                    {gameDetail.character.stats && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px', marginBottom: 12 }}>
                        {Object.entries(gameDetail.character.stats).map(([stat, val]) => (
                          <div key={stat} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #2a2622' }}>
                            <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 11, fontWeight: 600, color: '#9a8545' }}>{stat.toUpperCase()}</span>
                            <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 13, color: '#c8c0b0' }}>
                              {typeof val === 'object'
                                ? (val.base != null && val.effective != null
                                  ? (val.effective === val.base ? `${val.effective}` : `${val.effective}/${val.base}`)
                                  : `${val.effective ?? val.base ?? '—'}`)
                                : val}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {gameDetail.character.skills?.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 10, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em' }}>SKILLS</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                          {gameDetail.character.skills.map((sk, i) => (
                            <span key={i} style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#8a94a8', background: '#0a0e1a', padding: '2px 8px', borderRadius: 3, border: '1px solid #1e2540' }}>
                              {typeof sk === 'string' ? sk : `${sk.name} ${sk.modifier ?? ''}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {gameDetail.character.conditions?.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 10, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em' }}>CONDITIONS</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                          {gameDetail.character.conditions.map((c, i) => (
                            <span key={i} style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#e8845a', background: '#201416', padding: '2px 8px', borderRadius: 3, border: '1px solid #e8845a33' }}>
                              {typeof c === 'string' ? c : `${c.name} ${c.penalty ?? ''}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {gameDetail.character.inventory?.length > 0 && (
                      <div>
                        <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 10, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em' }}>INVENTORY</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                          {gameDetail.character.inventory.map((item, i) => (
                            <span key={i} style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#c8c0b0', background: '#0a0e1a', padding: '2px 8px', borderRadius: 3, border: '1px solid #1e2540' }}>
                              {typeof item === 'string' ? item : item.name || 'Unknown'}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* View Game Log + Server Log Capture toggle */}
              <div style={{ marginBottom: 24 }}>
                <button className={styles.goldBtn} onClick={() => onViewGameLog?.(gameDetail.game?.id ?? selectedGame.id)}>
                  View Game Log &rarr;
                </button>

                {/* AD-583: Per-game server log capture toggle. Playtester games
                    are always-on (forced by the backend) so we render a static
                    indicator rather than an interactive Toggle. */}
                {(() => {
                  const isPlaytester = gameDetail.game?.playerIsPlaytester
                    ?? gameDetail.game?.isPlaytester
                    ?? gameDetail.player?.isPlaytester
                    ?? false;
                  const enabled = isPlaytester
                    ? true
                    : (gameDetail.game?.loggingEnabled ?? false);
                  const gid = gameDetail.game?.id ?? selectedGame.id;
                  return (
                    <div style={{
                      marginTop: 14,
                      padding: '12px 14px',
                      background: '#0a0e1a',
                      border: '1px solid #1e2540',
                      borderRadius: 6,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {isPlaytester ? (
                          <div
                            className={styles.toggleOn}
                            style={{ opacity: 0.6, cursor: 'default' }}
                            aria-label="Server logging always on for playtester"
                          />
                        ) : (
                          <Toggle
                            value={enabled}
                            onToggle={async () => {
                              const newVal = !enabled;
                              const result = await toggleGameLogging(gid, newVal);
                              setGameDetail(prev => prev ? {
                                ...prev,
                                game: {
                                  ...prev.game,
                                  loggingEnabled: result?.loggingEnabled ?? newVal,
                                },
                              } : prev);
                            }}
                          />
                        )}
                        <span style={{
                          fontFamily: 'var(--font-alegreya-sans)',
                          fontSize: 13,
                          fontWeight: 600,
                          color: '#c8c0b0',
                        }}>
                          Capture Server Logs
                        </span>
                      </div>
                      <p style={{
                        fontFamily: 'var(--font-alegreya-sans)',
                        fontSize: 12,
                        color: '#7082a4',
                        margin: '8px 0 0 0',
                        lineHeight: 1.5,
                      }}>
                        {isPlaytester
                          ? 'Always on for playtester games.'
                          : 'Saves all server console output for debugging. Auto-enabled for playtester games.'}
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Narrative Log */}
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 11, fontWeight: 700, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Narrative Log</h4>
                <div className={styles.tableCard}>
                  {(narrative?.entries || gameDetail.narrative || []).slice(0, narrative ? undefined : 200).map((entry, i) => (
                    <TurnBlock key={i} entry={entry} />
                  ))}
                  {!narrative && (gameDetail.narrative?.length || 0) > 200 && (
                    <button onClick={loadFullNarrative} style={{ width: '100%', padding: 12, background: 'none', border: 'none', fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#c9a84c', cursor: 'pointer' }}>
                      Load full narrative
                    </button>
                  )}
                  {(!gameDetail.narrative || gameDetail.narrative.length === 0) && !narrative && (
                    <div style={{ padding: 14, textAlign: 'center', fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#7082a4' }}>No narrative entries.</div>
                  )}
                </div>
              </div>

              {/* Delete */}
              <div style={{ borderTop: '1px solid #1e2540', paddingTop: 20 }}>
                <button className={styles.dangerBtn} onClick={() => setDeleteTarget({
                  id: gameDetail.game?.id ?? selectedGame.id,
                  characterName: gameDetail.game?.characterName,
                  turnCount: gameDetail.game?.turnCount ?? 0,
                })}>Delete Game</button>
              </div>
            </div>
          ) : (
            <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4' }}>Failed to load game details.</p>
          )}
        </DetailPanel>
      )}

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 18, fontWeight: 700, color: '#d0c098', margin: 0 }}>All Games</h2>
            <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 14, color: '#7082a4' }}>{filtered.length}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input className={styles.searchInput} placeholder="Search by character, player, or setting..." value={search} onChange={e => setSearch(e.target.value)} />
            <button className={styles.refreshBtn} onClick={onRefresh}>Refresh</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {statuses.map(s => (
            <button key={s} className={statusFilter === s ? styles.filterPillActive : styles.filterPill} onClick={() => setStatusFilter(s)}>
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {selectedIds.size > 0 && (
          <div className={styles.bulkBar}>
            <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#c8c0b0' }}>
              <strong>{selectedIds.size}</strong> selected
            </span>
            <button className={styles.dangerBtn} style={{ padding: '6px 14px', fontSize: 10 }}
              onClick={() => { setBulkDeleteConfirm(true); setBulkDeleteText(''); setBulkDeleteProgress(null); }}>
              Delete Selected
            </button>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4' }}
              onClick={() => setSelectedIds(new Set())}>
              Clear
            </button>
          </div>
        )}

        <div className={styles.tableCard} style={{ overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: gameCols, gap: 8, padding: '10px 16px', borderBottom: '1px solid #2a2622', minWidth: 900 }}>
            <input type="checkbox" className={styles.checkbox}
              checked={sorted.length > 0 && sorted.every(g => selectedIds.has(g.id))}
              onChange={toggleSelectAll} />
            <SortHeader label="ID" field="id" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
            <SortHeader label="Character" field="characterName" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
            <SortHeader label="Player" field="playerName" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
            <SortHeader label="Setting" field="setting" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
            <SortHeader label="Status" field="status" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
            <SortHeader label="Turns" field="turnCount" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
            <SortHeader label="AI Cost" field="totalCost" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
            <SortHeader label="$/Turn" field="costPerTurn" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
            <SortHeader label="Last Played" field="lastPlayedAt" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
            <span />
          </div>
          {sorted.map(game => {
            const isDim = game.turnCount === 0 || !game.characterName;
            return (
              <div key={game.id} className={styles.clickableRow} onClick={() => openGameDetail(game)} style={{
                display: 'grid', gridTemplateColumns: gameCols, gap: 8,
                padding: '10px 16px', borderBottom: '1px solid #2a2622', alignItems: 'center', minWidth: 900,
                opacity: isDim ? 0.55 : 1,
              }}>
                <input type="checkbox" className={styles.checkbox}
                  checked={selectedIds.has(game.id)}
                  onChange={() => toggleSelect(game.id)}
                  onClick={e => e.stopPropagation()} />
                <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: '#7082a4' }}>#{game.id}</span>
                <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#c8c0b0' }}>
                  {game.characterName || <em style={{ color: '#7082a4' }}>No character yet</em>}
                </span>
                <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#8a94a8' }}>{game.playerName || '—'}</span>
                <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#8a94a8' }}>{game.setting || '—'}</span>
                <StatusBadge status={game.status} />
                <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 13, color: '#c8c0b0' }}>{game.turnCount ?? 0}</span>
                <div className={styles.costCell}>
                  <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 13, color: (game.totalCost || 0) > 0.5 ? '#e8c45a' : '#c8c0b0', fontWeight: (game.totalCost || 0) > 0.5 ? 600 : 400 }}>
                    {formatCost(game.totalCost)}
                  </span>
                  {game.initCost > 0 && <div className={styles.costBreakdown}>Init: {formatCost(game.initCost)} &middot; Gameplay: {formatCost(game.gameplayCost)}</div>}
                </div>
                <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: '#7082a4' }}>
                  {!game.turnCount ? '\u2014' : game.costPerTurn != null ? formatCost(game.costPerTurn) : `$${((game.gameplayCost ?? game.totalCost) / game.turnCount).toFixed(3)}`}
                </span>
                <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4' }}>{timeAgo(game.lastPlayedAt || game.lastPlayed)}</span>
                <button className={styles.deleteIcon} aria-label="Delete game" onClick={e => { e.stopPropagation(); setDeleteTarget(game); }}><TrashIcon /></button>
              </div>
            );
          })}
          {sorted.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4' }}>No games found.</div>
          )}
        </div>
      </div>

      {/* Row delete modal */}
      {deleteTarget && !selectedGame && (
        <DeleteGameModal game={deleteTarget} onConfirm={handleRowDelete} onCancel={() => setDeleteTarget(null)} />
      )}

      {/* Detail panel delete modal */}
      {deleteTarget && selectedGame && (
        <DeleteGameModal game={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      )}

      {/* Bulk delete modal */}
      {bulkDeleteConfirm && (
        <div className={styles.deleteModal}>
          <div onClick={e => e.stopPropagation()} className={styles.deleteModalCard}>
            <h3 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 16, fontWeight: 700, color: '#d0c098', marginBottom: 12 }}>
              Delete {selectedIds.size} Games
            </h3>
            <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#c8c0b0', marginBottom: 4, lineHeight: 1.6 }}>
              This will permanently delete <strong>{selectedIds.size}</strong> game{selectedIds.size !== 1 ? 's' : ''}. This cannot be undone.
            </p>
            {bulkDeleteProgress != null ? (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#c8c0b0', marginBottom: 8 }}>
                  Deleting... ({bulkDeleteProgress} of {selectedIds.size})
                </div>
                <div style={{ background: '#1e2540', borderRadius: 3, height: 6 }}>
                  <div style={{ background: '#e85a5a', height: 6, borderRadius: 3, width: `${(bulkDeleteProgress / selectedIds.size) * 100}%`, transition: 'width 0.2s ease' }} />
                </div>
              </div>
            ) : (
              <>
                <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#7082a4', marginTop: 16, marginBottom: 6 }}>
                  Type <strong style={{ color: '#c8c0b0' }}>delete {selectedIds.size}</strong> to confirm
                </p>
                <input
                  value={bulkDeleteText}
                  onChange={e => setBulkDeleteText(e.target.value)}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#c8c0b0',
                    background: '#0a0e1a', border: '1px solid #1e2540',
                    borderRadius: 4, padding: '10px 14px', outline: 'none',
                  }}
                  autoFocus
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
                  <button className={styles.ghostBtn} onClick={() => { setBulkDeleteConfirm(false); setBulkDeleteText(''); }}>Cancel</button>
                  <button
                    onClick={async () => {
                      if (bulkDeleteText !== `delete ${selectedIds.size}`) return;
                      const toDelete = [...selectedIds];
                      setBulkDeleteProgress(0);
                      for (let i = 0; i < toDelete.length; i++) {
                        try { await deleteAdminGame(toDelete[i]); } catch { /* continue */ }
                        setBulkDeleteProgress(i + 1);
                      }
                      setLocalGames(prev => (prev || data?.games || []).filter(g => !selectedIds.has(g.id)));
                      setSelectedIds(new Set());
                      setBulkDeleteConfirm(false);
                      setBulkDeleteText('');
                      setBulkDeleteProgress(null);
                    }}
                    disabled={bulkDeleteText !== `delete ${selectedIds.size}`}
                    style={{
                      fontFamily: 'var(--font-cinzel)', fontSize: 11, fontWeight: 700,
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                      color: bulkDeleteText === `delete ${selectedIds.size}` ? '#ffffff' : '#5a4a4a',
                      background: bulkDeleteText === `delete ${selectedIds.size}` ? '#b83a3a' : '#2a1a1a',
                      border: 'none', borderRadius: 4, padding: '10px 20px',
                      cursor: bulkDeleteText === `delete ${selectedIds.size}` ? 'pointer' : 'default',
                      opacity: bulkDeleteText === `delete ${selectedIds.size}` ? 1 : 0.5,
                      transition: 'all 0.2s ease',
                    }}
                  >Delete All</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// COSTS TAB
// ═════════════════════════════════════════════════════════════════════════════

function CostsTab({ data, loading, onRefresh, onViewGame }) {
  if (loading) return <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4', textAlign: 'center', padding: 40 }}>Loading...</p>;

  const costs = data || {};

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 18, fontWeight: 700, color: '#d0c098', margin: 0 }}>Costs</h2>
        <button className={styles.refreshBtn} onClick={onRefresh}>Refresh</button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 12 }}>
        <StatCard label="Total Spend" value={formatCostShort(costs.totalSpend)} sub="Across all games" />
        <StatCard label="Total Turns" value={String(costs.totalTurns ?? 0)} sub="All users combined" />
        <StatCard label="Avg Cost/Turn" value={formatCost(costs.avgCostPerTurn)} sub="Gameplay only" />
        <StatCard label="Active Games" value={String(costs.activeGames ?? 0)} sub="Currently in progress" />
      </div>

      {(costs.totalInitCost != null || costs.totalGameplayCost != null) && (
        <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4', marginBottom: 28 }}>
          Init costs: {formatCost(costs.totalInitCost)} &middot; Gameplay costs: {formatCost(costs.totalGameplayCost)}
          {(costs.totalGmSpend > 0 || costs.totalGmCalls > 0) && (
            <> &middot; GM costs: {formatCost(costs.totalGmSpend)} ({costs.totalGmCalls ?? 0} calls)</>
          )}
        </p>
      )}
      {costs.totalInitCost == null && costs.totalGameplayCost == null && <div style={{ marginBottom: 28 }} />}

      {costs.topGames?.length > 0 && (
        <div className={styles.tableCard}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #2a2622' }}>
            <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 11, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Highest-Cost Games
            </span>
          </div>
          {costs.topGames.map((g, i) => (
            <div key={i} className={styles.clickableRow} onClick={() => g.gameId && onViewGame?.(g.gameId)} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 16px', borderBottom: '1px solid #2a2622',
              cursor: g.gameId ? 'pointer' : 'default',
            }}>
              <div>
                {g.gameId && <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: '#7082a4', marginRight: 8 }}>#{g.gameId}</span>}
                <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#c8c0b0' }}>{g.characterName || 'Unnamed'}</span>
                <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4', marginLeft: 8 }}>{g.playerName || ''}</span>
              </div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: '#7082a4' }}>{g.turnCount ?? 0} turns</span>
                <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 13, fontWeight: 600, color: '#c9a84c' }}>{formatCost(g.totalCost)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// HEALTH TAB
// ═════════════════════════════════════════════════════════════════════════════

function HealthTab({ data, loading, onRefresh, onSwitchTab, onViewStuckGame }) {
  const [showErrors, setShowErrors] = useState(false);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);
  const [deleteAllText, setDeleteAllText] = useState('');
  const [deleteAllProgress, setDeleteAllProgress] = useState(null);
  const [localStuckRemoved, setLocalStuckRemoved] = useState([]);
  const [stuckDeleteTarget, setStuckDeleteTarget] = useState(null);

  if (loading) return <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4', textAlign: 'center', padding: 40 }}>Loading...</p>;

  const h = data || {};
  const db = h.database || {};
  const counts = h.counts || {};
  const errors = h.errors || {};
  const fallbacks = h.fallbacks || {};
  const stuck = (h.stuckGames || []).filter(g => !localStuckRemoved.includes(g.id));
  const reports = h.reports || {};
  const storytellers = h.storytellerPopularity || [];
  const settings = h.settingPopularity || [];
  const retention = h.retention || {};
  const maxST = storytellers.length > 0 ? storytellers[0].count : 1;
  const maxSE = settings.length > 0 ? settings[0].count : 1;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 18, fontWeight: 700, color: '#d0c098', margin: 0 }}>Health</h2>
        <button className={styles.refreshBtn} onClick={onRefresh}>Refresh</button>
      </div>

      {/* Row 1: Status Cards */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
        <StatCard
          label="Database"
          value={db.connected ? 'Connected' : 'Error'}
          valueColor={db.connected ? '#8aba7a' : '#e85a5a'}
          accent={db.connected ? '#8aba7a' : '#e85a5a'}
          sub={db.size || 'Unavailable'}
        />
        <StatCard
          label="Errors (24h)"
          value={errors.last24h ?? 0}
          valueColor={(errors.last24h || 0) > 0 ? '#e8845a' : '#d0c098'}
          accent={(errors.last24h || 0) > 0 ? '#e8845a' : undefined}
          sub={
            (errors.last24h || 0) > 0
              ? <button onClick={() => setShowErrors(!showErrors)} style={{ background: 'none', border: 'none', fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#c9a84c', cursor: 'pointer', padding: 0 }}>{showErrors ? 'Hide details' : 'View details'}</button>
              : undefined
          }
        />
        <StatCard
          label="AI Fallbacks"
          value={fallbacks.last24h ?? 0}
          valueColor={(fallbacks.last24h || 0) > 0 ? '#e8c45a' : '#8aba7a'}
          accent={(fallbacks.last24h || 0) > 0 ? '#e8c45a' : '#8aba7a'}
          sub={`${fallbacks.last7d ?? 0} this week \u00B7 ${fallbacks.total ?? 0} all time`}
        />
        <StatCard
          label="Stuck Games"
          value={stuck.length}
          valueColor={stuck.length > 0 ? '#e8c45a' : '#d0c098'}
          accent={stuck.length > 0 ? '#e8c45a' : undefined}
          sub={stuck.length > 0 ? 'See below' : 'None'}
        />
        <StatCard
          label="Open Reports"
          value={(reports.openBugs || 0) + (reports.openSuggestions || 0)}
          valueColor={((reports.openBugs || 0) + (reports.openSuggestions || 0)) > 0 ? '#e8c45a' : '#d0c098'}
          accent={((reports.openBugs || 0) + (reports.openSuggestions || 0)) > 0 ? '#e8c45a' : undefined}
          onClick={() => { if (reports.openBugs || reports.openSuggestions) onSwitchTab?.('Reports'); }}
          sub={`${reports.openBugs || 0} bugs \u00B7 ${reports.openSuggestions || 0} suggestions`}
        />
      </div>

      {/* Row 2: Count Cards */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
        <StatCard label="Users" value={counts.totalUsers ?? 0} sub={`${counts.totalPlaytesters ?? 0} playtesters`} />
        <StatCard label="Games" value={counts.totalGames ?? 0} sub={`${counts.activeGames ?? 0} active`} />
        <StatCard label="Total Turns" value={counts.totalTurns ?? 0} sub="All time" />
      </div>

      {/* Row 3: Retention Cards */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 4 }}>
        <StatCard compact label="Players with Games" value={`${retention.usersWithGames ?? 0} of ${counts.totalUsers ?? 0}`} />
        <StatCard compact label="Created 2+ Games" value={`${retention.usersWithMultipleGames ?? 0} of ${retention.usersWithGames ?? 0}`} />
        <StatCard compact label="Returned for 2+ Sessions" value={`${retention.returningUsers ?? 0} of ${retention.usersWithGames ?? 0}`} />
      </div>
      <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 11, color: '#7082a4', fontStyle: 'italic', marginBottom: 24 }}>Counts include all registered users</p>

      {/* Storyteller Popularity */}
      {storytellers.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 11, fontWeight: 700, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            Storyteller Popularity
          </h4>
          <div className={styles.tableCard} style={{ padding: 16 }}>
            {storytellers.map((st, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: i < storytellers.length - 1 ? 10 : 0 }}>
                <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#c8c0b0', minWidth: 100 }}>{st.name}</span>
                <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: '#7082a4', minWidth: 30 }}>{st.count}</span>
                <div style={{ flex: 1, background: '#1e2540', borderRadius: 3, height: 6 }}>
                  <div className={styles.popBar} style={{ width: `${(st.count / maxST) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Setting Popularity */}
      {settings.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 11, fontWeight: 700, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            Setting Popularity
          </h4>
          <div className={styles.tableCard} style={{ padding: 16 }}>
            {settings.map((se, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: i < settings.length - 1 ? 10 : 0 }}>
                <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#c8c0b0', minWidth: 100 }}>{se.name}</span>
                <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: '#7082a4', minWidth: 30 }}>{se.count}</span>
                <div style={{ flex: 1, background: '#1e2540', borderRadius: 3, height: 6 }}>
                  <div className={styles.popBar} style={{ width: `${(se.count / maxSE) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stuck Games */}
      {stuck.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <h4 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 11, fontWeight: 700, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
              Stuck Games
            </h4>
            <button className={styles.dangerBtn} style={{ padding: '4px 12px', fontSize: 10 }}
              onClick={() => setDeleteAllConfirm(true)}>
              Delete All Stuck
            </button>
          </div>
          <p style={{ fontFamily: 'var(--font-alegreya)', fontStyle: 'italic', fontSize: 12, color: '#7082a4', marginBottom: 10 }}>
            Games stuck in initialization for 3+ days, or active with no turns in 14+ days.
          </p>
          <div className={styles.tableCard}>
            {stuck.map((g, i) => (
              <div key={i} className={styles.clickableRow} onClick={() => onViewStuckGame?.(g.id)} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 16px', borderBottom: '1px solid #2a2622',
              }}>
                <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#c8c0b0' }}>
                  #{g.id} &middot; {g.characterName || 'Unnamed'} &middot; {g.playerName || 'Unknown'}
                </span>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <StatusBadge status={g.status} />
                  <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#e8c45a' }}>{(() => {
                    const ts = g.lastActivity || g.createdAt;
                    if (!ts) return 'Unknown';
                    const days = Math.floor((Date.now() - new Date(ts).getTime()) / 86400000);
                    return g.status === 'initializing'
                      ? `Initializing for ${days} day${days !== 1 ? 's' : ''}`
                      : `No activity for ${days} day${days !== 1 ? 's' : ''}`;
                  })()}</span>
                  <button className={styles.deleteIcon} aria-label="Delete game" onClick={e => { e.stopPropagation(); setStuckDeleteTarget(g); }}>
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {stuckDeleteTarget && (
            <DeleteGameModal
              game={stuckDeleteTarget}
              onConfirm={async (gameId) => {
                await deleteAdminGame(gameId);
                setLocalStuckRemoved(prev => [...prev, gameId]);
                setStuckDeleteTarget(null);
              }}
              onCancel={() => setStuckDeleteTarget(null)}
            />
          )}

          {deleteAllConfirm && (
            <div className={styles.deleteModal}>
              <div onClick={e => e.stopPropagation()} className={styles.deleteModalCard}>
                <h3 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 16, fontWeight: 700, color: '#d0c098', marginBottom: 12 }}>
                  Delete All Stuck Games
                </h3>
                <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#c8c0b0', marginBottom: 4, lineHeight: 1.6 }}>
                  This will permanently delete <strong>{stuck.length}</strong> stuck game{stuck.length !== 1 ? 's' : ''}. This cannot be undone.
                </p>
                {deleteAllProgress != null ? (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#c8c0b0', marginBottom: 8 }}>
                      Deleting... {deleteAllProgress} / {stuck.length}
                    </div>
                    <div style={{ background: '#1e2540', borderRadius: 3, height: 6 }}>
                      <div style={{ background: '#e85a5a', height: 6, borderRadius: 3, width: `${(deleteAllProgress / stuck.length) * 100}%`, transition: 'width 0.2s ease' }} />
                    </div>
                  </div>
                ) : (
                  <>
                    <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#7082a4', marginTop: 16, marginBottom: 6 }}>
                      Type <strong style={{ color: '#c8c0b0' }}>delete all</strong> to confirm
                    </p>
                    <input
                      value={deleteAllText}
                      onChange={e => setDeleteAllText(e.target.value)}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#c8c0b0',
                        background: '#0a0e1a', border: '1px solid #1e2540',
                        borderRadius: 4, padding: '10px 14px', outline: 'none',
                      }}
                      autoFocus
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
                      <button className={styles.ghostBtn} onClick={() => { setDeleteAllConfirm(false); setDeleteAllText(''); }}>Cancel</button>
                      <button
                        onClick={async () => {
                          if (deleteAllText !== 'delete all') return;
                          const toDelete = [...stuck];
                          setDeleteAllProgress(0);
                          for (let i = 0; i < toDelete.length; i++) {
                            try {
                              await deleteAdminGame(toDelete[i].id);
                              setLocalStuckRemoved(prev => [...prev, toDelete[i].id]);
                            } catch { /* continue */ }
                            setDeleteAllProgress(i + 1);
                          }
                          setDeleteAllConfirm(false);
                          setDeleteAllText('');
                          setDeleteAllProgress(null);
                        }}
                        disabled={deleteAllText !== 'delete all'}
                        style={{
                          fontFamily: 'var(--font-cinzel)', fontSize: 11, fontWeight: 700,
                          letterSpacing: '0.08em', textTransform: 'uppercase',
                          color: deleteAllText === 'delete all' ? '#ffffff' : '#5a4a4a',
                          background: deleteAllText === 'delete all' ? '#b83a3a' : '#2a1a1a',
                          border: 'none', borderRadius: 4, padding: '10px 20px',
                          cursor: deleteAllText === 'delete all' ? 'pointer' : 'default',
                          opacity: deleteAllText === 'delete all' ? 1 : 0.5,
                          transition: 'all 0.2s ease',
                        }}
                      >Delete All</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fallback Games */}
      {fallbacks.recentGames?.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 11, fontWeight: 700, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            Games Using Fallback Provider
          </h4>
          <div className={styles.tableCard}>
            {fallbacks.recentGames.map((g, i) => (
              <div key={i} className={styles.clickableRow} onClick={() => onViewStuckGame?.(g.gameId || g.id)} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 16px', borderBottom: '1px solid #2a2622',
              }}>
                <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#c8c0b0' }}>
                  #{g.gameId || g.id} &middot; {g.characterName || 'Unnamed'} &middot; {g.playerName || 'Unknown'}
                </span>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {g.phase && (
                    <span style={{
                      fontFamily: 'var(--font-cinzel)', fontSize: 9, fontWeight: 700,
                      color: '#e8c45a', background: '#1a1a12', border: '1px solid #e8c45a33',
                      borderRadius: 3, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>{g.phase.replace(/_/g, ' ')}</span>
                  )}
                  {g.createdAt && (
                    <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4' }}>{timeAgo(g.createdAt)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Errors */}
      {showErrors && errors.recent?.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 11, fontWeight: 700, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            Recent Errors
          </h4>
          <div className={styles.tableCard}>
            {errors.recent.map((err, i) => (
              <div key={i} className={styles.tableRow} style={{ padding: '10px 16px', borderBottom: '1px solid #2a2622' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: '#e8845a' }}>
                    {err.method} {err.endpoint}
                  </span>
                  <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 11, color: '#7082a4' }}>{timeAgo(err.timestamp)}</span>
                </div>
                <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#8a94a8', margin: 0 }}>{err.message}</p>
                {err.gameId && (
                  <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: '#7082a4' }}>Game #{err.gameId}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// REPORTS TAB
// ═════════════════════════════════════════════════════════════════════════════

const REPORT_STATUSES = ['open', 'reviewed', 'resolved', 'dismissed'];

function ReportStatusBadge({ status }) {
  const s = (status || '').toLowerCase();
  const map = {
    open: { color: '#e8c45a', bg: '#1a1a12', border: '#e8c45a33' },
    reviewed: { color: '#8a94a8', bg: '#161a20', border: '#8a94a833' },
    resolved: { color: '#8aba7a', bg: '#142018', border: '#8aba7a33' },
    dismissed: { color: '#7082a4', bg: '#111528', border: '#7082a433' },
  };
  const st = map[s] || map.open;
  return (
    <span style={{
      fontFamily: 'var(--font-cinzel)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.06em', padding: '2px 8px', borderRadius: 3,
      color: st.color, background: st.bg, border: `1px solid ${st.border}`,
    }}>{status || 'Open'}</span>
  );
}

function ReportTypeBadge({ type }) {
  const isBug = type === 'bug';
  return (
    <span style={{
      fontFamily: 'var(--font-cinzel)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.06em', padding: '2px 8px', borderRadius: 3,
      color: isBug ? '#e85a5a' : '#c9a84c',
      background: isBug ? '#201416' : '#1a1814',
      border: `1px solid ${isBug ? '#e85a5a33' : '#c9a84c33'}`,
    }}>{isBug ? 'BUG' : 'SUGGESTION'}</span>
  );
}

function ReportCard({ report, onStatusChange, onSaveNotes, onViewGame }) {
  const [expanded, setExpanded] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notesText, setNotesText] = useState(report.adminNotes || '');
  const [savingNotes, setSavingNotes] = useState(false);

  const ctx = report.context || {};
  const ctxEntries = [];
  (function flatten(obj, prefix) {
    for (const [k, v] of Object.entries(obj)) {
      if (v == null) continue;
      const key = prefix ? `${prefix}.${k}` : k;
      if (typeof v === 'object' && !Array.isArray(v)) { flatten(v, key); }
      else if (Array.isArray(v) && v.length > 0) { ctxEntries.push([key, v.map(x => typeof x === 'object' ? (x.name || JSON.stringify(x)) : x).join(', ')]); }
      else if (!Array.isArray(v)) { ctxEntries.push([key, v]); }
    }
  })(ctx, '');
  const msgTruncated = (report.message || '').length > 200 && !expanded;

  async function handleSaveNotes() {
    setSavingNotes(true);
    await onSaveNotes(report.id, notesText);
    setSavingNotes(false);
  }

  return (
    <div style={{ background: '#111528', border: '1px solid #3a3328', borderRadius: 8, padding: '16px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <ReportTypeBadge type={report.type} />
          {report.category && (
            <span style={{
              fontFamily: 'var(--font-cinzel)', fontSize: 9, fontWeight: 600, color: '#7082a4',
              background: '#161a20', border: '1px solid #1e2540', borderRadius: 3, padding: '2px 8px',
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>{report.category}</span>
          )}
        </div>
        <ReportStatusBadge status={report.status} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#8a94a8' }}>
          {report.playerName || 'Unknown'} ({report.playerEmail || '—'})
          {report.gameId && (
            <span> &middot; Game #{report.gameId}{report.characterName ? ` \u00B7 ${report.characterName}` : ''}{ctx.turnNumber ? ` \u00B7 Turn ${ctx.turnNumber}` : ''}</span>
          )}
        </span>
        <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4' }}>{timeAgo(report.createdAt)}</span>
      </div>

      <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#c8c0b0', lineHeight: 1.6, margin: '0 0 10px' }}>
        {msgTruncated ? report.message.slice(0, 200) + '...' : report.message}
        {msgTruncated && (
          <button onClick={() => setExpanded(true)} style={{
            background: 'none', border: 'none', color: '#c9a84c', fontSize: 13,
            fontFamily: 'var(--font-alegreya-sans)', cursor: 'pointer', marginLeft: 4,
          }}>Show more</button>
        )}
      </p>

      {ctxEntries.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <button onClick={() => setShowContext(!showContext)} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4',
          }}>
            Context ({ctxEntries.length} fields) {showContext ? '\u25B2' : '\u25BC'}
          </button>
          {showContext && (
            <div style={{ background: '#0e1420', border: '1px solid #161c34', borderRadius: 4, padding: '8px 12px', marginTop: 6 }}>
              {ctxEntries.map(([key, val]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                  <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#6b83a3' }}>{key}</span>
                  <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: '#8a94a8', maxWidth: '60%', textAlign: 'right' }}>{String(val)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {REPORT_STATUSES.map(s => (
            <button key={s}
              className={(report.status || 'open') === s ? styles.filterPillActive : styles.filterPill}
              onClick={() => onStatusChange(report.id, s)}
              style={{ padding: '3px 8px' }}
            >{s.charAt(0).toUpperCase() + s.slice(1)}</button>
          ))}
        </div>
        <button onClick={() => setShowNotes(!showNotes)} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: report.adminNotes ? '#8a94a8' : '#7082a4',
        }}>{report.adminNotes ? 'Edit note' : 'Add note'}</button>
        {report.gameId && (
          <button onClick={() => onViewGame(report.gameId)} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#c9a84c',
          }}>View Game</button>
        )}
      </div>

      {showNotes && (
        <div style={{ marginTop: 10 }}>
          <textarea
            value={notesText}
            onChange={e => setNotesText(e.target.value)}
            rows={3}
            style={{
              width: '100%', boxSizing: 'border-box', padding: '8px 10px',
              background: '#0a0e1a', border: '1px solid #1e2540', borderRadius: 4,
              fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#c8c0b0',
              outline: 'none', resize: 'vertical',
            }}
            placeholder="Admin notes..."
          />
          <button className={styles.goldBtn} onClick={handleSaveNotes} disabled={savingNotes}
            style={{ marginTop: 6, padding: '6px 14px', fontSize: 10 }}>
            {savingNotes ? 'Saving...' : 'Save Note'}
          </button>
        </div>
      )}
    </div>
  );
}

function ReportsTab({ data, loading, onRefresh, onViewGame, onReportCountChange }) {
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('open');
  const [reports, setReports] = useState([]);

  // Distiller state
  const [distillResult, setDistillResult] = useState(null);
  const [gmDistillResult, setGmDistillResult] = useState(null);
  const [distilling, setDistilling] = useState(false);
  const [gmDistilling, setGmDistilling] = useState(false);
  const [showDistillFilters, setShowDistillFilters] = useState(false);
  const [distillType, setDistillType] = useState('all');
  const [distillStatus, setDistillStatus] = useState('open');
  const [distillFrom, setDistillFrom] = useState('');
  const [distillTo, setDistillTo] = useState('');
  const [focusedCluster, setFocusedCluster] = useState(null);

  // GM Questions browser state
  const [gmQuestionsOpen, setGmQuestionsOpen] = useState(false);
  const [gmQuestions, setGmQuestions] = useState([]);
  const [gmQuestionsTotal, setGmQuestionsTotal] = useState(0);
  const [gmQuestionsLoading, setGmQuestionsLoading] = useState(false);
  const [gmQuestionsExpanded, setGmQuestionsExpanded] = useState({});

  const fetchGmQuestions = useCallback(async (append = false) => {
    setGmQuestionsLoading(true);
    try {
      const res = await getAdminGmQuestions({ limit: 50, offset: append ? gmQuestions.length : 0 });
      const items = res.questions || res.items || [];
      setGmQuestions(prev => append ? [...prev, ...items] : items);
      setGmQuestionsTotal(res.total ?? items.length);
    } catch { /* keep stale */ }
    setGmQuestionsLoading(false);
  }, [gmQuestions.length]);

  useEffect(() => { if (data?.reports) setReports(data.reports); }, [data]);

  const visibleReports = useMemo(() => {
    return (reports || []).filter(r => {
      if (focusedCluster) {
        const ids = focusedCluster.reportIds || [];
        if (!ids.includes(r.id)) return false;
      }
      if (typeFilter !== 'all' && r.type !== typeFilter) return false;
      if (statusFilter !== 'all' && (r.status || 'open') !== statusFilter) return false;
      return true;
    });
  }, [reports, typeFilter, statusFilter, focusedCluster]);

  async function handleStatusChange(reportId, newStatus) {
    const oldReport = reports.find(r => r.id === reportId);
    const oldStatus = oldReport?.status || 'open';
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
    if (oldStatus === 'open' && newStatus !== 'open') onReportCountChange?.(-1);
    else if (oldStatus !== 'open' && newStatus === 'open') onReportCountChange?.(1);
    try { await updateReport(reportId, { status: newStatus }); }
    catch {
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: oldStatus } : r));
      if (oldStatus === 'open' && newStatus !== 'open') onReportCountChange?.(1);
      else if (oldStatus !== 'open' && newStatus === 'open') onReportCountChange?.(-1);
    }
  }

  async function handleSaveNotes(reportId, notes) {
    try {
      await updateReport(reportId, { adminNotes: notes });
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, adminNotes: notes } : r));
    } catch { /* ignore */ }
  }

  if (loading) return <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4', textAlign: 'center', padding: 40 }}>Loading...</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 18, fontWeight: 700, color: '#d0c098', margin: 0 }}>Reports</h2>
          <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 14, color: '#7082a4' }}>{visibleReports.length}</span>
        </div>
        <button className={styles.refreshBtn} onClick={onRefresh}>Refresh</button>
      </div>

      {/* ─── Distiller ─── */}
      <div style={{ marginBottom: 20, padding: 16, border: '1px solid #2a2622', borderRadius: 8, background: '#0d1120' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className={styles.goldBtn}
            disabled={distilling}
            onClick={async () => {
              setDistilling(true);
              try {
                const opts = {};
                if (distillType !== 'all') opts.type = distillType;
                if (distillStatus !== 'all') opts.status = distillStatus;
                if (distillFrom) opts.afterDate = distillFrom;
                if (distillTo) opts.beforeDate = distillTo;
                const res = await distillReports(opts);
                setDistillResult(res);
              } catch { setDistillResult({ error: true }); }
              setDistilling(false);
            }}
            style={distilling ? { opacity: 0.6 } : undefined}
          >
            {distilling ? 'Distilling...' : 'Distill Reports'}
          </button>
          <button
            className={styles.ghostBtn}
            disabled={gmDistilling}
            onClick={async () => {
              setGmDistilling(true);
              try {
                const opts = {};
                if (distillFrom) opts.afterDate = distillFrom;
                if (distillTo) opts.beforeDate = distillTo;
                const res = await distillGmQuestions(opts);
                setGmDistillResult(res);
              } catch { setGmDistillResult({ error: true }); }
              setGmDistilling(false);
            }}
            style={gmDistilling ? { opacity: 0.6 } : undefined}
          >
            {gmDistilling ? 'Distilling...' : 'Distill GM Questions'}
          </button>
          <button
            onClick={() => setShowDistillFilters(!showDistillFilters)}
            style={{
              fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4',
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px',
            }}
          >
            Filter {showDistillFilters ? '\u25B2' : '\u25BC'}
          </button>
        </div>

        {showDistillFilters && (
          <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 11, color: '#7082a4' }}>Type:</span>
              {['all', 'bug', 'suggestion'].map(t => (
                <button key={t} className={distillType === t ? styles.filterPillActive : styles.filterPill}
                  onClick={() => setDistillType(t)}>
                  {t === 'all' ? 'All' : t === 'bug' ? 'Bugs' : 'Suggestions'}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 11, color: '#7082a4' }}>Status:</span>
              {['all', 'open', 'resolved'].map(s => (
                <button key={s} className={distillStatus === s ? styles.filterPillActive : styles.filterPill}
                  onClick={() => setDistillStatus(s)}>
                  {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 11, color: '#7082a4' }}>From:</span>
              <input type="date" value={distillFrom} onChange={e => setDistillFrom(e.target.value)}
                style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#c8c0b0', background: '#0a0e1a', border: '1px solid #1e2540', borderRadius: 4, padding: '4px 8px' }} />
              <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 11, color: '#7082a4' }}>To:</span>
              <input type="date" value={distillTo} onChange={e => setDistillTo(e.target.value)}
                style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#c8c0b0', background: '#0a0e1a', border: '1px solid #1e2540', borderRadius: 4, padding: '4px 8px' }} />
            </div>
          </div>
        )}
      </div>

      {/* ─── Distill Results ─── */}
      {distillResult && !distillResult.error && (
        <div style={{ marginBottom: 20 }}>
          {(distillResult.clusters || []).map((cluster, i) => (
            <div key={i} className={styles.tableCard} style={{ marginBottom: 10, padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 14, fontWeight: 700, color: '#c9a84c' }}>{cluster.title || `Cluster ${i + 1}`}</span>
                {cluster.severity && (
                  <span style={{
                    fontFamily: 'var(--font-cinzel)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.06em', padding: '2px 8px', borderRadius: 3,
                    color: cluster.severity === 'high' ? '#e85a5a' : cluster.severity === 'medium' ? '#e8c45a' : '#7082a4',
                    background: cluster.severity === 'high' ? '#201416' : cluster.severity === 'medium' ? '#1a1a12' : '#161a20',
                    border: `1px solid ${cluster.severity === 'high' ? '#e85a5a33' : cluster.severity === 'medium' ? '#e8c45a33' : '#7082a433'}`,
                  }}>{cluster.severity}</span>
                )}
                <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 13, fontWeight: 600, color: '#d0c098', marginLeft: 'auto' }}>
                  {cluster.count ?? (cluster.reportIds || []).length} reports
                </span>
              </div>
              {cluster.summary && (
                <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#8a94a8', lineHeight: 1.5, margin: '0 0 8px' }}>{cluster.summary}</p>
              )}
              {cluster.reportIds && cluster.reportIds.length > 0 && (
                <button
                  onClick={() => setFocusedCluster(focusedCluster === cluster ? null : cluster)}
                  style={{
                    fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#c9a84c',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  }}
                >
                  {focusedCluster === cluster ? 'Clear filter' : `Show reports \u2192`}
                </button>
              )}
            </div>
          ))}
          {distillResult.distilledAt && (
            <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 11, color: '#7082a4', marginTop: 4 }}>
              Distilled at {new Date(distillResult.distilledAt).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {gmDistillResult && !gmDistillResult.error && (
        <div style={{ marginBottom: 20 }}>
          {(gmDistillResult.clusters || []).map((cluster, i) => (
            <div key={i} className={styles.tableCard} style={{ marginBottom: 10, padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 14, fontWeight: 700, color: '#c9a84c' }}>{cluster.title || `Cluster ${i + 1}`}</span>
                {cluster.severity && (
                  <span style={{
                    fontFamily: 'var(--font-cinzel)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.06em', padding: '2px 8px', borderRadius: 3,
                    color: cluster.severity === 'high' ? '#e85a5a' : cluster.severity === 'medium' ? '#e8c45a' : '#7082a4',
                    background: cluster.severity === 'high' ? '#201416' : cluster.severity === 'medium' ? '#1a1a12' : '#161a20',
                    border: `1px solid ${cluster.severity === 'high' ? '#e85a5a33' : cluster.severity === 'medium' ? '#e8c45a33' : '#7082a433'}`,
                  }}>{cluster.severity}</span>
                )}
                <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 13, fontWeight: 600, color: '#d0c098', marginLeft: 'auto' }}>
                  {cluster.count ?? 0} questions
                </span>
              </div>
              {cluster.summary && (
                <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#8a94a8', lineHeight: 1.5, margin: 0 }}>{cluster.summary}</p>
              )}
            </div>
          ))}
          {gmDistillResult.distilledAt && (
            <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 11, color: '#7082a4', marginTop: 4 }}>
              Distilled at {new Date(gmDistillResult.distilledAt).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {focusedCluster && (
        <div style={{ marginBottom: 12 }}>
          <button onClick={() => setFocusedCluster(null)} style={{
            fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#c9a84c',
            background: '#1a1814', border: '1px solid #3a3328', borderRadius: 4,
            padding: '4px 12px', cursor: 'pointer',
          }}>
            Clear filter &times; &mdash; showing {visibleReports.length} of {reports.length}
          </button>
        </div>
      )}

      {/* ─── GM Questions Browser ─── */}
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => { setGmQuestionsOpen(o => !o); if (!gmQuestionsOpen && gmQuestions.length === 0) fetchGmQuestions(); }}
          style={{
            fontFamily: 'var(--font-cinzel)', fontSize: 13, fontWeight: 700,
            color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase',
            background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0',
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <span style={{ fontSize: 10 }}>{gmQuestionsOpen ? '\u25BC' : '\u25B6'}</span>
          Recent GM Questions
          {gmQuestionsLoading && <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 11, color: '#7082a4', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>Loading...</span>}
        </button>

        {gmQuestionsOpen && (
          <div style={{ marginTop: 8 }}>
            {gmQuestions.length === 0 && !gmQuestionsLoading && (
              <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4', padding: '12px 0' }}>No GM questions found.</p>
            )}
            {gmQuestions.map((q, i) => {
              const expanded = gmQuestionsExpanded[i];
              return (
                <div key={q.id || i} style={{
                  background: '#111528', border: '1px solid #2a2622', borderRadius: 6,
                  padding: '12px 16px', marginBottom: 8,
                }}>
                  {/* Header */}
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                    <span
                      onClick={() => q.gameId && onViewGame?.(q.gameId)}
                      style={{
                        fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: '#7082a4',
                        cursor: q.gameId ? 'pointer' : 'default',
                      }}
                      className={q.gameId ? styles.nameLink : undefined}
                    >
                      #{q.gameId || '?'}
                    </span>
                    {q.characterName && <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#c8c0b0' }}>{q.characterName}</span>}
                    {q.playerName && <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4' }}>{q.playerName}</span>}
                    {q.setting && <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 11, color: '#7082a4' }}>&middot; {q.setting}</span>}
                    {q.callType === 'refinement' && (
                      <span style={{
                        fontFamily: 'var(--font-cinzel)', fontSize: 9, fontWeight: 700,
                        color: '#e8c45a', background: '#1a1a12', border: '1px solid #e8c45a33',
                        borderRadius: 3, padding: '1px 6px', textTransform: 'uppercase', letterSpacing: '0.06em',
                      }}>refinement</span>
                    )}
                  </div>
                  {/* Question */}
                  {q.question && (
                    <div style={{
                      borderLeft: '3px solid #c9a84c', paddingLeft: 12, marginBottom: 8,
                      fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#d0c098', lineHeight: 1.5,
                    }}>
                      {q.question}
                    </div>
                  )}
                  {/* Response */}
                  {q.response && (
                    <div style={{
                      fontFamily: 'var(--font-alegreya)', fontSize: 13, fontStyle: 'italic',
                      color: '#7082a4', lineHeight: 1.5,
                      ...(!expanded ? { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } : {}),
                    }}>
                      {q.response}
                    </div>
                  )}
                  {q.response && q.response.length > 120 && (
                    <button
                      onClick={() => setGmQuestionsExpanded(prev => ({ ...prev, [i]: !prev[i] }))}
                      style={{
                        fontFamily: 'var(--font-alegreya-sans)', fontSize: 11, color: '#c9a84c',
                        background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0 0',
                      }}
                    >
                      {expanded ? 'Show less' : 'Show more'}
                    </button>
                  )}
                  {/* Footer */}
                  <div style={{ display: 'flex', gap: 12, marginTop: 6, alignItems: 'center' }}>
                    {q.turnNumber != null && <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: '#7082a4' }}>Turn {q.turnNumber}</span>}
                    {q.cost != null && <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: '#7082a4' }}>{formatCost(q.cost)}</span>}
                    {q.createdAt && <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 11, color: '#7082a4' }}>{timeAgo(q.createdAt)}</span>}
                  </div>
                </div>
              );
            })}
            {gmQuestionsTotal > gmQuestions.length && (
              <button
                onClick={() => fetchGmQuestions(true)}
                disabled={gmQuestionsLoading}
                className={styles.ghostBtn}
                style={{ width: '100%', marginTop: 4 }}
              >
                {gmQuestionsLoading ? 'Loading...' : 'Load more'}
              </button>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 20, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 11, color: '#7082a4', marginRight: 6 }}>Type:</span>
          {['all', 'bug', 'suggestion'].map(t => (
            <button key={t} className={typeFilter === t ? styles.filterPillActive : styles.filterPill}
              onClick={() => setTypeFilter(t)}>
              {t === 'all' ? 'All' : t === 'bug' ? 'Bugs' : 'Suggestions'}
            </button>
          ))}
        </div>
        <div style={{ width: 1, height: 20, background: '#1e2540' }} />
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 11, color: '#7082a4', marginRight: 6 }}>Status:</span>
          {['all', ...REPORT_STATUSES].map(s => (
            <button key={s} className={statusFilter === s ? styles.filterPillActive : styles.filterPill}
              onClick={() => setStatusFilter(s)}>
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {visibleReports.length === 0 ? (
          <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4', textAlign: 'center', padding: 20 }}>No reports found.</p>
        ) : (
          visibleReports.map(r => (
            <ReportCard key={r.id} report={r} onStatusChange={handleStatusChange} onSaveNotes={handleSaveNotes} onViewGame={onViewGame} />
          ))
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SETTINGS TAB
// ═════════════════════════════════════════════════════════════════════════════

function SettingsTab({ data, loading, onRefresh }) {
  const [newCode, setNewCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Announcement state
  const [annText, setAnnText] = useState('');
  const [annSaving, setAnnSaving] = useState(false);
  const [annMsg, setAnnMsg] = useState('');

  if (loading) return <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4', textAlign: 'center', padding: 40 }}>Loading...</p>;

  const invite = data?.invite || data || {};
  const announcement = data?.announcement || null;

  async function handleUpdateCode() {
    if (!newCode.trim()) return;
    setSaving(true);
    setSaveMsg('');
    try {
      await updateInviteCode(newCode.trim());
      setNewCode('');
      setSaveMsg('Updated');
      onRefresh();
    } catch (err) {
      setSaveMsg(err.message || 'Failed');
    }
    setSaving(false);
  }

  async function handlePostAnnouncement() {
    if (!annText.trim()) return;
    setAnnSaving(true);
    setAnnMsg('');
    try {
      await setAdminAnnouncement(annText.trim());
      setAnnText('');
      setAnnMsg('Posted');
      onRefresh();
      setTimeout(() => setAnnMsg(''), 2000);
    } catch (err) {
      setAnnMsg(err.message || 'Failed');
    }
    setAnnSaving(false);
  }

  async function handleClearAnnouncement() {
    setAnnSaving(true);
    setAnnMsg('');
    try {
      await clearAdminAnnouncement();
      setAnnMsg('Cleared');
      onRefresh();
      setTimeout(() => setAnnMsg(''), 2000);
    } catch (err) {
      setAnnMsg(err.message || 'Failed');
    }
    setAnnSaving(false);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 16, fontWeight: 700, color: '#d0c098', margin: 0 }}>Settings</h2>
        <button className={styles.refreshBtn} onClick={onRefresh}>Refresh</button>
      </div>

      {/* Announcement */}
      <div style={{ background: '#111528', border: '1px solid #3a3328', borderRadius: 6, padding: 20, maxWidth: 480, marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 11, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
          Announcement
        </div>

        {/* Current announcement display */}
        {announcement?.text ? (
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#c8c0b0',
              lineHeight: 1.6, marginBottom: 4,
              whiteSpace: 'pre-wrap', overflowWrap: 'break-word',
            }}>
              {announcement.text}
            </div>
            <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4' }}>
              Posted {timeAgo(announcement.updatedAt)}
            </div>
          </div>
        ) : (
          <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#7082a4', fontStyle: 'italic', marginBottom: 16 }}>
            No active announcement
          </div>
        )}

        {/* Textarea */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <textarea
            rows={3}
            maxLength={1000}
            placeholder="Write an announcement for all players..."
            value={annText}
            onChange={e => setAnnText(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#c8c0b0',
              background: '#0a0e1a', border: '1px solid #1e2540', borderRadius: 6,
              padding: '10px 14px', resize: 'vertical', outline: 'none',
            }}
          />
          <div style={{
            position: 'absolute', bottom: 8, right: 10,
            fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, color: '#7082a4',
          }}>
            {annText.length}/1000
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className={styles.goldBtn} onClick={handlePostAnnouncement} disabled={annSaving || !annText.trim()}>
            {annSaving ? 'Saving...' : 'Post Announcement'}
          </button>
          {announcement?.text && (
            <button className={styles.ghostBtn} onClick={handleClearAnnouncement} disabled={annSaving}>
              Clear Announcement
            </button>
          )}
        </div>
        {annMsg && (
          <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: annMsg === 'Posted' || annMsg === 'Cleared' ? '#8aba7a' : '#e85a5a', marginTop: 8 }}>
            {annMsg}
          </p>
        )}
      </div>

      {/* Invite Code */}
      <div style={{ background: '#111528', border: '1px solid #3a3328', borderRadius: 6, padding: 20, maxWidth: 480 }}>
        <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 10, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
          Invite Code
        </div>
        <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 18, color: '#d0c098', marginBottom: 6 }}>
          {invite.code || <span style={{ color: '#7082a4' }}>Not set</span>}
        </div>
        <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4', marginBottom: 16 }}>
          {invite.source === 'database' ? 'Stored in database. New users must enter this code to register.'
            : invite.source === 'environment' ? 'Set via INVITE_CODE environment variable on Railway.'
            : invite.source === 'none' ? 'No invite code required. Anyone can register.'
            : invite.source || 'Unknown source'}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            className={styles.codeInput}
            placeholder="e.g., PLAYTEST2026"
            value={newCode}
            onChange={e => setNewCode(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleUpdateCode(); }}
          />
          <button className={styles.goldBtn} onClick={handleUpdateCode} disabled={saving}>
            {saving ? 'Saving...' : 'Update Code'}
          </button>
        </div>
        {saveMsg && (
          <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: saveMsg === 'Updated' ? '#8aba7a' : '#e85a5a', marginTop: 8 }}>
            {saveMsg}
          </p>
        )}
      </div>

      {/* System Info */}
      <div style={{ background: '#111528', border: '1px solid #3a3328', borderRadius: 6, padding: 20, maxWidth: 480, marginTop: 20 }}>
        <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 10, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
          System Info
        </div>
        {[
          ['Admin', typeof window !== 'undefined' ? (getUser()?.email || 'Unknown') : ''],
          ['Frontend', process.env.NEXT_PUBLIC_VERSION || 'dev'],
          ['API Base', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'],
        ].map(([label, val]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #2a2622' }}>
            <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#7082a4' }}>{label}</span>
            <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: '#8a94a8' }}>{val}</span>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div style={{ background: '#111528', border: '1px solid #3a3328', borderRadius: 6, padding: 20, maxWidth: 480, marginTop: 20 }}>
        <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 10, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
          Quick Links
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            ['Railway Dashboard', 'https://railway.app/dashboard'],
            ['Vercel Dashboard', 'https://vercel.com/dashboard'],
            ['GitHub Repo', 'https://github.com/bweidig/crucibleRPG-frontend'],
          ].map(([label, href]) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer" style={{
              fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#c9a84c',
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
              transition: 'color 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline'; }}
              onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}
            >
              {label}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// GAME LOG TAB
// ═════════════════════════════════════════════════════════════════════════════

function EventTypeBadge({ type }) {
  const t = (type || '').toLowerCase();
  let cls = styles.badgeDefault;
  if (t === 'ai_call') cls = styles.badgeAiCall;
  else if (t === 'turn_start') cls = styles.badgeTurnStart;
  else if (t === 'turn_end') cls = styles.badgeTurnEnd;
  else if (t === 'error') cls = styles.badgeError;
  return <span className={cls}>{type || 'unknown'}</span>;
}

// ─── Server Logs helpers (AD-583) ───
// Map console.log [tag] prefixes into named groups for the collapsible UI.
const LOG_GROUP_DEFS = [
  { label: 'Resolution', tags: ['resolution', 'executeTurn', 'resolve-action', 'fortunes-balance', 'crucible-roll'] },
  { label: 'Context Curation', tags: ['context-curator', 'retrieval', 'manifest'] },
  { label: 'AI Call', tags: ['gemini-diag', 'gemini', 'openai-diag', 'openai', 'anthropic', 'callAI'] },
  { label: 'AI Raw Response', tags: ['AI_RAW_RESPONSE'] },
  { label: 'State Changes', tags: ['stateChange', 'applyStateChanges', 'conditions', 'inventory', 'triage'] },
  { label: 'Classification', tags: ['classify', 'classifier', 'skill-matching'] },
];
const LOG_GROUP_ORDER = ['Resolution', 'Context Curation', 'AI Call', 'AI Raw Response', 'State Changes', 'Classification', 'Errors', 'Other'];

function groupLogLines(lines) {
  const groups = Object.fromEntries(LOG_GROUP_ORDER.map(l => [l, []]));
  for (const line of lines || []) {
    if ((line.level || '').toLowerCase() === 'error') {
      groups['Errors'].push(line);
      continue;
    }
    const msg = String(line.message || '');
    let matched = false;
    for (const def of LOG_GROUP_DEFS) {
      if (def.tags.some(tag => msg.includes(`[${tag}]`))) {
        groups[def.label].push(line);
        matched = true;
        break;
      }
    }
    if (!matched) groups['Other'].push(line);
  }
  return groups;
}

function relMs(ts, baseTs) {
  if (!ts || !baseTs) return '';
  const diff = new Date(ts).getTime() - new Date(baseTs).getTime();
  const sign = diff >= 0 ? '+' : '';
  return `${sign}${diff}ms`;
}

function isInitEntry(entry) {
  return entry.turnNumber == null || entry.turnNumber === 0;
}

function turnLabelFor(entry) {
  return isInitEntry(entry) ? 'Init' : `Turn ${entry.turnNumber}`;
}

function formatLogLineForCopy(line, baseTs) {
  const rel = baseTs ? relMs(line.timestamp, baseTs) : '';
  const lvl = `[${(line.level || 'log').toLowerCase()}]`;
  return [rel, lvl, line.message || ''].filter(Boolean).join(' ');
}

function formatTurnForCopy(entry) {
  const lines = entry.lines || [];
  const baseTs = lines[0]?.timestamp;
  const tsStr = entry.capturedAt ? new Date(entry.capturedAt).toLocaleString() : '';
  const header = `=== ${turnLabelFor(entry)} (${entry.requestType || 'turn'}) \u2014 ${tsStr} ===`;
  const body = lines.map(l => formatLogLineForCopy(l, baseTs)).join('\n');
  return `${header}\n${body}`;
}

function reqTypeBadgeClass(reqType) {
  const t = (reqType || '').toLowerCase();
  if (t === 'init') return styles.badgePurple;
  if (t === 'error') return styles.badgeError;
  if (t === 'bug_report_flush') return styles.badgeGold;
  if (t === 'gm_question') return styles.badgeGreen;
  if (t === 'rewind') return styles.badgeOrange;
  return styles.badgeBlue; // turn
}

// Server Logs panel — turn-pill multi-select view of server-side console
// output captured per game per turn. Designed for one-click copy-into-Claude
// debugging. Loads everything for the game in a single fetch (Option A from
// the spec — fine for playtester games under ~100 turns).
function ServerLogsPanel({ gameId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [lastClickedId, setLastClickedId] = useState(null);
  const [expandedTurns, setExpandedTurns] = useState(() => new Set());
  const [expandedGroups, setExpandedGroups] = useState(() => new Set());
  const [copyStatus, setCopyStatus] = useState({});

  useEffect(() => {
    if (!gameId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setLogs([]);
    setSelectedIds(new Set());
    setLastClickedId(null);
    setExpandedTurns(new Set());
    setExpandedGroups(new Set());

    getServerLogs(gameId, { limit: 200 })
      .then(data => {
        if (cancelled) return;
        const items = Array.isArray(data?.logs) ? data.logs : [];
        setLogs(items);
        // Default selection: most recent entry, expanded, with errors group
        // auto-open if any errors are present.
        if (items.length > 0) {
          const sorted = [...items].sort((a, b) => {
            const at = a.turnNumber == null ? -1 : a.turnNumber;
            const bt = b.turnNumber == null ? -1 : b.turnNumber;
            if (at !== bt) return at - bt;
            return (a.id || 0) - (b.id || 0);
          });
          const latest = sorted[sorted.length - 1];
          setSelectedIds(new Set([latest.id]));
          setLastClickedId(latest.id);
          setExpandedTurns(new Set([latest.id]));
          const grouped = groupLogLines(latest.lines);
          if (grouped['Errors'].length > 0) {
            setExpandedGroups(new Set([`${latest.id}::Errors`]));
          }
        }
      })
      .catch(err => {
        if (!cancelled) setError(err?.message || 'Failed to load server logs');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [gameId]);

  // Sort: init first, then by turnNumber, then by id within same turn.
  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => {
      const at = a.turnNumber == null ? -1 : a.turnNumber;
      const bt = b.turnNumber == null ? -1 : b.turnNumber;
      if (at !== bt) return at - bt;
      return (a.id || 0) - (b.id || 0);
    });
  }, [logs]);

  const selectedEntries = useMemo(
    () => sortedLogs.filter(l => selectedIds.has(l.id)),
    [sortedLogs, selectedIds]
  );

  function handlePillClick(entry, e) {
    if (e.shiftKey && lastClickedId != null) {
      const last = sortedLogs.find(l => l.id === lastClickedId);
      // Range selection only operates on numeric (non-init) turns.
      if (last && !isInitEntry(last) && !isInitEntry(entry)) {
        const lo = Math.min(last.turnNumber, entry.turnNumber);
        const hi = Math.max(last.turnNumber, entry.turnNumber);
        const next = new Set(selectedIds);
        for (const log of sortedLogs) {
          if (!isInitEntry(log) && log.turnNumber >= lo && log.turnNumber <= hi) {
            next.add(log.id);
          }
        }
        setSelectedIds(next);
        // Auto-expand newly selected so the user sees what they grabbed.
        setExpandedTurns(prev => {
          const n = new Set(prev);
          for (const id of next) n.add(id);
          return n;
        });
        return;
      }
    }
    // Single toggle.
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(entry.id)) next.delete(entry.id);
      else {
        next.add(entry.id);
        setExpandedTurns(p => new Set([...p, entry.id]));
      }
      return next;
    });
    setLastClickedId(entry.id);
  }

  function selectAll() {
    setSelectedIds(new Set(sortedLogs.map(l => l.id)));
    setExpandedTurns(new Set(sortedLogs.map(l => l.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function selectionLabel() {
    if (selectedEntries.length === 0) return 'No turns selected';
    if (selectedEntries.length === sortedLogs.length) return `Selected: All ${sortedLogs.length} entries`;
    if (selectedEntries.length === 1) return `Selected: ${turnLabelFor(selectedEntries[0])}`;
    const numeric = selectedEntries.filter(e => !isInitEntry(e)).map(e => e.turnNumber);
    if (numeric.length === selectedEntries.length && numeric.length > 1) {
      const lo = Math.min(...numeric);
      const hi = Math.max(...numeric);
      const set = new Set(numeric);
      let contiguous = true;
      for (let i = lo; i <= hi; i++) {
        if (!set.has(i)) { contiguous = false; break; }
      }
      if (contiguous) return `Selected: Turns ${lo}\u2013${hi} (${numeric.length} turns)`;
    }
    return `Selected: ${selectedEntries.length} entries`;
  }

  async function copyText(text, key) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(s => ({ ...s, [key]: 'copied' }));
      setTimeout(() => setCopyStatus(s => {
        const n = { ...s }; delete n[key]; return n;
      }), 2000);
    } catch {
      setCopyStatus(s => ({ ...s, [key]: 'failed' }));
      setTimeout(() => setCopyStatus(s => {
        const n = { ...s }; delete n[key]; return n;
      }), 2500);
    }
  }

  function copySelected() {
    if (selectedEntries.length === 0) return;
    const today = new Date().toISOString().slice(0, 10);
    const summary = selectionLabel().replace('Selected: ', '');
    const header = `Server logs for Game #${gameId}, ${summary}, captured ${today}:`;
    const body = selectedEntries.map(formatTurnForCopy).join('\n\n');
    copyText(`${header}\n\n${body}`, 'selected');
  }

  function copyTurn(entry) {
    copyText(formatTurnForCopy(entry), `turn-${entry.id}`);
  }

  function copyGroup(entry, label, lines) {
    const baseTs = (entry.lines || [])[0]?.timestamp;
    const text = lines.map(l => formatLogLineForCopy(l, baseTs)).join('\n');
    copyText(text, `group-${entry.id}-${label}`);
  }

  function toggleTurn(id) {
    setExpandedTurns(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  function toggleGroup(key) {
    setExpandedGroups(prev => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key); else n.add(key);
      return n;
    });
  }

  if (!gameId) return null;
  if (loading) {
    return <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4', textAlign: 'center', padding: 40 }}>Loading server logs...</p>;
  }
  if (error) {
    return <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#e85a5a', textAlign: 'center', padding: 40 }}>{error}</p>;
  }
  if (sortedLogs.length === 0) {
    return (
      <div className={styles.tableCard} style={{ padding: 24, textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#c8c0b0', marginBottom: 8 }}>
          No server logs captured for this game.
        </p>
        <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#7082a4', margin: 0 }}>
          Logs are automatically captured for playtester games and games with logging enabled. For other games, logs are saved when a bug report is filed.
        </p>
      </div>
    );
  }

  const selectedCount = selectedEntries.length;
  const copyBtnLabel = copyStatus.selected === 'copied'
    ? '\u2713 Copied!'
    : copyStatus.selected === 'failed'
      ? 'Copy failed'
      : `Copy Selected${selectedCount > 0 ? ` (${selectedCount})` : ''}`;

  return (
    <div>
      {/* Pill Bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 11, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Captured Turns
          </span>
          <button className={styles.tinyBtn} onClick={selectAll}>Select All</button>
          <button className={styles.tinyBtn} onClick={clearSelection}>Clear</button>
        </div>
        <div className={styles.turnScrubber}>
          {sortedLogs.map(entry => {
            const sel = selectedIds.has(entry.id);
            const label = isInitEntry(entry) ? 'Init' : entry.turnNumber;
            const tip = `${entry.requestType || 'turn'}${entry.capturedAt ? ' \u2014 ' + new Date(entry.capturedAt).toLocaleString() : ''}`;
            return (
              <button
                key={entry.id}
                className={sel ? styles.serverLogPillActive : styles.serverLogPill}
                onClick={(e) => handlePillClick(entry, e)}
                title={tip}
              >
                <span>{label}</span>
                <span
                  className={reqTypeBadgeClass(entry.requestType)}
                  style={{ fontSize: 9, padding: '1px 5px' }}
                >
                  {entry.requestType || 'turn'}
                </span>
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: 8, fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4' }}>
          {selectionLabel()}
          {selectedCount > 1 && (
            <span style={{ marginLeft: 10, color: '#5a6480' }}>(Tip: Shift+Click for range)</span>
          )}
        </div>
      </div>

      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button
          className={styles.goldBtn}
          onClick={copySelected}
          disabled={selectedCount === 0}
          style={{ padding: '8px 16px', opacity: selectedCount === 0 ? 0.5 : 1 }}
        >
          {copyBtnLabel}
        </button>
      </div>

      {/* Selected Turn Logs */}
      {selectedCount === 0 ? (
        <div className={styles.tableCard} style={{ padding: 20, textAlign: 'center', fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#7082a4' }}>
          Click a turn pill above to view its logs.
        </div>
      ) : (
        <div className={styles.serverLogsScroller}>
          {selectedEntries.map(entry => {
            const turnExpanded = expandedTurns.has(entry.id);
            const grouped = groupLogLines(entry.lines || []);
            const baseTs = (entry.lines || [])[0]?.timestamp;
            const tsStr = entry.capturedAt ? new Date(entry.capturedAt).toLocaleString() : '';
            const turnCopyKey = `turn-${entry.id}`;
            const turnCopyLabel = copyStatus[turnCopyKey] === 'copied' ? '\u2713 Copied' : copyStatus[turnCopyKey] === 'failed' ? 'Failed' : 'Copy Turn';
            return (
              <div key={entry.id} className={styles.tableCard} style={{ marginBottom: 10 }}>
                <div className={styles.serverLogTurnHeader} style={{ borderBottom: turnExpanded ? '1px solid #2a2622' : 'none' }}>
                  <button
                    className={styles.collapseToggle}
                    onClick={() => toggleTurn(entry.id)}
                    style={{ flex: 1, textAlign: 'left', textTransform: 'none', letterSpacing: 0 }}
                  >
                    <span style={{ fontSize: 10 }}>{turnExpanded ? '\u25BC' : '\u25B6'}</span>
                    <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 13, fontWeight: 700, color: '#d0c098', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      {turnLabelFor(entry)}
                    </span>
                    <span className={reqTypeBadgeClass(entry.requestType)}>{entry.requestType || 'turn'}</span>
                    {tsStr && (
                      <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4', fontWeight: 400 }}>{tsStr}</span>
                    )}
                    <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: '#5a6480', fontWeight: 400 }}>
                      {(entry.lines || []).length} lines
                    </span>
                  </button>
                  <button className={styles.tinyBtn} onClick={() => copyTurn(entry)}>{turnCopyLabel}</button>
                </div>

                {turnExpanded && (
                  <div style={{ padding: '10px 14px 14px' }}>
                    {LOG_GROUP_ORDER.every(l => grouped[l].length === 0) ? (
                      <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4', margin: 0 }}>No log lines in this entry.</p>
                    ) : LOG_GROUP_ORDER.map(label => {
                      const lines = grouped[label];
                      if (!lines || lines.length === 0) return null;
                      const groupKey = `${entry.id}::${label}`;
                      // Errors group auto-expanded by default.
                      const isExpanded = label === 'Errors'
                        ? !expandedGroups.has(`${groupKey}::collapsed`)
                        : expandedGroups.has(groupKey);
                      const groupCopyKey = `group-${entry.id}-${label}`;
                      const groupCopyLabel = copyStatus[groupCopyKey] === 'copied' ? '\u2713' : copyStatus[groupCopyKey] === 'failed' ? '!' : 'Copy';
                      return (
                        <div key={label} style={{ marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button
                              className={styles.collapseToggle}
                              onClick={() => {
                                if (label === 'Errors') {
                                  // Toggle the "collapsed" sentinel for Errors so default = open.
                                  toggleGroup(`${groupKey}::collapsed`);
                                } else {
                                  toggleGroup(groupKey);
                                }
                              }}
                              style={{ flex: 1, textAlign: 'left' }}
                            >
                              <span style={{ fontSize: 9 }}>{isExpanded ? '\u25BC' : '\u25B6'}</span>
                              <span style={{ color: label === 'Errors' ? '#e85a5a' : '#9a8545' }}>
                                {label} <span style={{ color: '#7082a4', fontWeight: 400 }}>({lines.length})</span>
                              </span>
                            </button>
                            <button className={styles.tinyBtn} onClick={() => copyGroup(entry, label, lines)}>{groupCopyLabel}</button>
                          </div>
                          {isExpanded && (
                            <pre className={styles.serverLogPre}>
                              {lines.map((line, i) => {
                                const lvl = (line.level || 'log').toLowerCase();
                                const color = lvl === 'error' ? '#e85a5a' : lvl === 'warn' ? '#e8845a' : '#c8c0b0';
                                return (
                                  <div key={i} className={styles.serverLogLine} style={{ color }}>
                                    <span style={{ color: '#5a6480', marginRight: 8 }}>{relMs(line.timestamp, baseTs)}</span>
                                    <span style={{ color: '#7082a4', marginRight: 8 }}>[{lvl}]</span>
                                    {line.message || ''}
                                  </div>
                                );
                              })}
                            </pre>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function GameLogTab({ pendingGameId, onClearPending }) {
  const [gameIdInput, setGameIdInput] = useState('');
  const [loadedGameId, setLoadedGameId] = useState(null);
  const [gameInfo, setGameInfo] = useState(null);
  const [events, setEvents] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [currentSnapshot, setCurrentSnapshot] = useState(null);
  const [selectedTurn, setSelectedTurn] = useState(null);
  const [typeFilter, setTypeFilter] = useState('All');
  const [errorsOnly, setErrorsOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedEvents, setExpandedEvents] = useState(new Set());
  // Per-turn events: a separate fetch via `?turn=N` that bypasses the
  // backend's hardcoded LIMIT 500 on the bulk endpoint, so we get the
  // FULL event log for the selected turn (matching what Railway shows).
  // null = no per-turn fetch yet; array = per-turn results to use.
  const [turnEvents, setTurnEvents] = useState(null);
  const [turnEventsLoading, setTurnEventsLoading] = useState(false);
  // Default to expanded so the full event_data renders inline without
  // requiring a click on every row. Toggle off if too noisy.
  const [expandAll, setExpandAll] = useState(true);
  // Sub-tab inside Game Log: 'events' = existing snapshot+events view,
  // 'serverLogs' = AD-583 server console output viewer.
  const [subTab, setSubTab] = useState('events');

  const typeFilters = ['All', 'ai_call', 'turn_start', 'turn_end', 'error'];

  // Auto-load from pending prop
  useEffect(() => {
    if (pendingGameId) {
      setGameIdInput(String(pendingGameId));
      loadGame(pendingGameId);
      if (onClearPending) onClearPending();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingGameId]);

  async function loadGame(id) {
    const gid = id || gameIdInput.trim();
    if (!gid) return;
    setLoading(true);
    setError(null);
    setEvents([]);
    setSnapshots([]);
    setCurrentSnapshot(null);
    setSelectedTurn(null);
    setTypeFilter('All');
    setErrorsOnly(false);
    setExpandedEvents(new Set());
    setTurnEvents(null);
    setGameInfo(null);

    try {
      const [logData, snapshotsData] = await Promise.all([
        getGameLog(gid),
        getGameLogSnapshots(gid),
      ]);
      const evts = logData?.events || logData || [];
      const snaps = snapshotsData?.snapshots || snapshotsData || [];
      setEvents(Array.isArray(evts) ? evts : []);
      setSnapshots(Array.isArray(snaps) ? snaps : []);
      setLoadedGameId(gid);

      // Extract game info from first snapshot or events
      if (snaps.length > 0) {
        const first = snaps[0];
        setGameInfo({
          gameId: gid,
          characterName: first.characterName || first.character?.name,
          setting: first.setting || first.sceneState?.location,
        });
      } else if (evts.length > 0) {
        setGameInfo({ gameId: gid, characterName: null, setting: null });
      }

      // Default to latest turn. Snapshots use camelCase (`turnNumber`) per
      // API_CONTRACT, but events use snake_case (`turn_number`) — read both.
      const turnNumbers = snaps.map(s => s.turnNumber).filter(n => n != null).sort((a, b) => a - b);
      if (turnNumbers.length > 0) {
        const latest = turnNumbers[turnNumbers.length - 1];
        setSelectedTurn(latest);
        loadSnapshot(gid, latest);
        loadEventsForTurn(gid, latest);
      } else {
        // Try to get turn numbers from events
        const evtTurns = [...new Set(evts.map(e => e.turn_number ?? e.turnNumber).filter(n => n != null))].sort((a, b) => a - b);
        if (evtTurns.length > 0) {
          const latest = evtTurns[evtTurns.length - 1];
          setSelectedTurn(latest);
          loadEventsForTurn(gid, latest);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load game log');
    }
    setLoading(false);
  }

  async function loadSnapshot(gid, turnNumber) {
    setSnapshotLoading(true);
    try {
      const snap = await getGameLogSnapshot(gid || loadedGameId, turnNumber);
      setCurrentSnapshot(snap);
    } catch {
      setCurrentSnapshot(null);
    }
    setSnapshotLoading(false);
  }

  // Per-turn fetch: bypasses the bulk endpoint's hardcoded LIMIT 500 by
  // querying `?turn=N` directly. Returns the COMPLETE set of events for
  // that turn (the same data Railway logs surface).
  async function loadEventsForTurn(gid, turnNumber) {
    setTurnEventsLoading(true);
    setTurnEvents(null);
    try {
      const data = await getGameLog(gid || loadedGameId, { turn: turnNumber });
      const evts = data?.events || data || [];
      setTurnEvents(Array.isArray(evts) ? evts : []);
    } catch {
      setTurnEvents([]);
    }
    setTurnEventsLoading(false);
  }

  function handleTurnClick(turnNumber) {
    setSelectedTurn(turnNumber);
    setExpandedEvents(new Set());
    loadSnapshot(loadedGameId, turnNumber);
    loadEventsForTurn(loadedGameId, turnNumber);
  }

  function toggleEventExpand(idx) {
    setExpandedEvents(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  }

  // Build turn list from snapshots + events. Snapshots use camelCase
  // (`turnNumber`), events use snake_case (`turn_number`) per API_CONTRACT.
  const turnNumbers = useMemo(() => {
    const fromSnaps = snapshots.map(s => s.turnNumber).filter(n => n != null);
    const fromEvts = events.map(e => e.turn_number ?? e.turnNumber).filter(n => n != null);
    return [...new Set([...fromSnaps, ...fromEvts])].sort((a, b) => a - b);
  }, [snapshots, events]);

  // Filter events. Event field names are snake_case (turn_number, event_type,
  // created_at) per API_CONTRACT — keep camelCase fallbacks for safety.
  // When a per-turn fetch has populated `turnEvents`, prefer that source: it
  // contains the COMPLETE event log for the selected turn (no LIMIT 500),
  // and we can skip the client-side turn filter entirely. Errors-only mode
  // still uses the bulk events list since errors span all turns.
  const filteredEvents = useMemo(() => {
    const tsOf = (e) => new Date(e.created_at || e.timestamp || e.createdAt);
    if (errorsOnly) {
      return events
        .filter(e => (e.event_type || e.eventType || '').toLowerCase() === 'error')
        .sort((a, b) => tsOf(a) - tsOf(b));
    }
    const usingTurnFetch = turnEvents != null && selectedTurn != null;
    let evts = usingTurnFetch ? turnEvents : events;
    if (!usingTurnFetch && selectedTurn != null) {
      evts = evts.filter(e => (e.turn_number ?? e.turnNumber) === selectedTurn);
    }
    if (typeFilter !== 'All') {
      evts = evts.filter(e => (e.event_type || e.eventType) === typeFilter);
    }
    return [...evts].sort((a, b) => tsOf(a) - tsOf(b));
  }, [events, turnEvents, selectedTurn, typeFilter, errorsOnly]);

  // Turn Summary: aggregate the per-turn events into a single card so the
  // admin doesn't have to read every event_data blob to see "what happened
  // this turn." Pulls cost/tokens/model out of ai_call event_data, counts
  // events by type, and surfaces any classification fields the backend has
  // attached. All fields are extracted defensively (snake_case + camelCase)
  // because event_data shape is not part of the contract.
  // Source events: prefer the per-turn fetch result (full set, no LIMIT 500)
  // when available, otherwise fall back to filteredEvents.
  const turnSummary = useMemo(() => {
    if (errorsOnly || selectedTurn == null) return null;
    const source = (turnEvents != null) ? turnEvents : filteredEvents;
    if (!source || source.length === 0) return null;

    const countByType = {};
    const aiCalls = [];
    const classifications = [];
    let totalCost = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    for (const evt of source) {
      const type = evt.event_type || evt.eventType || 'unknown';
      countByType[type] = (countByType[type] || 0) + 1;
      const data = evt.event_data || evt.eventData || evt.data || {};

      if (type === 'ai_call') {
        const model = data.model || data.modelName || null;
        const inT = data.input_tokens ?? data.inputTokens ?? null;
        const outT = data.output_tokens ?? data.outputTokens ?? null;
        const cost = data.cost ?? data.totalCost ?? null;
        const taskType = data.task_type || data.taskType || data.task || data.purpose || null;
        if (typeof cost === 'number') totalCost += cost;
        if (typeof inT === 'number') totalInputTokens += inT;
        if (typeof outT === 'number') totalOutputTokens += outT;
        aiCalls.push({ model, inT, outT, cost, taskType });
      }

      // Classification can show up in a few places: a dedicated event type,
      // a `classification` field on event_data, or a `task_type === 'classification'`.
      if (data.classification) {
        classifications.push(typeof data.classification === 'string' ? data.classification : JSON.stringify(data.classification));
      }
      if (data.directive_type || data.directiveType) {
        classifications.push(`directive: ${data.directive_type || data.directiveType}`);
      }
    }

    return {
      eventCount: source.length,
      countByType,
      aiCalls,
      classifications,
      totalCost,
      totalInputTokens,
      totalOutputTokens,
    };
  }, [turnEvents, filteredEvents, selectedTurn, errorsOnly]);

  // Snapshot data helpers
  const snap = currentSnapshot?.snapshot || currentSnapshot;
  const snapStats = snap?.character?.stats || snap?.stats;
  const snapConditions = snap?.character?.conditions || snap?.conditions || [];
  const snapNpcs = snap?.npcs || snap?.onScreenNpcs || [];
  const snapResources = snap?.resources || snap?.character?.resources;
  const snapScene = snap?.sceneState || snap?.scene;
  const snapThreads = snap?.worldThreads || snapScene?.worldThreads;

  return (
    <div>
      {/* Game Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 18, fontWeight: 700, color: '#d0c098', margin: 0 }}>Game Log</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            className={styles.searchInput}
            placeholder="Enter game ID..."
            value={gameIdInput}
            onChange={e => setGameIdInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') loadGame(); }}
            style={{ width: 180 }}
          />
          <button className={styles.goldBtn} onClick={() => loadGame()} style={{ padding: '8px 16px' }}>Load</button>
        </div>
      </div>

      {/* Game Info Header */}
      {gameInfo && (
        <div style={{ marginBottom: 16, fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#8a94a8' }}>
          <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 13, color: '#c9a84c' }}>Game #{gameInfo.gameId}</span>
          {gameInfo.characterName && <span> &middot; {gameInfo.characterName}</span>}
          {gameInfo.setting && <span> &middot; {gameInfo.setting}</span>}
        </div>
      )}

      {loading && <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4', textAlign: 'center', padding: 40 }}>Loading...</p>}
      {error && <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#e85a5a', textAlign: 'center', padding: 40 }}>{error}</p>}

      {loadedGameId && !loading && !error && (
        <>
          {/* Sub-tab toggle: existing Events view vs AD-583 Server Logs view */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button
              className={subTab === 'events' ? styles.subTabActive : styles.subTab}
              onClick={() => setSubTab('events')}
            >
              Events &amp; Snapshot
            </button>
            <button
              className={subTab === 'serverLogs' ? styles.subTabActive : styles.subTab}
              onClick={() => setSubTab('serverLogs')}
            >
              Server Logs
            </button>
          </div>

          {subTab === 'serverLogs' ? (
            <ServerLogsPanel gameId={loadedGameId} />
          ) : events.length === 0 && snapshots.length === 0 ? (
            <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4', textAlign: 'center', padding: 40 }}>No events recorded for this game.</p>
          ) : (
            <>
              {/* Turn Scrubber */}
              {turnNumbers.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 11, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                    Turns
                  </span>
                  <div className={styles.turnScrubber}>
                    {turnNumbers.map(t => (
                      <button
                        key={t}
                        className={selectedTurn === t && !errorsOnly ? styles.turnBtnActive : styles.turnBtn}
                        onClick={() => { setErrorsOnly(false); handleTurnClick(t); }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Type Filters */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                {typeFilters.map(f => (
                  <button
                    key={f}
                    className={!errorsOnly && typeFilter === f ? styles.typeFilterPillActive : styles.typeFilterPill}
                    onClick={() => { setErrorsOnly(false); setTypeFilter(f); }}
                  >
                    {f === 'All' ? 'All' : f}
                  </button>
                ))}
                <button
                  className={errorsOnly ? styles.errorsOnlyPillActive : styles.errorsOnlyPill}
                  onClick={() => setErrorsOnly(!errorsOnly)}
                >
                  {'\u26A0'} Errors Only
                </button>
                <button
                  className={expandAll ? styles.typeFilterPillActive : styles.typeFilterPill}
                  onClick={() => setExpandAll(!expandAll)}
                  style={{ marginLeft: 'auto' }}
                  title="Show full event_data inline for every event"
                >
                  {expandAll ? '\u25BC Collapse all' : '\u25B6 Expand all'}
                </button>
              </div>

              {/* Two-Column Layout */}
              <div className={styles.logColumns}>
                {/* Left Column — Snapshot */}
                <div>
                  <h3 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 13, fontWeight: 700, color: '#d0c098', marginBottom: 12 }}>
                    Snapshot {selectedTurn != null ? `— Turn ${selectedTurn}` : ''}
                  </h3>
                  {snapshotLoading ? (
                    <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#7082a4' }}>Loading...</p>
                  ) : !snap ? (
                    <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#7082a4' }}>No snapshot recorded for this turn</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {/* Player Stats */}
                      {snapStats && Object.keys(snapStats).length > 0 && (
                        <div className={styles.tableCard} style={{ padding: 14 }}>
                          <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 10, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Stats</span>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 20px' }}>
                            {Object.entries(snapStats).map(([stat, val]) => {
                              const isObj = typeof val === 'object' && val !== null;
                              const effective = isObj ? (val.effective ?? val.current) : val;
                              const base = isObj ? val.base : null;
                              const hasPenalty = isObj && effective != null && base != null && effective < base;
                              const display = isObj
                                ? (effective != null && base != null
                                  ? (effective === base ? `${effective}` : `${effective} / ${base}`)
                                  : `${effective ?? base ?? '—'}`)
                                : `${val}`;

                              return (
                                <div key={stat} className={styles.snapshotStatRow}>
                                  <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 11, fontWeight: 600, color: '#c9a84c' }}>{stat.toUpperCase()}</span>
                                  <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 13, color: hasPenalty ? '#e8845a' : '#c8c0b0' }}>
                                    {display}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Conditions */}
                      {snapConditions.length > 0 && (
                        <div>
                          <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 10, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Conditions</span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {snapConditions.map((c, i) => (
                              <span key={i} style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#e8845a', background: '#201416', padding: '2px 8px', borderRadius: 3, border: '1px solid #e8845a33' }}>
                                {typeof c === 'string' ? c : `${c.name}${c.penalty ? ` ${c.penalty}` : ''}`}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* NPCs */}
                      {snapNpcs.length > 0 && (
                        <div>
                          <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 10, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>On-Screen NPCs</span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {snapNpcs.map((npc, i) => (
                              <div key={i} className={styles.npcCard}>
                                <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#d0c098', fontWeight: 600, marginBottom: 4 }}>
                                  {npc.name || 'Unknown NPC'}
                                </div>
                                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: '#8a94a8' }}>
                                  {npc.hp != null && <span>HP: {npc.hp}</span>}
                                  {npc.disposition && <span>{npc.disposition}</span>}
                                  {npc.attitude && <span>{npc.attitude}</span>}
                                </div>
                                {npc.conditions?.length > 0 && (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                                    {npc.conditions.map((c, j) => (
                                      <span key={j} style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 11, color: '#e8845a', background: '#201416', padding: '1px 6px', borderRadius: 3, border: '1px solid #e8845a33' }}>
                                        {typeof c === 'string' ? c : c.name}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Resources */}
                      {snapResources && Object.keys(snapResources).length > 0 && (
                        <div className={styles.tableCard} style={{ padding: 14 }}>
                          <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 10, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Resources</span>
                          {Object.entries(snapResources).map(([key, val]) => (
                            <div key={key} className={styles.snapshotStatRow}>
                              <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#8a94a8' }}>{key}</span>
                              <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 13, color: '#c8c0b0' }}>{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Scene */}
                      {snapScene && (
                        <div className={styles.tableCard} style={{ padding: 14 }}>
                          <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 10, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Scene</span>
                          {Object.entries(snapScene).filter(([k]) => k !== 'worldThreads').map(([key, val]) => (
                            <div key={key} className={styles.snapshotStatRow}>
                              <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#8a94a8' }}>{key}</span>
                              <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: '#c8c0b0' }}>{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* World Threads */}
                      {snapThreads?.length > 0 && (
                        <CollapsibleSection title="World Threads">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {snapThreads.map((thread, i) => (
                              <div key={i} style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#8a94a8', padding: '4px 0', borderBottom: '1px solid #2a2622' }}>
                                {typeof thread === 'string' ? thread : thread.name || JSON.stringify(thread)}
                              </div>
                            ))}
                          </div>
                        </CollapsibleSection>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Column — Events */}
                <div>
                  <h3 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 13, fontWeight: 700, color: '#d0c098', marginBottom: 12 }}>
                    Events {errorsOnly ? '— Errors (All Turns)' : selectedTurn != null ? `— Turn ${selectedTurn}` : ''}
                    <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: '#7082a4', marginLeft: 8 }}>{filteredEvents.length}</span>
                    {!errorsOnly && turnEvents != null && selectedTurn != null && (
                      <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, color: '#6a8a6a', marginLeft: 6 }}>full set</span>
                    )}
                    {turnEventsLoading && (
                      <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, color: '#7082a4', marginLeft: 6 }}>loading...</span>
                    )}
                  </h3>

                  {/* Turn Summary card — aggregates the per-turn events into a
                      single at-a-glance view (totals + per-AI-call breakdown). */}
                  {turnSummary && (
                    <div className={styles.tableCard} style={{ padding: 14, marginBottom: 12 }}>
                      <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 10, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
                        Turn Summary
                      </span>

                      {/* Totals row */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px 16px', marginBottom: 12 }}>
                        <div className={styles.snapshotStatRow}>
                          <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#8a94a8' }}>Events</span>
                          <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 13, color: '#c8c0b0' }}>{turnSummary.eventCount}</span>
                        </div>
                        <div className={styles.snapshotStatRow}>
                          <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#8a94a8' }}>AI calls</span>
                          <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 13, color: '#c8c0b0' }}>{turnSummary.aiCalls.length}</span>
                        </div>
                        <div className={styles.snapshotStatRow}>
                          <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#8a94a8' }}>Tokens</span>
                          <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: '#c8c0b0' }}>
                            {turnSummary.totalInputTokens.toLocaleString()} {'\u2192'} {turnSummary.totalOutputTokens.toLocaleString()}
                          </span>
                        </div>
                        <div className={styles.snapshotStatRow}>
                          <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#8a94a8' }}>Cost</span>
                          <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 13, fontWeight: 600, color: '#d0c098' }}>{formatCost(turnSummary.totalCost)}</span>
                        </div>
                      </div>

                      {/* Event-type breakdown */}
                      {Object.keys(turnSummary.countByType).length > 0 && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 11, color: '#7082a4', marginBottom: 4 }}>By type</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {Object.entries(turnSummary.countByType)
                              .sort((a, b) => b[1] - a[1])
                              .map(([type, count]) => (
                                <span key={type} style={{
                                  fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: '#c8c0b0',
                                  background: '#0a0e1a', border: '1px solid #2a2622',
                                  padding: '2px 8px', borderRadius: 3,
                                }}>
                                  {type} <span style={{ color: '#9a8545' }}>{'\u00D7'}{count}</span>
                                </span>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Per-AI-call breakdown */}
                      {turnSummary.aiCalls.length > 0 && (
                        <div style={{ marginBottom: turnSummary.classifications.length > 0 ? 10 : 0 }}>
                          <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 11, color: '#7082a4', marginBottom: 4 }}>AI calls</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {turnSummary.aiCalls.map((call, i) => (
                              <div key={i} style={{
                                display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'baseline',
                                fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11,
                                padding: '4px 0', borderBottom: '1px solid #1e2540',
                              }}>
                                {call.taskType && <span style={{ color: '#9a8545', minWidth: 90 }}>{call.taskType}</span>}
                                {call.model && <span style={{ color: '#7ab4e8' }}>{call.model}</span>}
                                {call.inT != null && <span style={{ color: '#8a94a8' }}>{'\u2192'} {call.inT.toLocaleString()}</span>}
                                {call.outT != null && <span style={{ color: '#8a94a8' }}>{'\u2190'} {call.outT.toLocaleString()}</span>}
                                {call.cost != null && <span style={{ color: '#d0c098', fontWeight: 600, marginLeft: 'auto' }}>{formatCost(call.cost)}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Classifications */}
                      {turnSummary.classifications.length > 0 && (
                        <div>
                          <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 11, color: '#7082a4', marginBottom: 4 }}>Classification</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {turnSummary.classifications.map((c, i) => (
                              <span key={i} style={{
                                fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: '#c8c0b0',
                                background: '#1a1610', border: '1px solid #3d3322',
                                padding: '2px 8px', borderRadius: 3,
                              }}>
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className={styles.tableCard}>
                    {filteredEvents.length === 0 ? (
                      <div style={{ padding: 14, textAlign: 'center', fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#7082a4' }}>
                        {errorsOnly ? 'No errors found.' : turnEventsLoading ? 'Loading events for this turn...' : 'No events for this selection.'}
                      </div>
                    ) : filteredEvents.map((evt, idx) => {
                      const evtType = evt.event_type || evt.eventType || 'unknown';
                      const isError = evtType.toLowerCase() === 'error';
                      const isAiCall = evtType.toLowerCase() === 'ai_call';
                      const evtData = evt.event_data || evt.eventData || evt.data;
                      const expanded = expandAll || expandedEvents.has(idx);
                      const ts = evt.created_at || evt.timestamp || evt.createdAt;
                      const evtTurn = evt.turn_number ?? evt.turnNumber;

                      // Extract ai_call stats
                      const aiModel = isAiCall && evtData ? (evtData.model || evtData.modelName) : null;
                      const aiInputTokens = isAiCall && evtData ? (evtData.input_tokens || evtData.inputTokens) : null;
                      const aiOutputTokens = isAiCall && evtData ? (evtData.output_tokens || evtData.outputTokens) : null;
                      const aiCost = isAiCall && evtData ? (evtData.cost || evtData.totalCost) : null;

                      return (
                        <div key={idx} className={isError ? styles.eventCardError : styles.eventCard}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            {isError && <span style={{ fontSize: 14 }}>{'\u26A0'}</span>}
                            <EventTypeBadge type={evtType} />
                            {errorsOnly && evtTurn != null && (
                              <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: '#7082a4' }}>Turn {evtTurn}</span>
                            )}
                            {ts && (
                              <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 11, color: '#7082a4', marginLeft: 'auto' }}>
                                {new Date(ts).toLocaleTimeString()}
                              </span>
                            )}
                          </div>

                          {/* AI Call compact stats */}
                          {isAiCall && (aiModel || aiInputTokens != null || aiCost != null) && (
                            <div className={styles.aiCallStats}>
                              {aiModel && <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: '#7ab4e8' }}>{aiModel}</span>}
                              {aiInputTokens != null && <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: '#8a94a8' }}>{'\u2192'} {aiInputTokens.toLocaleString()}</span>}
                              {aiOutputTokens != null && <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: '#8a94a8' }}>{'\u2190'} {aiOutputTokens.toLocaleString()}</span>}
                              {aiCost != null && <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: '#d0c098', fontWeight: 600 }}>{formatCost(aiCost)}</span>}
                            </div>
                          )}

                          {/* Event data — always rendered when expandAll is on,
                              otherwise togglable per event. */}
                          {evtData && (
                            <div style={{ marginTop: 6 }}>
                              {!expandAll && (
                                <button className={styles.eventExpand} onClick={() => toggleEventExpand(idx)}>
                                  {expanded ? '\u25BC Hide data' : '\u25B6 Show data'}
                                </button>
                              )}
                              {expanded && (
                                <pre className={styles.eventDataPre}>
                                  {JSON.stringify(evtData, null, 2)}
                                </pre>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function CollapsibleSection({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button className={styles.collapseToggle} onClick={() => setOpen(!open)}>
        <span style={{ fontSize: 10 }}>{open ? '\u25BC' : '\u25B6'}</span>
        {title}
      </button>
      {open && <div style={{ marginTop: 8 }}>{children}</div>}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ANALYTICS TAB
// ═════════════════════════════════════════════════════════════════════════════

function SectionHeader({ children }) {
  return (
    <h3 style={{
      fontFamily: 'var(--font-cinzel)', fontSize: 13, fontWeight: 700,
      color: '#c9a84c', letterSpacing: '0.12em', textTransform: 'uppercase',
      marginBottom: 14, marginTop: 32,
    }}>{children}</h3>
  );
}

function DropoffBar({ label, count, max, color }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
      <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#8a94a8', minWidth: 70, textAlign: 'right' }}>{label}</span>
      <div style={{ flex: 1, height: 18, background: '#0a0e1a', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.3s ease', minWidth: count > 0 ? 2 : 0 }} />
      </div>
      <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 13, color: '#d0c098', minWidth: 36, textAlign: 'right' }}>{count}</span>
    </div>
  );
}

function RankedRow({ rank, name, count, max }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 16px', borderBottom: '1px solid #2a2622',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`,
        background: 'rgba(201, 168, 76, 0.06)', transition: 'width 0.3s ease',
      }} />
      <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: '#7082a4', minWidth: 20, textAlign: 'right', position: 'relative' }}>{rank}</span>
      <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#c8c0b0', flex: 1, position: 'relative' }}>{name}</span>
      <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 13, fontWeight: 600, color: '#c9a84c', position: 'relative' }}>{count}</span>
    </div>
  );
}

function AnalyticsTab({ data, loading, onRefresh }) {
  if (loading) return <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4', textAlign: 'center', padding: 40 }}>Loading...</p>;

  const d = data || {};
  const noData = Object.keys(d).length === 0;

  if (noData) return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 18, fontWeight: 700, color: '#d0c098', margin: 0 }}>Analytics</h2>
        <button className={styles.refreshBtn} onClick={onRefresh}>Refresh</button>
      </div>
      <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4', textAlign: 'center', padding: 40 }}>No data yet.</p>
    </div>
  );

  // Game Patterns
  const totalGames = d.totalGames ?? 0;
  const activeGames = d.activeGames ?? 0;
  const completedGames = d.completedGames ?? 0;
  const abandonedGames = d.abandonedGames ?? 0;
  const pct = (n) => totalGames > 0 ? `${((n / totalGames) * 100).toFixed(1)}%` : '—';

  const dropoff = d.dropoffBuckets || {};
  const dropoffEntries = [
    { label: '0 turns', key: 'zero', color: '#e85a5a' },
    { label: '1–3', key: 'oneToThree', color: '#e8845a' },
    { label: '4–10', key: 'fourToTen', color: '#e8b45a' },
    { label: '11–20', key: 'elevenToTwenty', color: '#e8c45a' },
    { label: '20+', key: 'twentyPlus', color: '#c9a84c' },
  ];
  const maxDropoff = Math.max(1, ...dropoffEntries.map(e => dropoff[e.key] ?? 0));

  const topSettings = d.topSettings || [];
  const topTemplates = d.topTemplates || [];
  const maxSettingCount = topSettings.length > 0 ? topSettings[0].count : 1;
  const maxTemplateCount = topTemplates.length > 0 ? topTemplates[0].count : 1;

  // Cost Analytics
  const avgCostPerGame = d.avgCostPerGame;
  const avgInitCost = d.avgInitCost;
  const avgGameplayCost = d.avgGameplayCost;
  const avgGmCost = d.avgGmCost;
  const recentAvgPerTurn = d.recentAvgCostPerTurn;
  const previousAvgPerTurn = d.previousAvgCostPerTurn;
  const projected = d.projectedMonthlyCost100Players;

  const totalInitCost = d.totalInitCost ?? 0;
  const totalGameplayCost = d.totalGameplayCost ?? 0;
  const totalGmCost = d.totalGmCost ?? 0;
  const costSum = totalInitCost + totalGameplayCost + totalGmCost;
  const initPct = costSum > 0 ? (totalInitCost / costSum) * 100 : 0;
  const gameplayPct = costSum > 0 ? (totalGameplayCost / costSum) * 100 : 0;
  const gmPct = costSum > 0 ? (totalGmCost / costSum) * 100 : 0;

  // Engagement
  const avgTurns = d.avgTurnsPerGame;
  const avgTurnsCompleted = d.avgTurnsCompleted;
  const avgTurnsAbandoned = d.avgTurnsAbandoned;
  const avgGmCalls = d.avgGmCallsPerGame;
  const sigDist = d.significanceDistribution;
  const weeklyGames = d.weeklyGamesCreated || [];
  const weeklyCosts = d.weeklyCostPerWeek || [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 18, fontWeight: 700, color: '#d0c098', margin: 0 }}>Analytics</h2>
        <button className={styles.refreshBtn} onClick={onRefresh}>Refresh</button>
      </div>

      {/* ─── Game Patterns ─── */}
      <SectionHeader>Game Patterns</SectionHeader>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
        <StatCard label="Total Games" value={totalGames} />
        <StatCard label="Active" value={activeGames} sub={pct(activeGames)} valueColor="#8aba7a" />
        <StatCard label="Completed" value={completedGames} sub={pct(completedGames)} />
        <StatCard label="Abandoned" value={abandonedGames} sub={pct(abandonedGames)} valueColor={abandonedGames > 0 ? '#e8845a' : undefined} />
      </div>

      {Object.keys(dropoff).length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 11, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            Abandoned Drop-off
          </div>
          {dropoffEntries.map(e => (
            <DropoffBar key={e.key} label={e.label} count={dropoff[e.key] ?? 0} max={maxDropoff} color={e.color} />
          ))}
        </div>
      )}

      {topSettings.length > 0 && (
        <div className={styles.tableCard} style={{ marginBottom: 16 }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #2a2622' }}>
            <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 11, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Top Settings</span>
          </div>
          {topSettings.slice(0, 10).map((s, i) => (
            <RankedRow key={i} rank={i + 1} name={s.name || s.setting || 'Unknown'} count={s.count} max={maxSettingCount} />
          ))}
        </div>
      )}

      {topTemplates.length > 0 && (
        <div className={styles.tableCard} style={{ marginBottom: 16 }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #2a2622' }}>
            <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 11, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Top Templates</span>
          </div>
          {topTemplates.slice(0, 10).map((t, i) => (
            <RankedRow key={i} rank={i + 1} name={t.name || t.template || 'Unknown'} count={t.count} max={maxTemplateCount} />
          ))}
        </div>
      )}

      {/* ─── Cost Analytics ─── */}
      <SectionHeader>Cost Analytics</SectionHeader>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
        <StatCard label="Avg Cost/Game" value={formatCost(avgCostPerGame)} />
        <StatCard label="Avg Init Cost" value={formatCost(avgInitCost)} />
        <StatCard label="Avg Gameplay Cost" value={formatCost(avgGameplayCost)} />
        <StatCard label="Avg GM Cost" value={formatCost(avgGmCost)} />
      </div>

      {(recentAvgPerTurn != null || previousAvgPerTurn != null) && (
        <div style={{ display: 'flex', gap: 24, marginBottom: 20, alignItems: 'center' }}>
          <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 11, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Cost Trend</div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
            <div>
              <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4' }}>Recent 50 avg/turn: </span>
              <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 14, fontWeight: 600, color: '#d0c098' }}>{formatCost(recentAvgPerTurn)}</span>
            </div>
            {previousAvgPerTurn != null && (
              <>
                <span style={{
                  fontSize: 16,
                  color: recentAvgPerTurn <= previousAvgPerTurn ? '#8aba7a' : '#e85a5a',
                }}>{recentAvgPerTurn <= previousAvgPerTurn ? '\u2193' : '\u2191'}</span>
                <div>
                  <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4' }}>Previous 50: </span>
                  <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 14, fontWeight: 600, color: '#7082a4' }}>{formatCost(previousAvgPerTurn)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {projected != null && (
        <div style={{
          background: '#111528', border: '2px solid #3a3328', borderRadius: 8,
          padding: '20px 24px', marginBottom: 24, textAlign: 'center',
        }}>
          <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 11, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
            Projected Monthly Cost at 100 Players
          </div>
          <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 32, fontWeight: 700, color: '#c9a84c' }}>
            {formatCostShort(projected)}
          </div>
        </div>
      )}

      {costSum > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 11, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            Cost Ratio
          </div>
          <div style={{ display: 'flex', height: 24, borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
            {initPct > 0 && <div style={{ width: `${initPct}%`, background: '#7ab4e8', transition: 'width 0.3s' }} />}
            {gameplayPct > 0 && <div style={{ width: `${gameplayPct}%`, background: '#c9a84c', transition: 'width 0.3s' }} />}
            {gmPct > 0 && <div style={{ width: `${gmPct}%`, background: '#8aba7a', transition: 'width 0.3s' }} />}
          </div>
          <div style={{ display: 'flex', gap: 20, fontFamily: 'var(--font-alegreya-sans)', fontSize: 12 }}>
            <span><span style={{ color: '#7ab4e8' }}>{'\u25A0'}</span> Init {initPct.toFixed(1)}%</span>
            <span><span style={{ color: '#c9a84c' }}>{'\u25A0'}</span> Gameplay {gameplayPct.toFixed(1)}%</span>
            <span><span style={{ color: '#8aba7a' }}>{'\u25A0'}</span> GM {gmPct.toFixed(1)}%</span>
          </div>
        </div>
      )}

      {/* ─── Engagement ─── */}
      <SectionHeader>Engagement</SectionHeader>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
        <StatCard label="Avg Turns/Game" value={avgTurns != null ? avgTurns.toFixed(1) : '—'} />
        <StatCard label="Avg (Completed)" value={avgTurnsCompleted != null ? avgTurnsCompleted.toFixed(1) : '—'} />
        <StatCard label="Avg (Abandoned)" value={avgTurnsAbandoned != null ? avgTurnsAbandoned.toFixed(1) : '—'} />
        <StatCard label="Avg GM Calls" value={avgGmCalls != null ? avgGmCalls.toFixed(1) : '—'} />
      </div>

      {sigDist && Object.keys(sigDist).length > 0 && (() => {
        const scores = [1, 2, 3, 4, 5];
        const maxSig = Math.max(1, ...scores.map(s => sigDist[s] ?? 0));
        return (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 11, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
              Significance Distribution
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 100 }}>
              {scores.map(s => {
                const count = sigDist[s] ?? 0;
                const h = maxSig > 0 ? (count / maxSig) * 100 : 0;
                return (
                  <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: '#8a94a8' }}>{count}</span>
                    <div style={{ width: '100%', maxWidth: 48, height: `${h}%`, minHeight: count > 0 ? 4 : 0, background: '#c9a84c', borderRadius: '3px 3px 0 0', transition: 'height 0.3s' }} />
                    <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: '#7082a4' }}>{s}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {(weeklyGames.length > 0 || weeklyCosts.length > 0) && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 11, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            Weekly Trends
          </div>
          {weeklyGames.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4', marginRight: 8 }}>Games:</span>
              {weeklyGames.slice(-8).map((w, i) => (
                <span key={i} style={{
                  fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: '#d0c098',
                  marginRight: 12,
                }}>
                  <span style={{ fontSize: 10, color: '#7082a4' }}>{w.week || ''} </span>{w.count ?? 0}
                </span>
              ))}
            </div>
          )}
          {weeklyCosts.length > 0 && (
            <div>
              <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4', marginRight: 8 }}>Cost:</span>
              {weeklyCosts.slice(-8).map((w, i, arr) => {
                const prev = i > 0 ? (arr[i - 1].cost ?? 0) : null;
                const curr = w.cost ?? 0;
                const warming = prev != null && curr > prev;
                return (
                  <span key={i} style={{
                    fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12,
                    color: warming ? '#e8845a' : '#d0c098',
                    marginRight: 12,
                  }}>
                    <span style={{ fontSize: 10, color: '#7082a4' }}>{w.week || ''} </span>{formatCostShort(curr)}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN ADMIN PAGE
// ═════════════════════════════════════════════════════════════════════════════

const TABS = ['Users', 'Games', 'Game Log', 'Costs', 'Analytics', 'Health', 'Reports', 'Settings'];

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Users');
  const [authChecked, setAuthChecked] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const [usersData, setUsersData] = useState(null);
  const [gamesData, setGamesData] = useState(null);
  const [costsData, setCostsData] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [reportsData, setReportsData] = useState(null);
  const [settingsData, setSettingsData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);

  const [usersLoading, setUsersLoading] = useState(false);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [costsLoading, setCostsLoading] = useState(false);
  const [healthLoading, setHealthLoading] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const [openReportCount, setOpenReportCount] = useState(0);
  const [pendingGameDetail, setPendingGameDetail] = useState(null);
  const [pendingSearch, setPendingSearch] = useState(null);
  const [pendingGameLogId, setPendingGameLogId] = useState(null);

  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/auth'); return; }
    const user = getUser();
    setUserEmail(user?.email || '');
    getAdminUsers()
      .then(data => { setUsersData(data); setAuthChecked(true); })
      .catch(err => {
        if (err.status === 403) router.replace('/menu');
        else router.replace('/auth');
      });
  }, [router]);

  const fetchedTabs = useRef({});
  const fetchTab = useCallback(async (tab, force = false) => {
    if (!force && fetchedTabs.current[tab]) return;
    fetchedTabs.current[tab] = true;
    if (tab === 'Users') {
      setUsersLoading(true);
      try { setUsersData(await getAdminUsers()); } catch { /* keep stale */ }
      setUsersLoading(false);
    } else if (tab === 'Games') {
      setGamesLoading(true);
      try { setGamesData(await getAdminGames()); } catch { /* keep stale */ }
      setGamesLoading(false);
    } else if (tab === 'Costs') {
      setCostsLoading(true);
      try { setCostsData(await getAdminCosts()); } catch { /* keep stale */ }
      setCostsLoading(false);
    } else if (tab === 'Health') {
      setHealthLoading(true);
      try {
        const d = await getAdminHealth();
        setHealthData(d);
        const rpts = d?.reports || {};
        setOpenReportCount((rpts.openBugs || 0) + (rpts.openSuggestions || 0));
      } catch { /* keep stale */ }
      setHealthLoading(false);
    } else if (tab === 'Reports') {
      setReportsLoading(true);
      try { setReportsData(await getAdminReports({})); } catch { /* keep stale */ }
      setReportsLoading(false);
    } else if (tab === 'Analytics') {
      setAnalyticsLoading(true);
      try { setAnalyticsData(await getAdminAnalytics()); } catch { /* keep stale */ }
      setAnalyticsLoading(false);
    } else if (tab === 'Settings') {
      setSettingsLoading(true);
      try {
        const [invite, announcement] = await Promise.all([getInviteCode(), getAdminAnnouncement()]);
        setSettingsData({ invite, announcement });
      } catch { /* keep stale */ }
      setSettingsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (authChecked) fetchTab(activeTab);
  }, [activeTab, authChecked, fetchTab]);

  if (!authChecked) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0e1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0e1a', color: '#c8c0b0' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 40px', maxWidth: 1280, borderBottom: '1px solid #1e2540',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <a href="/menu" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 22, fontWeight: 900, color: '#c9a84c', letterSpacing: '0.06em' }}>CRUCIBLE</span>
            <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 600, color: '#9a8545', letterSpacing: '0.18em' }}>RPG</span>
          </a>
          <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 14, fontWeight: 600, color: '#7082a4', letterSpacing: '0.08em', textTransform: 'uppercase', marginLeft: 8 }}>ADMIN</span>
        </div>
        <nav style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <a href="/menu" className={styles.headerLink}>Main Menu</a>
          <span style={{ color: '#7082a4' }}>&middot;</span>
          <a href="/settings" className={styles.headerLink}>Settings</a>
          <span style={{ color: '#7082a4' }}>&middot;</span>
          <a href="/rulebook" className={styles.headerLink}>Rulebook</a>
        </nav>
        <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#7082a4' }}>
          Signed in as <span style={{ color: '#c9a84c' }}>{userEmail}</span>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{
        display: 'flex', gap: 0,
        padding: '0 40px', maxWidth: 1280,
        borderBottom: '1px solid #1e2540',
      }}>
        {TABS.map(tab => (
          <button
            key={tab}
            className={activeTab === tab ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab(tab)}
            style={{ position: 'relative' }}
          >
            {tab}
            {tab === 'Reports' && openReportCount > 0 && (
              <span style={{
                position: 'absolute', top: 4, right: 2,
                background: '#c9a84c', color: '#0a0e1a',
                fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9, fontWeight: 700,
                width: 16, height: 16, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{openReportCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '24px 40px' }}>
        {activeTab === 'Users' && (
          <UsersTab
            data={usersData} loading={usersLoading}
            onRefresh={() => fetchTab('Users', true)}
            onGameDeleted={(gameId) => setGamesData(prev => prev ? { ...prev, games: (prev.games || []).filter(g => g.id !== gameId) } : prev)}
            onViewGame={(gid) => { setPendingGameDetail(gid); setActiveTab('Games'); }}
            onNavigateToGames={(playerName) => { setPendingSearch(playerName); setActiveTab('Games'); }}
          />
        )}
        {activeTab === 'Games' && (
          <GamesTab
            data={gamesData} loading={gamesLoading}
            onRefresh={() => fetchTab('Games', true)}
            pendingGameId={pendingGameDetail} onClearPending={() => setPendingGameDetail(null)}
            pendingSearch={pendingSearch} onClearPendingSearch={() => setPendingSearch(null)}
            onViewGameLog={(gid) => { setPendingGameLogId(gid); setActiveTab('Game Log'); }}
          />
        )}
        {activeTab === 'Game Log' && (
          <GameLogTab
            pendingGameId={pendingGameLogId}
            onClearPending={() => setPendingGameLogId(null)}
          />
        )}
        {activeTab === 'Costs' && (
          <CostsTab
            data={costsData} loading={costsLoading}
            onRefresh={() => fetchTab('Costs', true)}
            onViewGame={(gid) => { setPendingGameDetail(gid); setActiveTab('Games'); }}
          />
        )}
        {activeTab === 'Analytics' && (
          <AnalyticsTab
            data={analyticsData} loading={analyticsLoading}
            onRefresh={() => fetchTab('Analytics', true)}
          />
        )}
        {activeTab === 'Health' && (
          <HealthTab
            data={healthData} loading={healthLoading}
            onRefresh={() => fetchTab('Health', true)}
            onSwitchTab={setActiveTab}
            onViewStuckGame={(gid) => { setPendingGameDetail(gid); setActiveTab('Games'); }}
          />
        )}
        {activeTab === 'Reports' && (
          <ReportsTab
            data={reportsData} loading={reportsLoading}
            onRefresh={() => fetchTab('Reports', true)}
            onViewGame={(gid) => { setPendingGameDetail(gid); setActiveTab('Games'); }}
            onReportCountChange={(delta) => setOpenReportCount(prev => Math.max(0, prev + delta))}
          />
        )}
        {activeTab === 'Settings' && (
          <SettingsTab
            data={settingsData} loading={settingsLoading}
            onRefresh={() => fetchTab('Settings', true)}
          />
        )}
      </div>
    </div>
  );
}
