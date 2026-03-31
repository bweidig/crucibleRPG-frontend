'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { get, post, del, clearToken, isAuthenticated, getUser } from '@/lib/api';
import AuthAvatar from '@/components/AuthAvatar';
import styles from './page.module.css';

// ─── GOLD PALETTE ───

const GOLD = {
  accent: "#d4a94e",
  light: "#ffe8a0",
  dim: "#a08040",
  gradient: "linear-gradient(135deg, rgba(212,169,78,0.10) 0%, rgba(180,120,40,0.03) 100%)",
  iconBg: "linear-gradient(135deg, rgba(212,169,78,0.15), rgba(140,100,30,0.06))",
  border: "rgba(212,169,78,0.22)",
  borderHover: "rgba(212,169,78,0.4)",
  glow: "rgba(212,169,78,0.08)",
  stripe: "#c9a84c",
};

// ─── EMBER PARTICLES ───

const EMBER_COLORS = ["#c9a84c", "#d4a94e", "#e8a840", "#d4845a", "#c0924a", "#ddb84e"];

// ─── FONT & SIZE OPTIONS (for display settings persistence) ───

const FONT_OPTIONS = [
  { id: "lexie", label: "Lexie Readable", family: "var(--font-lexie), sans-serif" },
  { id: "system", label: "System Default", family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  { id: "alegreya-sans", label: "Alegreya Sans", family: "var(--font-alegreya-sans), sans-serif" },
  { id: "georgia", label: "Georgia", family: "Georgia, 'Times New Roman', serif" },
  { id: "mono", label: "Monospace", family: "var(--font-jetbrains), 'Courier New', monospace" },
];
const SIZE_OPTIONS = [
  { id: "small", label: "Small", base: 13, meta: 10, heading: 22, sub: 14 },
  { id: "medium", label: "Medium", base: 15, meta: 11, heading: 26, sub: 16 },
  { id: "large", label: "Large", base: 17, meta: 12, heading: 30, sub: 18 },
  { id: "xlarge", label: "X-Large", base: 19, meta: 13, heading: 34, sub: 20 },
];

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
    Forgiving: { color: "#8aba7a", bg: "rgba(138,186,122,0.12)", border: "rgba(138,186,122,0.3)" },
    Standard:  { color: "#b0b8cc", bg: "rgba(176,184,204,0.1)",  border: "rgba(176,184,204,0.2)" },
    Harsh:     { color: "#e8c45a", bg: "rgba(232,196,90,0.12)",  border: "rgba(232,196,90,0.3)" },
    Brutal:    { color: "#e8845a", bg: "rgba(232,132,90,0.12)",  border: "rgba(232,132,90,0.3)" },
  };
  const d = map[difficulty] || map.Standard;
  return (
    <span style={{
      fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 12, fontWeight: 500,
      padding: '3px 10px', borderRadius: 10, letterSpacing: '0.06em',
      color: d.color, background: d.bg, border: `1px solid ${d.border}`,
    }}>{difficulty.toUpperCase()}</span>
  );
}

// ─── METADATA LINE ───

function MetaLine({ game }) {
  const sep = <span style={{ color: '#3a4460', margin: '0 10px' }}>{'\u00B7'}</span>;
  const isSetup = !game.character?.name || game.status === 'initializing';
  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
      {game.storyteller && game.storyteller !== 'pending' && (
        <><span style={{ fontFamily: "var(--font-alegreya-sans), sans-serif", fontSize: 14, color: '#8a90a4' }}>{game.storyteller}</span>{sep}</>
      )}
      {game.turnCount > 0 && (
        <><span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 13, color: '#8a90a4' }}>{game.turnCount}</span>
        <span style={{ fontFamily: "var(--font-alegreya-sans), sans-serif", fontSize: 14, color: '#8a90a4' }}> turns</span>{sep}</>
      )}
      {game.difficulty && <><DiffBadge difficulty={game.difficulty} />{sep}</>}
      <span style={{ fontFamily: "var(--font-alegreya-sans), sans-serif", fontSize: 14, color: '#5a6a88', textTransform: 'capitalize' }}>
        {isSetup ? 'In Setup' : game.status}
      </span>
    </div>
  );
}

// ─── PARTICLE FIELD ───

function ParticleField() {
  const [particles] = useState(() =>
    Array.from({ length: 60 }, (_, i) => {
      const color = EMBER_COLORS[Math.floor(Math.random() * EMBER_COLORS.length)];
      const size = Math.random() * 3.0 + 0.6;
      const opacity = Math.random() * 0.30 + 0.06;
      const floatDur = Math.random() * 14 + 6;
      const floatDelay = Math.random() * 10;
      const hasTwinkle = Math.random() < 0.4;
      const twinkleDur = Math.random() * 3 + 1.5;
      const twinkleDelay = Math.random() * 6;
      return { id: i, x: Math.random() * 100, y: Math.random() * 100, size, color, opacity, floatDur, floatDelay, hasTwinkle, twinkleDur, twinkleDelay, blur: size > 2.5 };
    })
  );

  return (
    <div className={styles.particleField}>
      {particles.map(p => (
        <div key={p.id} className={styles.particle} style={{
          left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
          background: p.color, '--p-opacity': p.opacity, opacity: p.opacity,
          animation: `float ${p.floatDur}s ease-in-out ${p.floatDelay}s infinite${p.hasTwinkle ? `, twinkle ${p.twinkleDur}s ease-in-out ${p.twinkleDelay}s infinite` : ''}`,
          filter: p.blur ? 'blur(0.5px)' : 'none',
        }} />
      ))}
    </div>
  );
}

// ─── CHARACTER SNAPSHOT ───

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
    <div style={{ padding: '16px 0', marginBottom: 14, borderTop: '1px solid rgba(212,169,78,0.12)', borderBottom: '1px solid rgba(212,169,78,0.12)' }}>
      {/* Stats */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: conditions.length > 0 || skills.length > 0 ? 14 : 0 }}>
        {Object.entries(stats).map(([key, val]) => {
          const base = typeof val === 'object' ? (val.base ?? val.effective ?? 0) : val;
          const effective = typeof val === 'object' ? (val.effective ?? val.base ?? 0) : val;
          const color = effective < base ? '#e8845a' : effective > base ? '#8aba7a' : '#c8c0b0';
          return (
            <div key={key} style={{
              minWidth: 52, padding: '6px 8px', textAlign: 'center',
              background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.04)',
            }}>
              <div style={{ fontFamily: "var(--font-cinzel), serif", fontSize: 10, fontWeight: 700, color: '#a08040', letterSpacing: '0.08em' }}>{key.toUpperCase()}</div>
              <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 16, fontWeight: 500, color }}>{Number(effective).toFixed(1)}</div>
            </div>
          );
        })}
      </div>

      {/* Conditions */}
      {conditions.length > 0 && (
        <div style={{ marginBottom: skills.length > 0 ? 12 : 0 }}>
          <div style={{ fontFamily: "var(--font-cinzel), serif", fontSize: 10, fontWeight: 600, color: '#6b83a3', letterSpacing: '0.12em', marginBottom: 6 }}>CONDITIONS</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {visibleConds.map((c, i) => {
              const name = typeof c === 'string' ? c : c.name;
              const isBuff = typeof c === 'object' && c.isBuff;
              const penalty = typeof c === 'object' ? c.penalty : null;
              const stat = typeof c === 'object' ? c.stat : null;
              return (
                <span key={i} style={{
                  fontFamily: "var(--font-alegreya-sans), sans-serif", fontSize: 12,
                  padding: '3px 10px', borderRadius: 10,
                  color: isBuff ? '#8aba7a' : '#e8a860',
                  background: isBuff ? 'rgba(138,186,122,0.08)' : 'rgba(232,168,96,0.08)',
                  border: `1px solid ${isBuff ? 'rgba(138,186,122,0.2)' : 'rgba(232,168,96,0.2)'}`,
                }}>
                  {name}
                  {penalty != null && <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 11, marginLeft: 4 }}>{penalty > 0 ? `-${penalty}` : `+${Math.abs(penalty)}`}</span>}
                  {stat && <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 11, marginLeft: 2, opacity: 0.7 }}>{stat}</span>}
                </span>
              );
            })}
            {hiddenCondCount > 0 && (
              <span className={styles.toggleLink} onClick={() => setShowAllConds(!showAllConds)}
                style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 11, color: '#8a90a4' }}>
                {showAllConds ? 'show less' : `+${hiddenCondCount} more`}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div>
          <div style={{ fontFamily: "var(--font-cinzel), serif", fontSize: 10, fontWeight: 600, color: '#6b83a3', letterSpacing: '0.12em', marginBottom: 6 }}>TOP SKILLS</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {visibleSkills.map((sk, i) => {
              const name = typeof sk === 'string' ? sk : sk.name || sk.scope;
              const mod = typeof sk === 'object' ? sk.modifier : null;
              return (
                <span key={i} style={{
                  fontFamily: "var(--font-alegreya-sans), sans-serif", fontSize: 12, color: '#a0a4b4',
                  padding: '3px 10px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  {name}
                  {mod != null && <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 11, color: '#c9a84c', marginLeft: 4 }}>+{mod}</span>}
                </span>
              );
            })}
            {hiddenSkillCount > 0 && (
              <span className={styles.toggleLink} onClick={() => setShowAllSkills(!showAllSkills)}
                style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 11, color: '#8a90a4' }}>
                {showAllSkills ? 'show less' : `+${hiddenSkillCount} more`}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HERO CARD ───

function HeroCard({ game, onNavigate, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  async function handleExpand() {
    setExpanded(prev => !prev);
    if (!detail && !detailLoading) {
      setDetailLoading(true);
      try {
        const data = await get(`/api/games/${game.id}`);
        setDetail(data.character || data.game?.character || null);
      } catch { setDetail(null); }
      setDetailLoading(false);
    }
  }

  return (
    <div className={styles.heroCard} onClick={handleExpand} style={{
      background: '#1c2240', borderRadius: 14, overflow: 'hidden', padding: '28px 36px',
      borderTop: '1px solid rgba(212,169,78,0.35)',
      borderRight: '1px solid rgba(212,169,78,0.35)',
      borderBottom: '1px solid rgba(212,169,78,0.35)',
      borderLeft: '4px solid #c9a84c',
      position: 'relative',
    }}>
      {/* Timestamp + delete */}
      <div style={{ position: 'absolute', top: 16, right: 18, display: 'flex', alignItems: 'center', gap: 10, zIndex: 2 }}>
        <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 13, color: '#7082a4' }}>
          {formatTimeAgo(game.createdAt)}
        </span>
        <button className={styles.deleteBtn} onClick={e => { e.stopPropagation(); onDelete(game); }}
          style={{ background: 'none', border: 'none', padding: 2, color: '#5a6a88', fontSize: 16, lineHeight: 1 }}
        >&times;</button>
      </div>

      {/* Headline */}
      <div style={{
        fontFamily: "var(--font-cinzel), serif", fontSize: 'clamp(20px, 2.8vw, 26px)', fontWeight: 700,
        color: GOLD.accent, letterSpacing: '0.06em', marginBottom: 14,
      }}>Continue Your Adventure</div>

      {/* Character + icon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: GOLD.iconBg, border: `1px solid ${GOLD.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <SettingIcon setting={game.setting} color={GOLD.accent} />
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-alegreya-sans), sans-serif", fontSize: 18, fontWeight: 500, color: '#c8c0b0' }}>
            {game.character?.name || 'New Character'}
          </div>
          <div style={{ fontFamily: "var(--font-alegreya-sans), sans-serif", fontSize: 14, color: GOLD.dim }}>
            {game.setting !== 'pending' ? game.setting : 'Setting up'}
          </div>
        </div>
      </div>

      {/* Blurb (clamped to 2 lines in collapsed, still 2 in expanded since full is in modal) */}
      {game.blurb && (
        <p style={{
          fontFamily: "var(--font-alegreya), serif", fontSize: 17, fontStyle: 'italic',
          color: '#a0a4b4', lineHeight: 1.65, margin: '0 0 14px',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{game.blurb}</p>
      )}

      {/* Expanded content */}
      {expanded && (
        <div style={{ animation: 'expandIn 0.25s ease' }}>
          {/* Resume button */}
          <button className={styles.resumeBtn} onClick={e => { e.stopPropagation(); onNavigate(game); }}
            style={{
              background: `linear-gradient(135deg, ${GOLD.accent}, ${GOLD.light})`,
              fontFamily: "var(--font-cinzel), serif", fontSize: 16, fontWeight: 700,
              color: '#0a0e1a', padding: '13px 40px', borderRadius: 8,
              border: 'none', letterSpacing: '0.08em', marginBottom: 20,
            }}>RESUME</button>

          {/* Character snapshot */}
          {detailLoading && (
            <p style={{ fontFamily: "var(--font-alegreya), serif", fontStyle: 'italic', fontSize: 14, color: '#7082a4', margin: '10px 0' }}>Loading character...</p>
          )}
          {detail && <CharacterSnapshot detail={detail} />}
        </div>
      )}

      {/* Metadata line */}
      <div style={{ marginTop: expanded ? 0 : 6 }}>
        <MetaLine game={game} />
      </div>
    </div>
  );
}

// ─── GAME TILE ───

function GameTile({ game, onClick }) {
  const isSetup = !game.character?.name || game.status === 'initializing';

  return (
    <div className={styles.gameCard} onClick={onClick} style={{
      background: '#161c32', borderRadius: 10, overflow: 'hidden',
      borderTop: '1px solid rgba(212,169,78,0.10)',
      borderRight: '1px solid rgba(212,169,78,0.10)',
      borderBottom: '1px solid rgba(212,169,78,0.10)',
      borderLeft: '4px solid #c9a84c',
      minHeight: 160, padding: 18, display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: GOLD.iconBg, border: `1px solid ${GOLD.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.25s',
        }}>
          <SettingIcon setting={game.setting} color={GOLD.accent} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontFamily: "var(--font-alegreya-sans), sans-serif", fontSize: 17, fontWeight: 600,
              color: '#c8c0b0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              transition: 'color 0.25s',
            }}>{game.character?.name || 'New Character'}</span>
            {isSetup && (
              <span style={{
                fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 10, color: '#7082a4',
                background: 'rgba(112,130,164,0.12)', padding: '1px 5px', borderRadius: 3,
              }}>SETUP</span>
            )}
          </div>
          <div style={{ fontFamily: "var(--font-alegreya-sans), sans-serif", fontSize: 13, color: GOLD.dim }}>
            {game.setting !== 'pending' ? game.setting : 'New World'}
          </div>
        </div>
      </div>

      {/* Blurb */}
      {game.blurb ? (
        <div style={{
          fontFamily: "var(--font-alegreya), serif", fontSize: 15, fontStyle: 'italic',
          color: '#8a8e9e', lineHeight: 1.55,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{game.blurb}</div>
      ) : isSetup ? (
        <div style={{
          fontFamily: "var(--font-alegreya), serif", fontSize: 15, fontStyle: 'italic',
          color: '#5a6a88', lineHeight: 1.55,
        }}>Character creation in progress.</div>
      ) : null}

      {/* Footer */}
      <div style={{
        marginTop: 'auto', paddingTop: 6,
        borderTop: `1px solid ${GOLD.border}`,
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
      }}>
        {game.turnCount > 0 && (
          <span style={{
            fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 12, color: GOLD.accent,
            background: GOLD.glow, padding: '2px 7px', borderRadius: 4,
          }}>{game.turnCount} turns</span>
        )}
        <DiffBadge difficulty={game.difficulty} />
        <span style={{
          fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 12, color: '#5a6a88',
          marginLeft: 'auto',
        }}>{formatTimeAgo(game.createdAt)}</span>
      </div>
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
        background: '#111528', borderRadius: 12, padding: '32px 36px 28px',
        borderTop: `1px solid ${GOLD.border}`, borderRight: `1px solid ${GOLD.border}`,
        borderBottom: `1px solid ${GOLD.border}`, borderLeft: `4px solid ${GOLD.stripe}`,
        animation: 'expandIn 0.25s',
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 14, right: 16,
          background: 'none', border: 'none', color: '#5a6a88', fontSize: 18, cursor: 'pointer',
          transition: 'color 0.2s',
        }}>&times;</button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10, flexShrink: 0,
            background: GOLD.iconBg, border: `1px solid ${GOLD.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <SettingIcon setting={game.setting} color={GOLD.accent} />
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-alegreya-sans), sans-serif", fontSize: 24, fontWeight: 600, color: '#e0d8c8' }}>
              {game.character?.name || 'New Character'}
            </div>
            <div style={{ fontFamily: "var(--font-alegreya-sans), sans-serif", fontSize: 15, color: GOLD.dim }}>
              {game.setting !== 'pending' ? game.setting : 'New World'}
            </div>
          </div>
        </div>

        {/* Blurb (full, not clamped) */}
        {game.blurb ? (
          <p style={{ fontFamily: "var(--font-alegreya), serif", fontSize: 16, fontStyle: 'italic', color: '#a0a4b4', lineHeight: 1.7, margin: '0 0 16px' }}>{game.blurb}</p>
        ) : isSetup ? (
          <p style={{ fontFamily: "var(--font-alegreya), serif", fontSize: 16, fontStyle: 'italic', color: '#5a6a88', lineHeight: 1.7, margin: '0 0 16px' }}>Character creation in progress.</p>
        ) : null}

        {/* Character snapshot */}
        {loading && (
          <p style={{ fontFamily: "var(--font-alegreya), serif", fontStyle: 'italic', fontSize: 14, color: '#7082a4', margin: '10px 0' }}>Loading character...</p>
        )}
        {!loading && detail && <CharacterSnapshot detail={detail} />}

        {/* Metadata */}
        <div style={{ marginBottom: 20 }}>
          <MetaLine game={game} />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button className={styles.resumeBtn} onClick={onNavigate} style={{
            background: `linear-gradient(135deg, ${GOLD.accent}, ${GOLD.light})`,
            fontFamily: "var(--font-cinzel), serif", fontSize: 14, fontWeight: 700,
            color: '#0a0e1a', padding: '11px 32px', borderRadius: 8,
            border: 'none', letterSpacing: '0.08em',
          }}>{isSetup ? 'CONTINUE SETUP' : 'RESUME'}</button>
          <button className={styles.deleteBtn} onClick={onDelete} style={{
            background: 'none', border: 'none', padding: '8px 12px',
            fontFamily: "var(--font-alegreya-sans), sans-serif", fontSize: 14, color: '#5a6a88',
          }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── DISPLAY SETTINGS MODAL ───

function DisplaySettings({ font, setFont, textSize, setTextSize, onClose }) {
  const sz = SIZE_OPTIONS.find(s => s.id === textSize) || SIZE_OPTIONS[1];
  const ff = (FONT_OPTIONS.find(f => f.id === font) || FONT_OPTIONS[0]).family;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />
      <div onClick={e => e.stopPropagation()} style={{
        background: "#111528", border: "1px solid #1e2540", borderRadius: 10,
        padding: "24px 28px", maxWidth: 460, width: "90%",
        position: "relative", zIndex: 1, maxHeight: "85vh", overflowY: "auto",
      }}>
        <h2 style={{ fontFamily: "var(--font-cinzel), serif", fontSize: sz.heading - 8, color: "#d0c098", marginBottom: 20, marginTop: 0 }}>Display Settings</h2>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontFamily: ff, fontSize: sz.base, color: "#8a94a8", display: "block", marginBottom: 8 }}>Font</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {FONT_OPTIONS.map(f => (
              <button key={f.id} onClick={() => setFont(f.id)} style={{
                padding: "8px 12px", cursor: "pointer", borderRadius: 6, textAlign: "left",
                border: `1px solid ${font === f.id ? "#c9a84c" : "#3a3328"}`,
                background: font === f.id ? "#0d1120" : "transparent",
                fontFamily: f.family, fontSize: sz.base,
                color: font === f.id ? "#c9a84c" : "#c8c0b0", transition: "all 0.2s",
              }}>{f.label}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 8 }}>
          <label style={{ fontFamily: ff, fontSize: sz.base, color: "#8a94a8", display: "block", marginBottom: 8 }}>Text Size</label>
          <div style={{ display: "flex", gap: 6 }}>
            {SIZE_OPTIONS.map(s => (
              <button key={s.id} onClick={() => setTextSize(s.id)} style={{
                flex: 1, padding: "8px 0", cursor: "pointer", borderRadius: 6,
                border: `1px solid ${textSize === s.id ? "#c9a84c" : "#3a3328"}`,
                background: textSize === s.id ? "#0d1120" : "transparent",
                fontFamily: ff, fontSize: sz.base - 2,
                color: textSize === s.id ? "#c9a84c" : "#8a94a8", transition: "all 0.2s",
              }}>{s.label}</button>
            ))}
          </div>
        </div>
        <button onClick={onClose} style={{ position: "absolute", top: 12, right: 14, background: "none", border: "none", color: "#6b83a3", fontSize: 16, cursor: "pointer" }}>{'\u2715'}</button>
      </div>
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
        background: "#111528", border: "1px solid #3a3328", borderRadius: 10,
        padding: "24px 28px", maxWidth: 420, width: "90%", position: "relative", zIndex: 1,
      }}>
        <h3 style={{ fontFamily: "var(--font-cinzel), serif", fontSize: 16, fontWeight: 700, color: '#e8845a', marginBottom: 12, marginTop: 0 }}>Delete Game</h3>
        <div style={{ marginBottom: 6 }}>
          {game.character?.name && <div style={{ fontFamily: "var(--font-cinzel), serif", fontSize: 15, color: "#d0c098", marginBottom: 2 }}>{game.character.name}</div>}
          {game.setting !== 'pending' && <div style={{ fontFamily: "var(--font-cinzel), serif", fontSize: 12, fontWeight: 600, color: "#c9a84c", letterSpacing: "0.1em" }}>{game.setting}</div>}
        </div>
        <p style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 14, color: "#c8c0b0", lineHeight: 1.6, marginBottom: 0 }}>
          This will permanently delete this game and all of its history. This cannot be undone.
        </p>
        <p style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 13, color: "#8a94a8", marginTop: 16, marginBottom: 6 }}>
          Type <strong style={{ color: "#c8c0b0" }}>{confirmWord}</strong> to confirm
        </p>
        <input value={text} onChange={e => setText(e.target.value)} autoFocus style={{
          width: '100%', boxSizing: 'border-box',
          fontFamily: "var(--font-alegreya-sans)", fontSize: 14, color: "#c8c0b0",
          background: "#0a0e1a", border: `1px solid ${shaking ? '#e8845a' : '#1e2540'}`,
          borderRadius: 4, padding: '10px 14px', outline: 'none',
          transition: 'border-color 0.2s', animation: shaking ? 'shake 0.4s ease' : 'none',
        }} />
        {error && <p style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 13, color: '#e8845a', marginTop: 8 }}>{error}</p>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
          <button onClick={onCancel} disabled={deleting} style={{
            fontFamily: "var(--font-cinzel), serif", fontSize: 12, fontWeight: 600,
            background: "none", border: "none", color: "#8a94a8", cursor: "pointer", padding: "10px 16px",
          }}>Cancel</button>
          <button onClick={handleDelete} disabled={!matches || deleting} style={{
            fontFamily: "var(--font-cinzel), serif", fontSize: 12, fontWeight: 600,
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

// ─── SNAPSHOT PICKER MODAL ───

function SnapshotPickerModal({ onClose, onSelect }) {
  const [snapshots, setSnapshots] = useState(null);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(null);

  useEffect(() => {
    get('/api/games/snapshots').then(data => setSnapshots(data.snapshots || data || [])).catch(() => setSnapshots([]));
  }, []);
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  async function handleSelect(snap) {
    setCreating(snap.id); setError(null);
    try { const result = await post(`/api/games/snapshots/${snap.id}/import-mine`); onSelect(result.gameId); }
    catch (err) { setError(err.message || 'Failed to create game from snapshot'); setCreating(null); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />
      <div onClick={e => e.stopPropagation()} style={{
        background: "#111528", border: "1px solid #3a3328", borderRadius: 10,
        padding: "24px 28px", maxWidth: 500, width: "90%", position: "relative", zIndex: 1,
        maxHeight: "80vh", overflowY: "auto",
      }}>
        <button onClick={onClose} style={{ position: "absolute", top: 12, right: 14, background: "none", border: "none", color: "#6b83a3", fontSize: 16, cursor: "pointer" }}>{'\u2715'}</button>
        {snapshots === null ? (
          <p style={{ fontFamily: "var(--font-alegreya)", fontStyle: 'italic', fontSize: 15, color: "#7082a4", textAlign: 'center', padding: 20 }}>Loading your worlds...</p>
        ) : snapshots.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <h3 style={{ fontFamily: "var(--font-cinzel), serif", fontSize: 18, fontWeight: 700, color: "#d0c098", marginBottom: 12, marginTop: 0 }}>No Saved Worlds</h3>
            <p style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 14, color: "#8a94a8", lineHeight: 1.7, marginBottom: 20 }}>
              World snapshots let you replay a world you have already built with a new character. You can save a world snapshot from the settings menu during any active game.
            </p>
            <button onClick={onClose} style={{ fontFamily: "var(--font-cinzel), serif", fontSize: 13, fontWeight: 600, color: "#c9a84c", background: 'none', border: "1px solid #3a3328", borderRadius: 6, padding: '10px 24px', cursor: 'pointer' }}>Got it</button>
          </div>
        ) : (
          <div>
            <h3 style={{ fontFamily: "var(--font-cinzel), serif", fontSize: 16, fontWeight: 700, color: "#d0c098", marginBottom: 16, marginTop: 0 }}>Choose a World</h3>
            {error && <p style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 13, color: '#e8845a', marginBottom: 12 }}>{error}</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {snapshots.map(snap => (
                <div key={snap.id} onClick={() => !creating && handleSelect(snap)} className={styles.gameCard} style={{
                  background: '#0d1120', borderLeft: `3px solid ${GOLD.stripe}`,
                  borderTop: '1px solid rgba(255,255,255,0.04)', borderRight: '1px solid rgba(255,255,255,0.04)',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  borderRadius: 8, padding: '14px 16px',
                  opacity: creating && creating !== snap.id ? 0.5 : 1,
                }}>
                  <div style={{ fontFamily: "var(--font-cinzel), serif", fontSize: 15, fontWeight: 700, color: "#d0c098", marginBottom: 4 }}>
                    {creating === snap.id ? 'Creating game...' : snap.name}
                  </div>
                  <div style={{ fontFamily: "var(--font-cinzel), serif", fontSize: 11, fontWeight: 600, color: GOLD.accent, letterSpacing: '0.1em', marginBottom: 6 }}>
                    {snap.setting || snap.settingName}
                  </div>
                  <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 11, color: "#7082a4", marginBottom: 4 }}>
                    {snap.factionCount || 0} factions {'\u00B7'} {snap.npcCount || 0} NPCs {'\u00B7'} {snap.locationCount || 0} locations
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 10, color: "#9a8545" }}>{snap.type === 'fresh_start' ? 'Fresh Start' : 'Branch'}</span>
                    <span style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 12, color: "#7082a4" }}>{formatTimeAgo(snap.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
  const [playerName, setPlayerName] = useState('');
  const [font, setFont] = useState("lexie");
  const [textSize, setTextSize] = useState("medium");
  const [showSettings, setShowSettings] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [isPlaytester, setIsPlaytester] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [detailTarget, setDetailTarget] = useState(null);

  // Auth check + fetch games
  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/auth'); return; }
    const user = getUser();
    if (user) setIsPlaytester(!!user.isPlaytester);
    if (user?.displayName) {
      setPlayerName(user.displayName);
    } else {
      try {
        const token = localStorage.getItem('crucible_token');
        const payload = JSON.parse(atob(token.split('.')[1]));
        setPlayerName(payload.email?.split('@')[0] || 'Adventurer');
      } catch { setPlayerName('Adventurer'); }
    }

    async function fetchGames() {
      try {
        const data = await get('/api/games');
        setGames((data.games || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
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

  function handleLogout() { clearToken(); router.push('/landing'); }

  function navigateToGame(game) {
    router.push(game.status === 'active' ? `/play?id=${game.id}` : `/init?id=${game.id}`);
  }

  async function handleDeleteGame(gameId) {
    await del(`/api/games/${gameId}`);
    setGames(prev => prev.filter(g => g.id !== gameId));
    setDeleteTarget(null);
    if (detailTarget?.id === gameId) setDetailTarget(null);
  }

  // Loading
  if (games === null) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0e1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: "var(--font-alegreya), serif", fontSize: 18, fontStyle: 'italic', color: '#7082a4' }}>Loading...</div>
      </div>
    );
  }

  const hasGames = games.length > 0;
  const activeGame = hasGames ? games[0] : null;
  const otherGames = hasGames ? games.slice(1) : [];

  return (
    <div className={styles.pageContainer} style={{ minHeight: "100vh", background: "#0a0e1a", color: "#c8c0b0", position: "relative" }}>
      <ParticleField />

      {/* ═══ NAV + WELCOME + HERO (860px) ═══ */}
      <div style={{
        position: 'relative', zIndex: 1, maxWidth: 860, margin: '0 auto', padding: '0 32px', boxSizing: 'border-box',
        opacity: loaded ? 1 : 0, transition: 'opacity 0.6s',
      }}>
        {/* Nav */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "18px 0", borderBottom: "1px solid #2a2622", marginBottom: 32,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, userSelect: "none" }}>
              <span style={{ fontFamily: "var(--font-cinzel), serif", fontSize: 24, fontWeight: 900, color: "#c9a84c", letterSpacing: "0.06em" }}>CRUCIBLE</span>
              <span style={{ fontFamily: "var(--font-cinzel), serif", fontSize: 14, fontWeight: 600, color: "#9a8545", letterSpacing: "0.08em" }}>RPG</span>
            </div>
            <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 10, color: "#7082a4", border: "1px solid #3a3328", borderRadius: 4, padding: "2px 7px" }}>EARLY ACCESS</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link href="/rulebook" className={styles.navLink} style={{ fontFamily: "var(--font-cinzel), serif", fontSize: 13, fontWeight: 600, color: "#9a8545", letterSpacing: "0.1em" }}>RULEBOOK</Link>
            <AuthAvatar size={32} />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#201416', border: '1px solid #5a3020', borderRadius: 6, padding: '10px 14px', marginBottom: 18, fontFamily: "var(--font-alegreya-sans), sans-serif", fontSize: 14, color: '#e8845a' }}>{error}</div>
        )}

        {/* Playtester gate */}
        {!isPlaytester && (
          <div style={{ background: "#111528", border: "1px solid #3a3328", borderRadius: 12, padding: "48px 40px", textAlign: "center", marginBottom: 32, animation: "fadeIn 0.5s ease both" }}>
            <div style={{ fontFamily: "var(--font-cinzel), serif", fontSize: 28, fontWeight: 700, color: "#c9a84c", marginBottom: 16 }}>Account Created</div>
            <p style={{ fontFamily: "var(--font-alegreya), serif", fontSize: 18, fontStyle: "italic", color: "#8a94a8", lineHeight: 1.7, maxWidth: 480, margin: "0 auto 20px" }}>Your account is pending playtester access.</p>
            <p style={{ fontFamily: "var(--font-alegreya-sans), sans-serif", fontSize: 14, color: "#7082a4", lineHeight: 1.6, maxWidth: 400, margin: "0 auto" }}>
              Crucible RPG is in early access. Once your account is approved, you will be able to create and play games from here.
            </p>
          </div>
        )}

        {/* Welcome + Hero */}
        {isPlaytester && (
          <div style={{ position: 'relative' }}>
            {/* Warm glow */}
            <div style={{
              position: 'absolute', width: 800, height: 500, top: -80, left: '50%', transform: 'translateX(-50%)',
              background: 'radial-gradient(ellipse, rgba(212,169,78,0.13) 0%, rgba(232,168,64,0.05) 35%, transparent 65%)',
              pointerEvents: 'none',
            }} />

            {hasGames ? (
              <>
                {/* Welcome heading */}
                <div style={{
                  fontFamily: "var(--font-cinzel), serif", fontSize: 'clamp(36px, 5.5vw, 48px)', fontWeight: 700,
                  color: '#d4a94e', textAlign: 'center', letterSpacing: '0.03em',
                  opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0) scale(1)' : 'translateY(18px) scale(0.97)',
                  transition: 'all 1.2s cubic-bezier(0.16,1,0.3,1) 0.05s',
                }}>Welcome back.</div>
                <div style={{
                  fontFamily: "var(--font-alegreya), serif", fontSize: 18, fontStyle: 'italic', fontWeight: 400,
                  color: '#8a8a78', textAlign: 'center', marginBottom: 36,
                  opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(10px)',
                  transition: 'all 1s ease 0.2s',
                }}>Pick up where you left off, or start something new.</div>

                {/* Hero card */}
                <div style={{
                  marginBottom: 24,
                  opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(14px)',
                  transition: 'all 1s cubic-bezier(0.16,1,0.3,1) 0.2s',
                }}>
                  <HeroCard game={activeGame} onNavigate={navigateToGame} onDelete={setDeleteTarget} />
                </div>

                {/* Action buttons */}
                <div style={{
                  display: 'flex', gap: 12, marginBottom: 48,
                  opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(10px)',
                  transition: 'all 1s ease 0.35s',
                }}>
                  <button className={styles.newGameBtn} onClick={() => router.push('/init')} style={{
                    flex: 1, padding: '17px 0', borderRadius: 10,
                    fontFamily: "var(--font-cinzel), serif", fontSize: 16, fontWeight: 700, letterSpacing: '0.08em',
                    background: 'linear-gradient(135deg, #c9a84c, #ddb84e)', border: 'none', color: '#0a0e1a',
                    boxShadow: '0 2px 16px rgba(201,168,76,0.2)',
                  }}>New Game</button>
                  {isPlaytester && (
                    <button className={styles.templateBtn} onClick={() => setShowSnapshots(true)} style={{
                      padding: '17px 24px', borderRadius: 10,
                      fontFamily: "var(--font-cinzel), serif", fontSize: 14, fontWeight: 600, letterSpacing: '0.06em',
                      background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.2)', color: '#c9a84c',
                    }}>From Template</button>
                  )}
                </div>
              </>
            ) : (
              /* New player */
              <div style={{ textAlign: 'center', padding: '60px 0 48px' }}>
                <div style={{
                  fontFamily: "var(--font-cinzel), serif", fontSize: 'clamp(36px, 5.5vw, 48px)', fontWeight: 700,
                  color: '#d4a94e', letterSpacing: '0.03em', marginBottom: 16,
                  opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0) scale(1)' : 'translateY(18px) scale(0.97)',
                  transition: 'all 1.2s cubic-bezier(0.16,1,0.3,1) 0.05s',
                }}>Welcome, {playerName}.</div>
                <div style={{
                  fontFamily: "var(--font-alegreya), serif", fontSize: 18, fontStyle: 'italic', fontWeight: 400,
                  color: '#8a8a78', marginBottom: 40,
                  opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(10px)',
                  transition: 'all 1s ease 0.2s',
                }}>Your first story is waiting.</div>
                <button className={styles.newGameBtn} onClick={() => router.push('/init')} style={{
                  padding: '18px 48px', borderRadius: 10,
                  fontFamily: "var(--font-cinzel), serif", fontSize: 16, fontWeight: 700, letterSpacing: '0.1em',
                  background: 'linear-gradient(135deg, #c9a84c, #ddb84e)', border: 'none', color: '#0a0e1a',
                  boxShadow: '0 2px 16px rgba(201,168,76,0.2)',
                  opacity: loaded ? 1 : 0, transition: 'opacity 1s ease 0.3s',
                }}>New Game</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ GAME GRID (1120px) ═══ */}
      {isPlaytester && hasGames && otherGames.length > 0 && (
        <div style={{
          position: 'relative', zIndex: 1, maxWidth: 1120, margin: '0 auto', padding: '0 32px', boxSizing: 'border-box',
          opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(10px)',
          transition: 'all 1s ease 0.45s',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 16 }}>
            <span style={{ fontFamily: "var(--font-cinzel), serif", fontSize: 15, fontWeight: 600, color: '#c9a84c', letterSpacing: '0.15em' }}>YOUR GAMES</span>
            <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 13, color: '#5a6a88' }}>({otherGames.length})</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
            {otherGames.map(g => (
              <GameTile key={g.id} game={g} onClick={() => setDetailTarget(g)} />
            ))}
          </div>
        </div>
      )}

      {/* ═══ FOOTER (1120px) ═══ */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1120, margin: '0 auto', padding: '0 32px', boxSizing: 'border-box' }}>
        <div style={{
          borderTop: "1px solid #2a2622", padding: "20px 0 32px", marginTop: 40,
          display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
        }}>
          <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 13, color: "#a08a48" }}>
            Crucible RPG {'\u00B7'} Early Access {'\u00B7'} v0.1.0
          </div>
          <div style={{ fontFamily: "var(--font-alegreya), serif", fontSize: 14, color: "#a08a48", fontStyle: "italic" }}>
            Every hero needs a crucible.
          </div>
        </div>
      </div>

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
      {showSnapshots && (
        <SnapshotPickerModal onClose={() => setShowSnapshots(false)} onSelect={(gameId) => { setShowSnapshots(false); router.push(`/init?id=${gameId}`); }} />
      )}
      {showSettings && (
        <DisplaySettings font={font} setFont={setFont} textSize={textSize} setTextSize={setTextSize} onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
