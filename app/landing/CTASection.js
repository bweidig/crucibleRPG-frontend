'use client';

import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/api';
import ScrollReveal from '@/components/ScrollReveal';
import styles from './page.module.css';

export default function CTASection() {
  const router = useRouter();
  const handleCTA = () => {
    router.push(getToken() ? '/menu' : '/auth');
  };

  return (
    <section className={styles.ctaSection} style={{ padding: '120px 24px 100px', textAlign: 'center', position: 'relative' }}>
      <div style={{
        position: 'absolute', width: 500, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201,168,76,0.04) 0%, transparent 65%)',
        top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none',
      }} />
      <ScrollReveal variant="fadeUpSlow">
        <h2 style={{
          fontFamily: 'var(--font-cinzel)', fontSize: 'clamp(26px, 3.5vw, 36px)',
          fontWeight: 700, color: 'var(--text-heading)', marginBottom: 18, position: 'relative',
        }}>Every Hero Needs a Crucible. Yours is waiting.</h2>
      </ScrollReveal>
      <ScrollReveal delay={0.1} variant="fadeUpSlow">
        <p style={{
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 18, fontWeight: 300,
          color: 'var(--text-dim)', lineHeight: 1.7, maxWidth: 500, margin: '0 auto 40px', position: 'relative',
        }}>No group required. No prep time. The engine knows the rules so you don't have to. Just you and a world that reacts to everything you do.</p>
      </ScrollReveal>
      <ScrollReveal delay={0.2} variant="fadeUpSlow">
        <button onClick={handleCTA} className={styles.ctaPrimary} style={{
          fontFamily: 'var(--font-cinzel)', fontSize: 16, fontWeight: 700, color: 'var(--bg-main)',
          background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-bright))',
          border: 'none', borderRadius: 6, padding: '18px 48px',
          cursor: 'pointer', letterSpacing: '0.1em', position: 'relative',
        }}>CREATE YOUR CHARACTER</button>
      </ScrollReveal>
    </section>
  );
}
