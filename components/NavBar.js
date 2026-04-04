'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AuthAvatar from '@/components/AuthAvatar';
import { getToken, getUser } from '@/lib/api';
import styles from './NavBar.module.css';

export default function NavBar({ variant = 'standard', currentPage }) {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    if (variant !== 'landing') return;
    const h = () => setScrollProgress(Math.min(window.scrollY / 300, 1));
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, [variant]);

  const user = getUser();
  const isPlaytester = user?.isPlaytester;
  const isLoggedIn = !!getToken();
  const wordmarkHref = isLoggedIn && isPlaytester ? '/menu' : '/';

  if (variant === 'landing') {
    return (
      <nav className={styles.landingNav} style={{
        background: scrollProgress > 0 ? `rgba(10, 14, 26, ${0.85 * scrollProgress})` : 'transparent',
        backdropFilter: scrollProgress > 0 ? `blur(${16 * scrollProgress}px)` : 'none',
        WebkitBackdropFilter: scrollProgress > 0 ? `blur(${16 * scrollProgress}px)` : 'none',
        borderBottom: scrollProgress > 0.5 ? `1px solid rgba(30, 37, 64, ${scrollProgress * 0.6})` : '1px solid transparent',
      }}>
        <Link href={wordmarkHref} className={styles.wordmark}>
          <span className={styles.wordmarkCrucible}>CRUCIBLE</span>
          <span className={styles.wordmarkRpg}>RPG</span>
        </Link>
        <div className={styles.landingLinks}>
          <a href="#features" onClick={e => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }} className={styles.navLink + ' ' + styles.sectionLink}>Features</a>
          <a href="#how-it-works" onClick={e => { e.preventDefault(); document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }); }} className={styles.navLink + ' ' + styles.sectionLink}>How It Works</a>
          <a href="#faq" onClick={e => { e.preventDefault(); document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' }); }} className={styles.navLink + ' ' + styles.sectionLink}>FAQ</a>
          {isPlaytester && <Link href="/rulebook" className={`${styles.navLink}${currentPage === 'rulebook' ? ` ${styles.navLinkActive}` : ''}`}>Rulebook</Link>}
          {isPlaytester && <Link href="/pricing" className={`${styles.navLink}${currentPage === 'pricing' ? ` ${styles.navLinkActive}` : ''}`}>Pricing</Link>}
          <AuthAvatar size={32} active={currentPage === 'settings'} />
        </div>
      </nav>
    );
  }

  return (
    <nav className={styles.standardNav}>
      <Link href={wordmarkHref} className={styles.wordmark}>
        <span className={styles.wordmarkCrucible}>CRUCIBLE</span>
        <span className={styles.wordmarkRpg}>RPG</span>
      </Link>
      <div className={styles.standardLinks}>
        {isLoggedIn && !isPlaytester && (
          <span style={{
            fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 600,
            color: 'var(--accent-gold)', letterSpacing: '0.15em', opacity: 0.7,
          }}>PLAYTEST ACCESS PENDING</span>
        )}
        <Link href="/faq" className={`${styles.navLink}${currentPage === 'faq' ? ` ${styles.navLinkActive}` : ''}`}>FAQ</Link>
        {(!isLoggedIn || isPlaytester) && <Link href="/rulebook" className={`${styles.navLink}${currentPage === 'rulebook' ? ` ${styles.navLinkActive}` : ''}`}>Rulebook</Link>}
        {(!isLoggedIn || isPlaytester) && <Link href="/pricing" className={`${styles.navLink}${currentPage === 'pricing' ? ` ${styles.navLinkActive}` : ''}`}>Pricing</Link>}
        <AuthAvatar size={32} active={currentPage === 'settings'} />
      </div>
    </nav>
  );
}
