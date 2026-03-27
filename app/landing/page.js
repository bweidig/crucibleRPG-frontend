'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

const features = [
  { title: 'A Storyteller That Listens', desc: 'Choose your narrator\'s voice: epic, gritty, unsettling, playful. Step into a world that responds to every decision you make. No scripts. No rails. Just your choices and what happens next.' },
  { title: 'Real Mechanics Under the Hood', desc: 'Six core stats. Skills earned through play. Dice rolls resolved with tenth-decimal precision on the server. This isn\'t a chatbot pretending to be a game. It\'s a game engine wearing a storyteller\'s mask.' },
  { title: 'Any World. Any Genre.', desc: 'Swords and sorcery. Steam and revolution. Neon and chrome. Post-apocalyptic wastelands. Surreal dreamscapes. Pick a setting or build your own from scratch.' },
  { title: 'Consequences That Stick', desc: 'Injuries don\'t vanish between scenes. Gear degrades. Resources run out. NPCs remember how you treated them. The world moves forward whether you\'re ready or not.' },
];

const steps = [
  { num: '01', title: 'Choose Your World', desc: 'Swords and sorcery? Neon-lit dystopia? Something no one\'s built before? Pick a genre, answer a few questions to give it texture, or write the whole thing yourself. The world is yours to define.' },
  { num: '02', title: 'Create Your Character', desc: 'Describe who they are in your own words, answer a few guided questions, or grab a prefab and go. Your character\'s backstory shapes their stats, skills, and starting gear. Not a class dropdown.' },
  { num: '03', title: 'Play', desc: 'The AI narrates. You decide. A full tabletop engine handles stats, dice, inventory, conditions, and consequences behind the scenes. You just play.' },
  { num: '04', title: 'Your Story Unfolds', desc: 'Every session builds on the last. The world remembers your choices, tracks your reputation, and evolves around you. Share your story when you\'re ready. Or keep it yours.' },
];

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

function NavBar({ scrolled }) {
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      padding: '0 clamp(24px, 4vw, 56px)', height: 72,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: scrolled ? 'rgba(10, 14, 26, 0.94)' : 'transparent',
      backdropFilter: scrolled ? 'blur(16px)' : 'none',
      borderBottom: scrolled ? '1px solid var(--border-gold-faint)' : '1px solid transparent',
      transition: 'all 0.5s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 22, fontWeight: 900, color: 'var(--accent-gold)', letterSpacing: '0.06em' }}>CRUCIBLE</span>
        <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 600, color: 'var(--gold-muted)', letterSpacing: '0.18em' }}>RPG</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
        {['Features', 'How It Works', 'FAQ'].map((item) => (
          <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`} className={styles.navLink}>{item}</a>
        ))}
        <Link href="/auth" className={styles.navSignIn}>SIGN IN</Link>
      </div>
    </nav>
  );
}

function HeroSection() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setTimeout(() => setLoaded(true), 150); }, []);

  return (
    <section style={{
      position: 'relative', minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '120px 24px 80px',
    }}>
      <div style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201,168,76,0.05) 0%, transparent 60%)',
        top: '42%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none',
      }} />

      {/* Wordmark */}
      <div style={{
        opacity: loaded ? 1 : 0,
        transform: loaded ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
        marginBottom: 52, textAlign: 'center',
      }}>
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
        fontFamily: 'var(--font-alegreya)', fontSize: 'clamp(22px, 3.2vw, 30px)',
        fontStyle: 'italic', fontWeight: 500, color: '#9a9480',
        textAlign: 'center', maxWidth: 600, lineHeight: 1.7, marginBottom: 16,
        opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 1s cubic-bezier(0.16,1,0.3,1) 0.2s',
      }}>Your story. Your choices. No table required.</h1>

      {/* Sub-tagline */}
      <p style={{
        fontFamily: 'var(--font-alegreya-sans)', fontSize: 'clamp(16px, 2vw, 19px)',
        fontWeight: 300, color: 'var(--text-dim)', textAlign: 'center', maxWidth: 560,
        lineHeight: 1.7, marginBottom: 52,
        opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 1s cubic-bezier(0.16,1,0.3,1) 0.35s',
      }}>An AI-powered tabletop RPG with real mechanics, real consequences, and a world that remembers everything you do.</p>

      {/* CTAs */}
      <div style={{
        display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center',
        opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 1s cubic-bezier(0.16,1,0.3,1) 0.5s',
      }}>
        <button className={styles.ctaPrimary} style={{
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
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" style={{ padding: '100px clamp(24px, 5vw, 60px)', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 14, fontWeight: 600, color: 'var(--accent-gold)', letterSpacing: '0.25em' }}>FEATURES</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 28 }}>
        {features.map((f, i) => (
          <div key={i} style={{
            padding: '36px 32px', borderRadius: 8,
            border: '1px solid var(--border-gold-faint)',
            background: 'var(--bg-gold-faint)',
          }}>
            <h3 style={{
              fontFamily: 'var(--font-cinzel)', fontSize: 19, fontWeight: 700,
              color: 'var(--text-heading)', marginBottom: 14, lineHeight: 1.4,
            }}>{f.title}</h3>
            <p style={{
              fontFamily: 'var(--font-alegreya-sans)', fontSize: 17, fontWeight: 300,
              color: 'var(--text-muted)', lineHeight: 1.75,
            }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section id="how-it-works" style={{ padding: '100px clamp(24px, 5vw, 60px)', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 14, fontWeight: 600, color: 'var(--accent-gold)', letterSpacing: '0.25em' }}>HOW IT WORKS</span>
      </div>
      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute', left: 27, top: 28, bottom: 28, width: 1,
          background: 'linear-gradient(to bottom, var(--border-card-separator), var(--bg-gold-faint))',
        }} />
        {steps.map((step, i) => (
          <div key={i} style={{
            display: 'flex', gap: 32, alignItems: 'flex-start',
            marginBottom: i < steps.length - 1 ? 52 : 0, position: 'relative',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              border: '1px solid var(--border-card-separator)', background: 'var(--bg-main)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-cinzel)', fontSize: 16, fontWeight: 700,
              color: 'var(--accent-gold)', flexShrink: 0, position: 'relative', zIndex: 1,
            }}>{step.num}</div>
            <div style={{ paddingTop: 4 }}>
              <h3 style={{
                fontFamily: 'var(--font-cinzel)', fontSize: 22, fontWeight: 700,
                color: 'var(--text-heading)', marginBottom: 10,
              }}>{step.title}</h3>
              <p style={{
                fontFamily: 'var(--font-alegreya-sans)', fontSize: 17, fontWeight: 300,
                color: 'var(--text-muted)', lineHeight: 1.75,
              }}>{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section style={{ padding: '100px 24px 80px', textAlign: 'center', position: 'relative' }}>
      <div style={{
        position: 'absolute', width: 500, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201,168,76,0.04) 0%, transparent 65%)',
        top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none',
      }} />
      <h2 style={{
        fontFamily: 'var(--font-cinzel)', fontSize: 'clamp(26px, 3.5vw, 36px)',
        fontWeight: 700, color: 'var(--text-heading)', marginBottom: 18, position: 'relative',
      }}>Every Hero Needs a Crucible. Yours is waiting.</h2>
      <p style={{
        fontFamily: 'var(--font-alegreya-sans)', fontSize: 18, fontWeight: 300,
        color: 'var(--text-dim)', lineHeight: 1.7, maxWidth: 500, margin: '0 auto 40px', position: 'relative',
      }}>No group required. No prep time. The engine knows the rules so you don't have to. Just you and a world waiting to see what you'll do.</p>
      <button className={styles.ctaPrimary} style={{
        fontFamily: 'var(--font-cinzel)', fontSize: 16, fontWeight: 700, color: 'var(--bg-main)',
        background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-bright))',
        border: 'none', borderRadius: 6, padding: '18px 48px',
        cursor: 'pointer', letterSpacing: '0.1em', position: 'relative',
      }}>CREATE YOUR CHARACTER</button>
    </section>
  );
}

function ScrollFade() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const check = () => {
      const { scrollY, innerHeight } = window;
      const { scrollHeight } = document.documentElement;
      const atBottom = scrollY + innerHeight >= scrollHeight - 20;
      const hasScroll = scrollHeight > innerHeight + 20;
      setVisible(hasScroll && !atBottom);
    };
    check();
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check, { passive: true });
    return () => {
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, []);

  return <div className={styles.scrollFade} style={{ opacity: visible ? 1 : 0 }} />;
}

function Footer() {
  return (
    <footer style={{
      padding: '40px clamp(24px, 4vw, 56px) 36px',
      borderTop: '1px solid var(--border-gold-subtle)',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      maxWidth: 1200, margin: '0 auto', flexWrap: 'wrap', gap: 16,
    }}>
      <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 15, color: 'var(--gold-muted)', letterSpacing: '0.1em' }}>CRUCIBLE RPG</span>
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        {['FAQ', 'Help', 'Contact', 'Privacy', 'Terms'].map((link) => (
          <a key={link} href="#" className={styles.footerLink}>{link}</a>
        ))}
      </div>
    </footer>
  );
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)', position: 'relative' }}>
      <ParticleField />
      <NavBar scrolled={scrolled} />
      <ScrollFade />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection />
      <Footer />
    </div>
  );
}
