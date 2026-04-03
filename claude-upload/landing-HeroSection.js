'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/api';
import styles from './page.module.css';

function ScrollChevron({ heroStage }) {
  const [scrolledPast, setScrolledPast] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolledPast(window.scrollY > 100);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isVisible = heroStage >= 5 && !scrolledPast;

  return (
    <button
      className={styles.scrollChevron}
      onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
      aria-label="Scroll to features"
      style={{
        opacity: isVisible ? 0.4 : 0,
        pointerEvents: isVisible ? 'auto' : 'none',
        transition: 'opacity 0.5s ease',
      }}
    >
      <svg viewBox="0 0 24 12" width={28} height={14} style={{ display: 'block' }}>
        <path d="M2 2 L12 10 L22 2" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
    </button>
  );
}

export default function HeroSection() {
  const [heroStage, setHeroStage] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const timers = [
      setTimeout(() => setHeroStage(1), 80),
      setTimeout(() => setHeroStage(2), 320),
      setTimeout(() => setHeroStage(3), 520),
      setTimeout(() => setHeroStage(4), 680),
      setTimeout(() => setHeroStage(5), 900),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const heroConfigs = [
    null,
    { dist: 24, dur: 0.7,  opDur: 0.5,  ease: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    { dist: 18, dur: 0.6,  opDur: 0.4,  ease: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    { dist: 12, dur: 0.5,  opDur: 0.35, ease: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    { dist: 8,  dur: 0.45, opDur: 0.3,  ease: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    { dist: 6,  dur: 0.5,  opDur: 0.35, ease: 'cubic-bezier(0.22, 1, 0.36, 1)' },
  ];

  const heroStyle = (stage) => {
    const cfg = heroConfigs[stage];
    return {
      opacity: heroStage >= stage ? 1 : 0,
      transform: heroStage >= stage ? 'translateY(0)' : `translateY(${cfg.dist}px)`,
      transition: `opacity ${cfg.opDur}s ${cfg.ease}, transform ${cfg.dur}s ${cfg.ease}`,
    };
  };

  const handleCTA = () => {
    router.push(getToken() ? '/menu' : '/auth');
  };

  return (
    <section className={styles.heroSection} style={{
      position: 'relative', minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '120px 24px 48px',
    }}>
      <div style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201,168,76,0.05) 0%, transparent 60%)',
        top: '42%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none',
      }} />

      {/* Wordmark */}
      <div style={{ ...heroStyle(1), marginBottom: 52, textAlign: 'center' }}>
        <div style={{
          fontFamily: 'var(--font-cinzel)', fontSize: 'clamp(52px, 8vw, 80px)', fontWeight: 900,
          color: 'var(--accent-gold)', letterSpacing: '0.08em', lineHeight: 1,
        }}>CRUCIBLE</div>
        <div style={{
          fontFamily: 'var(--font-cinzel)', fontSize: 'clamp(14px, 2.2vw, 20px)', fontWeight: 600,
          color: 'var(--gold-muted)', letterSpacing: '0.5em', marginTop: 8,
        }}>RPG</div>
      </div>

      {/* Tagline */}
      <h1 style={{
        fontFamily: 'var(--font-alegreya)', fontSize: 'clamp(24px, 3.5vw, 36px)',
        fontStyle: 'italic', fontWeight: 500, color: '#b0a480',
        textAlign: 'center', maxWidth: 600, lineHeight: 1.7, marginBottom: 16,
        ...heroStyle(2),
      }}>Your story. Your choices. No table required.</h1>

      {/* Sub-tagline */}
      <p style={{
        fontFamily: 'var(--font-alegreya-sans)', fontSize: 'clamp(16px, 2vw, 18px)',
        fontWeight: 300, color: 'var(--text-dim)', textAlign: 'center', maxWidth: 560,
        lineHeight: 1.7, marginBottom: 52,
        ...heroStyle(3),
      }}>A solo tabletop RPG powered by AI. Real mechanics, real consequences, and a world that remembers everything you do.</p>

      {/* CTAs */}
      <div style={{
        display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center',
        ...heroStyle(4),
      }}>
        <button onClick={handleCTA} className={styles.ctaPrimary} style={{
          fontFamily: 'var(--font-cinzel)', fontSize: 15, fontWeight: 700, color: 'var(--bg-main)',
          background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-bright))',
          border: 'none', borderRadius: 6, padding: '16px 40px',
          cursor: 'pointer', letterSpacing: '0.1em',
        }}>START YOUR ADVENTURE</button>
        <a href="#how-it-works" style={{ textDecoration: 'none' }}>
          <button className={styles.ctaSecondary} style={{
            fontFamily: 'var(--font-cinzel)', fontSize: 15, fontWeight: 600, color: 'var(--accent-gold)',
            background: 'transparent', border: '1px solid var(--border-card)',
            borderRadius: 6, padding: '16px 40px', cursor: 'pointer', letterSpacing: '0.1em',
          }}>SEE HOW IT WORKS</button>
        </a>
      </div>

      <ScrollChevron heroStage={heroStage} />
    </section>
  );
}
