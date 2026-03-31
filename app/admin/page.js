'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getUser } from '@/lib/api';
import {
  getAdminUsers, getAdminUser, togglePlaytester, toggleDebug,
  getAdminGames, getAdminGameDetail, deleteAdminGame, getAdminGameNarrative,
  getAdminCosts, getAdminHealth,
  getAdminReports, updateReport,
  getInviteCode, updateInviteCode,
} from '@/lib/adminApi';
import styles from './page.module.css';

// ─── HELPERS ───

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
  if (!dateStr) return '-';
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

function formatCostPerTurn(cost, turns) {
  if (!turns) return '-';
  return `$${(cost / turns).toFixed(3)}`;
}

// ─── SORT HELPER ───

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

function SortHeader({ label, field, sortField, sortDirection, onSort, style }) {
  const active = sortField === field;
  return (
    <span
      onClick={() => onSort(field)}
      style={{
        ...style,
        fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 600,
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

// ─── STATUS BADGE ───

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

// ─── TRASH ICON SVG ───

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

// ─── DELETE GAME MODAL (type-to-confirm) ───

function DeleteGameModal({ game, onConfirm, onCancel }) {
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [shaking, setShaking] = useState(false);

  const confirmWord = game.characterName || `game-${game.id}`;
  const matches = confirmText === confirmWord;

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
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
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#111528', border: '1px solid #3a3328', borderRadius: 10,
        padding: '24px 28px', maxWidth: 420, width: '90vw',
      }}>
        <h3 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 16, fontWeight: 700, color: '#d0c098', marginBottom: 12 }}>
          Delete Game
        </h3>
        <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#c8c0b0', marginBottom: 4, lineHeight: 1.6 }}>
          This will permanently delete <strong>{game.characterName || `Game #${game.id}`}</strong> — {game.turnCount ?? 0} turns of data. This cannot be undone.
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

// ─── DETAIL PANEL (push layout) ───

function DetailPanel({ children, onClose }) {
  return (
    <div className={styles.pushPanel}>
      <button className={styles.panelClose} onClick={onClose} style={{
        width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, fontWeight: 600,
      }}>&times;</button>
      <div style={{ padding: '28px 32px' }}>{children}</div>
    </div>
  );
}

// ─── COLLAPSIBLE TURN ───

function TurnBlock({ entry }) {
  const [open, setOpen] = useState(false);
  const sig = entry.significanceScore;
  const sigLabel = sig >= 5 ? '\u2605\u2605\u2605\u2605\u2605' : sig >= 4 ? '\u2605\u2605\u2605\u2605' : sig >= 3 ? '\u2605\u2605\u2605' : sig >= 2 ? '\u2605\u2605' : sig >= 1 ? '\u2605' : '';
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
          {sigLabel && <span style={{ fontSize: 10, color: '#c9a84c', marginLeft: 6 }}>{sigLabel}</span>}
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

// =============================================================================
// USERS TAB
// =============================================================================

function UsersTab({ data, loading, onRefresh, onGameDeleted }) {
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const currentUser = getUser();

  useEffect(() => { if (data?.users) setUsers(data.users); }, [data]);

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.displayName || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
  });

  const sorted = useMemo(() => sortData(filtered, sortField, sortDirection), [filtered, sortField, sortDirection]);

  function handleSort(field) {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }

  const [deleteTarget, setDeleteTarget] = useState(null);

  async function openUserDetail(user) {
    setSelectedUser(user);
    setDetailLoading(true);
    try {
      const detail = await getAdminUser(user.id);
      setUserDetail(detail);
    } catch { setUserDetail(null); }
    setDetailLoading(false);
  }

  const [toggleStatus, setToggleStatus] = useState({});
  const [debugToggleStatus, setDebugToggleStatus] = useState({});

  async function handleDebugToggle(user) {
    const newVal = !user.isDebug;
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isDebug: newVal } : u));
    setDebugToggleStatus(prev => ({ ...prev, [user.id]: 'saving' }));
    try {
      await toggleDebug(user.id, newVal);
      setDebugToggleStatus(prev => ({ ...prev, [user.id]: 'saved' }));
      setTimeout(() => setDebugToggleStatus(prev => { const n = { ...prev }; delete n[user.id]; return n; }), 2000);
    } catch {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isDebug: !newVal } : u));
      setDebugToggleStatus(prev => ({ ...prev, [user.id]: 'failed' }));
      setTimeout(() => setDebugToggleStatus(prev => { const n = { ...prev }; delete n[user.id]; return n; }), 3000);
    }
  }

  async function handleToggle(user) {
    const newVal = !user.isPlaytester;
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isPlaytester: newVal } : u));
    setToggleStatus(prev => ({ ...prev, [user.id]: 'saving' }));
    try {
      await togglePlaytester(user.id, newVal);
      setToggleStatus(prev => ({ ...prev, [user.id]: 'saved' }));
      setTimeout(() => setToggleStatus(prev => { const n = { ...prev }; delete n[user.id]; return n; }), 2000);
    } catch {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isPlaytester: !newVal } : u));
      setToggleStatus(prev => ({ ...prev, [user.id]: 'failed' }));
      setTimeout(() => setToggleStatus(prev => { const n = { ...prev }; delete n[user.id]; return n; }), 3000);
    }
  }

  async function handleDeleteGame(gameId) {
    await deleteAdminGame(gameId);
    setUserDetail(prev => {
      if (!prev) return prev;
      const updatedGames = (prev.games || []).filter(g => g.id !== gameId);
      return { ...prev, games: updatedGames };
    });
    setUsers(prev => prev.map(u =>
      u.id === selectedUser?.id ? { ...u, gameCount: Math.max(0, (u.gameCount ?? 1) - 1) } : u
    ));
    if (onGameDeleted) onGameDeleted(gameId);
    setDeleteTarget(null);
  }

  const allLastActiveNull = sorted.length > 0 && sorted.every(u => !u.lastActiveAt);
  const userGridCols = allLastActiveNull ? '1.8fr 2.5fr 80px 100px 100px 120px' : '1.8fr 2.5fr 80px 100px 100px 120px 110px';

  if (loading) return <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4', textAlign: 'center', padding: 40 }}>Loading...</p>;

  return (
    <div style={{ display: 'flex', gap: 0 }}>
      {/* User Detail Panel (push layout) */}
      {selectedUser && (
        <DetailPanel onClose={() => { setSelectedUser(null); setUserDetail(null); setDeleteTarget(null); }}>
          {detailLoading ? (
            <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4' }}>Loading...</p>
          ) : userDetail ? (
            <div>
              <h3 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 20, fontWeight: 700, color: '#d0c098', marginBottom: 4 }}>
                {userDetail.user?.displayName || selectedUser.displayName}
              </h3>
              <p style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: '#7082a4', marginBottom: 4 }}>{userDetail.user?.email || selectedUser.email}</p>
              <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4', marginBottom: 20 }}>
                Joined {formatDate(userDetail.user?.createdAt)} &middot; Playtester: {userDetail.user?.isPlaytester ? 'Yes' : 'No'} &middot; Debug: {userDetail.user?.isDebug ? 'Yes' : 'No'}
              </p>

              <div style={{ marginBottom: 24 }}>
                <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Total AI Spend
                </span>
                <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 18, color: '#d0c098', marginTop: 4 }}>
                  {formatCostShort(userDetail.totalCost)}
                </div>
              </div>

              {/* User games list */}
              <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
                Games ({userDetail.games?.length || 0})
              </span>
              <div className={styles.tableCard}>
                {(userDetail.games || []).map(g => (
                  <div key={g.id} className={styles.tableRow} style={{
                    display: 'grid', gridTemplateColumns: '1.5fr 1fr 70px 70px 80px 30px',
                    padding: '8px 12px', borderBottom: '1px solid #2a2622', alignItems: 'center',
                  }}>
                    <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#c8c0b0' }}>
                      {g.characterName || <em style={{ color: '#7082a4' }}>No character yet</em>}
                    </span>
                    <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#8a94a8' }}>{g.setting || '-'}</span>
                    <StatusBadge status={g.status} />
                    <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: '#c8c0b0' }}>{g.turnCount ?? 0}</span>
                    <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: '#c8c0b0' }}>{formatCost(g.totalCost)}</span>
                    <button
                      className={styles.deleteIcon}
                      aria-label="Delete game"
                      onClick={() => setDeleteTarget(g)}
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
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 20, fontWeight: 700, color: '#d0c098', margin: 0 }}>Users</h2>
            <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 14, color: '#7082a4' }}>{filtered.length}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              className={styles.searchInput}
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button className={styles.refreshBtn} onClick={onRefresh}>Refresh</button>
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableCard}>
          {/* Header row */}
          <div style={{
            display: 'grid', gridTemplateColumns: userGridCols, gap: 12,
            padding: '10px 16px', borderBottom: '1px solid #2a2622',
          }}>
            <SortHeader label="Name" field="displayName" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
            <SortHeader label="Email" field="email" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
            <SortHeader label="Games" field="gameCount" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
            <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Playtester</span>
            <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Debug</span>
            <SortHeader label="Joined" field="createdAt" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
            {!allLastActiveNull && <SortHeader label="Last Active" field="lastActiveAt" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />}
          </div>
          {/* Data rows */}
          {sorted.map(user => (
            <div key={user.id} className={styles.clickableRow} onClick={() => openUserDetail(user)} style={{
              display: 'grid', gridTemplateColumns: userGridCols, gap: 12,
              padding: '10px 16px', borderBottom: '1px solid #2a2622', alignItems: 'center',
            }}>
              <div>
                <span className={styles.nameLink}>
                  {user.displayName || 'No name'}
                </span>
                {currentUser?.email === user.email && <span className={styles.badgeAdmin}>ADMIN</span>}
              </div>
              <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: '#7082a4' }}>{user.email}</span>
              <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 13, color: '#c8c0b0' }}>{user.gameCount ?? 0}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  className={user.isPlaytester ? styles.toggleOn : styles.toggleOff}
                  style={{ opacity: toggleStatus[user.id] === 'saving' ? 0.5 : 1 }}
                  onClick={e => { e.stopPropagation(); handleToggle(user); }}
                  aria-label={`Toggle playtester for ${user.displayName}`}
                />
                {toggleStatus[user.id] === 'saved' && <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 11, color: '#8aba7a' }}>Saved</span>}
                {toggleStatus[user.id] === 'failed' && <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 11, color: '#e85a5a' }}>Failed</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  className={user.isDebug ? styles.toggleOn : styles.toggleOff}
                  style={{ opacity: debugToggleStatus[user.id] === 'saving' ? 0.5 : 1 }}
                  onClick={e => { e.stopPropagation(); handleDebugToggle(user); }}
                  aria-label={`Toggle debug for ${user.displayName}`}
                />
                {debugToggleStatus[user.id] === 'saved' && <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 11, color: '#8aba7a' }}>Saved</span>}
                {debugToggleStatus[user.id] === 'failed' && <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 11, color: '#e85a5a' }}>Failed</span>}
              </div>
              <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4' }}>{formatDate(user.createdAt)}</span>
              {!allLastActiveNull && <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4' }}>{timeAgo(user.lastActiveAt)}</span>}
            </div>
          ))}
          {sorted.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4' }}>
              No users found.
            </div>
          )}
        </div>
        {allLastActiveNull && sorted.length > 0 && (
          <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4', fontStyle: 'italic', marginTop: 8 }}>
            Last active tracking coming soon
          </div>
        )}
      </div>

      {/* Delete game modal */}
      {deleteTarget && (
        <DeleteGameModal
          game={deleteTarget}
          onConfirm={handleDeleteGame}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

// =============================================================================
// GAMES TAB
// =============================================================================

function GamesTab({ data, loading, onRefresh }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedGame, setSelectedGame] = useState(null);
  const [gameDetail, setGameDetail] = useState(null);
  const [narrative, setNarrative] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [rowDeleteTarget, setRowDeleteTarget] = useState(null);
  const [localGames, setLocalGames] = useState(null);
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('desc');

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
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }

  async function openGameDetail(game) {
    setSelectedGame(game);
    setDetailLoading(true);
    setNarrative(null);
    try {
      const detail = await getAdminGameDetail(game.id);
      setGameDetail(detail);
    } catch { setGameDetail(null); }
    setDetailLoading(false);
  }

  async function loadFullNarrative() {
    if (!selectedGame) return;
    try {
      const narr = await getAdminGameNarrative(selectedGame.id);
      setNarrative(narr);
    } catch { /* ignore */ }
  }

  async function handleDelete(gameId) {
    await deleteAdminGame(gameId);
    setSelectedGame(null);
    setGameDetail(null);
    setConfirmDelete(null);
    setLocalGames(prev => (prev || data?.games || []).filter(g => g.id !== gameId));
  }

  async function handleRowDelete(gameId) {
    await deleteAdminGame(gameId);
    setLocalGames(prev => (prev || data?.games || []).filter(g => g.id !== gameId));
    setRowDeleteTarget(null);
  }

  const statuses = ['all', 'active', 'initializing', 'completed', 'abandoned'];

  if (loading) return <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4', textAlign: 'center', padding: 40 }}>Loading...</p>;

  return (
    <div style={{ display: 'flex', gap: 0 }}>
      {/* Game Detail Panel (push layout) */}
      {selectedGame && (
        <DetailPanel onClose={() => { setSelectedGame(null); setGameDetail(null); setNarrative(null); setConfirmDelete(null); }}>
          {detailLoading ? (
            <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4' }}>Loading...</p>
          ) : gameDetail ? (
            <div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <h3 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 20, fontWeight: 700, color: '#d0c098', margin: 0 }}>
                    Game #{gameDetail.game?.id ?? selectedGame.id}
                  </h3>
                  <StatusBadge status={gameDetail.game?.status || selectedGame.status} />
                </div>
                <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#c8c0b0', marginBottom: 2 }}>
                  {gameDetail.game?.characterName || 'No character'} &middot; {gameDetail.game?.setting || 'No setting'}
                </p>
                <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#8a94a8', marginBottom: 2 }}>
                  Player: {gameDetail.game?.playerName || '-'} ({gameDetail.game?.playerEmail || '-'})
                </p>
                <p style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: '#7082a4' }}>
                  Total: {formatCost(gameDetail.game?.totalCost)} &middot; {gameDetail.game?.turnCount ?? 0} turns &middot; {gameDetail.game?.costPerTurn != null ? formatCost(gameDetail.game.costPerTurn) : formatCostPerTurn(gameDetail.game?.gameplayCost ?? gameDetail.game?.totalCost, gameDetail.game?.turnCount)}/turn
                </p>
                {(gameDetail.game?.initCost > 0 || gameDetail.game?.gameplayCost > 0) && (
                  <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4', marginTop: 2 }}>
                    Init: {formatCost(gameDetail.game?.initCost)} &middot; Gameplay: {formatCost(gameDetail.game?.gameplayCost)}
                  </p>
                )}
                <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4', marginTop: 4 }}>
                  Created {formatDate(gameDetail.game?.createdAt)} &middot; Last played {timeAgo(gameDetail.game?.lastPlayedAt || gameDetail.game?.lastPlayed)}
                </p>
              </div>
              {gameDetail.character && (
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 700, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Character</h4>
                  <div style={{ background: '#111528', border: '1px solid #3a3328', borderRadius: 6, padding: 16 }}>
                    <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#c8c0b0', marginBottom: 8 }}><strong style={{ color: '#d0c098' }}>{gameDetail.character.name}</strong></p>
                    {gameDetail.character.backstory && (
                      <p style={{ fontFamily: 'var(--font-alegreya)', fontStyle: 'italic', fontSize: 13, color: '#8a94a8', marginBottom: 12, lineHeight: 1.6 }}>
                        {gameDetail.character.backstory.length > 300 ? gameDetail.character.backstory.slice(0, 300) + '...' : gameDetail.character.backstory}
                      </p>
                    )}
                    {gameDetail.character.stats && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px', marginBottom: 12 }}>
                        {Object.entries(gameDetail.character.stats).map(([stat, val]) => (
                          <div key={stat} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #2a2622' }}>
                            <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 11, fontWeight: 600, color: '#9a8545' }}>{stat.toUpperCase()}</span>
                            <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 13, color: '#c8c0b0' }}>{typeof val === 'object' ? `${val.base ?? val.effective ?? '-'}` : val}</span>
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
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 700, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Narrative Log</h4>
                <div className={styles.tableCard}>
                  {(narrative?.entries || gameDetail.narrative || []).slice(0, narrative ? undefined : 200).map((entry, i) => (
                    <TurnBlock key={i} entry={entry} />
                  ))}
                  {!narrative && (gameDetail.narrative?.length || 0) > 200 && (
                    <button onClick={loadFullNarrative} style={{ width: '100%', padding: 12, background: 'none', border: 'none', fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#c9a84c', cursor: 'pointer' }}>Load full narrative</button>
                  )}
                  {(!gameDetail.narrative || gameDetail.narrative.length === 0) && !narrative && (
                    <div style={{ padding: 14, textAlign: 'center', fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#7082a4' }}>No narrative entries.</div>
                  )}
                </div>
              </div>
              <div style={{ borderTop: '1px solid #1e2540', paddingTop: 20 }}>
                <button className={styles.dangerBtn} onClick={() => setRowDeleteTarget({ ...selectedGame, characterName: gameDetail.game?.characterName, turnCount: gameDetail.game?.turnCount })}>Delete Game</button>
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
            <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 20, fontWeight: 700, color: '#d0c098', margin: 0 }}>All Games</h2>
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
        <div className={styles.tableCard} style={{ overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '50px 2fr 1.2fr 1.2fr 85px 60px 90px 80px 90px 40px', padding: '10px 16px', borderBottom: '1px solid #2a2622', minWidth: 900 }}>
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
          {sorted.map(game => (
            <div key={game.id} className={styles.clickableRow} onClick={() => openGameDetail(game)} style={{
              display: 'grid', gridTemplateColumns: '50px 2fr 1.2fr 1.2fr 85px 60px 90px 80px 90px 40px',
              padding: '10px 16px', borderBottom: '1px solid #2a2622', alignItems: 'center', minWidth: 900,
            }}>
              <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: '#7082a4' }}>#{game.id}</span>
              <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#c8c0b0' }}>{game.characterName || <em style={{ color: '#7082a4' }}>No character yet</em>}</span>
              <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#8a94a8' }}>{game.playerName || '-'}</span>
              <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#8a94a8' }}>{game.setting || '-'}</span>
              <StatusBadge status={game.status} />
              <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 13, color: '#c8c0b0' }}>{game.turnCount ?? 0}</span>
              <div className={styles.costCell}>
                <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 13, color: (game.totalCost || 0) > 0.5 ? '#e8c45a' : '#c8c0b0', fontWeight: (game.totalCost || 0) > 0.5 ? 600 : 400 }}>{formatCost(game.totalCost)}</span>
                {(game.initCost > 0) && <div className={styles.costBreakdown}>Init: {formatCost(game.initCost)} &middot; Gameplay: {formatCost(game.gameplayCost)}</div>}
              </div>
              <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: '#7082a4' }}>{game.costPerTurn != null ? formatCost(game.costPerTurn) : formatCostPerTurn(game.gameplayCost ?? game.totalCost, game.turnCount)}</span>
              <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4' }}>{timeAgo(game.lastPlayedAt || game.lastPlayed)}</span>
              <button className={styles.deleteIcon} aria-label="Delete game" onClick={e => { e.stopPropagation(); setRowDeleteTarget(game); }}><TrashIcon /></button>
            </div>
          ))}
          {sorted.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4' }}>No games found.</div>
          )}
        </div>
      </div>

      {/* Delete game modal (type-to-confirm) */}
      {rowDeleteTarget && (
        <DeleteGameModal
          game={rowDeleteTarget}
          onConfirm={handleRowDelete}
          onCancel={() => setRowDeleteTarget(null)}
        />
      )}
    </div>
  );
}

// =============================================================================
// COSTS TAB
// =============================================================================

function CostsTab({ data, loading, onRefresh }) {
  if (loading) return <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4', textAlign: 'center', padding: 40 }}>Loading...</p>;

  const costs = data || {};

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 20, fontWeight: 700, color: '#d0c098', margin: 0 }}>Costs</h2>
        <button className={styles.refreshBtn} onClick={onRefresh}>Refresh</button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 12 }}>
        {[
          { label: 'Total Spend', value: formatCostShort(costs.totalSpend), sub: 'Across all games' },
          { label: 'Total Turns', value: String(costs.totalTurns ?? 0), sub: 'All users combined' },
          { label: 'Avg Cost/Turn', value: formatCost(costs.avgCostPerTurn), sub: 'Gameplay only' },
          { label: 'Active Games', value: String(costs.activeGames ?? 0), sub: 'Currently in progress' },
        ].map(card => (
          <div key={card.label} className={styles.statCard}>
            <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
              {card.label}
            </div>
            <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 28, fontWeight: 700, color: '#d0c098', marginBottom: 4 }}>
              {card.value}
            </div>
            <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4' }}>{card.sub}</div>
          </div>
        ))}
      </div>
      {(costs.totalInitCost != null || costs.totalGameplayCost != null) && (
        <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4', marginBottom: 28 }}>
          Init costs: {formatCost(costs.totalInitCost)} &middot; Gameplay costs: {formatCost(costs.totalGameplayCost)}
        </p>
      )}
      {costs.totalInitCost == null && costs.totalGameplayCost == null && <div style={{ marginBottom: 28 }} />}

      {/* Top Cost Games */}
      {costs.topGames?.length > 0 && (
        <div className={styles.tableCard}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #2a2622' }}>
            <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Highest-Cost Games
            </span>
          </div>
          {costs.topGames.map((g, i) => (
            <div key={i} className={styles.tableRow} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 16px', borderBottom: '1px solid #2a2622',
            }}>
              <div>
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

// =============================================================================
// HEALTH TAB
// =============================================================================

function HealthTab({ data, loading, onRefresh, onSwitchTab }) {
  const [showErrors, setShowErrors] = useState(false);

  if (loading) return <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4', textAlign: 'center', padding: 40 }}>Loading...</p>;

  const h = data || {};
  const db = h.database || {};
  const counts = h.counts || {};
  const errors = h.errors || {};
  const stuck = h.stuckGames || [];
  const reports = h.reports || {};
  const storytellers = h.storytellerPopularity || [];
  const settings = h.settingPopularity || [];
  const retention = h.retention || {};
  const maxST = storytellers.length > 0 ? storytellers[0].count : 1;
  const maxSE = settings.length > 0 ? settings[0].count : 1;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 20, fontWeight: 700, color: '#d0c098', margin: 0 }}>Health</h2>
        <button className={styles.refreshBtn} onClick={onRefresh}>Refresh</button>
      </div>

      {/* Status Cards */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
        <div className={styles.statCard}>
          <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Database</div>
          <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 28, fontWeight: 700, color: db.connected ? '#8aba7a' : '#e85a5a', marginBottom: 4 }}>
            {db.connected ? 'Connected' : 'Error'}
          </div>
          <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4' }}>{db.size || '-'}</div>
        </div>
        <div className={styles.statCard}>
          <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Errors (24h)</div>
          <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 28, fontWeight: 700, color: (errors.last24h || 0) > 0 ? '#e8845a' : '#d0c098', marginBottom: 4 }}>
            {errors.last24h ?? 0}
          </div>
          <div>
            {(errors.last24h || 0) > 0 && (
              <button onClick={() => setShowErrors(!showErrors)} style={{ background: 'none', border: 'none', fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#c9a84c', cursor: 'pointer', padding: 0 }}>
                {showErrors ? 'Hide details' : 'View details'}
              </button>
            )}
          </div>
        </div>
        <div className={styles.statCard}>
          <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Stuck Games</div>
          <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 28, fontWeight: 700, color: stuck.length > 0 ? '#e8c45a' : '#d0c098', marginBottom: 4 }}>
            {stuck.length}
          </div>
          <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4' }}>
            {stuck.length > 0 ? 'See below' : 'None'}
          </div>
        </div>
        <div className={styles.statCard} style={{ cursor: (reports.openBugs || reports.openSuggestions) ? 'pointer' : 'default' }}
          onClick={() => { if (reports.openBugs || reports.openSuggestions) onSwitchTab?.('Reports'); }}>
          <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Open Reports</div>
          <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 28, fontWeight: 700, color: ((reports.openBugs || 0) + (reports.openSuggestions || 0)) > 0 ? '#e8c45a' : '#d0c098', marginBottom: 4 }}>
            {(reports.openBugs || 0) + (reports.openSuggestions || 0)}
          </div>
          <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4' }}>
            {reports.openBugs || 0} bugs &middot; {reports.openSuggestions || 0} suggestions
          </div>
        </div>
      </div>

      {/* Counts */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
        <div className={styles.statCard}>
          <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Users</div>
          <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 28, fontWeight: 700, color: '#d0c098', marginBottom: 4 }}>{counts.totalUsers ?? 0}</div>
          <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4' }}>{counts.totalPlaytesters ?? 0} playtesters</div>
        </div>
        <div className={styles.statCard}>
          <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Games</div>
          <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 28, fontWeight: 700, color: '#d0c098', marginBottom: 4 }}>{counts.totalGames ?? 0}</div>
          <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4' }}>{counts.activeGames ?? 0} active</div>
        </div>
        <div className={styles.statCard}>
          <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Total Turns</div>
          <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 28, fontWeight: 700, color: '#d0c098', marginBottom: 4 }}>{counts.totalTurns ?? 0}</div>
          <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4' }}>All time</div>
        </div>
      </div>

      {/* Stuck Games */}
      {stuck.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 700, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            Stuck Games
          </h4>
          <div className={styles.tableCard}>
            {stuck.map((g, i) => (
              <div key={i} className={styles.clickableRow} onClick={() => { if (onSwitchTab) onSwitchTab('Games'); }} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 16px', borderBottom: '1px solid #2a2622',
              }}>
                <div>
                  <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#c8c0b0' }}>
                    #{g.id} &middot; {g.characterName || 'Unnamed'} &middot; {g.playerName || 'Unknown'}
                  </span>
                </div>
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
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Storyteller Popularity */}
      {storytellers.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 700, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
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
          <h4 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 700, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
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

      {/* Retention */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 24 }}>
        <div className={styles.statCard}>
          <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Players with Games</div>
          <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 18, fontWeight: 700, color: '#d0c098' }}>
            {retention.usersWithGames ?? 0} of {counts.totalUsers ?? 0}
          </div>
        </div>
        <div className={styles.statCard}>
          <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Created 2+ Games</div>
          <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 18, fontWeight: 700, color: '#d0c098' }}>
            {retention.usersWithMultipleGames ?? 0} of {retention.usersWithGames ?? 0}
          </div>
        </div>
        <div className={styles.statCard}>
          <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Returned for 2+ Sessions</div>
          <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 18, fontWeight: 700, color: '#d0c098' }}>
            {retention.returningUsers ?? 0} of {retention.usersWithGames ?? 0}
          </div>
        </div>
      </div>

      {/* Recent Errors */}
      {showErrors && errors.recent?.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 700, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
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

// =============================================================================
// REPORTS TAB
// =============================================================================

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
    <div style={{
      background: '#111528', border: '1px solid #3a3328', borderRadius: 8,
      padding: '16px 20px',
    }}>
      {/* Header row */}
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

      {/* Player info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#8a94a8' }}>
          {report.playerName || 'Unknown'} ({report.playerEmail || '-'})
          {report.gameId && (
            <span> &middot; Game #{report.gameId}{report.characterName ? ` &middot; ${report.characterName}` : ''}{ctx.turnNumber ? ` &middot; Turn ${ctx.turnNumber}` : ''}</span>
          )}
        </span>
        <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4' }}>{timeAgo(report.createdAt)}</span>
      </div>

      {/* Message */}
      <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#c8c0b0', lineHeight: 1.6, margin: '0 0 10px' }}>
        {msgTruncated ? report.message.slice(0, 200) + '...' : report.message}
        {msgTruncated && (
          <button onClick={() => setExpanded(true)} style={{
            background: 'none', border: 'none', color: '#c9a84c', fontSize: 13,
            fontFamily: 'var(--font-alegreya-sans)', cursor: 'pointer', marginLeft: 4,
          }}>Show more</button>
        )}
      </p>

      {/* Context toggle */}
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
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#8a94a8', maxWidth: '60%', textAlign: 'right' }}>{String(val)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Admin actions */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Status pills */}
        <div style={{ display: 'flex', gap: 4 }}>
          {REPORT_STATUSES.map(s => (
            <button
              key={s}
              className={(report.status || 'open') === s ? styles.filterPillActive : styles.filterPill}
              onClick={() => onStatusChange(report.id, s)}
              style={{ padding: '3px 8px' }}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Notes toggle */}
        <button onClick={() => setShowNotes(!showNotes)} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: report.adminNotes ? '#8a94a8' : '#7082a4',
        }}>
          {report.adminNotes ? 'Edit note' : 'Add note'}
        </button>

        {/* View Game */}
        {report.gameId && (
          <button onClick={() => onViewGame(report.gameId)} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#c9a84c',
          }}>View Game</button>
        )}
      </div>

      {/* Notes editor */}
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

function ReportsTab({ data, loading, onRefresh, onViewGame }) {
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('open');
  const [reports, setReports] = useState([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => { if (data?.reports) setReports(data.reports); }, [data]);

  // Re-fetch when filters change
  useEffect(() => {
    if (!data) return; // first load handled by parent
    let cancelled = false;
    setFetching(true);
    getAdminReports({ type: typeFilter, status: statusFilter })
      .then(d => { if (!cancelled) setReports(d.reports || []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setFetching(false); });
    return () => { cancelled = true; };
  }, [typeFilter, statusFilter]);

  async function handleStatusChange(reportId, newStatus) {
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
    try { await updateReport(reportId, { status: newStatus }); }
    catch { setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: r.status } : r)); }
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
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 20, fontWeight: 700, color: '#d0c098', margin: 0 }}>Reports</h2>
          <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 14, color: '#7082a4' }}>{reports.length}</span>
        </div>
        <button className={styles.refreshBtn} onClick={onRefresh}>Refresh</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {['all', 'bug', 'suggestion'].map(t => (
            <button key={t} className={typeFilter === t ? styles.filterPillActive : styles.filterPill}
              onClick={() => setTypeFilter(t)}>
              {t === 'all' ? 'All' : t === 'bug' ? 'Bugs' : 'Suggestions'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {REPORT_STATUSES.map(s => (
            <button key={s} className={statusFilter === s ? styles.filterPillActive : styles.filterPill}
              onClick={() => setStatusFilter(s)}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Report cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {fetching ? (
          <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4', textAlign: 'center', padding: 20 }}>Loading...</p>
        ) : reports.length === 0 ? (
          <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4', textAlign: 'center', padding: 20 }}>No reports found.</p>
        ) : (
          reports.map(r => (
            <ReportCard
              key={r.id}
              report={r}
              onStatusChange={handleStatusChange}
              onSaveNotes={handleSaveNotes}
              onViewGame={onViewGame}
            />
          ))
        )}
      </div>
    </div>
  );
}

// =============================================================================
// SETTINGS TAB
// =============================================================================

function SettingsTab({ data, loading, onRefresh }) {
  const [newCode, setNewCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  if (loading) return <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4', textAlign: 'center', padding: 40 }}>Loading...</p>;

  const invite = data || {};

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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 16, fontWeight: 700, color: '#d0c098', margin: 0 }}>Settings</h2>
        <button className={styles.refreshBtn} onClick={onRefresh}>Refresh</button>
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
          {invite.source || 'Unknown source'}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            className={styles.codeInput}
            placeholder="New invite code..."
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

// =============================================================================
// MAIN ADMIN PAGE
// =============================================================================

const TABS = ['Users', 'Games', 'Costs', 'Health', 'Reports', 'Settings'];

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Users');
  const [authChecked, setAuthChecked] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // Tab data caches
  const [usersData, setUsersData] = useState(null);
  const [gamesData, setGamesData] = useState(null);
  const [costsData, setCostsData] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [reportsData, setReportsData] = useState(null);
  const [settingsData, setSettingsData] = useState(null);

  // Loading states
  const [usersLoading, setUsersLoading] = useState(false);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [costsLoading, setCostsLoading] = useState(false);
  const [healthLoading, setHealthLoading] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Open report count for tab badge
  const [openReportCount, setOpenReportCount] = useState(0);

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/auth'); return; }
    const user = getUser();
    setUserEmail(user?.email || '');

    // Admin check: try fetching users; 403 means not admin
    getAdminUsers()
      .then(data => {
        setUsersData(data);
        setAuthChecked(true);
      })
      .catch(err => {
        if (err.status === 403) router.replace('/menu');
        else router.replace('/auth');
      });
  }, [router]);

  // Fetch tab data on first visit
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
      try {
        const d = await getAdminReports({ status: 'open' });
        setReportsData(d);
      } catch { /* keep stale */ }
      setReportsLoading(false);
    } else if (tab === 'Settings') {
      setSettingsLoading(true);
      try { setSettingsData(await getInviteCode()); } catch { /* keep stale */ }
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
        padding: '20px 48px',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 22, fontWeight: 900, color: '#c9a84c', letterSpacing: '0.06em' }}>CRUCIBLE</span>
          <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 600, color: '#9a8545', letterSpacing: '0.18em' }}>RPG</span>
          <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 14, fontWeight: 600, color: '#7082a4', letterSpacing: '0.08em', textTransform: 'uppercase', marginLeft: 8 }}>ADMIN</span>
        </div>
        <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#7082a4' }}>
          Signed in as <span style={{ color: '#c9a84c' }}>{userEmail}</span>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{
        display: 'flex', gap: 0,
        padding: '0 48px',
        borderTop: '1px solid #1e2540',
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
                position: 'absolute', top: 6, right: 4,
                background: '#c9a84c', color: '#0a0e1a',
                fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700,
                width: 16, height: 16, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{openReportCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '28px 48px' }}>
        {activeTab === 'Users' && <UsersTab data={usersData} loading={usersLoading} onRefresh={() => fetchTab('Users', true)} onGameDeleted={(gameId) => setGamesData(prev => prev ? { ...prev, games: (prev.games || []).filter(g => g.id !== gameId) } : prev)} />}
        {activeTab === 'Games' && <GamesTab data={gamesData} loading={gamesLoading} onRefresh={() => fetchTab('Games', true)} />}
        {activeTab === 'Costs' && <CostsTab data={costsData} loading={costsLoading} onRefresh={() => fetchTab('Costs', true)} />}
        {activeTab === 'Health' && <HealthTab data={healthData} loading={healthLoading} onRefresh={() => fetchTab('Health', true)} onSwitchTab={setActiveTab} />}
        {activeTab === 'Reports' && <ReportsTab data={reportsData} loading={reportsLoading} onRefresh={() => fetchTab('Reports', true)} onViewGame={(gid) => { setActiveTab('Games'); }} />}
        {activeTab === 'Settings' && <SettingsTab data={settingsData} loading={settingsLoading} onRefresh={() => fetchTab('Settings', true)} />}
      </div>
    </div>
  );
}
