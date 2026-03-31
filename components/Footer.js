'use client';

import styles from './Footer.module.css';

const FOOTER_LINKS = [
  { label: 'FAQ', href: '/faq' },
  { label: 'Rulebook', href: '/rulebook' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
];

export default function Footer({ variant = 'standard' }) {
  if (variant === 'minimal') {
    return (
      <footer className={styles.minimal}>
        &copy; 2026 CrucibleRPG &middot; Every hero needs a crucible.
      </footer>
    );
  }

  return (
    <footer className={styles.standard}>
      <div className={styles.standardInner}>
        <span className={styles.brandText}>CRUCIBLE RPG</span>
        <div className={styles.linkRow}>
          {FOOTER_LINKS.map(link => (
            <a key={link.label} href={link.href} className={styles.footerLink}>{link.label}</a>
          ))}
        </div>
      </div>
      <div className={styles.copyright}>
        &copy; 2026 CrucibleRPG &middot; Every hero needs a crucible.
      </div>
    </footer>
  );
}
