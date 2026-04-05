'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { get, post, del, clearToken, isAuthenticated, getUser } from '@/lib/api';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import ParticleField from '@/components/ParticleField';
import { CardNoise } from '@/components/CardNoise';
import styles from './page.module.css';

// ─── HELPERS ───

function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// ─── SETTING ICON (SVG) ───

function SettingIcon({ setting, color }) {
  const s = { width: 18, height: 18, stroke: color || "#9a8545", fill: "none", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" };
  const icons = {
    "Sword & Soil": <svg viewBox="0 0 24 24" {...s}><line x1="5" y1="19" x2="19" y2="5" /><line x1="14" y1="15" x2="18" y2="13" /><line x1="19" y1="19" x2="5" y2="5" /><line x1="10" y1="15" x2="6" y2="13" /></svg>,
    "Smoke & Steel": <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2.5" /><line x1="12" y1="5" x2="12" y2="2" /><line x1="12" y1="22" x2="12" y2="19" /><line x1="5" y1="12" x2="2" y2="12" /><line x1="22" y1="12" x2="19" y2="12" /></svg>,
    "Concrete & Code": <svg viewBox="0 0 24 24" {...s}><rect x="3" y="8" width="6" height="14" rx="1" /><rect x="11" y="3" width="5" height="19" rx="1" /><rect x="18" y="6" width="4" height="16" rx="1" /></svg>,
    "Stars & Circuits": <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="5" /><ellipse cx="12" cy="12" rx="11" ry="4" transform="rotate(-20 12 12)" /></svg>,
    "Ash & Remnants": <svg viewBox="0 0 24 24" {...s}><path d="M12 22c-4 0-7-2.5-7-7 0-3.5 3-6.5 4.5-8.5 0.8-1 1.5-2.5 2-4.5 0.5 2 1.2 3.5 2 4.5C15 8.5 19 11.5 19 15c0 4.5-3 7-7 7z" /></svg>,
    "Dream & Myth": <svg viewBox="0 0 24 24" {...s}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>,
  };
  return icons[setting] || <svg viewBox="0 0 24 24" {...s}><polygon points="12,2 22,12 12,22 2,12" /></svg>;
}

// ─── DIFFICULTY BADGE ───

function DiffBadge({ difficulty }) {
  if (!difficulty) return null;
  const map = {
    Forgiving: { color: "#7aba7a", bg: "#142018", border: "#7aba7a33" },
    Standard:  { color: "#8a94a8", bg: "#161a20", border: "#8a94a833" },
    Harsh:     { color: "#e8c45a", bg: "#1e1a12", border: "#e8c45a33" },
    Brutal:    { color: "#e85a5a", bg: "#201416", border: "#e85a5a33" },
  };
  const d = map[difficulty] || map.Standard;
  return (
    <span style={{
      fontFamily: "var(--font-cinzel)", fontSize: 12, fontWeight: 700,
      padding: '4px 12px', borderRadius: 10,
      color: d.color, background: d.bg, border: `1px solid ${d.border}`,
    }}>{difficulty.toUpperCase()}</span>
  );
}

// ─── SECTION LABEL ───

function SectionLabel({ text, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
      <span style={{
        fontFamily: 'var(--font-cinzel)', fontSize: 14, fontWeight: 600,
        color: 'var(--accent-gold)', letterSpacing: '0.15em',
      }}>{text}</span>
      {count != null && (
        <span style={{
          fontFamily: 'var(--font-jetbrains)', fontSize: 12,
          color: 'var(--text-secondary)',
        }}>({count})</span>
      )}
    </div>
  );
}

// ─── CHARACTER SNAPSHOT (for hero card) ───

function CharacterSnapshot({ detail }) {
  const [showAllConds, setShowAllConds] = useState(false);
  const [showAllSkills, setShowAllSkills] = useState(false);

  if (!detail?.stats) return null;
  const stats = detail.stats;
  const conditions = detail.conditions || [];
  const skills = (detail.skills || []).slice().sort((a, b) => {
    const mA = typeof a === 'object' ? (a.modifier || 0) : 0;
    const mB = typeof b === 'object' ? (b.modifier || 0) : 0;
    return mB - mA;
  });

  const visibleConds = showAllConds ? conditions : conditions.slice(0, 3);
  const hiddenCondCount = conditions.length - 3;
  const visibleSkills = showAllSkills ? skills : skills.slice(0, 4);
  const hiddenSkillCount = skills.length - 4;

  return (
    <div style={{ padding: '14px 0', borderTop: '1px solid var(--border-card-separator)', borderBottom: '1px solid var(--border-card-separator)' }}>
      {/* Stats grid */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: conditions.length > 0 || skills.length > 0 ? 14 : 0 }}>
        {Object.entries(stats).map(([key, val]) => {
          const base = typeof val === 'object' ? (val.base ?? val.effective ?? 0) : val;
          const effective = typeof val === 'object' ? (val.effective ?? val.base ?? 0) : val;
          const color = effective < base ? 'var(--color-danger)' : effective > base ? 'var(--color-success)' : 'var(--text-primary)';
          return (
            <div key={key} style={{
              minWidth: 52, padding: '6px 8px', textAlign: 'center',
              background: 'var(--bg-main)', borderRadius: 5, border: '1px solid var(--border-primary)',
            }}>
              <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 11, fontWeight: 700, color: '#9a8545', letterSpacing: '0.08em' }}>{key.toUpperCase()}</div>
              <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 15, fontWeight: 500, color }}>{Number(effective).toFixed(1)}</div>
            </div>
          );
        })}
      </div>

      {/* Conditions */}
      {conditions.length > 0 && (
        <div style={{ marginBottom: skills.length > 0 ? 12 : 0 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {visibleConds.map((c, i) => {
              const name = typeof c === 'string' ? c : c.name;
              const isBuff = typeof c === 'object' && c.isBuff;
              const penalty = typeof c === 'object' ? c.penalty : null;
              const stat = typeof c === 'object' ? c.stat : null;
              return (
                <span key={i} style={{
                  fontFamily: 'var(--font-alegreya-sans)', fontSize: 12,
                  padding: '3px 10px', borderRadius: 10,
                  color: isBuff ? 'var(--color-success)' : 'var(--color-danger)',
                  background: isBuff ? '#142018' : '#201416',
                  border: `1px solid ${isBuff ? '#8aba7a33' : '#e8845a33'}`,
                }}>
                  {name}
                  {penalty != null && <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 11, marginLeft: 4 }}>{isBuff ? `+${Math.abs(penalty)}` : `\u2212${Math.abs(penalty)}`}</span>}
                  {stat && <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 11, marginLeft: 2, opacity: 0.7 }}>{stat}</span>}
                </span>
              );
            })}
            {hiddenCondCount > 0 && (
              <span className={styles.toggleLink} onClick={() => setShowAllConds(!showAllConds)}
                style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                {showAllConds ? 'show less' : `+${hiddenCondCount} more`}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {visibleSkills.map((sk, i) => {
              const name = typeof sk === 'string' ? sk : sk.name || sk.scope;
              const mod = typeof sk === 'object' ? sk.modifier : null;
              return (
                <span key={i} style={{
                  fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: 'var(--text-secondary)',
                  padding: '3px 10px', borderRadius: 10,
                  background: 'var(--bg-main)', border: '1px solid var(--border-primary)',
                }}>
                  {name}
                  {mod != null && <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 11, color: 'var(--accent-gold)', marginLeft: 4 }}>+{mod}</span>}
                </span>
              );
            })}
            {hiddenSkillCount > 0 && (
              <span className={styles.toggleLink} onClick={() => setShowAllSkills(!showAllSkills)}
                style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                {showAllSkills ? 'show less' : `+${hiddenSkillCount} more`}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── GAME DETAIL MODAL ───

function GameDetailModal({ game, onClose, onNavigate, onDelete }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const isSetup = !game.character?.name || game.status === 'initializing';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    get(`/api/games/${game.id}`).then(data => {
      if (!cancelled) setDetail(data.character || data.game?.character || null);
    }).catch(() => {
      if (!cancelled) setDetail(null);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [game.id]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s' }} />
      <div onClick={e => e.stopPropagation()} style={{
        position: 'relative', zIndex: 1, maxWidth: 640, width: '92%',
        background: 'var(--bg-card)', borderRadius: 8, padding: '32px 36px 28px',
        borderTop: '1px solid var(--border-card)',
        borderRight: '1px solid var(--border-card)',
        borderBottom: '1px solid var(--border-card)',
        borderLeft: '4px solid var(--accent-gold)',
        animation: 'expandIn 0.25s',
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 14, right: 16,
          background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: 18, cursor: 'pointer',
          transition: 'color 0.2s',
        }}>&times;</button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10, flexShrink: 0,
            background: 'var(--bg-card)', border: '1px solid var(--border-card)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <SettingIcon setting={game.setting} color="var(--accent-gold)" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 24, fontWeight: 600, color: 'var(--text-heading)' }}>
              {game.character?.name || 'New Character'}
            </div>
            <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, color: '#9a8545' }}>
              {game.setting !== 'pending' ? game.setting : 'New World'}
            </div>
          </div>
        </div>

        {/* Blurb */}
        {game.blurb ? (
          <p style={{ fontFamily: 'var(--font-alegreya)', fontSize: 16, fontStyle: 'italic', color: 'var(--text-secondary)', lineHeight: 1.7, margin: '0 0 16px' }}>{game.blurb}</p>
        ) : isSetup ? (
          <p style={{ fontFamily: 'var(--font-alegreya)', fontSize: 16, fontStyle: 'italic', color: 'var(--text-dim)', lineHeight: 1.7, margin: '0 0 16px' }}>Character creation in progress.</p>
        ) : null}

        {/* Character snapshot */}
        {loading && (
          <p style={{ fontFamily: 'var(--font-alegreya)', fontStyle: 'italic', fontSize: 14, color: 'var(--text-muted)', margin: '10px 0' }}>Loading character...</p>
        )}
        {!loading && detail && <CharacterSnapshot detail={detail} />}

        {/* Metadata */}
        <div style={{ marginBottom: 20, marginTop: 14 }}>
          <MetaLine game={game} />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button className={styles.resumeBtn} onClick={onNavigate} style={{
            background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-bright))',
            fontFamily: 'var(--font-cinzel)', fontSize: 14, fontWeight: 700,
            color: 'var(--bg-main)', padding: '11px 32px', borderRadius: 8,
            border: 'none', letterSpacing: '0.08em',
          }}>{isSetup ? 'CONTINUE SETUP' : 'RESUME'}</button>
          <button className={styles.deleteBtn} onClick={onDelete} style={{
            background: 'none', border: 'none', padding: '8px 12px',
            fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: 'var(--text-dim)',
            cursor: 'pointer',
          }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── METADATA LINE ───

function MetaLine({ game, small }) {
  const sep = <span style={{ color: 'var(--border-primary)', margin: '0 6px' }}>{'\u00B7'}</span>;
  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
      {game.storyteller && game.storyteller !== 'pending' && (
        <><span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: small ? 12 : 13, color: 'var(--text-secondary)' }}>{game.storyteller}</span>{sep}</>
      )}
      {game.turnCount > 0 && (
        <><span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 12, color: 'var(--text-secondary)' }}>{game.turnCount} turns</span>{sep}</>
      )}
      {game.difficulty && <><DiffBadge difficulty={game.difficulty} /></>}
    </div>
  );
}

// ─── DELETE CONFIRM MODAL ───

function DeleteConfirmModal({ game, onConfirm, onCancel }) {
  const confirmWord = game.character?.name || (game.setting !== 'pending' ? game.setting : 'DELETE');
  const [text, setText] = useState('');
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [shaking, setShaking] = useState(false);
  const matches = text === confirmWord;

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onCancel]);

  async function handleDelete() {
    if (!matches) { setShaking(true); setTimeout(() => setShaking(false), 400); return; }
    setDeleting(true); setError(null);
    try { await onConfirm(game.id); } catch (err) { setError(err.message || 'Failed to delete game'); setDeleting(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />
      <div onClick={e => e.stopPropagation()} style={{
        background: "var(--bg-card)", border: "1px solid var(--border-card)", borderRadius: 8,
        padding: "24px 28px", maxWidth: 420, width: "90%", position: "relative", zIndex: 1,
      }}>
        <h3 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 16, fontWeight: 700, color: 'var(--color-danger)', marginBottom: 12, marginTop: 0 }}>Delete Game</h3>
        <div style={{ marginBottom: 6 }}>
          {game.character?.name && <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 15, color: 'var(--text-heading)', marginBottom: 2 }}>{game.character.name}</div>}
          {game.setting !== 'pending' && <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 600, color: 'var(--accent-gold)', letterSpacing: '0.1em' }}>{game.setting}</div>}
        </div>
        <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 0 }}>
          This will permanently delete this game and all of its history. This cannot be undone.
        </p>
        <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: 'var(--text-secondary)', marginTop: 16, marginBottom: 6 }}>
          Type <strong style={{ color: 'var(--text-primary)' }}>{confirmWord}</strong> to confirm
        </p>
        <input value={text} onChange={e => setText(e.target.value)} autoFocus style={{
          width: '100%', boxSizing: 'border-box',
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: 'var(--text-primary)',
          background: 'var(--bg-main)', border: `1px solid ${shaking ? 'var(--color-danger)' : 'var(--border-primary)'}`,
          borderRadius: 4, padding: '10px 14px', outline: 'none',
          transition: 'border-color 0.2s', animation: shaking ? 'shake 0.4s ease' : 'none',
        }} />
        {error && <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: 'var(--color-danger)', marginTop: 8 }}>{error}</p>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
          <button onClick={onCancel} disabled={deleting} style={{
            fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 600,
            background: "none", border: "none", color: 'var(--text-secondary)', cursor: "pointer", padding: "10px 16px",
          }}>Cancel</button>
          <button onClick={handleDelete} disabled={!matches || deleting} style={{
            fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 600,
            color: matches && !deleting ? '#ffffff' : '#5a4a4a',
            background: matches && !deleting ? '#b83a3a' : '#2a1a1a',
            border: 'none', borderRadius: 4, padding: '10px 20px',
            cursor: matches && !deleting ? 'pointer' : 'default',
            opacity: matches && !deleting ? 1 : 0.5, transition: 'all 0.2s',
          }}>{deleting ? 'Deleting...' : 'Delete Game'}</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════

export default function MenuPage() {
  const router = useRouter();
  const [games, setGames] = useState(null);
  const [font, setFont] = useState("lexie");
  const [textSize, setTextSize] = useState("medium");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [isPlaytester, setIsPlaytester] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);
  const [heroDetail, setHeroDetail] = useState(null);

  // Auth check + fetch games
  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/auth'); return; }
    const user = getUser();
    if (user && !user.isPlaytester) { router.replace('/'); return; }
    if (user) setIsPlaytester(!!user.isPlaytester);

    async function fetchGames() {
      try {
        const data = await get('/api/games');
        const sorted = (data.games || []).sort((a, b) => new Date(b.lastPlayedAt || b.createdAt) - new Date(a.lastPlayedAt || a.createdAt));
        setGames(sorted);

        // Auto-fetch hero game detail for stats
        if (sorted.length > 0) {
          const heroGame = sorted[0];
          try {
            const heroData = await get(`/api/games/${heroGame.id}`);
            setHeroDetail(heroData.character || heroData.game?.character || null);
          } catch { setHeroDetail(null); }
        }
      } catch (err) {
        if (err.status === 401) { clearToken(); router.replace('/auth'); return; }
        setError('Failed to load games. Please try again.');
        setGames([]);
      }
    }
    fetchGames();
    setTimeout(() => setLoaded(true), 100);
  }, [router]);

  // Persist font/size
  useEffect(() => {
    try { const saved = JSON.parse(localStorage.getItem('crucible_display_settings') || '{}'); if (saved.font) setFont(saved.font); if (saved.textSize) setTextSize(saved.textSize); } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem('crucible_display_settings', JSON.stringify({ font, textSize })); } catch {}
  }, [font, textSize]);

  function navigateToGame(game) {
    router.push(game.status === 'active' ? `/play?id=${game.id}` : `/init?id=${game.id}`);
  }

  async function handleDeleteGame(gameId) {
    await del(`/api/games/${gameId}`);
    setGames(prev => prev.filter(g => g.id !== gameId));
    setDeleteTarget(null);
    if (detailTarget?.id === gameId) setDetailTarget(null);
  }

  // Loading state
  if (games === null) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'var(--font-alegreya)', fontSize: 18, fontStyle: 'italic', color: 'var(--text-muted)' }}>Loading...</div>
      </div>
    );
  }

  const hasGames = games.length > 0;
  const heroGame = hasGames ? games[0] : null;
  const narrativeGames = games.slice(1, 3);   // index 1-2: full-width narrative cards
  const olderGames = games.slice(3);           // index 3+: compact 2-column grid
  const otherGamesCount = games.length - 1;    // total non-hero games

  const heroIsSetup = heroGame && (!heroGame.character?.name || heroGame.status === 'initializing');

  return (
    <div className={styles.pageContainer} style={{
      minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)',
      position: 'relative', display: 'flex', flexDirection: 'column', paddingTop: 72,
    }}>
      <ParticleField />
      <NavBar />

      {/* ═══ MAIN CONTENT ═══ */}
      <div style={{
        flex: 1, position: 'relative', zIndex: 1,
        maxWidth: 680, width: '100%', margin: '0 auto',
        padding: '0 clamp(20px, 5vw, 32px)',
        boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Error */}
        {error && (
          <div style={{ background: '#201416', border: '1px solid #5a3020', borderRadius: 6, padding: '10px 14px', marginBottom: 18, marginTop: 12, fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: 'var(--color-danger)' }}>{error}</div>
        )}

        {/* Playtester gate */}
        {!isPlaytester && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 12, padding: '48px 40px', textAlign: 'center', marginBottom: 32, marginTop: 24, animation: 'fadeIn 0.5s ease both' }}>
            <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 28, fontWeight: 700, color: 'var(--accent-gold)', marginBottom: 16 }}>Account Created</div>
            <p style={{ fontFamily: 'var(--font-alegreya)', fontSize: 18, fontStyle: 'italic', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 480, margin: '0 auto 20px' }}>Your account is pending playtester access.</p>
            <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 400, margin: '0 auto' }}>
              Crucible RPG is in early access. Once your account is approved, you will be able to create and play games from here.
            </p>
          </div>
        )}

        {/* ─── EMPTY STATE (0 games) ─── */}
        {isPlaytester && !hasGames && (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ textAlign: 'center', position: 'relative', padding: '40px 0' }}>
              {/* Radial glow */}
              <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -60%)',
                width: 500, height: 300, borderRadius: '50%',
                background: 'radial-gradient(ellipse, rgba(201,168,76,0.06) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />
              <h1 style={{
                fontFamily: 'var(--font-cinzel)', fontSize: 'clamp(30px, 5vw, 42px)', fontWeight: 700,
                color: 'var(--accent-gold)', marginBottom: 16, marginTop: 0,
                position: 'relative',
                opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(18px)',
                transition: 'opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.05s, transform 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.05s',
              }}>Every story starts here.</h1>
              <p style={{
                fontFamily: 'var(--font-alegreya)', fontSize: 18, fontStyle: 'italic', fontWeight: 500,
                color: 'var(--text-secondary)', marginBottom: 12,
                position: 'relative',
                opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(10px)',
                transition: 'opacity 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s, transform 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s',
              }}>Choose a world, create a character, and see what happens.</p>
              <p style={{
                fontFamily: 'var(--font-alegreya-sans)', fontSize: 15,
                color: 'var(--text-dim)', marginBottom: 36,
                position: 'relative',
                opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(10px)',
                transition: 'opacity 1s cubic-bezier(0.16, 1, 0.3, 1) 0.3s, transform 1s cubic-bezier(0.16, 1, 0.3, 1) 0.3s',
              }}>No prep needed. The engine knows the rules so you don&rsquo;t have to.</p>
              <button className={styles.btnPrimary} onClick={() => router.push('/init')} style={{
                fontFamily: 'var(--font-cinzel)', fontSize: 15, fontWeight: 700,
                color: 'var(--bg-main)', letterSpacing: '0.1em',
                background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-bright))',
                border: 'none', borderRadius: 6, padding: '16px 44px',
                boxShadow: '0 2px 20px rgba(201,168,76,0.2)',
                position: 'relative',
                opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(10px)',
                transition: 'opacity 1s cubic-bezier(0.16, 1, 0.3, 1) 0.4s, transform 1s cubic-bezier(0.16, 1, 0.3, 1) 0.4s',
              }}>BEGIN YOUR STORY</button>
            </div>
          </div>
        )}

        {/* ─── RETURNING PLAYER LAYOUT (1+ games) ─── */}
        {isPlaytester && hasGames && (
          <div>
            {/* Welcome */}
            <div style={{ textAlign: 'center', paddingTop: 16, marginBottom: 36 }}>
              <h1 style={{
                fontFamily: 'var(--font-cinzel)', fontSize: 'clamp(30px, 5vw, 42px)', fontWeight: 700,
                color: 'var(--accent-gold)', marginBottom: 10, marginTop: 0,
                opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(18px)',
                transition: 'opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.05s, transform 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.05s',
              }}>Welcome back.</h1>
              <p style={{
                fontFamily: 'var(--font-alegreya)', fontSize: 18, fontStyle: 'italic', fontWeight: 500,
                color: 'var(--text-secondary-bright)', margin: 0,
                opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(10px)',
                transition: 'opacity 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s, transform 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s',
              }}>Pick up where you left off, or start something new.</p>
            </div>

            {/* CONTINUE YOUR ADVENTURE */}
            <div style={{
              opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(14px)',
              transition: 'opacity 1s cubic-bezier(0.16, 1, 0.3, 1) 0.25s, transform 1s cubic-bezier(0.16, 1, 0.3, 1) 0.25s',
            }}>
            <SectionLabel text="CONTINUE YOUR ADVENTURE" />

            {/* Hero Card */}
            <div className={styles.heroCard} style={{
              background: 'var(--bg-card-elevated)',
              borderTop: '1px solid var(--border-card)',
              borderRight: '1px solid var(--border-card)',
              borderBottom: '1px solid var(--border-card)',
              borderLeft: '4px solid var(--accent-gold)',
              borderRadius: 8, padding: '28px 32px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.3), 0 0 1px rgba(201,168,76,0.08)',
              marginBottom: 16,
              position: 'relative', overflow: 'hidden',
            }}>
              <CardNoise opacity={0.03} />
              {/* Header row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <div style={{
                  fontFamily: 'var(--font-cinzel)', fontSize: 20, fontWeight: 700,
                  color: 'var(--text-heading)',
                }}>{heroIsSetup ? 'New Character' : (heroGame.character?.name || 'New Character')}</div>
                <span style={{
                  fontFamily: 'var(--font-jetbrains)', fontSize: 12,
                  color: 'var(--text-secondary)', flexShrink: 0, marginLeft: 12,
                }}>{formatTimeAgo(heroGame.lastPlayedAt || heroGame.createdAt)}</span>
              </div>

              {/* World name */}
              <div style={{
                fontFamily: 'var(--font-alegreya-sans)', fontSize: 14,
                color: '#9a8545', marginBottom: 14,
              }}>{heroIsSetup ? 'Setting up...' : (heroGame.setting !== 'pending' ? heroGame.setting : 'New World')}</div>

              {/* Blurb / Setup message */}
              {heroIsSetup ? (
                <p style={{
                  fontFamily: 'var(--font-alegreya)', fontSize: 16, fontStyle: 'italic',
                  color: 'var(--text-secondary)', lineHeight: 1.7, margin: '0 0 14px',
                }}>Character creation in progress.</p>
              ) : heroGame.blurb ? (
                <p style={{
                  fontFamily: 'var(--font-alegreya)', fontSize: 16, fontStyle: 'italic',
                  color: 'var(--text-secondary)', lineHeight: 1.7, margin: '0 0 14px',
                }}>{heroGame.blurb}</p>
              ) : null}

              {/* Stats / Conditions / Skills (only for non-setup games) */}
              {!heroIsSetup && heroDetail && <CharacterSnapshot detail={heroDetail} />}

              {/* Footer row */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: 12, marginTop: 14,
              }}>
                <button className={styles.resumeBtn} onClick={() => navigateToGame(heroGame)} style={{
                  background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-bright))',
                  fontFamily: 'var(--font-cinzel)', fontSize: 14, fontWeight: 700,
                  color: 'var(--bg-main)', padding: '11px 32px', borderRadius: 6,
                  border: 'none', letterSpacing: '0.08em',
                  boxShadow: '0 2px 16px rgba(201,168,76,0.2)',
                }}>{heroIsSetup ? 'CONTINUE SETUP' : 'RESUME'}</button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MetaLine game={heroGame} />
                </div>
              </div>
            </div>

            </div>{/* end CONTINUE YOUR ADVENTURE stagger wrapper */}

            {/* NEW GAME button */}
            <div className={styles.newGameBtn} onClick={() => router.push('/init')} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') router.push('/init'); }} style={{
              opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(10px)',
              transition: 'opacity 1s cubic-bezier(0.16, 1, 0.3, 1) 0.35s, transform 1s cubic-bezier(0.16, 1, 0.3, 1) 0.35s',
              width: '100%', padding: '14px 0', borderRadius: 5,
              fontFamily: 'var(--font-cinzel)', fontSize: 14, fontWeight: 600, letterSpacing: '0.08em',
              color: 'var(--text-secondary)', background: 'var(--bg-card-elevated)',
              border: '1px solid var(--border-card)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
              marginBottom: 32,
              position: 'relative', overflow: 'hidden', textAlign: 'center',
            }}>
              <CardNoise opacity={0.02} />
              <span style={{ position: 'relative', zIndex: 1 }}>NEW GAME</span>
            </div>

            {/* YOUR GAMES section (narrative cards, games at index 1-2) */}
            {narrativeGames.length > 0 && (
              <div style={{
                marginBottom: olderGames.length > 0 ? 0 : 48,
                opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(10px)',
                transition: 'opacity 1s cubic-bezier(0.16, 1, 0.3, 1) 0.45s, transform 1s cubic-bezier(0.16, 1, 0.3, 1) 0.45s',
              }}>
                <SectionLabel text="YOUR GAMES" count={otherGamesCount} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {narrativeGames.map(game => {
                    const isSetup = !game.character?.name || game.status === 'initializing';
                    return (
                      <div key={game.id} className={styles.narrativeCard} onClick={() => setDetailTarget(game)} style={{
                        background: 'var(--bg-card-elevated)', borderRadius: 8, padding: '22px 26px',
                        borderTop: '1px solid var(--border-card)',
                        borderRight: '1px solid var(--border-card)',
                        borderBottom: '1px solid var(--border-card)',
                        borderLeft: '3px solid var(--border-card)',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
                        cursor: 'pointer',
                        position: 'relative', overflow: 'hidden',
                      }}>
                        <CardNoise opacity={0.025} />
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className={styles.narrativeCardName} style={{
                              fontFamily: 'var(--font-cinzel)', fontSize: 16, fontWeight: 700,
                              color: 'var(--text-heading)', transition: 'color 0.2s',
                            }}>{isSetup ? 'New Character' : (game.character?.name || 'New Character')}</span>
                            {isSetup && (
                              <span style={{
                                fontFamily: 'var(--font-jetbrains)', fontSize: 10, color: 'var(--text-secondary)',
                                background: 'var(--bg-main)', padding: '1px 5px', borderRadius: 3,
                                border: '1px solid var(--border-primary)',
                              }}>SETUP</span>
                            )}
                          </div>
                          <span style={{
                            fontFamily: 'var(--font-jetbrains)', fontSize: 12,
                            color: 'var(--text-secondary)', flexShrink: 0, marginLeft: 12,
                          }}>{formatTimeAgo(game.lastPlayedAt || game.createdAt)}</span>
                        </div>

                        {/* World */}
                        <div style={{
                          fontFamily: 'var(--font-alegreya-sans)', fontSize: 13,
                          color: '#9a8545', marginBottom: 10,
                        }}>{isSetup ? 'Setting up...' : (game.setting !== 'pending' ? game.setting : 'New World')}</div>

                        {/* Blurb */}
                        {isSetup ? (
                          <p style={{
                            fontFamily: 'var(--font-alegreya)', fontSize: 15, fontStyle: 'italic',
                            color: 'var(--text-secondary-bright)', lineHeight: 1.7, margin: '0 0 14px',
                          }}>Character creation in progress.</p>
                        ) : game.blurb ? (
                          <p style={{
                            fontFamily: 'var(--font-alegreya)', fontSize: 15, fontStyle: 'italic',
                            color: 'var(--text-secondary-bright)', lineHeight: 1.7, margin: '0 0 14px',
                          }}>{game.blurb}</p>
                        ) : null}

                        {/* Metadata footer */}
                        <div style={{ borderTop: '1px solid var(--border-card-separator)', paddingTop: 10 }}>
                          <MetaLine game={game} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* OLDER GAMES section (compact 2-column grid, games at index 3+) */}
            {olderGames.length > 0 && (
              <div style={{
                marginTop: 28, marginBottom: 48,
                opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(10px)',
                transition: 'opacity 1s cubic-bezier(0.16, 1, 0.3, 1) 0.5s, transform 1s cubic-bezier(0.16, 1, 0.3, 1) 0.5s',
              }}>
                <SectionLabel text="OLDER GAMES" count={olderGames.length} />
                <div className={styles.compactGrid}>
                  {olderGames.map(game => {
                    const isSetup = !game.character?.name || game.status === 'initializing';
                    return (
                      <div key={game.id} className={styles.compactCard} onClick={() => setDetailTarget(game)} style={{
                        background: 'var(--bg-card-elevated)', borderRadius: 6, padding: '16px 18px',
                        borderTop: '1px solid var(--border-card)',
                        borderRight: '1px solid var(--border-card)',
                        borderBottom: '1px solid var(--border-card)',
                        borderLeft: '3px solid var(--border-card)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        cursor: 'pointer',
                        display: 'flex', flexDirection: 'column',
                        position: 'relative', overflow: 'hidden',
                      }}>
                        <CardNoise opacity={0.025} />
                        {/* Name */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <span className={styles.compactCardName} style={{
                            fontFamily: 'var(--font-cinzel)', fontSize: 14, fontWeight: 700,
                            color: 'var(--text-heading)', transition: 'color 0.2s',
                          }}>{isSetup ? 'New Character' : (game.character?.name || 'New Character')}</span>
                          {isSetup && (
                            <span style={{
                              fontFamily: 'var(--font-jetbrains)', fontSize: 10, color: 'var(--text-secondary)',
                              background: 'var(--bg-main)', padding: '1px 5px', borderRadius: 3,
                              border: '1px solid var(--border-primary)',
                            }}>SETUP</span>
                          )}
                        </div>

                        {/* World */}
                        <div style={{
                          fontFamily: 'var(--font-alegreya-sans)', fontSize: 12,
                          color: '#9a8545',
                        }}>{isSetup ? 'Setting up...' : (game.setting !== 'pending' ? game.setting : 'New World')}</div>

                        {/* Footer */}
                        <div style={{
                          marginTop: 'auto', paddingTop: 10,
                          borderTop: '1px solid var(--border-card-separator)',
                          display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4,
                        }}>
                          <MetaLine game={game} small />
                          <span style={{
                            fontFamily: 'var(--font-jetbrains)', fontSize: 12,
                            color: 'var(--text-secondary)', marginLeft: 'auto',
                          }}>{formatTimeAgo(game.lastPlayedAt || game.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer variant="minimal" />

      {/* ═══ MODALS ═══ */}
      {detailTarget && (
        <GameDetailModal
          game={detailTarget}
          onClose={() => setDetailTarget(null)}
          onNavigate={() => { setDetailTarget(null); navigateToGame(detailTarget); }}
          onDelete={() => { setDetailTarget(null); setDeleteTarget(detailTarget); }}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal game={deleteTarget} onConfirm={handleDeleteGame} onCancel={() => setDeleteTarget(null)} />
      )}
    </div>
  );
}
