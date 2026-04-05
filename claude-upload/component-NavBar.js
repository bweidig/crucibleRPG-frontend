'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AuthAvatar from '@/components/AuthAvatar';
import { getToken, getUser } from '@/lib/api';
import styles from './NavBar.module.css';

export default function NavBar({ variant = 'standard', currentPage }) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (variant !== 'landing' && variant !== 'standard') return;
    const h = () => setScrollProgress(Math.min(window.scrollY / 300, 1));
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, [variant]);

  // Close menu on resize to desktop
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = () => { if (mq.matches) setMenuOpen(false); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const user = getUser();
  const isPlaytester = user?.isPlaytester;
  const isLoggedIn = !!getToken();
  const wordmarkHref = isLoggedIn && isPlaytester ? '/menu' : '/';

  const smoothScroll = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const hamburger = (
    <button
      className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ''}`}
      onClick={() => setMenuOpen(prev => !prev)}
      aria-label={menuOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={menuOpen}
    >
      <span className={styles.hamburgerLine} />
      <span className={styles.hamburgerLine} />
      <span className={styles.hamburgerLine} />
    </button>
  );

  if (variant === 'landing') {
    return (
      <nav className={styles.landingNav} style={{
        background: scrollProgress > 0 || menuOpen ? `rgba(10, 14, 26, ${Math.max(0.85 * scrollProgress, menuOpen ? 0.95 : 0)})` : 'transparent',
        backdropFilter: scrollProgress > 0 || menuOpen ? `blur(${Math.max(16 * scrollProgress, menuOpen ? 16 : 0)}px)` : 'none',
        WebkitBackdropFilter: scrollProgress > 0 || menuOpen ? `blur(${Math.max(16 * scrollProgress, menuOpen ? 16 : 0)}px)` : 'none',
        borderBottom: scrollProgress > 0.5 || menuOpen ? `1px solid rgba(30, 37, 64, ${menuOpen ? 0.6 : scrollProgress * 0.6})` : '1px solid transparent',
      }}>
        <Link href={wordmarkHref} className={styles.wordmark}>
          <span className={styles.wordmarkCrucible}>CRUCIBLE</span>
          <span className={styles.wordmarkRpg}>RPG</span>
        </Link>
        <div className={styles.landingLinks}>
          <a href="#features" onClick={e => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }} className={styles.navLink + ' ' + styles.sectionLink}>Features</a>
          <a href="#how-it-works" onClick={e => { e.preventDefault(); document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }); }} className={styles.navLink + ' ' + styles.sectionLink}>How It Works</a>
          <a href="#faq" onClick={e => { e.preventDefault(); document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' }); }} className={styles.navLink + ' ' + styles.sectionLink}>FAQ</a>
          {isPlaytester && <Link href="/rulebook" className={`${styles.navLink} ${styles.sectionLink}${currentPage === 'rulebook' ? ` ${styles.navLinkActive}` : ''}`}>Rulebook</Link>}
          {isPlaytester && <Link href="/pricing" className={`${styles.navLink} ${styles.sectionLink}${currentPage === 'pricing' ? ` ${styles.navLinkActive}` : ''}`}>Pricing</Link>}
          {hamburger}
          <AuthAvatar size={32} active={currentPage === 'settings'} />
        </div>

        <div className={`${styles.mobileMenu} ${menuOpen ? styles.mobileMenuOpen : ''}`}>
          <a href="#features" onClick={e => { e.preventDefault(); smoothScroll('features'); }} className={styles.mobileMenuLink}>Features</a>
          <a href="#how-it-works" onClick={e => { e.preventDefault(); smoothScroll('how-it-works'); }} className={styles.mobileMenuLink}>How It Works</a>
          <a href="#faq" onClick={e => { e.preventDefault(); smoothScroll('faq'); }} className={styles.mobileMenuLink}>FAQ</a>
          <Link href="/rulebook" className={styles.mobileMenuLink} onClick={() => setMenuOpen(false)}>Rulebook</Link>
          <Link href="/pricing" className={styles.mobileMenuLink} onClick={() => setMenuOpen(false)}>Pricing</Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className={styles.standardNav} style={{
      background: `rgba(10, 14, 26, ${0.5 + 0.35 * scrollProgress})`,
      borderBottom: `1px solid rgba(30, 37, 64, ${0.4 + 0.2 * scrollProgress})`,
    }}>
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
        <Link href="/faq" className={`${styles.navLink} ${styles.sectionLink}${currentPage === 'faq' ? ` ${styles.navLinkActive}` : ''}`}>FAQ</Link>
        {(!isLoggedIn || isPlaytester) && <Link href="/rulebook" className={`${styles.navLink} ${styles.sectionLink}${currentPage === 'rulebook' ? ` ${styles.navLinkActive}` : ''}`}>Rulebook</Link>}
        {(!isLoggedIn || isPlaytester) && <Link href="/pricing" className={`${styles.navLink} ${styles.sectionLink}${currentPage === 'pricing' ? ` ${styles.navLinkActive}` : ''}`}>Pricing</Link>}
        {hamburger}
        <AuthAvatar size={32} active={currentPage === 'settings'} />
      </div>

      <div className={`${styles.mobileMenu} ${menuOpen ? styles.mobileMenuOpen : ''}`}>
        <Link href="/faq" className={`${styles.mobileMenuLink}${currentPage === 'faq' ? ` ${styles.mobileMenuLinkActive}` : ''}`} onClick={() => setMenuOpen(false)}>FAQ</Link>
        {(!isLoggedIn || isPlaytester) && <Link href="/rulebook" className={`${styles.mobileMenuLink}${currentPage === 'rulebook' ? ` ${styles.mobileMenuLinkActive}` : ''}`} onClick={() => setMenuOpen(false)}>Rulebook</Link>}
        {(!isLoggedIn || isPlaytester) && <Link href="/pricing" className={`${styles.mobileMenuLink}${currentPage === 'pricing' ? ` ${styles.mobileMenuLinkActive}` : ''}`} onClick={() => setMenuOpen(false)}>Pricing</Link>}
      </div>
    </nav>
  );
}
