'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AuthAvatar from '@/components/AuthAvatar';
import styles from './page.module.css';

// --- PLACEHOLDER CONFIG (easy to swap later) ---

const PRICING = {
  trial: {
    turns: 'XX',
    label: 'Free Trial',
  },
  subscription: {
    price: 'X.XX',
    turns: 'XXX',
    label: 'Adventurer',
  },
  topups: [
    { turns: 'XX', price: 'X.XX' },
    { turns: 'XX', price: 'X.XX' },
    { turns: 'XXX', price: 'XX.XX' },
  ],
};

const FAQ_ITEMS = [
  {
    q: "What's a turn?",
    a: 'One turn is one action in the game. You describe what your character does, the engine resolves it, and the storyteller narrates what happens next. Combat, exploration, conversation: each one is a turn.',
  },
  {
    q: 'Do unused turns roll over?',
    a: 'No. Your turn allotment resets on your billing date each month. Use them or lose them.',
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

// --- PARTICLE FIELD ---

const EMBER_COLORS = ["#c9a84c", "#d4a94e", "#e8a840", "#d4845a", "#c0924a", "#ddb84e"];

function ParticleField() {
  const [particles] = useState(() =>
    Array.from({ length: 60 }, (_, i) => {
      const color = EMBER_COLORS[Math.floor(Math.random() * EMBER_COLORS.length)];
      const size = Math.random() * 3.0 + 0.6;
      const opacity = Math.random() * 0.30 + 0.06;
      const floatDur = Math.random() * 14 + 6;
      const floatDelay = Math.random() * 10;
      const hasTwinkle = Math.random() < 0.4;
      const twinkleDur = Math.random() * 3 + 1.5;
      const twinkleDelay = Math.random() * 6;
      return {
        id: i, x: Math.random() * 100, y: Math.random() * 100,
        size, color, opacity, floatDur, floatDelay,
        hasTwinkle, twinkleDur, twinkleDelay,
        blur: size > 2.5,
      };
    })
  );

  return (
    <div className={styles.particleField}>
      {particles.map(p => (
        <div key={p.id} className={styles.particle} style={{
          left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size,
          background: p.color,
          '--p-opacity': p.opacity, opacity: p.opacity,
          animation: `float ${p.floatDur}s ease-in-out ${p.floatDelay}s infinite${p.hasTwinkle ? `, twinkle ${p.twinkleDur}s ease-in-out ${p.twinkleDelay}s infinite` : ''}`,
          filter: p.blur ? 'blur(0.5px)' : 'none',
        }} />
      ))}
    </div>
  );
}

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
        fontFamily: 'var(--font-alegreya-sans)', fontSize: 15,
        fontWeight: 400, color: 'var(--text-secondary)', lineHeight: 1.5,
      }}>{text}</span>
    </div>
  );
}

// --- MAIN ---

export default function PricingPage() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setTimeout(() => setLoaded(true), 150); }, []);

  return (
    <div className={styles.pageContainer} style={{
      minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)',
      position: 'relative',
    }}>
      <ParticleField />

      {/* Top bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '24px clamp(24px, 4vw, 56px)',
        position: 'relative', zIndex: 1,
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
        <AuthAvatar size={32} />
      </div>

      {/* Hero */}
      <div style={{
        textAlign: 'center', padding: '60px 24px 20px',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{
          opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 1s cubic-bezier(0.16,1,0.3,1) 0.1s',
        }}>
          <span style={{
            fontFamily: 'var(--font-cinzel)', fontSize: 14, fontWeight: 600,
            color: 'var(--accent-gold)', letterSpacing: '0.25em',
          }}>PRICING</span>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-alegreya)', fontSize: 'clamp(26px, 3.5vw, 34px)',
          fontStyle: 'italic', fontWeight: 500, color: '#9a9480',
          marginTop: 20, marginBottom: 14,
          opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 1s cubic-bezier(0.16,1,0.3,1) 0.2s',
        }}>No tiers. No gates. Just the whole world for one price.</h1>

        <p style={{
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 17, fontWeight: 300,
          color: 'var(--text-muted)', maxWidth: 480, margin: '0 auto', lineHeight: 1.7,
          opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 1s cubic-bezier(0.16,1,0.3,1) 0.3s',
        }}>Every storyteller. Every setting. Every feature. Start free or jump right in.</p>
      </div>

      {/* Pricing cards */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 24,
        padding: '48px 24px 32px', flexWrap: 'wrap',
        position: 'relative', zIndex: 1,
        opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 1s cubic-bezier(0.16,1,0.3,1) 0.4s',
      }}>

        {/* Free Trial */}
        <div className={styles.priceCard} style={{
          background: 'var(--bg-gold-faint)',
          border: '1px solid var(--border-gold-subtle)',
          borderRadius: 10, padding: '36px 32px',
          width: 300, maxWidth: '100%', display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 600,
            color: 'var(--gold-muted)', letterSpacing: '0.2em', marginBottom: 16,
          }}>FREE TRIAL</div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
            <span style={{
              fontFamily: 'var(--font-cinzel)', fontSize: 40, fontWeight: 900, color: 'var(--text-heading)',
            }}>Free</span>
          </div>

          <div style={{
            fontFamily: 'var(--font-jetbrains)', fontSize: 14,
            color: 'var(--accent-gold)', marginBottom: 24,
          }}>{PRICING.trial.turns} turns</div>

          <div style={{
            fontFamily: 'var(--font-alegreya-sans)', fontSize: 14,
            color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 28,
            paddingBottom: 24, borderBottom: '1px solid var(--border-gold-faint)',
          }}>No credit card. No commitment. Just jump in.</div>

          <div style={{ flex: 1 }}>
            <Feature text="Full game. No locked features." />
            <Feature text="1 world creation" />
            <Feature text="All storytellers and settings" />
            <Feature text="Saves carry over when you subscribe" />
          </div>

          <button
            className={styles.btnSecondary}
            style={{
              fontFamily: 'var(--font-cinzel)', fontSize: 13, fontWeight: 700,
              color: 'var(--accent-gold)', letterSpacing: '0.1em',
              background: 'transparent', border: '1px solid var(--border-card)',
              borderRadius: 5, padding: '14px 24px', width: '100%',
              marginTop: 24,
            }}
          >TRY IT FREE</button>
        </div>

        {/* Subscription */}
        <div className={styles.priceCard} style={{
          background: 'var(--bg-gold-subtle)',
          border: '1px solid var(--border-card-separator)',
          borderRadius: 10, padding: '36px 32px',
          width: 300, maxWidth: '100%', display: 'flex', flexDirection: 'column',
          position: 'relative',
        }}>
          {/* Recommended badge */}
          <div style={{
            position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
            fontFamily: 'var(--font-cinzel)', fontSize: 10, fontWeight: 700,
            color: 'var(--bg-main)', letterSpacing: '0.15em',
            background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-bright))',
            borderRadius: 20, padding: '5px 16px',
          }}>RECOMMENDED</div>

          <div style={{
            fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 600,
            color: 'var(--gold-muted)', letterSpacing: '0.2em', marginBottom: 16,
          }}>{PRICING.subscription.label.toUpperCase()}</div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
            <span style={{
              fontFamily: 'var(--font-cinzel)', fontSize: 18, fontWeight: 700, color: 'var(--text-heading)',
            }}>$</span>
            <span style={{
              fontFamily: 'var(--font-cinzel)', fontSize: 40, fontWeight: 900, color: 'var(--text-heading)',
            }}>{PRICING.subscription.price}</span>
            <span style={{
              fontFamily: 'var(--font-alegreya-sans)', fontSize: 15,
              fontWeight: 400, color: 'var(--text-muted)',
            }}>/month</span>
          </div>

          <div style={{
            fontFamily: 'var(--font-jetbrains)', fontSize: 14,
            color: 'var(--accent-gold)', marginBottom: 24,
          }}>{PRICING.subscription.turns} turns included</div>

          <div style={{
            fontFamily: 'var(--font-alegreya-sans)', fontSize: 14,
            color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 28,
            paddingBottom: 24, borderBottom: '1px solid var(--border-gold-faint)',
          }}>Your monthly turns. Spend them however you want. Resets every billing cycle. Cancel anytime.</div>

          <div style={{ flex: 1 }}>
            <Feature text="Full game: every feature, every setting" />
            <Feature text="5 world creations per month" />
            <Feature text="Unlimited saved campaigns" />
            <Feature text="Buy extra turns if you need more" />
            <Feature text="Cancel anytime. No contracts." />
          </div>

          <button
            className={styles.btnPrimary}
            style={{
              fontFamily: 'var(--font-cinzel)', fontSize: 13, fontWeight: 700,
              color: 'var(--bg-main)', letterSpacing: '0.1em',
              background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-bright))',
              border: 'none', borderRadius: 5, padding: '14px 24px', width: '100%',
              marginTop: 24,
            }}
          >SUBSCRIBE</button>
        </div>
      </div>

      {/* Top-up section */}
      <div style={{
        maxWidth: 640, margin: '0 auto',
        padding: '48px 24px 32px',
        position: 'relative', zIndex: 1,
        opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 1s cubic-bezier(0.16,1,0.3,1) 0.55s',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span style={{
            fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 600,
            color: 'var(--gold-muted)', letterSpacing: '0.2em',
          }}>NEED MORE TURNS?</span>
          <p style={{
            fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, fontWeight: 300,
            color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.6,
          }}>Top-up packs for when the story can't wait. Available to subscribers anytime.</p>
        </div>

        <div style={{
          display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap',
        }}>
          {PRICING.topups.map((pack, i) => (
            <div key={i} className={styles.topupCard} style={{
              background: 'var(--bg-gold-faint)',
              border: '1px solid var(--border-gold-subtle)',
              borderRadius: 8, padding: '20px 24px',
              textAlign: 'center', flex: '1 1 160px', maxWidth: 190,
            }}>
              <div style={{
                fontFamily: 'var(--font-jetbrains)', fontSize: 22,
                fontWeight: 500, color: 'var(--text-heading)', marginBottom: 4,
              }}>{pack.turns}</div>
              <div style={{
                fontFamily: 'var(--font-alegreya-sans)', fontSize: 13,
                color: 'var(--text-muted)', marginBottom: 12,
              }}>turns</div>
              <div style={{
                fontFamily: 'var(--font-cinzel)', fontSize: 16, fontWeight: 700,
                color: 'var(--accent-gold)',
              }}>${pack.price}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ section */}
      <div style={{
        maxWidth: 560, margin: '0 auto',
        padding: '48px 24px 40px',
        position: 'relative', zIndex: 1,
        opacity: loaded ? 1 : 0,
        transition: 'opacity 1s ease 0.6s',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span style={{
            fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 600,
            color: 'var(--gold-muted)', letterSpacing: '0.2em',
          }}>COMMON QUESTIONS</span>
        </div>

        {FAQ_ITEMS.map((item, i) => (
          <div key={i} style={{
            marginBottom: 28,
            paddingBottom: 28,
            borderBottom: i < FAQ_ITEMS.length - 1 ? '1px solid var(--border-gold-faint)' : 'none',
          }}>
            <div style={{
              fontFamily: 'var(--font-cinzel)', fontSize: 15, fontWeight: 700,
              color: 'var(--text-heading)', marginBottom: 8,
            }}>{item.q}</div>
            <div style={{
              fontFamily: 'var(--font-alegreya-sans)', fontSize: 15,
              fontWeight: 300, color: 'var(--text-muted)', lineHeight: 1.7,
            }}>{item.a}</div>
          </div>
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
          fontFamily: 'var(--font-cinzel)', fontSize: 'clamp(22px, 3vw, 28px)',
          fontWeight: 700, color: 'var(--text-heading)', marginBottom: 14, position: 'relative',
        }}>Every Hero Needs a Crucible. Yours is waiting.</h2>
        <p style={{
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 16, fontWeight: 300,
          color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 420, margin: '0 auto 32px',
          position: 'relative',
        }}>No group required. No prep time. Just you and a world waiting to see what you'll do.</p>
        <button
          className={styles.btnPrimary}
          style={{
            fontFamily: 'var(--font-cinzel)', fontSize: 15, fontWeight: 700,
            color: 'var(--bg-main)', letterSpacing: '0.1em',
            background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-bright))',
            border: 'none', borderRadius: 6, padding: '16px 44px',
            position: 'relative',
          }}
        >START YOUR ADVENTURE</button>
      </div>

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
