'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { get, clearToken, isAuthenticated, getUser } from '@/lib/api';
import AuthAvatar from '@/components/AuthAvatar';
import styles from './page.module.css';

// ─── DESIGN SYSTEM TOKENS ───
const C = {
  bg: "#0a0e1a",
  panel: "#0d1120",
  card: "#111528",
  text: "#c8c0b0",
  heading: "#d0c098",
  secondary: "#8a94a8",
  muted: "#7082a4",
  dim: "#6b83a3",
  accent: "#c9a84c",
  accentBright: "#ddb84e",
  danger: "#e8845a",
  statVal: "#b0b8cc",
  goldLabel: "#9a8545",
  footer: "#a08a48",
  border: "#1e2540",
  cardBorder: "#3a3328",
  cardBorderHover: "#564b2e",
  cardSep: "#2a2622",
  overlay: "rgba(0,0,0,0.6)",
  glow: "rgba(201,168,76,0.05)",
  glowHover: "rgba(201,168,76,0.08)",
  shadow: "rgba(0,0,0,0.3)",
  accentGlow: "rgba(201,168,76,0.45)",
};

// ─── FONT & SIZE OPTIONS ───
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

// ─── SETTING ICONS ───
const SETTING_ICONS = {
  'Sword & Soil': '\u2694\uFE0F',
  'Smoke & Steel': '\u2699\uFE0F',
  'Concrete & Code': '\uD83C\uDFD9\uFE0F',
  'Stars & Circuits': '\uD83D\uDE80',
  'Ash & Remnants': '\uD83D\uDD25',
  'Dream & Myth': '\u2728',
  'Fractured Grid': '\u26A1',
  'Custom': '\uD83C\uDFA8',
};

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

// ─── PARTICLE FIELD ───
function ParticleField() {
  const [particles] = useState(() =>
    Array.from({ length: 35 }, (_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 2 + 0.5, duration: Math.random() * 12 + 8,
      delay: Math.random() * 8, opacity: Math.random() * 0.2 + 0.03,
    }))
  );
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: "absolute", left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size, borderRadius: "50%",
          background: C.accent, '--p-opacity': p.opacity, opacity: p.opacity,
          animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite`,
        }} />
      ))}
    </div>
  );
}

// ─── WORDMARK ───
function Wordmark() {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 4, userSelect: "none" }}>
      <span style={{ fontFamily: "var(--font-cinzel), serif", fontSize: 22, fontWeight: 900, color: C.accent, letterSpacing: "0.06em" }}>CRUCIBLE</span>
      <span style={{ fontFamily: "var(--font-cinzel), serif", fontSize: 12, fontWeight: 600, color: C.goldLabel, letterSpacing: "0.08em" }}>RPG</span>
    </div>
  );
}

// ─── CONTINUE CARD ───
function ContinueCard({ game, sz, ff, onClick }) {
  const [h, setH] = useState(false);
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} onClick={onClick}
      className={styles.continueCard}
      style={{
        background: C.card, border: `1px solid ${h ? C.cardBorderHover : C.cardBorder}`,
        borderLeft: `3px solid ${C.accent}`,
        borderRadius: 12, padding: "36px 40px 40px", cursor: "pointer",
        transition: "all 0.3s ease", position: "relative", overflow: "hidden",
        boxShadow: h ? `0 8px 40px ${C.shadow}` : "none",
      }}>
      <div style={{
        position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%",
        background: `radial-gradient(circle, ${C.glow} 0%, transparent 70%)`,
        transition: "opacity 0.3s", opacity: h ? 1 : 0.4, pointerEvents: "none",
      }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{
            fontFamily: "var(--font-cinzel), serif", fontSize: sz.meta + 1, fontWeight: 600,
            color: C.accent, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8,
          }}>Continue Your Adventure</div>
          <div style={{ fontFamily: "var(--font-cinzel), serif", fontSize: Math.round(sz.heading * 1.25), fontWeight: 700, color: C.heading }}>
            {game.character?.name || game.setting}
          </div>
        </div>
        <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: sz.meta, color: C.muted, paddingTop: 4 }}>
          {formatTimeAgo(game.createdAt)}
        </div>
      </div>

      <div style={{ display: "flex", gap: 32, marginBottom: 24, flexWrap: "wrap" }}>
        {game.character?.name && (
          <div>
            <div style={{ fontFamily: "var(--font-cinzel), serif", fontSize: sz.meta, fontWeight: 600, color: C.goldLabel, letterSpacing: "0.14em", marginBottom: 4 }}>CHARACTER</div>
            <div style={{ fontFamily: ff, fontSize: sz.base + 1, color: C.text }}>{game.character.name}</div>
          </div>
        )}
        <div>
          <div style={{ fontFamily: "var(--font-cinzel), serif", fontSize: sz.meta, fontWeight: 600, color: C.goldLabel, letterSpacing: "0.14em", marginBottom: 4 }}>SETTING</div>
          <div style={{ fontFamily: ff, fontSize: sz.base + 1, color: C.text }}>{game.setting !== 'pending' ? game.setting : 'Not yet chosen'}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        {[
          game.storyteller !== 'pending' && ["Storyteller", game.storyteller],
          game.difficulty && ["Difficulty", game.difficulty],
          ["Status", game.status],
        ].filter(Boolean).map(([l, v], i) => (
          <div key={i} style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: sz.meta + 1 }}>
            <span style={{ color: C.goldLabel }}>{l}:</span>{" "}
            <span style={{ color: C.statVal, textTransform: 'capitalize' }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── NEW PLAYER HERO ───
function NewPlayerHero({ sz, ff, playerName, onBegin }) {
  const [btnH, setBtnH] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setTimeout(() => setLoaded(true), 150); }, []);

  return (
    <div style={{ textAlign: "center", padding: "80px 24px 60px", position: "relative" }}>
      <div style={{
        position: "absolute", width: 500, height: 500, borderRadius: "50%",
        background: `radial-gradient(circle, ${C.glow} 0%, transparent 60%)`,
        top: "45%", left: "50%", transform: "translate(-50%, -50%)", pointerEvents: "none",
      }} />

      <div style={{
        fontFamily: "var(--font-cinzel), serif", fontSize: "clamp(28px, 4vw, 38px)", fontWeight: 700,
        color: C.accent, letterSpacing: "0.04em", marginBottom: 16,
        opacity: loaded ? 1 : 0, transform: loaded ? "translateY(0)" : "translateY(16px)",
        transition: "all 1s cubic-bezier(0.16,1,0.3,1) 0.1s",
      }}>Welcome, {playerName}.</div>

      <p style={{
        fontFamily: "var(--font-alegreya), serif", fontSize: "clamp(18px, 2.5vw, 22px)",
        fontStyle: "italic", fontWeight: 500, color: "#9a9480",
        maxWidth: 400, lineHeight: 1.6, margin: "0 auto 44px",
        opacity: loaded ? 1 : 0, transform: loaded ? "translateY(0)" : "translateY(12px)",
        transition: "all 1s cubic-bezier(0.16,1,0.3,1) 0.25s",
      }}>Your first story is waiting.</p>

      <button onClick={onBegin} onMouseEnter={() => setBtnH(true)} onMouseLeave={() => setBtnH(false)}
        style={{
          fontFamily: "var(--font-cinzel), serif", fontSize: 15, fontWeight: 700,
          color: C.bg, letterSpacing: "0.1em",
          background: `linear-gradient(135deg, ${C.accent}, ${C.accentBright})`,
          border: "none", borderRadius: 6, padding: "18px 48px", cursor: "pointer",
          boxShadow: btnH ? `0 4px 30px ${C.accentGlow}` : "none",
          transform: btnH ? "translateY(-2px)" : "none",
          transition: "all 0.3s ease",
          opacity: loaded ? 1 : 0,
        }}>BEGIN YOUR STORY</button>
    </div>
  );
}

// ─── NEW GAME BUTTON ───
function NewGameButton({ sz, onClick }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        width: "100%", padding: "20px 0", borderRadius: 10, cursor: "pointer",
        fontFamily: "var(--font-cinzel), serif", fontSize: sz.base + 1, fontWeight: 700,
        letterSpacing: "0.08em", display: "flex", alignItems: "center",
        justifyContent: "center", gap: 10,
        background: h ? "rgba(201,168,76,0.06)" : "rgba(201,168,76,0.02)",
        border: `1px solid ${h ? C.cardBorderHover : C.cardBorder}`,
        color: h ? C.accentBright : C.accent,
        boxShadow: h ? `0 4px 24px ${C.shadow}` : "none",
        transform: h ? "translateY(-1px)" : "none",
        transition: "all 0.3s ease",
      }}>
      <span style={{ fontSize: 18, color: C.accentBright }}>{'\u2726'}</span> New Game
    </button>
  );
}

// ─── EXPANDABLE GAME ROW ───
function GameRow({ game, expanded, onToggle, sz, ff, onResume }) {
  const [h, setH] = useState(false);
  const [resumeH, setResumeH] = useState(false);
  const icon = SETTING_ICONS[game.setting] || '\u2694\uFE0F';

  return (
    <div>
      <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} onClick={onToggle}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px",
          background: h || expanded ? C.card : "transparent",
          borderRadius: expanded ? "8px 8px 0 0" : 8,
          cursor: "pointer", transition: "background 0.2s",
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: C.panel, border: `1px solid ${C.cardBorder}`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0,
          }}>{icon}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontFamily: ff, fontSize: sz.base, color: h || expanded ? C.heading : C.text,
              transition: "color 0.2s", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {game.character?.name || 'Unnamed'}{" "}
              <span style={{ color: C.goldLabel }}>in</span>{" "}
              {game.setting !== 'pending' ? game.setting : 'New World'}
            </div>
            <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: sz.meta, color: C.goldLabel, marginTop: 2 }}>
              {game.setting !== 'pending' ? game.setting : 'Setup'} {'\u00B7'} {game.difficulty || 'Standard'}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: sz.meta, color: C.muted }}>
            {formatTimeAgo(game.createdAt)}
          </div>
          <span style={{
            color: C.goldLabel, fontSize: 12, transition: "transform 0.2s",
            transform: expanded ? "rotate(180deg)" : "rotate(0)",
          }}>{'\u25BC'}</span>
        </div>
      </div>

      {expanded && (
        <div style={{
          background: C.panel, borderTop: `1px solid ${C.cardSep}`,
          padding: "18px 20px 18px 66px", borderRadius: "0 0 8px 8px",
        }}>
          <div style={{ display: "flex", gap: 20, marginBottom: 14, flexWrap: "wrap" }}>
            {game.storyteller && game.storyteller !== 'pending' && (
              <div>
                <div style={{ fontFamily: "var(--font-cinzel), serif", fontSize: sz.meta, fontWeight: 600, color: C.goldLabel, letterSpacing: "0.14em", marginBottom: 2 }}>STORYTELLER</div>
                <div style={{ fontFamily: ff, fontSize: sz.base - 1, color: C.text }}>{game.storyteller}</div>
              </div>
            )}
            <div>
              <div style={{ fontFamily: "var(--font-cinzel), serif", fontSize: sz.meta, fontWeight: 600, color: C.goldLabel, letterSpacing: "0.14em", marginBottom: 2 }}>DIFFICULTY</div>
              <div style={{ fontFamily: ff, fontSize: sz.base - 1, color: C.text }}>{game.difficulty || 'Standard'}</div>
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-cinzel), serif", fontSize: sz.meta, fontWeight: 600, color: C.goldLabel, letterSpacing: "0.14em", marginBottom: 2 }}>STATUS</div>
              <div style={{ fontFamily: ff, fontSize: sz.base - 1, color: C.text, textTransform: 'capitalize' }}>{game.status}</div>
            </div>
          </div>

          <button onClick={e => { e.stopPropagation(); onResume(); }}
            onMouseEnter={() => setResumeH(true)} onMouseLeave={() => setResumeH(false)}
            style={{
              padding: "10px 24px", borderRadius: 8, cursor: "pointer",
              fontFamily: "var(--font-cinzel), serif", fontSize: sz.base - 1, fontWeight: 600,
              background: resumeH ? C.glowHover : C.glow,
              border: `1px solid ${resumeH ? C.cardBorderHover : C.cardBorder}`,
              color: C.accent, transition: "all 0.2s",
            }}>Resume Game</button>
        </div>
      )}
    </div>
  );
}

// ─── DISPLAY SETTINGS MODAL ───
function DisplaySettings({ font, setFont, textSize, setTextSize, onClose, sz, ff }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: C.overlay, backdropFilter: "blur(4px)" }} />
      <div onClick={e => e.stopPropagation()} style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
        padding: "24px 28px", maxWidth: 460, width: "90%",
        position: "relative", zIndex: 1, maxHeight: "85vh", overflowY: "auto",
      }}>
        <h2 style={{ fontFamily: "var(--font-cinzel), serif", fontSize: sz.heading - 8, color: C.heading, marginBottom: 20, marginTop: 0 }}>
          Display Settings
        </h2>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontFamily: ff, fontSize: sz.base, color: C.secondary, display: "block", marginBottom: 8 }}>Font</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {FONT_OPTIONS.map(f => (
              <button key={f.id} onClick={() => setFont(f.id)} style={{
                padding: "8px 12px", cursor: "pointer", borderRadius: 6, textAlign: "left",
                border: `1px solid ${font === f.id ? C.accent : C.cardBorder}`,
                background: font === f.id ? C.panel : "transparent",
                fontFamily: f.family, fontSize: sz.base,
                color: font === f.id ? C.accent : C.text, transition: "all 0.2s",
              }}>{f.label}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 8 }}>
          <label style={{ fontFamily: ff, fontSize: sz.base, color: C.secondary, display: "block", marginBottom: 8 }}>Text Size</label>
          <div style={{ display: "flex", gap: 6 }}>
            {SIZE_OPTIONS.map(s => (
              <button key={s.id} onClick={() => setTextSize(s.id)} style={{
                flex: 1, padding: "8px 0", cursor: "pointer", borderRadius: 6,
                border: `1px solid ${textSize === s.id ? C.accent : C.cardBorder}`,
                background: textSize === s.id ? C.panel : "transparent",
                fontFamily: ff, fontSize: sz.base - 2,
                color: textSize === s.id ? C.accent : C.secondary, transition: "all 0.2s",
              }}>{s.label}</button>
            ))}
          </div>
        </div>

        <button onClick={onClose} style={{ position: "absolute", top: 12, right: 14,
          background: "none", border: "none", color: C.dim, fontSize: 16, cursor: "pointer" }}>{'\u2715'}</button>
      </div>
    </div>
  );
}

// ─── DIVIDER ───
function Divider() { return <div style={{ height: 1, background: C.cardSep, margin: "0 16px" }} />; }

// ─── MAIN PAGE ───
export default function MenuPage() {
  const router = useRouter();
  const [games, setGames] = useState(null); // null = loading
  const [playerName, setPlayerName] = useState('');
  const [font, setFont] = useState("lexie");
  const [textSize, setTextSize] = useState("medium");
  const [showSettings, setShowSettings] = useState(false);
  const [expandedGame, setExpandedGame] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [isPlaytester, setIsPlaytester] = useState(true); // optimistic default

  const sz = SIZE_OPTIONS.find(s => s.id === textSize) || SIZE_OPTIONS[1];
  const ff = (FONT_OPTIONS.find(f => f.id === font) || FONT_OPTIONS[0]).family;

  const [settingsH, setSettingsH] = useState(false);
  const [logoutH, setLogoutH] = useState(false);

  // Auth check + fetch games
  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/auth');
      return;
    }

    // Get display name and playtester flag from stored user profile
    const user = getUser();
    if (user) {
      setIsPlaytester(!!user.isPlaytester);
    }
    if (user?.displayName) {
      setPlayerName(user.displayName);
    } else {
      // Fallback: decode from JWT payload
      try {
        const token = localStorage.getItem('crucible_token');
        const payload = JSON.parse(atob(token.split('.')[1]));
        setPlayerName(payload.email?.split('@')[0] || 'Adventurer');
      } catch {
        setPlayerName('Adventurer');
      }
    }

    async function fetchGames() {
      try {
        const data = await get('/api/games');
        const sorted = (data.games || []).sort((a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setGames(sorted);
      } catch (err) {
        if (err.status === 401) {
          clearToken();
          router.replace('/auth');
          return;
        }
        setError('Failed to load games. Please try again.');
        setGames([]);
      }
    }

    fetchGames();
    setTimeout(() => setLoaded(true), 100);
  }, [router]);

  function handleLogout() {
    clearToken();
    router.push('/landing');
  }

  function navigateToGame(game) {
    if (game.status === 'active') {
      router.push(`/play?id=${game.id}`);
    } else {
      router.push(`/init?id=${game.id}`);
    }
  }

  // Loading state
  if (games === null) {
    return (
      <div style={{
        minHeight: '100vh', background: C.bg, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          fontFamily: "var(--font-alegreya), serif", fontSize: 18, fontStyle: 'italic',
          color: C.muted,
        }}>Loading...</div>
      </div>
    );
  }

  const hasGames = games.length > 0;
  const activeGame = hasGames ? games[0] : null;
  const otherGames = hasGames ? games.slice(1) : [];
  const initial = playerName.charAt(0).toUpperCase();

  return (
    <div className={styles.pageContainer} style={{
      minHeight: "100vh", background: C.bg, color: C.text,
      fontFamily: ff, fontSize: sz.base, position: "relative",
    }}>
      <ParticleField />

      <div className={styles.contentWrapper} style={{
        position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", padding: "0 32px", boxSizing: "border-box",
        opacity: loaded ? 1 : 0, transition: "opacity 0.6s",
      }}>

        {/* ─── NAV BAR ─── */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "18px 0", borderBottom: `1px solid ${C.cardSep}`, marginBottom: 32,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Wordmark />
            <div style={{
              fontFamily: "var(--font-jetbrains), monospace", fontSize: sz.meta - 1, color: C.muted,
              border: `1px solid ${C.cardBorder}`, borderRadius: 4, padding: "2px 7px",
            }}>EARLY ACCESS</div>
          </div>
          <AuthAvatar size={32} />
        </div>

        {/* ─── ERROR ─── */}
        {error && (
          <div style={{
            background: '#201416', border: '1px solid #5a3020', borderRadius: 6,
            padding: '10px 14px', marginBottom: 18,
            fontFamily: "var(--font-alegreya-sans), sans-serif", fontSize: 14, color: C.danger,
          }}>{error}</div>
        )}

        {/* ─── PLAYTESTER GATE ─── */}
        {!isPlaytester && (
          <div style={{
            background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 12,
            padding: "48px 40px", textAlign: "center", marginBottom: 32,
            animation: "fadeInUp 0.5s ease both",
          }}>
            <div style={{
              fontFamily: "var(--font-cinzel), serif", fontSize: 28, fontWeight: 700,
              color: C.accent, marginBottom: 16,
            }}>Account Created</div>
            <p style={{
              fontFamily: "var(--font-alegreya), serif", fontSize: 18, fontStyle: "italic",
              color: C.secondary, lineHeight: 1.7, maxWidth: 480, margin: "0 auto 20px",
            }}>Your account is pending playtester access.</p>
            <p style={{
              fontFamily: "var(--font-alegreya-sans), sans-serif", fontSize: 14,
              color: C.muted, lineHeight: 1.6, maxWidth: 400, margin: "0 auto",
            }}>
              Crucible RPG is in early access. Once your account is approved,
              you will be able to create and play games from here.
            </p>
          </div>
        )}

        {/* ─── HERO SECTION ─── */}
        {isPlaytester && <div style={{ position: "relative" }}>
          <div style={{
            position: "absolute", width: 600, height: 600, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(201,168,76,0.05) 0%, transparent 60%)",
            top: "30%", left: "50%", transform: "translate(-50%, -50%)", pointerEvents: "none",
          }} />

          {hasGames && (
            <div style={{
              fontFamily: "var(--font-alegreya), serif", fontSize: 22, fontStyle: "italic",
              fontWeight: 500, color: "#9a9480", textAlign: "center",
              marginBottom: 24, paddingTop: 28,
              animation: "fadeInUp 0.5s ease both",
            }}>Welcome back.</div>
          )}

          <div style={{ animation: "fadeInUp 0.5s ease 0.08s both", marginBottom: 28 }}>
            {hasGames
              ? <ContinueCard game={activeGame} sz={sz} ff={ff} onClick={() => navigateToGame(activeGame)} />
              : <NewPlayerHero sz={sz} ff={ff} playerName={playerName} onBegin={() => router.push('/init')} />
            }
          </div>

          {hasGames && (
            <div style={{ animation: "fadeInUp 0.5s ease 0.1s both", marginBottom: 40 }}>
              <NewGameButton sz={sz} onClick={() => router.push('/init')} />
            </div>
          )}
        </div>}

        {/* ─── OTHER SAVED GAMES ─── */}
        {isPlaytester && hasGames && otherGames.length > 0 && (
          <div style={{ animation: "fadeInUp 0.5s ease 0.2s both", marginBottom: 36 }}>
            <div style={{
              fontFamily: "var(--font-cinzel), serif", fontSize: sz.sub, fontWeight: 600,
              color: C.heading, marginBottom: 14,
            }}>
              Other Games
              <span style={{
                fontFamily: "var(--font-jetbrains), monospace", fontSize: sz.meta,
                color: C.goldLabel, marginLeft: 8,
              }}>({otherGames.length})</span>
            </div>
            <div style={{ background: C.panel, border: `1px solid ${C.cardBorder}`, borderRadius: 10, overflow: "hidden" }}>
              {otherGames.map((g, i) => (
                <div key={g.id}>
                  <GameRow game={g} expanded={expandedGame === g.id}
                    onToggle={() => setExpandedGame(expandedGame === g.id ? null : g.id)}
                    sz={sz} ff={ff} onResume={() => navigateToGame(g)} />
                  {i < otherGames.length - 1 && <Divider />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── FOOTER ─── */}
        <div style={{
          borderTop: `1px solid ${C.cardSep}`, padding: "20px 0 32px",
          display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
        }}>
          <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: sz.meta, color: C.footer }}>
            Crucible RPG {'\u00B7'} Early Access {'\u00B7'} v0.1.0
          </div>
          <div style={{ fontFamily: "var(--font-alegreya), serif", fontSize: sz.meta + 1, color: C.footer, fontStyle: "italic" }}>
            Every hero needs a crucible.
          </div>
        </div>
      </div>

    </div>
  );
}
