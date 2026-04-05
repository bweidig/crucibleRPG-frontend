'use client';

import { useState } from 'react';
import Link from 'next/link';
import ScrollReveal from '@/components/ScrollReveal';
import styles from './page.module.css';

export default function CTASection() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleEmailSubmit = async () => {
    if (!email || !email.includes('@') || submitting) return;
    setEmailError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setEmailError(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setEmailError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
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
          fontWeight: 700, color: 'var(--text-heading)', marginBottom: 40, position: 'relative',
        }}>Every Hero Needs a Crucible. Yours is waiting.</h2>
      </ScrollReveal>

      <ScrollReveal delay={0.1} variant="fadeUpSlow">
        <div style={{
          display: 'grid', gap: 32,
          maxWidth: 800, width: '100%', margin: '0 auto', position: 'relative', textAlign: 'left',
        }} className={styles.ctaGrid}>
          {/* Stay in the Loop */}
          <div className={styles.ctaCard} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-primary)',
            borderRadius: 8, padding: '36px 32px', boxSizing: 'border-box',
          }}>
            <h3 style={{
              fontFamily: 'var(--font-cinzel)', fontSize: 20, fontWeight: 700,
              color: 'var(--text-heading)', marginBottom: 12,
            }}>Stay in the Loop</h3>
            <p style={{
              fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, color: 'var(--text-secondary)',
              lineHeight: 1.7, marginBottom: 20,
            }}>Get updates on launch, new features, and the occasional tale from the forge.</p>

            {!submitted ? (
              <>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleEmailSubmit()}
                    placeholder="your@email.com"
                    style={{
                      flex: 1, background: 'var(--bg-input)', border: '1px solid var(--border-gold-faint)',
                      borderRadius: 4, padding: '12px 16px',
                      fontFamily: 'var(--font-alegreya-sans)', fontSize: 16, color: 'var(--text-primary)',
                      outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                  <button
                    onClick={handleEmailSubmit}
                    disabled={submitting}
                    style={{
                      fontFamily: 'var(--font-cinzel)', fontSize: 13, fontWeight: 700,
                      color: 'var(--bg-main)', letterSpacing: '0.08em',
                      background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-bright))',
                      border: 'none', borderRadius: 4, padding: '12px 20px',
                      cursor: submitting ? 'default' : 'pointer', flexShrink: 0,
                    }}
                  >{submitting ? '...' : 'SUBSCRIBE'}</button>
                </div>
                {emailError && (
                  <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: 'var(--color-danger)', marginTop: 8 }}>{emailError}</div>
                )}
              </>
            ) : (
              <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, color: 'var(--accent-gold)' }}>
                You're on the list.
              </div>
            )}
          </div>

          {/* Join the Playtest */}
          <div className={styles.ctaCard} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-primary)',
            borderRadius: 8, padding: '36px 32px', boxSizing: 'border-box',
          }}>
            <h3 style={{
              fontFamily: 'var(--font-cinzel)', fontSize: 20, fontWeight: 700,
              color: 'var(--text-heading)', marginBottom: 12,
            }}>Join the Playtest</h3>
            <p style={{
              fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, color: 'var(--text-secondary)',
              lineHeight: 1.7, marginBottom: 20,
            }}>Create an account and request access. We're letting people in gradually.</p>
            <Link href="/auth" style={{
              display: 'inline-block', textDecoration: 'none',
              fontFamily: 'var(--font-cinzel)', fontSize: 14, fontWeight: 700,
              color: 'var(--bg-main)', letterSpacing: '0.1em',
              background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-bright))',
              borderRadius: 6, padding: '14px 32px',
            }}>REQUEST ACCESS</Link>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
