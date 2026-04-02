'use client';

import { useState } from 'react';
import Link from 'next/link';
import ScrollReveal from '@/components/ScrollReveal';
import styles from './page.module.css';

const faqItems = [
  { q: 'Is this just a chatbot?', a: 'No. There\'s a real game engine running server-side with six core stats, skill progression, equipment with durability, and dice rolls resolved to tenth-decimal precision. The AI writes the story. The server runs the game.' },
  { q: 'Can I really do anything?', a: 'You can try anything. The three suggested actions each turn are starting points, not limits. Type your own and the system figures out which stats apply, sets a difficulty, and rolls. There is no script to go off of.' },
  { q: 'Do I need to know tabletop RPG rules?', a: 'Not at all. The engine handles every rule automatically. You just describe what your character does. The Rulebook is there if you\'re curious, but you never need to open it.' },
  { q: 'Is there a free trial?', a: 'Yes. No credit card required. You get enough turns to create a character, build a world, and play through several scenes.' },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section id="faq" style={{ padding: '100px clamp(24px, 5vw, 60px)', maxWidth: 700, margin: '0 auto' }}>
      <ScrollReveal>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 14, fontWeight: 600, color: 'var(--accent-gold)', letterSpacing: '0.25em' }}>FAQ</span>
        </div>
      </ScrollReveal>
      <div>
        {faqItems.map((item, i) => (
          <ScrollReveal key={i} delay={i * 0.08}>
            <div>
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
          </ScrollReveal>
        ))}
      </div>
      <ScrollReveal delay={0.3}>
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Link href="/faq" className={styles.faqSeeAll}>See all questions &rarr;</Link>
        </div>
      </ScrollReveal>
    </section>
  );
}
