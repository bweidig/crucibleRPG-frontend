'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

// --- SVG ICONS ---
const Icons = {
  sword: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
      <path d="M13 19l6-6" /><path d="M16 16l4 4" />
      <path d="M19 21l2-2" />
    </svg>
  ),
  plus: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  book: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  gear: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  ),
  logout: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  clock: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
};

// --- MOCK DATA ---
const mockSave = {
  characterName: 'Kael Ashborne',
  setting: 'Smoke & Steel',
  storyteller: 'Bard',
  lastPlayed: '2 hours ago',
};

// --- PARTICLE FIELD ---
function ParticleField() {
  const [particles] = useState(() =>
    Array.from({ length: 35 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      duration: Math.random() * 12 + 8,
      delay: Math.random() * 8,
      opacity: Math.random() * 0.2 + 0.03,
    }))
  );

  return (
    <div className={styles.particleField}>
      {particles.map((p) => (
        <div key={p.id} className={styles.particle} style={{
          left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size,
          '--p-opacity': p.opacity, opacity: p.opacity,
          animationDuration: `${p.duration}s`,
          animationDelay: `${p.delay}s`,
        }} />
      ))}
    </div>
  );
}

// --- NEW PLAYER VIEW ---
function NewPlayerMenu() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setTimeout(() => setLoaded(true), 150); }, []);

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '80px 24px', position: 'relative', zIndex: 1,
    }}>
      {/* Subtle glow */}
      <div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201,168,76,0.05) 0%, transparent 60%)',
        top: '45%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none',
      }} />

      {/* Tagline */}
      <h1 style={{
        fontFamily: 'var(--font-alegreya)', fontSize: 'clamp(24px, 3.5vw, 32px)',
        fontStyle: 'italic', fontWeight: 500, color: '#9a9480',
        textAlign: 'center', maxWidth: 500, lineHeight: 1.6, marginBottom: 12,
        opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 1s cubic-bezier(0.16,1,0.3,1) 0.2s',
      }}>Your adventure awaits.</h1>

      <p style={{
        fontFamily: 'var(--font-alegreya-sans)', fontSize: 17, fontWeight: 300,
        color: 'var(--text-dim)', textAlign: 'center', maxWidth: 400, lineHeight: 1.7,
        marginBottom: 48,
        opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 1s cubic-bezier(0.16,1,0.3,1) 0.35s',
      }}>Create your character, choose your world, and step into a story only you can tell.</p>

      <Link href="/init" className={styles.btnPrimary} style={{
        fontFamily: 'var(--font-cinzel)', fontSize: 15, fontWeight: 700,
        color: 'var(--bg-main)', letterSpacing: '0.1em',
        background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-bright))',
        border: 'none', borderRadius: 6, padding: '18px 48px',
        textDecoration: 'none',
        opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 1s cubic-bezier(0.16,1,0.3,1) 0.5s',
      }}>BEGIN YOUR STORY</Link>
    </div>
  );
}

// --- RETURNING PLAYER VIEW ---
function ReturningPlayerMenu({ save }) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setTimeout(() => setLoaded(true), 150); }, []);

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '80px 24px', position: 'relative', zIndex: 1,
      gap: 0,
    }}>
      {/* Subtle glow */}
      <div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201,168,76,0.05) 0%, transparent 60%)',
        top: '42%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none',
      }} />

      {/* Welcome back */}
      <p style={{
        fontFamily: 'var(--font-alegreya)', fontSize: 20, fontStyle: 'italic',
        fontWeight: 500, color: 'var(--text-muted)', marginBottom: 36,
        opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(12px)',
        transition: 'all 1s cubic-bezier(0.16,1,0.3,1) 0.1s',
      }}>Welcome back.</p>

      {/* Continue card */}
      <Link
        href="/play"
        className={styles.continueCard}
        style={{
          background: 'rgba(201,168,76,0.03)',
          border: '1px solid rgba(201,168,76,0.12)',
          borderRadius: 10, padding: '36px 44px',
          maxWidth: 420, width: '100%',
          textAlign: 'center', position: 'relative',
          textDecoration: 'none', color: 'inherit', display: 'block',
          opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 1s cubic-bezier(0.16,1,0.3,1) 0.2s',
        }}
      >
        {/* Character name */}
        <div style={{
          fontFamily: 'var(--font-cinzel)', fontSize: 24, fontWeight: 700,
          color: 'var(--text-heading)', letterSpacing: '0.04em', marginBottom: 16,
        }}>{save.characterName}</div>

        {/* Details row */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 24,
          marginBottom: 20, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{
              fontFamily: 'var(--font-cinzel)', fontSize: 11, fontWeight: 600,
              color: 'var(--gold-muted)', letterSpacing: '0.15em',
            }}>SETTING</span>
            <span style={{
              fontFamily: 'var(--font-alegreya-sans)', fontSize: 15,
              fontWeight: 500, color: 'var(--text-secondary)',
            }}>{save.setting}</span>
          </div>
          <div style={{
            width: 1, height: 32, background: 'rgba(201,168,76,0.1)',
          }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{
              fontFamily: 'var(--font-cinzel)', fontSize: 11, fontWeight: 600,
              color: 'var(--gold-muted)', letterSpacing: '0.15em',
            }}>STORYTELLER</span>
            <span style={{
              fontFamily: 'var(--font-alegreya-sans)', fontSize: 15,
              fontWeight: 500, color: 'var(--text-secondary)',
            }}>{save.storyteller}</span>
          </div>
        </div>

        {/* Last played */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 6, marginBottom: 24, color: 'var(--text-dim)',
        }}>
          {Icons.clock}
          <span style={{
            fontFamily: 'var(--font-alegreya-sans)', fontSize: 13,
            fontWeight: 400,
          }}>{save.lastPlayed}</span>
        </div>

        {/* Continue button */}
        <div
          className={styles.btnPrimary}
          style={{
            fontFamily: 'var(--font-cinzel)', fontSize: 14, fontWeight: 700,
            color: 'var(--bg-main)', letterSpacing: '0.1em',
            background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-bright))',
            border: 'none', borderRadius: 5, padding: '14px 44px',
            width: '100%', textAlign: 'center',
          }}
        >CONTINUE</div>
      </Link>

      {/* Secondary actions */}
      <div style={{
        display: 'flex', gap: 16, marginTop: 28, flexWrap: 'wrap', justifyContent: 'center',
        opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 1s cubic-bezier(0.16,1,0.3,1) 0.4s',
      }}>
        <Link
          href="/init"
          className={styles.btnSecondary}
          style={{
            fontFamily: 'var(--font-cinzel)', fontSize: 13, fontWeight: 600,
            color: 'var(--text-muted)', letterSpacing: '0.08em',
            background: 'transparent', border: '1px solid rgba(201,168,76,0.15)',
            borderRadius: 5, padding: '12px 32px',
            display: 'flex', alignItems: 'center', gap: 10,
            textDecoration: 'none',
          }}
        >
          <span style={{ color: 'var(--gold-muted)' }}>{Icons.plus}</span>
          NEW GAME
        </Link>
        <button
          className={styles.btnSecondary}
          onClick={() => console.log('Open saved games list')}
          style={{
            fontFamily: 'var(--font-cinzel)', fontSize: 13, fontWeight: 600,
            color: 'var(--text-muted)', letterSpacing: '0.08em',
            background: 'transparent', border: '1px solid rgba(201,168,76,0.15)',
            borderRadius: 5, padding: '12px 32px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}
        >
          <span style={{ color: 'var(--gold-muted)' }}>{Icons.book}</span>
          SAVED GAMES
        </button>
      </div>
    </div>
  );
}

// --- MAIN EXPORT ---
export default function MainMenuPage() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const hasExistingSave = true;

  useEffect(() => { setTimeout(() => setLoaded(true), 100); }, []);

  const handleLogOut = () => {
    router.push('/');
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)',
      position: 'relative', display: 'flex', flexDirection: 'column',
    }}>
      <ParticleField />

      {/* Top bar — wordmark + utility links */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '24px clamp(24px, 4vw, 56px)',
        position: 'relative', zIndex: 1,
        opacity: loaded ? 1 : 0,
        transition: 'opacity 0.8s ease 0.1s',
      }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{
            fontFamily: 'var(--font-cinzel)', fontSize: 22, fontWeight: 900,
            color: 'var(--accent-gold)', letterSpacing: '0.06em',
          }}>CRUCIBLE</span>
          <span style={{
            fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 600,
            color: 'var(--gold-muted)', letterSpacing: '0.18em',
          }}>RPG</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <button className={styles.menuLink}>
            {Icons.gear} Settings
          </button>
          <button className={styles.menuLink} onClick={handleLogOut}>
            {Icons.logout} Log Out
          </button>
        </div>
      </div>

      {/* Main content area */}
      {hasExistingSave ? (
        <ReturningPlayerMenu save={mockSave} />
      ) : (
        <NewPlayerMenu />
      )}

      {/* Footer */}
      <footer style={{
        padding: '24px clamp(24px, 4vw, 56px)',
        textAlign: 'center', position: 'relative', zIndex: 1,
      }}>
        <span style={{
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 14,
          color: 'var(--gold-footer)', letterSpacing: '0.04em',
        }}>&copy; 2026 CrucibleRPG &middot; Every hero needs a crucible.</span>
      </footer>
    </div>
  );
}
