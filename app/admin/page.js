'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getUser } from '@/lib/api';
import {
  getAdminUsers, getAdminUser, togglePlaytester,
  getAdminGames, getAdminGameDetail, deleteAdminGame, getAdminGameNarrative,
  getAdminCosts, getAdminHealth,
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

// ─── DELETE MODAL ───

function DeleteModal({ game, onConfirm, onCancel }) {
  return (
    <div className={styles.deleteModal} onClick={onCancel}>
      <div className={styles.deleteModalCard} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 16, fontWeight: 700, color: '#d0c098', marginBottom: 10 }}>
          Delete game #{game.id}?
        </h3>
        <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#8a94a8', marginBottom: 6 }}>
          {game.characterName || 'No character'} - {game.setting || 'No setting'} - {game.turnCount ?? 0} turns
        </p>
        <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#e85a5a', marginBottom: 18 }}>
          This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className={styles.ghostBtn} onClick={onCancel}>Cancel</button>
          <button className={styles.dangerBtnSolid} onClick={() => onConfirm(game.id)}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── DETAIL PANEL ───

function DetailPanel({ children, onClose }) {
  return (
    <>
      <div className={styles.panelOverlay} onClick={onClose} />
      <div className={styles.panelSlide}>
        <button className={styles.panelClose} onClick={onClose}>&times;</button>
        <div style={{ padding: '28px 32px' }}>{children}</div>
      </div>
    </>
  );
}

// ─── COLLAPSIBLE TURN ───

function TurnBlock({ entry }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid #2a2622' }}>
      <div
        className={styles.turnHeader}
        onClick={() => setOpen(!open)}
        style={{ padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: '#7082a4' }}>
          Turn {entry.turnNumber}{entry.significanceScore != null ? ` (sig: ${entry.significanceScore})` : ''}
        </span>
        <span style={{ color: '#7082a4', fontSize: 11 }}>{open ? '\u25B2' : '\u25BC'}</span>
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

function UsersTab({ data, loading, onRefresh }) {
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const currentUser = getUser();

  useEffect(() => { if (data?.users) setUsers(data.users); }, [data]);

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.displayName || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
  });

  async function openUserDetail(user) {
    setSelectedUser(user);
    setDetailLoading(true);
    try {
      const detail = await getAdminUser(user.id);
      setUserDetail(detail);
    } catch { setUserDetail(null); }
    setDetailLoading(false);
  }

  async function handleToggle(user) {
    const newVal = !user.isPlaytester;
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isPlaytester: newVal } : u));
    try {
      await togglePlaytester(user.id, newVal);
    } catch {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isPlaytester: !newVal } : u));
    }
  }

  if (loading) return <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4', textAlign: 'center', padding: 40 }}>Loading...</p>;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 16, fontWeight: 700, color: '#d0c098', margin: 0 }}>Users</h2>
          <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: '#7082a4' }}>{filtered.length}</span>
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
          display: 'grid', gridTemplateColumns: '1.8fr 2.5fr 80px 80px 110px 110px',
          padding: '10px 16px', borderBottom: '1px solid #2a2622',
        }}>
          {['Name', 'Email', 'Games', 'Playtester', 'Joined', 'Last Active'].map(h => (
            <span key={h} style={{
              fontFamily: 'var(--font-cinzel)', fontSize: 10, fontWeight: 600,
              color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>{h}</span>
          ))}
        </div>
        {/* Data rows */}
        {filtered.map(user => (
          <div key={user.id} className={styles.tableRow} style={{
            display: 'grid', gridTemplateColumns: '1.8fr 2.5fr 80px 80px 110px 110px',
            padding: '10px 16px', borderBottom: '1px solid #2a2622', alignItems: 'center',
          }}>
            <div>
              <span className={styles.nameLink} onClick={() => openUserDetail(user)}>
                {user.displayName || 'No name'}
              </span>
              {currentUser?.email === user.email && <span className={styles.badgeAdmin}>ADMIN</span>}
            </div>
            <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: '#7082a4' }}>{user.email}</span>
            <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 13, color: '#c8c0b0' }}>{user.gameCount ?? 0}</span>
            <button
              className={user.isPlaytester ? styles.toggleOn : styles.toggleOff}
              onClick={() => handleToggle(user)}
              aria-label={`Toggle playtester for ${user.displayName}`}
            />
            <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4' }}>{formatDate(user.createdAt)}</span>
            <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4' }}>{timeAgo(user.lastActiveAt)}</span>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: 20, textAlign: 'center', fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4' }}>
            No users found.
          </div>
        )}
      </div>

      {/* User Detail Panel */}
      {selectedUser && (
        <DetailPanel onClose={() => { setSelectedUser(null); setUserDetail(null); }}>
          {detailLoading ? (
            <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4' }}>Loading...</p>
          ) : userDetail ? (
            <div>
              <h3 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 18, fontWeight: 700, color: '#d0c098', marginBottom: 4 }}>
                {userDetail.user?.displayName || selectedUser.displayName}
              </h3>
              <p style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: '#7082a4', marginBottom: 4 }}>{userDetail.user?.email || selectedUser.email}</p>
              <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4', marginBottom: 20 }}>
                Joined {formatDate(userDetail.user?.createdAt)} &middot; Playtester: {userDetail.user?.isPlaytester ? 'Yes' : 'No'}
              </p>

              <div style={{ marginBottom: 24 }}>
                <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 10, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Total AI Spend
                </span>
                <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 18, color: '#d0c098', marginTop: 4 }}>
                  {formatCostShort(userDetail.totalCost)}
                </div>
              </div>

              {/* User games list */}
              <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 10, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
                Games ({userDetail.games?.length || 0})
              </span>
              <div className={styles.tableCard}>
                {(userDetail.games || []).map(g => (
                  <div key={g.id} className={styles.tableRow} style={{
                    display: 'grid', gridTemplateColumns: '1.5fr 1fr 70px 70px 80px',
                    padding: '8px 12px', borderBottom: '1px solid #2a2622', alignItems: 'center',
                  }}>
                    <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#c8c0b0' }}>
                      {g.characterName || <em style={{ color: '#7082a4' }}>No character yet</em>}
                    </span>
                    <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#8a94a8' }}>{g.setting || '-'}</span>
                    <StatusBadge status={g.status} />
                    <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: '#c8c0b0' }}>{g.turnCount ?? 0}</span>
                    <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: '#c8c0b0' }}>{formatCost(g.totalCost)}</span>
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

  const games = localGames || data?.games || [];

  const filtered = games.filter(g => {
    if (statusFilter !== 'all' && (g.status || '').toLowerCase() !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (g.characterName || '').toLowerCase().includes(q)
      || (g.playerName || '').toLowerCase().includes(q)
      || (g.setting || '').toLowerCase().includes(q);
  });

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
    try {
      await deleteAdminGame(gameId);
      setSelectedGame(null);
      setGameDetail(null);
      setConfirmDelete(null);
      onRefresh();
    } catch { /* ignore */ }
  }

  async function handleRowDelete(gameId) {
    try {
      await deleteAdminGame(gameId);
      setLocalGames(prev => (prev || data?.games || []).filter(g => g.id !== gameId));
      setRowDeleteTarget(null);
    } catch { /* ignore */ }
  }

  const statuses = ['all', 'active', 'initializing', 'completed', 'abandoned'];

  if (loading) return <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4', textAlign: 'center', padding: 40 }}>Loading...</p>;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 16, fontWeight: 700, color: '#d0c098', margin: 0 }}>All Games</h2>
          <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: '#7082a4' }}>{filtered.length}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            className={styles.searchInput}
            placeholder="Search by character, player, or setting..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className={styles.refreshBtn} onClick={onRefresh}>Refresh</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {statuses.map(s => (
          <button
            key={s}
            className={statusFilter === s ? styles.filterPillActive : styles.filterPill}
            onClick={() => setStatusFilter(s)}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className={styles.tableCard} style={{ overflowX: 'auto' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '50px 1.8fr 1.2fr 1.2fr 110px 70px 90px 80px 100px 50px',
          padding: '10px 16px', borderBottom: '1px solid #2a2622', minWidth: 900,
        }}>
          {['ID', 'Character', 'Player', 'Setting', 'Status', 'Turns', 'AI Cost', '$/Turn', 'Last Played', ''].map((h, i) => (
            <span key={i} style={{
              fontFamily: 'var(--font-cinzel)', fontSize: 10, fontWeight: 600,
              color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>{h}</span>
          ))}
        </div>
        {filtered.map(game => (
          <div key={game.id} className={styles.clickableRow} onClick={() => openGameDetail(game)} style={{
            display: 'grid', gridTemplateColumns: '50px 1.8fr 1.2fr 1.2fr 110px 70px 90px 80px 100px 50px',
            padding: '10px 16px', borderBottom: '1px solid #2a2622', alignItems: 'center', minWidth: 900,
          }}>
            <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: '#7082a4' }}>#{game.id}</span>
            <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#c8c0b0' }}>
              {game.characterName || <em style={{ color: '#7082a4' }}>No character yet</em>}
            </span>
            <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#8a94a8' }}>{game.playerName || '-'}</span>
            <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#8a94a8' }}>{game.setting || '-'}</span>
            <StatusBadge status={game.status} />
            <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 13, color: '#c8c0b0' }}>{game.turnCount ?? 0}</span>
            <div className={styles.costCell}>
              <span style={{
                fontFamily: 'var(--font-jetbrains-mono)', fontSize: 13,
                color: (game.totalCost || 0) > 0.5 ? '#e8c45a' : '#c8c0b0',
                fontWeight: (game.totalCost || 0) > 0.5 ? 600 : 400,
              }}>{formatCost(game.totalCost)}</span>
              {(game.initCost > 0) && (
                <div className={styles.costBreakdown}>
                  Init: {formatCost(game.initCost)} &middot; Gameplay: {formatCost(game.gameplayCost)}
                </div>
              )}
            </div>
            <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: '#7082a4' }}>
              {game.costPerTurn != null ? formatCost(game.costPerTurn) : formatCostPerTurn(game.gameplayCost ?? game.totalCost, game.turnCount)}
            </span>
            <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4' }}>{timeAgo(game.lastPlayedAt || game.lastPlayed)}</span>
            <button
              className={styles.deleteIcon}
              aria-label="Delete game"
              onClick={e => { e.stopPropagation(); setRowDeleteTarget(game); }}
            >
              <TrashIcon />
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: 20, textAlign: 'center', fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4' }}>
            No games found.
          </div>
        )}
      </div>

      {/* Row delete modal */}
      {rowDeleteTarget && (
        <DeleteModal
          game={rowDeleteTarget}
          onConfirm={handleRowDelete}
          onCancel={() => setRowDeleteTarget(null)}
        />
      )}

      {/* Game Detail Panel */}
      {selectedGame && (
        <DetailPanel onClose={() => { setSelectedGame(null); setGameDetail(null); setNarrative(null); setConfirmDelete(null); }}>
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

              {/* Character Snapshot */}
              {gameDetail.character && (
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 700, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
                    Character
                  </h4>
                  <div style={{ background: '#111528', border: '1px solid #3a3328', borderRadius: 6, padding: 16 }}>
                    <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#c8c0b0', marginBottom: 8 }}>
                      <strong style={{ color: '#d0c098' }}>{gameDetail.character.name}</strong>
                    </p>
                    {gameDetail.character.backstory && (
                      <p style={{ fontFamily: 'var(--font-alegreya)', fontStyle: 'italic', fontSize: 13, color: '#8a94a8', marginBottom: 12, lineHeight: 1.6 }}>
                        {gameDetail.character.backstory.length > 300
                          ? gameDetail.character.backstory.slice(0, 300) + '...'
                          : gameDetail.character.backstory}
                      </p>
                    )}

                    {/* Stats grid */}
                    {gameDetail.character.stats && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px', marginBottom: 12 }}>
                        {Object.entries(gameDetail.character.stats).map(([stat, val]) => (
                          <div key={stat} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #2a2622' }}>
                            <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 11, fontWeight: 600, color: '#9a8545' }}>{stat.toUpperCase()}</span>
                            <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 13, color: '#c8c0b0' }}>
                              {typeof val === 'object' ? `${val.base ?? val.effective ?? '-'}` : val}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Skills */}
                    {gameDetail.character.skills?.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 10, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em' }}>SKILLS</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                          {gameDetail.character.skills.map((sk, i) => (
                            <span key={i} style={{
                              fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#8a94a8',
                              background: '#0a0e1a', padding: '2px 8px', borderRadius: 3, border: '1px solid #1e2540',
                            }}>
                              {typeof sk === 'string' ? sk : `${sk.name} ${sk.modifier ?? ''}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Conditions */}
                    {gameDetail.character.conditions?.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 10, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em' }}>CONDITIONS</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                          {gameDetail.character.conditions.map((c, i) => (
                            <span key={i} style={{
                              fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#e8845a',
                              background: '#201416', padding: '2px 8px', borderRadius: 3, border: '1px solid #e8845a33',
                            }}>
                              {typeof c === 'string' ? c : `${c.name} ${c.penalty ?? ''}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Inventory */}
                    {gameDetail.character.inventory?.length > 0 && (
                      <div>
                        <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 10, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em' }}>INVENTORY</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                          {gameDetail.character.inventory.map((item, i) => (
                            <span key={i} style={{
                              fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#c8c0b0',
                              background: '#0a0e1a', padding: '2px 8px', borderRadius: 3, border: '1px solid #1e2540',
                            }}>
                              {typeof item === 'string' ? item : item.name || 'Unknown'}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Narrative Log */}
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 700, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
                  Narrative Log
                </h4>
                <div className={styles.tableCard}>
                  {(narrative?.entries || gameDetail.narrative || []).slice(0, narrative ? undefined : 200).map((entry, i) => (
                    <TurnBlock key={i} entry={entry} />
                  ))}
                  {!narrative && (gameDetail.narrative?.length || 0) > 200 && (
                    <button onClick={loadFullNarrative} style={{
                      width: '100%', padding: 12, background: 'none', border: 'none',
                      fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#c9a84c', cursor: 'pointer',
                    }}>Load full narrative</button>
                  )}
                  {(!gameDetail.narrative || gameDetail.narrative.length === 0) && !narrative && (
                    <div style={{ padding: 14, textAlign: 'center', fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#7082a4' }}>
                      No narrative entries.
                    </div>
                  )}
                </div>
              </div>

              {/* Delete Action */}
              <div style={{ borderTop: '1px solid #1e2540', paddingTop: 20 }}>
                {confirmDelete !== selectedGame.id ? (
                  <button className={styles.dangerBtn} onClick={() => setConfirmDelete(selectedGame.id)}>
                    Delete Game
                  </button>
                ) : (
                  <div>
                    <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#e85a5a', marginBottom: 12 }}>
                      Delete game #{selectedGame.id} ({gameDetail.game?.characterName || 'unnamed'})? This removes all {gameDetail.game?.turnCount ?? 0} turns of game data permanently.
                    </p>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button className={styles.ghostBtn} onClick={() => setConfirmDelete(null)}>Cancel</button>
                      <button className={styles.dangerBtnSolid} onClick={() => handleDelete(selectedGame.id)}>Delete</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4' }}>Failed to load game details.</p>
          )}
        </DetailPanel>
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
        <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 16, fontWeight: 700, color: '#d0c098', margin: 0 }}>Costs</h2>
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
            <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 10, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
              {card.label}
            </div>
            <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 22, fontWeight: 700, color: '#d0c098', marginBottom: 4 }}>
              {card.value}
            </div>
            <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4' }}>{card.sub}</div>
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
            <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 10, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
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

function HealthTab({ data, loading, onRefresh }) {
  const [showErrors, setShowErrors] = useState(false);

  if (loading) return <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4', textAlign: 'center', padding: 40 }}>Loading...</p>;

  const h = data || {};
  const db = h.database || {};
  const counts = h.counts || {};
  const errors = h.errors || {};
  const stuck = h.stuckGames || [];
  const storytellers = h.storytellerPopularity || [];
  const settings = h.settingPopularity || [];
  const retention = h.retention || {};
  const maxST = storytellers.length > 0 ? storytellers[0].count : 1;
  const maxSE = settings.length > 0 ? settings[0].count : 1;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 16, fontWeight: 700, color: '#d0c098', margin: 0 }}>Health</h2>
        <button className={styles.refreshBtn} onClick={onRefresh}>Refresh</button>
      </div>

      {/* Status Cards */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
        <div className={styles.statCard}>
          <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 10, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Database</div>
          <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 22, fontWeight: 700, color: db.connected ? '#8aba7a' : '#e85a5a', marginBottom: 4 }}>
            {db.connected ? 'Connected' : 'Error'}
          </div>
          <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4' }}>{db.size || '-'}</div>
        </div>
        <div className={styles.statCard}>
          <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 10, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Errors (24h)</div>
          <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 22, fontWeight: 700, color: (errors.count24h || 0) > 0 ? '#e8845a' : '#d0c098', marginBottom: 4 }}>
            {errors.count24h ?? 0}
          </div>
          <div>
            {(errors.count24h || 0) > 0 && (
              <button onClick={() => setShowErrors(!showErrors)} style={{ background: 'none', border: 'none', fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#c9a84c', cursor: 'pointer', padding: 0 }}>
                {showErrors ? 'Hide details' : 'View details'}
              </button>
            )}
          </div>
        </div>
        <div className={styles.statCard}>
          <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 10, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Stuck Games</div>
          <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 22, fontWeight: 700, color: stuck.length > 0 ? '#e8c45a' : '#d0c098', marginBottom: 4 }}>
            {stuck.length}
          </div>
          <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4' }}>
            {stuck.length > 0 ? 'See below' : 'None'}
          </div>
        </div>
      </div>

      {/* Counts */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
        <div className={styles.statCard}>
          <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 10, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Users</div>
          <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 22, fontWeight: 700, color: '#d0c098', marginBottom: 4 }}>{counts.users ?? 0}</div>
          <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4' }}>{counts.playtesters ?? 0} playtesters</div>
        </div>
        <div className={styles.statCard}>
          <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 10, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Games</div>
          <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 22, fontWeight: 700, color: '#d0c098', marginBottom: 4 }}>{counts.games ?? 0}</div>
          <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4' }}>{counts.activeGames ?? 0} active</div>
        </div>
        <div className={styles.statCard}>
          <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 10, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Total Turns</div>
          <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 22, fontWeight: 700, color: '#d0c098', marginBottom: 4 }}>{counts.totalTurns ?? 0}</div>
          <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4' }}>All time</div>
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
              <div key={i} className={styles.tableRow} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 16px', borderBottom: '1px solid #2a2622',
              }}>
                <div>
                  <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#c8c0b0' }}>
                    {g.characterName || 'Unnamed'} &middot; {g.playerName || 'Unknown'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <StatusBadge status={g.status} />
                  <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#e8c45a' }}>{g.stuckReason || 'Unknown'}</span>
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
          <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 10, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Players with Games</div>
          <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 18, fontWeight: 700, color: '#d0c098' }}>
            {retention.usersWithGames ?? 0} of {counts.users ?? 0}
          </div>
        </div>
        <div className={styles.statCard}>
          <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 10, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Created 2+ Games</div>
          <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 18, fontWeight: 700, color: '#d0c098' }}>
            {retention.usersWithMultipleGames ?? 0} of {retention.usersWithGames ?? 0}
          </div>
        </div>
        <div className={styles.statCard}>
          <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 10, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Returned for 2+ Sessions</div>
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
    </div>
  );
}

// =============================================================================
// MAIN ADMIN PAGE
// =============================================================================

const TABS = ['Users', 'Games', 'Costs', 'Health', 'Settings'];

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
  const [settingsData, setSettingsData] = useState(null);

  // Loading states
  const [usersLoading, setUsersLoading] = useState(false);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [costsLoading, setCostsLoading] = useState(false);
  const [healthLoading, setHealthLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);

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
  const fetchTab = useCallback(async (tab, force = false) => {
    if (tab === 'Users') {
      if (usersData && !force) return;
      setUsersLoading(true);
      try { setUsersData(await getAdminUsers()); } catch { /* keep stale */ }
      setUsersLoading(false);
    } else if (tab === 'Games') {
      if (gamesData && !force) return;
      setGamesLoading(true);
      try { setGamesData(await getAdminGames()); } catch { /* keep stale */ }
      setGamesLoading(false);
    } else if (tab === 'Costs') {
      if (costsData && !force) return;
      setCostsLoading(true);
      try { setCostsData(await getAdminCosts()); } catch { /* keep stale */ }
      setCostsLoading(false);
    } else if (tab === 'Health') {
      if (healthData && !force) return;
      setHealthLoading(true);
      try { setHealthData(await getAdminHealth()); } catch { /* keep stale */ }
      setHealthLoading(false);
    } else if (tab === 'Settings') {
      if (settingsData && !force) return;
      setSettingsLoading(true);
      try { setSettingsData(await getInviteCode()); } catch { /* keep stale */ }
      setSettingsLoading(false);
    }
  }, [usersData, gamesData, costsData, healthData, settingsData]);

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
        padding: '20px clamp(24px, 4vw, 32px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 22, fontWeight: 900, color: '#c9a84c', letterSpacing: '0.06em' }}>CRUCIBLE</span>
          <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 600, color: '#9a8545', letterSpacing: '0.18em' }}>RPG</span>
          <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 600, color: '#7082a4', letterSpacing: '0.08em', textTransform: 'uppercase', marginLeft: 8 }}>ADMIN</span>
        </div>
        <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#7082a4' }}>
          Signed in as <span style={{ color: '#c9a84c' }}>{userEmail}</span>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{
        display: 'flex', gap: 0,
        padding: '0 clamp(24px, 4vw, 32px)',
        borderTop: '1px solid #1e2540',
        borderBottom: '1px solid #1e2540',
      }}>
        {TABS.map(tab => (
          <button
            key={tab}
            className={activeTab === tab ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '28px clamp(24px, 4vw, 32px)', maxWidth: 1400 }}>
        {activeTab === 'Users' && <UsersTab data={usersData} loading={usersLoading} onRefresh={() => fetchTab('Users', true)} />}
        {activeTab === 'Games' && <GamesTab data={gamesData} loading={gamesLoading} onRefresh={() => fetchTab('Games', true)} />}
        {activeTab === 'Costs' && <CostsTab data={costsData} loading={costsLoading} onRefresh={() => fetchTab('Costs', true)} />}
        {activeTab === 'Health' && <HealthTab data={healthData} loading={healthLoading} onRefresh={() => fetchTab('Health', true)} />}
        {activeTab === 'Settings' && <SettingsTab data={settingsData} loading={settingsLoading} onRefresh={() => fetchTab('Settings', true)} />}
      </div>
    </div>
  );
}
