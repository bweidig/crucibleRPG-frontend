'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

const TIPS = [
  'Your stats come from your backstory. Who you are shapes what you can do.',
  'The dice favor the prepared. Build to your strengths and the odds follow.',
  'Injuries stick around. A broken arm doesn\'t heal between scenes.',
  'Weapons wear down with use. Take care of your gear.',
  'The AI gives you options, but you can always type your own action.',
  'Your storyteller shapes every word. You can switch them mid-game if the tone isn\'t right.',
  'Pack light. Carry too much and your body pays for it.',
  'A Natural 20 is always a critical success. No matter the odds.',
  'Food and water matter. Your body needs both to keep going.',
  'The world remembers what you do. Your choices ripple forward.',
];

const LORE_FRAGMENTS = [
  'Forging your world...',
  'Laying the foundations...',
  'Populating the streets...',
  'Drawing the map...',
  'Seeding rumors and secrets...',
  'Setting the stage...',
  'Sharpening the blades...',
  'Lighting the lanterns...',
  'Winding the clock...',
  'Your story begins...',
];

function ParticleField() {
  const [particles] = useState(() =>
    Array.from({ length: 25 }, (_, i) => ({
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
      {particles.map(p => (
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

function D20Icon({ size = 36, color = 'var(--accent-gold)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="2" y1="8.5" x2="22" y2="8.5" />
      <line x1="2" y1="15.5" x2="12" y2="22" />
      <line x1="22" y1="15.5" x2="12" y2="22" />
      <line x1="2" y1="8.5" x2="12" y2="2" />
      <line x1="22" y1="8.5" x2="12" y2="2" />
    </svg>
  );
}

function LoadingRing({ progress }) {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: 140, height: 140 }}>
      <svg width="140" height="140" style={{ transform: 'rotate(-90deg)', animation: 'ringPulse 3s ease-in-out infinite' }}>
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#16181e" strokeWidth="3" />
        <circle cx="70" cy="70" r={radius} fill="none" stroke="url(#goldGrad)" strokeWidth="3"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c9a84c" />
            <stop offset="50%" stopColor="#ddb84e" />
            <stop offset="100%" stopColor="#c9a84c" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        animation: 'd20Hover 4s ease-in-out infinite',
      }}>
        <D20Icon size={38} color="#6a5b33" />
      </div>
    </div>
  );
}

function LoadingScreenInner() {
  const searchParams = useSearchParams();
  const gameId = searchParams.get('gameId') || searchParams.get('id');
  const [progress, setProgress] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [loreIndex, setLoreIndex] = useState(0);
  const [tipFade, setTipFade] = useState(true);
  const [loreFade, setLoreFade] = useState(true);
  const [complete, setComplete] = useState(false);
  const prevLoreIndex = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) { clearInterval(interval); return 100; }
        const remaining = 100 - prev;
        const step = Math.max(0.3, remaining * 0.04 + Math.random() * 1.5);
        return Math.min(100, prev + step);
      });
    }, 120);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipFade(false);
      setTimeout(() => { setTipIndex(prev => (prev + 1) % TIPS.length); setTipFade(true); }, 400);
    }, 7500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const newIndex = Math.min(LORE_FRAGMENTS.length - 1, Math.floor(progress / (100 / LORE_FRAGMENTS.length)));
    if (newIndex !== prevLoreIndex.current) {
      prevLoreIndex.current = newIndex;
      setLoreFade(false);
      setTimeout(() => { setLoreIndex(newIndex); setLoreFade(true); }, 300);
    }
  }, [progress]);

  useEffect(() => {
    if (progress >= 100) setTimeout(() => setComplete(true), 800);
  }, [progress]);

  const summaryItems = [
    { label: 'Character', value: 'Kael Ashford' },
    { label: 'World', value: 'Sword & Soil' },
    { label: 'Voice', value: 'Chronicler' },
    { label: 'Difficulty', value: 'Standard' },
  ];

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      <ParticleField />

      <div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201,168,76,0.04) 0%, transparent 70%)',
        top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none',
      }} />

      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        animation: 'fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative', zIndex: 1,
      }}>
        {/* Character summary */}
        <div style={{
          display: 'flex', gap: 20, marginBottom: 44, flexWrap: 'wrap', justifyContent: 'center',
        }}>
          {summaryItems.map((item, i) => (
            <div key={i} style={{
              textAlign: 'center', padding: '0 20px',
              borderRight: i < 3 ? '1px solid var(--border-gold-faint)' : 'none',
            }}>
              <div style={{
                fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, fontWeight: 600,
                color: 'var(--text-dim)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 5,
              }}>{item.label}</div>
              <div style={{
                fontFamily: 'var(--font-cinzel)', fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)',
                maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Loading ring */}
        <LoadingRing progress={progress} />

        {/* Lore fragment */}
        <div style={{
          marginTop: 30, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontFamily: 'var(--font-alegreya)', fontSize: 18, fontStyle: 'italic',
            color: complete ? 'var(--accent-gold)' : 'var(--text-muted)',
            opacity: loreFade ? 1 : 0, transition: 'opacity 0.3s, color 0.5s',
            fontWeight: complete ? 600 : 400,
          }}>
            {complete ? 'Your story begins...' : LORE_FRAGMENTS[loreIndex]}
          </span>
        </div>

        {/* Progress percentage */}
        <div style={{
          marginTop: 10, fontFamily: 'var(--font-jetbrains)', fontSize: 13,
          color: 'var(--text-dim)', letterSpacing: '0.1em',
        }}>
          {Math.floor(progress)}%
        </div>

        {/* Enter button */}
        <div style={{
          marginTop: 36, height: 54,
          opacity: complete ? 1 : 0, transform: complete ? 'translateY(0)' : 'translateY(10px)',
          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          pointerEvents: complete ? 'auto' : 'none',
        }}>
          <Link href={gameId ? `/play?gameId=${gameId}` : '/menu'} className={complete ? styles.enterBtnShimmer : styles.enterBtn}>
            ENTER THE WORLD
          </Link>
        </div>

        {/* Tips */}
        <div style={{
          marginTop: 52, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          maxWidth: 540,
        }}>
          <div style={{
            width: 40, height: 1,
            background: 'linear-gradient(90deg, transparent, var(--border-gold-subtle), transparent)',
          }} />
          <div style={{
            fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, fontWeight: 600,
            color: 'var(--text-dim)', letterSpacing: '0.2em', textTransform: 'uppercase',
          }}>TIP</div>
          <div style={{
            textAlign: 'center', minHeight: 56,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <p style={{
              fontFamily: 'var(--font-alegreya-sans)', fontSize: 16, color: 'var(--text-muted)',
              lineHeight: 1.7, margin: 0, padding: '0 20px',
              opacity: tipFade ? 1 : 0, transition: 'opacity 0.4s',
            }}>
              {TIPS[tipIndex]}
            </p>
          </div>
        </div>
      </div>

      {/* Wordmark */}
      <div style={{
        position: 'absolute', top: 22, left: 24,
        display: 'flex', alignItems: 'baseline', gap: 8,
      }}>
        <Link href="/menu" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 22, fontWeight: 900, color: 'var(--accent-gold)', letterSpacing: '0.06em' }}>
            CRUCIBLE
          </span>
          <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 600, color: 'var(--gold-muted)', letterSpacing: '0.18em' }}>
            RPG
          </span>
        </Link>
      </div>
    </div>
  );
}

export default function LoadingScreen() {
  return (
    <Suspense fallback={null}>
      <LoadingScreenInner />
    </Suspense>
  );
}
