'use client';

import Link from 'next/link';
import { getToken, getUser } from '@/lib/api';

/**
 * Auth-aware nav element.
 * - Logged in: avatar circle with user initial, links to /settings
 * - Logged out: "Sign In" text link to /auth
 *
 * Props:
 *   size      — circle diameter (default 32, use 28 for compact bars)
 *   active    — if true, show gold border (used on /settings itself)
 *   style     — extra styles on the outer wrapper
 */
export default function AuthAvatar({ size = 32, active = false, style }) {
  const token = typeof window !== 'undefined' ? getToken() : null;

  if (!token) {
    return (
      <Link
        href="/auth"
        style={{
          textDecoration: 'none', padding: 0,
          minHeight: 44, display: 'flex', alignItems: 'center',
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 14,
          color: '#8a94a8', transition: 'color 0.2s ease',
          ...style,
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#c9a84c'; }}
        onMouseLeave={e => { e.currentTarget.style.color = '#8a94a8'; }}
      >
        Sign In
      </Link>
    );
  }

  const user = getUser();
  const name = user?.displayName || user?.email || '';
  const initial = name ? name.charAt(0).toUpperCase() : '?';

  return (
    <Link
      href="/settings"
      aria-label="Settings"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minWidth: 44, minHeight: 44,
        textDecoration: 'none', cursor: 'pointer', padding: 0,
        ...style,
      }}
      onMouseEnter={e => { const c = e.currentTarget.querySelector('[data-avatar]'); if (c && !active) c.style.borderColor = '#564b2e'; }}
      onMouseLeave={e => { const c = e.currentTarget.querySelector('[data-avatar]'); if (c && !active) c.style.borderColor = '#3a3328'; }}
    >
      <span
        data-avatar
        style={{
          width: size, height: size, borderRadius: '50%',
          background: '#111528',
          border: active ? '2px solid #c9a84c' : '1px solid #3a3328',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-cinzel)', fontSize: Math.round(size * 0.41), fontWeight: 600,
          color: '#c9a84c',
          transition: 'border-color 0.2s ease',
        }}
      >
        {initial}
      </span>
    </Link>
  );
}
