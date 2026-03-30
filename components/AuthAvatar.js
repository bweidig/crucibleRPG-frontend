'use client';

import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const token = typeof window !== 'undefined' ? getToken() : null;

  if (!token) {
    return (
      <button
        onClick={() => router.push('/auth')}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 14,
          color: '#8a94a8', transition: 'color 0.2s ease',
          ...style,
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#c9a84c'; }}
        onMouseLeave={e => { e.currentTarget.style.color = '#8a94a8'; }}
      >
        Sign In
      </button>
    );
  }

  const user = getUser();
  const name = user?.displayName || user?.email || '';
  const initial = name ? name.charAt(0).toUpperCase() : '?';

  return (
    <button
      onClick={() => router.push('/settings')}
      aria-label="Settings"
      style={{
        width: size, height: size, borderRadius: '50%',
        background: '#111528',
        border: active ? '2px solid #c9a84c' : '1px solid #3a3328',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-cinzel)', fontSize: Math.round(size * 0.41), fontWeight: 600,
        color: '#c9a84c', cursor: 'pointer', padding: 0,
        transition: 'border-color 0.2s ease',
        ...style,
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = '#564b2e'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = '#3a3328'; }}
    >
      {initial}
    </button>
  );
}
