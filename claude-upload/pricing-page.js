'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getUser } from '@/lib/api';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import ParticleField from '@/components/ParticleField';
import ScrollReveal from '@/components/ScrollReveal';
import styles from './page.module.css';

// --- PRICING CONFIG ---

const PRICING = {
  trial: {
    turns: '25',
    label: 'Free Trial',
  },
  subscription: {
    price: '9.99',
    turns: '225',
    label: 'Hero',
  },
  topups: [
    { turns: '25', price: '1.49' },
    { turns: '50', price: '2.49' },
    { turns: '100', price: '4.49' },
  ],
};

const FAQ_ITEMS = [
  {
    q: "What's a turn?",
    a: 'One turn is one action in the game. You describe what your character does, the engine resolves it, and the storyteller narrates what happens next. Combat, exploration, conversation: each one is a turn.',
  },
  {
    q: 'Do unused turns roll over?',
    a: 'Your monthly subscription turns reset on your billing date — use them or lose them. Top-up pack turns are yours to keep. They never expire and stack on top of your monthly allotment.',
  },
  {
    q: 'What counts as a world creation?',
    a: 'Starting a new campaign creates a new world. You get 5 per month with your subscription, more than most players will ever need. If you want more, additional creations cost a few turns from your monthly allotment.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel whenever you want. No contracts, no cancellation fees. Your subscription runs until the end of your current billing period.',
  },
  {
    q: 'Do I lose my saves if I cancel?',
    a: 'No. Your campaigns are yours. If you resubscribe later, everything will be right where you left it.',
  },
  {
    q: 'Does the free trial carry over?',
    a: 'Yes. Anything you create during the free trial (your character, your world, your progress) stays with your account. Subscribe and pick up right where you left off.',
  },
  {
    q: 'Is every feature available on every plan?',
    a: 'Yes. There are no locked storytellers, settings, or features. Everyone gets the same game.',
  },
];

// --- CHECK ICON ---

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// --- FEATURE LIST ITEM ---

function Feature({ text }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 14 }}>
      <Check />
      <span style={{
        fontFamily: 'var(--font-alegreya-sans)', fontSize: 16,
        fontWeight: 400, color: 'var(--text-secondary)', lineHeight: 1.5,
      }}>{text}</span>
    </div>
  );
}

// --- MAIN ---

export default function PricingPage() {
  const router = useRouter();
  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/auth'); return; }
    const user = getUser();
    if (user && !user.isPlaytester) { router.replace('/'); return; }
  }, [router]);

  return (
    <div className={styles.pageContainer} style={{
      minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)',
      position: 'relative', paddingTop: 72,
    }}>
      <ParticleField />
      <NavBar currentPage="pricing" />

      {/* Hero */}
      <div style={{
        textAlign: 'center', padding: '60px 24px 20px',
        position: 'relative', zIndex: 1,
      }}>
        <ScrollReveal>
          <span style={{
            fontFamily: 'var(--font-cinzel)', fontSize: 14, fontWeight: 600,
            color: 'var(--accent-gold)', letterSpacing: '0.25em',
            lineHeight: 1.15,
          }}>PRICING</span>

          <h1 style={{
            fontFamily: 'var(--font-alegreya)', fontSize: 'clamp(28px, 4vw, 36px)',
            fontStyle: 'italic', fontWeight: 500, color: '#b5ae94',
            lineHeight: 1.25,
            marginTop: 20, marginBottom: 14,
          }}>No locked features. No premium content. Just the whole world for one price.</h1>

          <p style={{
            fontFamily: 'var(--font-alegreya-sans)', fontSize: 18, fontWeight: 400,
            color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto', lineHeight: 1.7,
          }}>Every storyteller. Every setting. Start free or own the whole world.</p>
        </ScrollReveal>
      </div>

      {/* Pricing cards */}
      <div className={styles.pricingGrid}>

        {/* Free Trial */}
        <ScrollReveal delay={0} className={styles.cardWrapperFree}>
        <div className={styles.priceCard} style={{
          background: 'var(--bg-gold-faint)',
          border: '1px solid var(--border-gold-subtle)',
          borderRadius: 10, padding: '36px 32px',
          display: 'flex', flexDirection: 'column',
          height: '100%',
        }}>
          <div style={{
            fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 600,
            color: 'var(--gold-muted)', letterSpacing: '0.2em',
            lineHeight: 1.15, marginBottom: 16,
          }}>FREE TRIAL</div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
            <span style={{
              fontFamily: 'var(--font-cinzel)', fontSize: 40, fontWeight: 900,
              color: 'var(--text-heading)', lineHeight: 1.15,
            }}>Free</span>
          </div>

          <div style={{
            fontFamily: 'var(--font-alegreya-sans)', fontSize: 14,
            color: 'var(--accent-gold)', lineHeight: 1.5, marginBottom: 24,
          }}>{PRICING.trial.turns} turns</div>

          <div style={{
            fontFamily: 'var(--font-alegreya-sans)', fontSize: 16, fontWeight: 400,
            color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 28,
            paddingBottom: 24, borderBottom: '1px solid var(--border-gold-faint)',
          }}>One click and you&apos;re playing. See what your story becomes.</div>

          <div style={{ flex: 1 }}>
            <Feature text="Every feature. Every setting." />
            <Feature text="1 world creation" />
            <Feature text="All storytellers and settings" />
            <Feature text="Saves carry over when you subscribe" />
          </div>

          <button
            className={styles.btnSecondary}
            style={{
              fontFamily: 'var(--font-cinzel)', fontSize: 13, fontWeight: 700,
              letterSpacing: '0.1em', lineHeight: 1.15,
              borderRadius: 5, padding: '14px 24px', width: '100%',
              marginTop: 24,
            }}
          >TRY IT FREE</button>
        </div>
        </ScrollReveal>

        {/* Subscription — Hero card (visually differentiated) */}
        <ScrollReveal delay={0.1} className={styles.cardWrapperHero}>
        <div className={styles.heroCard}>
          <div className={styles.heroRibbon} />

          <div style={{
            fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 600,
            color: 'var(--gold-muted)', letterSpacing: '0.2em',
            lineHeight: 1.15, marginBottom: 16,
          }}>{PRICING.subscription.label.toUpperCase()}</div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
            <span className={styles.heroPriceDollar}>$</span>
            <span className={styles.heroPriceAmount}>{PRICING.subscription.price}</span>
            <span style={{
              fontFamily: 'var(--font-alegreya-sans)', fontSize: 15,
              fontWeight: 400, color: 'var(--text-muted)', lineHeight: 1.15,
            }}>/month</span>
            <span className={styles.priceUsd}>USD</span>
          </div>

          <div style={{
            fontFamily: 'var(--font-alegreya-sans)', fontSize: 14,
            color: 'var(--accent-gold)', lineHeight: 1.5, marginBottom: 24,
          }}>{PRICING.subscription.turns} turns included</div>

          <div style={{
            fontFamily: 'var(--font-alegreya-sans)', fontSize: 16, fontWeight: 400,
            color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 28,
            paddingBottom: 24, borderBottom: '1px solid var(--border-gold-faint)',
          }}>Your monthly turns. Combat, conversation, exploration. Spend them any way you like. Resets every billing cycle. Cancel anytime.</div>

          <div style={{ flex: 1 }}>
            <Feature text="Room for the stories that take time to tell" />
            <Feature text="Unlimited saved campaigns" />
            <Feature text="225 turns every month" />
            <Feature text="Top-up packs when you need more" />
            <Feature text="Cancel anytime. No contracts." />
          </div>

          <button
            className={styles.btnPrimary}
            style={{
              fontFamily: 'var(--font-cinzel)', fontSize: 13, fontWeight: 700,
              letterSpacing: '0.1em', lineHeight: 1.15,
              borderRadius: 5, padding: '14px 24px', width: '100%',
              marginTop: 24,
            }}
          >SUBSCRIBE</button>
        </div>
        </ScrollReveal>
      </div>

      {/* Top-up section */}
      <div style={{
        maxWidth: 640, margin: '0 auto',
        padding: '48px 24px 32px',
        position: 'relative', zIndex: 1,
      }}>
        <ScrollReveal>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <span style={{
              fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 600,
              color: 'var(--gold-muted)', letterSpacing: '0.2em', lineHeight: 1.15,
            }}>NEED MORE TURNS?</span>
          <p style={{
            fontFamily: 'var(--font-alegreya-sans)', fontSize: 16, fontWeight: 400,
            color: 'var(--text-secondary)', marginTop: 10, lineHeight: 1.6,
          }}>Top-up packs for when the story can&apos;t wait. Yours to keep — they never expire. Available to subscribers anytime.</p>
        </div>
        </ScrollReveal>

        <div style={{
          display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap',
        }}>
          {PRICING.topups.map((pack, i) => (
            <ScrollReveal key={i} delay={i * 0.1}>
              <div className={styles.topupCard} style={{
                borderRadius: 8, padding: '20px 24px',
                textAlign: 'center', flex: '1 1 160px', maxWidth: 190,
              }}>
                <div style={{
                  fontFamily: 'var(--font-cinzel)', fontSize: 22,
                  fontWeight: 700, color: 'var(--text-heading)',
                  lineHeight: 1.15, marginBottom: 4,
                }}>{pack.turns}</div>
                <div style={{
                  fontFamily: 'var(--font-cinzel)', fontSize: 14,
                  fontWeight: 600, color: 'var(--text-muted)',
                  lineHeight: 1.15, marginBottom: 12,
                }}>turns</div>
                <div style={{
                  fontFamily: 'var(--font-cinzel)', fontSize: 16, fontWeight: 700,
                  color: 'var(--accent-gold)', lineHeight: 1.15,
                }}>${pack.price}</div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>

      {/* FAQ section */}
      <div style={{
        maxWidth: 560, margin: '0 auto',
        padding: '48px 24px 40px',
        position: 'relative', zIndex: 1,
      }}>
        <ScrollReveal>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <span style={{
              fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 600,
              color: 'var(--gold-muted)', letterSpacing: '0.2em', lineHeight: 1.15,
            }}>COMMON QUESTIONS</span>
          </div>
        </ScrollReveal>

        {FAQ_ITEMS.map((item, i) => (
          <ScrollReveal key={i} delay={i * 0.1}>
            <div style={{
              marginBottom: 28,
              paddingBottom: 28,
              borderBottom: i < FAQ_ITEMS.length - 1 ? '1px solid var(--border-gold-faint)' : 'none',
            }}>
              <div style={{
                fontFamily: 'var(--font-cinzel)', fontSize: 14, fontWeight: 600,
                color: 'var(--text-heading)', lineHeight: 1.15, marginBottom: 8,
              }}>{item.q}</div>
              <div style={{
                fontFamily: 'var(--font-alegreya-sans)', fontSize: 16,
                fontWeight: 400, color: 'var(--text-secondary)', lineHeight: 1.7,
              }}>{item.a}</div>
            </div>
          </ScrollReveal>
        ))}
      </div>

      {/* Bottom CTA */}
      <div style={{
        textAlign: 'center', padding: '40px 24px 48px',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{
          position: 'absolute', width: 400, height: 250, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,168,76,0.04) 0%, transparent 65%)',
          top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none',
        }} />
        <h2 style={{
          fontFamily: 'var(--font-cinzel)', fontSize: 'clamp(22px, 3vw, 27px)',
          fontWeight: 700, color: 'var(--text-heading)',
          lineHeight: 1.15, marginBottom: 14, position: 'relative',
        }}>Every Hero Needs a Crucible. Yours is waiting.</h2>
        <p style={{
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 16, fontWeight: 400,
          color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 420, margin: '0 auto 32px',
          position: 'relative',
        }}>Every choice leaves a mark. Start making yours.</p>
        <button
          className={styles.btnPrimary}
          style={{
            fontFamily: 'var(--font-cinzel)', fontSize: 15, fontWeight: 700,
            letterSpacing: '0.1em', lineHeight: 1.15,
            borderRadius: 6, padding: '16px 44px',
            position: 'relative',
          }}
        >START YOUR ADVENTURE</button>
      </div>

      <Footer />
    </div>
  );
}
