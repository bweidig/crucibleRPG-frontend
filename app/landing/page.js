import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import ParticleField from '@/components/ParticleField';
import ScrollReveal from '@/components/ScrollReveal';
import HeroSection from './HeroSection';
import FAQSection from './FAQSection';
import CTASection from './CTASection';
import ScrollFade from './ScrollFade';
import styles from './page.module.css';

const features = [
  { title: 'A Storyteller That Listens', epigraph: 'You chose cruelty. The story noticed.', desc: 'Pick your narrator\'s voice: epic, gritty, unsettling, wry. Step into a world that responds to every decision. No scripts. No rails. Just your choices and what follows.' },
  { title: 'Real Mechanics Under the Hood', epigraph: 'The dice don\u2019t care about your backstory.', desc: 'Six core stats. Skills earned through play. Dice rolls resolved with tenth-decimal precision on the server. This isn\'t a chatbot pretending to be a game. It\'s a game engine wearing a storyteller\'s mask.' },
  { title: 'Any World. Any Genre.', epigraph: 'The factory bells haven\u2019t rung since the uprising.', desc: 'Swords and sorcery. Steam and revolution. Neon and chrome. Post-apocalyptic wastelands. Surreal dreamscapes. Pick a setting or build one from scratch.' },
  { title: 'Consequences That Stick', epigraph: 'He let you go. It won\u2019t happen again.', desc: 'Injuries don\'t vanish between scenes. Gear degrades. Resources run out. NPCs remember how you treated them. The world keeps moving whether you\'re ready or not.' },
];

const steps = [
  { num: '01', title: 'Choose Your World', desc: 'Swords and sorcery? Neon-lit dystopia? Something no one\'s built before? Pick a genre, answer a few questions to give it texture, or write the whole thing yourself. The world is yours to define.' },
  { num: '02', title: 'Create Your Character', desc: 'Describe who they are in your own words, answer a few guided questions, or grab a prefab and go. Your character\'s backstory shapes their stats, skills, and starting gear. Not a class dropdown.' },
  { num: '03', title: 'Play', desc: 'The AI narrates. You decide. A full tabletop engine handles stats, dice, inventory, conditions, and consequences behind the scenes. You just play.' },
  { num: '04', title: 'Your Story Unfolds', desc: 'Every session builds on the last. The world remembers your choices, tracks your reputation, and evolves around you. No two playthroughs are the same.' },
];

function FeaturesSection() {
  return (
    <section id="features" className={styles.featuresSection} style={{ padding: '120px clamp(24px, 5vw, 60px) 100px', maxWidth: 1000, margin: '0 auto', scrollMarginTop: 96 }}>
      <ScrollReveal>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 14, fontWeight: 600, color: 'var(--accent-gold)', letterSpacing: '0.25em' }}>FEATURES</span>
        </div>
      </ScrollReveal>
      <div className={styles.featuresGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 40 }}>
        {features.map((f, i) => (
          <ScrollReveal key={i} delay={i * 0.15} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className={styles.featureCard} style={{
              padding: '36px 32px', borderRadius: 8,
              border: '1px solid var(--border-primary)',
              background: 'var(--bg-card)', flex: 1,
            }}>
              <p style={{
                fontFamily: 'var(--font-alegreya)', fontSize: 16, fontStyle: 'italic', fontWeight: 400,
                color: 'var(--accent-gold)', lineHeight: 1.6, marginBottom: 14,
              }}>{f.epigraph}</p>
              <h3 style={{
                fontFamily: 'var(--font-cinzel)', fontSize: 27, fontWeight: 700,
                marginBottom: 14, lineHeight: 1.4,
              }}>{f.title}</h3>
              <p style={{
                fontFamily: 'var(--font-alegreya-sans)', fontSize: 17, fontWeight: 300,
                color: 'var(--text-muted)', lineHeight: 1.75,
              }}>{f.desc}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section id="how-it-works" className={styles.howSection} style={{ padding: '80px clamp(24px, 5vw, 60px) 80px', maxWidth: 800, margin: '0 auto', scrollMarginTop: 96 }}>
      <ScrollReveal>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 14, fontWeight: 600, color: 'var(--accent-gold)', letterSpacing: '0.25em' }}>HOW IT WORKS</span>
        </div>
      </ScrollReveal>
      <div style={{ position: 'relative' }}>
        <div className={styles.stepLine} style={{
          position: 'absolute', left: 27, top: 28, bottom: 28, width: 2,
          background: 'linear-gradient(to bottom, var(--border-card-separator), var(--bg-gold-faint))',
          boxShadow: '0 0 8px rgba(201,168,76,0.1)',
        }} />
        {steps.map((step, i) => (
          <ScrollReveal key={i} delay={i * 0.12} variant="fadeLeft">
            <div className={styles.stepItem} style={{
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
                  fontFamily: 'var(--font-cinzel)', fontSize: 24, fontWeight: 700,
                  marginBottom: 10,
                }}>{step.title}</h3>
                <p style={{
                  fontFamily: 'var(--font-alegreya-sans)', fontSize: 17, fontWeight: 300,
                  color: 'var(--text-muted)', lineHeight: 1.75,
                }}>{step.desc}</p>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
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
