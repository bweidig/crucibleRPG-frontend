import Link from 'next/link';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import ParticleField from '@/components/ParticleField';
import ScrollReveal from '@/components/ScrollReveal';
import FAQContent from './FAQContent';
import styles from './page.module.css';

export default function FAQPage() {
  return (
    <div className={styles.pageContainer} style={{
      minHeight: '100vh',
      background: 'var(--bg-main)',
      color: 'var(--text-primary)',
      position: 'relative', paddingTop: 72,
    }}>
      <ParticleField />
      <NavBar currentPage="faq" />

      {/* Header */}
      <ScrollReveal>
        <div style={{
          textAlign: 'center',
          padding: '48px 24px 12px',
          position: 'relative', zIndex: 1,
        }}>
          <div style={{
            fontFamily: 'var(--font-cinzel)',
            fontSize: 14, fontWeight: 600,
            color: '#c9a84c',
            letterSpacing: '0.25em',
            marginBottom: 16,
          }}>FAQ</div>
          <h1 style={{
            fontFamily: 'var(--font-alegreya)',
            fontSize: 'clamp(22px, 3vw, 28px)',
            fontWeight: 500,
            fontStyle: 'italic',
            color: '#d0c098',
            letterSpacing: '0.02em',
            marginBottom: 12,
            marginTop: 0,
          }}>Questions adventurers ask before the journey begins.</h1>
          <p style={{
            fontFamily: 'var(--font-alegreya-sans)',
            fontSize: 15, fontWeight: 400,
            color: '#8a94a8',
            maxWidth: 460, margin: '0 auto',
          }}>Everything you need to know about the game, your characters, and how it all works.</p>
        </div>
      </ScrollReveal>

      {/* Interactive FAQ (client component) */}
      <FAQContent />

      {/* Bottom CTA */}
      <div style={{
        textAlign: 'center',
        padding: '60px 24px 80px',
        position: 'relative', zIndex: 1,
      }}>
        <h2 style={{
          fontFamily: 'var(--font-cinzel)',
          fontSize: 'clamp(22px, 3vw, 28px)',
          fontWeight: 700,
          color: '#d0c098',
          letterSpacing: '0.04em',
          marginBottom: 16,
          marginTop: 0,
        }}>Ready to begin?</h2>
        <p style={{
          fontFamily: 'var(--font-alegreya)',
          fontSize: 'clamp(16px, 2vw, 18px)',
          fontStyle: 'italic', fontWeight: 500,
          color: '#8a94a8',
          maxWidth: 400, margin: '0 auto 36px', lineHeight: 1.6,
        }}>No group required. No prep time. Just you and a world waiting to see what you will do.</p>
        <Link href="/auth">
          <button
            className={styles.btnPrimary}
            style={{
              fontFamily: 'var(--font-cinzel)', fontSize: 15, fontWeight: 700,
              color: 'var(--bg-main)', letterSpacing: '0.1em',
              background: 'linear-gradient(135deg, #c9a84c, #ddb84e)',
              border: 'none', borderRadius: 6, padding: '16px 44px',
              cursor: 'pointer',
            }}
          >START YOUR ADVENTURE</button>
        </Link>
      </div>

      <Footer />
    </div>
  );
}
