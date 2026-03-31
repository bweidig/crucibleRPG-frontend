'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getToken } from '@/lib/api';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import ParticleField from '@/components/ParticleField';
import styles from './page.module.css';

const features = [
  { title: 'A Storyteller That Listens', desc: 'Pick your narrator\'s voice: epic, gritty, unsettling, wry. Step into a world that responds to every decision. No scripts. No rails. Just your choices and what follows.' },
  { title: 'Real Mechanics Under the Hood', desc: 'Six core stats. Skills earned through play. Dice rolls resolved with tenth-decimal precision on the server. This isn\'t a chatbot pretending to be a game. It\'s a game engine wearing a storyteller\'s mask.' },
  { title: 'Any World. Any Genre.', desc: 'Swords and sorcery. Steam and revolution. Neon and chrome. Post-apocalyptic wastelands. Surreal dreamscapes. Pick a setting or build one from scratch.' },
  { title: 'Consequences That Stick', desc: 'Injuries don\'t vanish between scenes. Gear degrades. Resources run out. NPCs remember how you treated them. The world keeps moving whether you\'re ready or not.' },
];

const steps = [
  { num: '01', title: 'Choose Your World', desc: 'Swords and sorcery? Neon-lit dystopia? Something no one\'s built before? Pick a genre, answer a few questions to give it texture, or write the whole thing yourself. The world is yours to define.' },
  { num: '02', title: 'Create Your Character', desc: 'Describe who they are in your own words, answer a few guided questions, or grab a prefab and go. Your character\'s backstory shapes their stats, skills, and starting gear. Not a class dropdown.' },
  { num: '03', title: 'Play', desc: 'The AI narrates. You decide. A full tabletop engine handles stats, dice, inventory, conditions, and consequences behind the scenes. You just play.' },
  { num: '04', title: 'Your Story Unfolds', desc: 'Every session builds on the last. The world remembers your choices, tracks your reputation, and evolves around you. No two playthroughs are the same.' },
];

const faqItems = [
  { q: 'Is this just a chatbot?', a: 'No. There\'s a real game engine running server-side with six core stats, skill progression, equipment with durability, and dice rolls resolved to tenth-decimal precision. The AI writes the story. The server runs the game.' },
  { q: 'Can I really do anything?', a: 'You can try anything. The three suggested actions each turn are starting points, not limits. Type your own and the system figures out which stats apply, sets a difficulty, and rolls. There is no script to go off of.' },
  { q: 'Do I need to know tabletop RPG rules?', a: 'Not at all. The engine handles every rule automatically. You just describe what your character does. The Rulebook is there if you\'re curious, but you never need to open it.' },
  { q: 'Is there a free trial?', a: 'Yes. No credit card required. You get enough turns to create a character, build a world, and play through several scenes.' },
];


function ScrollChevron({ loaded }) {
  const [scrolledPast, setScrolledPast] = useState(false);
  const [appeared, setAppeared] = useState(false);

  useEffect(() => {
    if (loaded && !appeared) {
      const timer = setTimeout(() => setAppeared(true), 800);
      return () => clearTimeout(timer);
    }
  }, [loaded, appeared]);

  useEffect(() => {
    const handleScroll = () => setScrolledPast(window.scrollY > 100);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isVisible = appeared && !scrolledPast;

  return (
    <button
      className={styles.scrollChevron}
      onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
      aria-label="Scroll to features"
      style={{
        opacity: isVisible ? 0.4 : 0,
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      <svg viewBox="0 0 24 12" width={28} height={14} style={{ display: 'block' }}>
        <path d="M2 2 L12 10 L22 2" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
    </button>
  );
}

function HeroSection() {
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();
  useEffect(() => { setTimeout(() => setLoaded(true), 150); }, []);

  const handleCTA = () => {
    router.push(getToken() ? '/menu' : '/auth');
  };

  return (
    <section className={styles.heroSection} style={{
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
      }}>A solo tabletop RPG powered by AI. Real mechanics, real consequences, and a world that remembers everything you do.</p>

      {/* CTAs */}
      <div style={{
        display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center',
        opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 1s cubic-bezier(0.16,1,0.3,1) 0.5s',
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

      {/* Scroll chevron */}
      <ScrollChevron loaded={loaded} />
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className={styles.featuresSection} style={{ padding: '100px clamp(24px, 5vw, 60px)', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 14, fontWeight: 600, color: 'var(--accent-gold)', letterSpacing: '0.25em' }}>FEATURES</span>
      </div>
      <div className={styles.featuresGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 28 }}>
        {features.map((f, i) => (
          <div key={i} className={styles.featureCard} style={{
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
    <section id="how-it-works" className={styles.howSection} style={{ padding: '100px clamp(24px, 5vw, 60px)', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 14, fontWeight: 600, color: 'var(--accent-gold)', letterSpacing: '0.25em' }}>HOW IT WORKS</span>
      </div>
      <div style={{ position: 'relative' }}>
        <div className={styles.stepLine} style={{
          position: 'absolute', left: 27, top: 28, bottom: 28, width: 1,
          background: 'linear-gradient(to bottom, var(--border-card-separator), var(--bg-gold-faint))',
        }} />
        {steps.map((step, i) => (
          <div key={i} className={styles.stepItem} style={{
            display: 'flex', gap: 32, alignItems: 'flex-start',
            marginBottom: i < steps.length - 1 ? 52 : 0, position: 'relative',
          }}>
            <div className={styles.stepCircle} style={{
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

function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section id="faq" style={{ padding: '100px clamp(24px, 5vw, 60px)', maxWidth: 700, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 14, fontWeight: 600, color: 'var(--accent-gold)', letterSpacing: '0.25em' }}>FAQ</span>
      </div>
      <div>
        {faqItems.map((item, i) => (
          <div key={i}>
            <button
              className={styles.faqQuestion}
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
            >
              <span style={{
                fontFamily: 'var(--font-cinzel)', fontSize: 17, fontWeight: 600,
                color: 'var(--text-heading)', transition: 'color 0.2s ease',
              }}>{item.q}</span>
              <svg
                className={styles.faqChevron}
                width={14} height={14} viewBox="0 0 14 14"
                style={{ transform: openIndex === i ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                <polyline points="2,5 7,10 12,5" fill="none" stroke="#7082a4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div
              className={styles.faqAnswer}
              style={{
                maxHeight: openIndex === i ? 300 : 0,
                opacity: openIndex === i ? 1 : 0,
                padding: openIndex === i ? '0 0 20px' : '0',
              }}
            >
              <p style={{
                fontFamily: 'var(--font-alegreya-sans)', fontSize: 17, fontWeight: 300,
                color: 'var(--text-muted)', lineHeight: 1.75,
              }}>{item.a}</p>
            </div>
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <Link href="/faq" className={styles.faqSeeAll}>See all questions &rarr;</Link>
      </div>
    </section>
  );
}

function CTASection() {
  const router = useRouter();
  const handleCTA = () => {
    router.push(getToken() ? '/menu' : '/auth');
  };

  return (
    <section className={styles.ctaSection} style={{ padding: '100px 24px 80px', textAlign: 'center', position: 'relative' }}>
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
      }}>No group required. No prep time. The engine knows the rules so you don't have to. Just you and a world that reacts to everything you do.</p>
      <button onClick={handleCTA} className={styles.ctaPrimary} style={{
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


export default function LandingPage() {
  return (
    <div className={styles.pageContainer} style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)', position: 'relative' }}>
      <ParticleField />
      <NavBar variant="landing" />
      <ScrollFade />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
}
