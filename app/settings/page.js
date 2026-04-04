'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated, getUser, setUser, getToken, clearToken, put, del } from '@/lib/api';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import ParticleField from '@/components/ParticleField';
import styles from './page.module.css';

const SETTINGS_KEY = 'crucible_display_settings';
const DEFAULT_SETTINGS = { theme: 'dark', font: 'lexie', textSize: 'medium' };

function loadDisplaySettings() {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch { return DEFAULT_SETTINGS; }
}

function saveDisplaySettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ─── FONT / SIZE MAPS ───

const FONTS = [
  { id: 'lexie', label: 'Lexie Readable', family: "'Lexie Readable', sans-serif" },
  { id: 'system', label: 'System Default', family: 'system-ui, sans-serif' },
  { id: 'alegreya', label: 'Alegreya Sans', family: "'Alegreya Sans', sans-serif" },
  { id: 'georgia', label: 'Georgia', family: 'Georgia, serif' },
  { id: 'mono', label: 'Monospace', family: "'JetBrains Mono', monospace" },
];

const SIZES = [
  { id: 'small', label: 'S' },
  { id: 'medium', label: 'M' },
  { id: 'large', label: 'L' },
  { id: 'xlarge', label: 'XL' },
];

const SIZE_PX = { small: 14, medium: 16, large: 18, xlarge: 20 };

// ─── THEME ICONS ───

function MoonIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
}
function SunIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
}
function HalfIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 3v18" /><path d="M12 3a9 9 0 0 1 0 18" fill="currentColor" opacity="0.3"/></svg>;
}

// =============================================================================
// MAIN SETTINGS PAGE
// =============================================================================

export default function SettingsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [user, setUserState] = useState(null);

  // Identity editing
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Display settings
  const [display, setDisplay] = useState(DEFAULT_SETTINGS);

  // Subscription (mock)
  const [planState] = useState('free'); // 'free' | 'subscriber' | 'cancelled'

  // Delete account
  const [showDelete, setShowDelete] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/auth'); return; }
    const u = getUser();
    if (u && !u.isPlaytester) { router.replace('/'); return; }
    setUserState(u);
    setDisplay(loadDisplaySettings());
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0e1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4' }}>Loading...</p>
      </div>
    );
  }

  const displayName = user?.displayName || user?.email || 'Adventurer';
  const initials = displayName.split(' ').map(w => w.charAt(0).toUpperCase()).join('').slice(0, 2);
  const joinDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Unknown';

  // Display settings handlers
  function updateDisplay(patch) {
    const next = { ...display, ...patch };
    setDisplay(next);
    saveDisplaySettings(next);
  }

  // Edit name
  function startEdit() {
    setEditName(user?.displayName || '');
    setEditing(true);
    setEditError('');
  }

  async function saveName() {
    const trimmed = editName.trim();
    if (!trimmed || trimmed.length > 50) return;
    setEditSaving(true);
    setEditError('');
    try {
      await put('/api/auth/profile', { displayName: trimmed });
      const updated = { ...user, displayName: trimmed };
      setUser(updated);
      setUserState(updated);
      setEditing(false);
    } catch (err) {
      if (err.status === 404) {
        // Endpoint not deployed yet — update localStorage anyway
        const updated = { ...user, displayName: trimmed };
        setUser(updated);
        setUserState(updated);
        setEditing(false);
      } else {
        setEditError(err.message || 'Failed to save');
      }
    }
    setEditSaving(false);
  }

  // Sign out
  function handleSignOut() {
    clearToken();
    try { localStorage.removeItem(SETTINGS_KEY); } catch { /* ignore */ }
    router.replace('/auth');
  }

  // Delete account
  async function handleDeleteAccount() {
    setDeleteError('');
    try {
      await del('/api/auth/account');
      clearToken();
      router.replace('/auth');
    } catch (err) {
      if (err.status === 404) {
        setDeleteError('Account deletion is not available yet. Contact support.');
      } else {
        setDeleteError(err.message || 'Failed to delete account');
      }
    }
  }

  const selectedFont = FONTS.find(f => f.id === display.font) || FONTS[0];

  return (
    <div className={styles.pageContainer} style={{
      minHeight: '100vh', background: '#0a0e1a', color: '#c8c0b0', position: 'relative',
    }}>
      <ParticleField />
      <NavBar currentPage="settings" />

      {/* Content */}
      <div style={{
        maxWidth: 820, margin: '0 auto',
        padding: '0 clamp(24px, 5vw, 48px) 48px',
        position: 'relative', zIndex: 1,
      }}>

        {/* ──── ZONE 1: IDENTITY ──── */}
        <div style={{ padding: '32px 0 28px', display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Avatar */}
          <div style={{
            width: 68, height: 68, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #111528, #181d32)',
            border: '2px solid #3a3328',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-cinzel)', fontSize: 24, fontWeight: 700, color: '#c9a84c',
          }}>
            {initials}
          </div>
          {/* Info */}
          <div style={{ flex: 1 }}>
            {!editing ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 22, fontWeight: 700, color: '#d0c098' }}>
                  {displayName}
                </span>
                <button className={styles.editLink} onClick={startEdit}>edit</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value.slice(0, 50))}
                  onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditing(false); }}
                  style={{
                    fontFamily: 'var(--font-cinzel)', fontSize: 20, fontWeight: 700, color: '#d0c098',
                    background: '#0a0e1a', border: '1px solid #3a3328', borderRadius: 4,
                    padding: '4px 10px', outline: 'none', width: 260,
                  }}
                  autoFocus
                />
                <button className={styles.saveBtn} onClick={saveName} disabled={editSaving}>Save</button>
                <button className={styles.cancelBtn} onClick={() => setEditing(false)}>Cancel</button>
              </div>
            )}
            {editError && <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#e85a5a', marginBottom: 4 }}>{editError}</p>}
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#6b83a3', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span>{user?.email}</span>
              <span>&middot;</span>
              <span>Since {joinDate}</span>
              {user?.isPlaytester && (
                <>
                  <span>&middot;</span>
                  <span style={{ fontFamily: 'var(--font-cinzel)', color: '#c9a84c' }}>PLAYTESTER</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div style={{ borderBottom: '1px solid #2a2622', marginBottom: 28 }} />

        {/* ──── ZONE 2: DISPLAY PREFERENCES ──── */}
        <div style={{
          background: '#0d1120', border: '1px solid #3a3328', borderRadius: 12,
          padding: '28px 32px', marginBottom: 28,
        }}>
          <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 13, fontWeight: 600, color: '#9a8545', letterSpacing: '0.12em', marginBottom: 20 }}>
            DISPLAY
          </div>

          {/* Theme toggle */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#7082a4', marginBottom: 8 }}>Theme</div>
            <div style={{ display: 'inline-flex', background: '#111528', borderRadius: 4, border: '1px solid #2a2622', overflow: 'hidden' }}>
              {[
                { id: 'dark', label: 'Dark', Icon: MoonIcon },
                { id: 'light', label: 'Light', Icon: SunIcon },
                { id: 'auto', label: 'Auto', Icon: HalfIcon },
              ].map(t => (
                <button
                  key={t.id}
                  className={display.theme === t.id ? styles.segBtnActive : styles.segBtn}
                  onClick={() => updateDisplay({ theme: t.id })}
                >
                  <t.Icon />{t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Font + Size row */}
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', marginBottom: 20 }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#7082a4', marginBottom: 8 }}>Reading Font</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {FONTS.map(f => (
                  <button
                    key={f.id}
                    className={display.font === f.id ? styles.fontBtnActive : styles.fontBtn}
                    style={{ fontFamily: f.family }}
                    onClick={() => updateDisplay({ font: f.id })}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#7082a4', marginBottom: 8 }}>Size</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {SIZES.map(s => (
                  <button
                    key={s.id}
                    className={display.textSize === s.id ? styles.sizeBtnActive : styles.sizeBtn}
                    onClick={() => updateDisplay({ textSize: s.id })}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div style={{
            background: '#111528', border: '1px solid #2a2622', borderRadius: 6, padding: 16,
          }}>
            <p style={{
              fontFamily: selectedFont.family,
              fontSize: SIZE_PX[display.textSize] || 16,
              color: '#d4c4a0', lineHeight: 1.7, fontStyle: 'italic', margin: 0,
            }}>
              The tavern falls silent as you push open the heavy oak door. A dozen eyes track your movement across the room. The bartender polishes a glass that was already clean, watching you with practiced indifference.
            </p>
          </div>
        </div>

        {/* ──── ZONE 3: SUBSCRIPTION ──── */}
        <div style={{
          background: '#0d1120', border: '1px solid #3a3328', borderRadius: 12,
          padding: '28px 32px', marginBottom: 28,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 13, fontWeight: 600, color: '#9a8545', letterSpacing: '0.12em' }}>
              SUBSCRIPTION
            </span>
            {planState === 'subscriber' && (
              <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 9, fontWeight: 700, color: '#8aba7a', background: '#142018', border: '1px solid #8aba7a33', borderRadius: 3, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Active
              </span>
            )}
            {planState === 'cancelled' && (
              <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 9, fontWeight: 700, color: '#e85a5a', background: '#201416', border: '1px solid #e85a5a33', borderRadius: 3, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Cancels Apr 15
              </span>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 22, fontWeight: 700, color: planState === 'free' ? '#8a94a8' : '#c9a84c', marginBottom: 4 }}>
                {planState === 'free' ? 'Free Trial' : 'Adventurer'}
              </div>
              <div style={{ fontFamily: planState === 'free' ? 'var(--font-alegreya-sans)' : "'JetBrains Mono', monospace", fontSize: 13, color: '#6b83a3' }}>
                {planState === 'free' ? 'No credit card required' : '$X.XX/month - Renews Apr 15, 2026'}
              </div>
            </div>
            <Link href="/pricing" className={planState === 'free' ? styles.upgradeBtn : styles.manageBtn}>
              {planState === 'free' ? 'UPGRADE' : 'Manage Subscription'}
            </Link>
          </div>

          {/* Turn usage */}
          <div style={{ background: '#111528', border: '1px solid #2a2622', borderRadius: 6, padding: 16, marginBottom: planState !== 'free' ? 20 : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#7082a4' }}>
                {planState === 'free' ? 'Trial Turns' : 'Turns This Month'}
              </span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#c8c0b0' }}>
                {planState === 'free' ? 'XX / XX' : 'XX / XXX'}
              </span>
            </div>
            <div style={{ background: '#1e2540', borderRadius: 3, height: 5, overflow: 'hidden' }}>
              <div style={{ width: '65%', height: '100%', background: '#c9a84c', borderRadius: 3 }} />
            </div>
          </div>

          {/* Top-up packs (subscribers only) */}
          {planState === 'subscriber' && (
            <div>
              <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#6b83a3', marginBottom: 10 }}>
                Need more? Grab a top-up pack anytime.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { turns: 'XX', price: 'X.XX' },
                  { turns: 'XX', price: 'X.XX' },
                  { turns: 'XXX', price: 'XX.XX' },
                ].map((pack, i) => (
                  <button key={i} className={styles.topupBtn}>
                    <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{pack.turns} turns</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#c9a84c' }}>${pack.price}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ──── ZONE 4: ACCOUNT + LEGAL ──── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0 20px' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <button className={styles.signOutBtn} onClick={handleSignOut}>Sign Out</button>
            <button className={styles.deleteLink} onClick={() => setShowDelete(!showDelete)}>Delete Account</button>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Link href="/terms" className={styles.legalLink}>Terms of Service</Link>
            <Link href="/privacy" className={styles.legalLink}>Privacy Policy</Link>
          </div>
        </div>

        {/* Delete confirmation panel */}
        {showDelete && (
          <div style={{
            background: '#201416', border: '1px solid #e8845a33', borderRadius: 8,
            padding: 20, marginBottom: 20,
          }}>
            <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#e8845a', marginBottom: 8 }}>
              This will permanently delete your account, all characters, worlds, and game data. This action cannot be undone.
            </p>
            <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#8a94a8', marginBottom: 12 }}>
              Type <strong style={{ color: '#e8845a' }}>DELETE</strong> to confirm:
            </p>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                className={styles.deleteInput}
                value={deleteInput}
                onChange={e => setDeleteInput(e.target.value)}
                placeholder="DELETE"
              />
              <button
                className={styles.deleteConfirm}
                disabled={deleteInput !== 'DELETE'}
                onClick={handleDeleteAccount}
              >
                Delete My Account
              </button>
              <button className={styles.cancelBtn} onClick={() => { setShowDelete(false); setDeleteInput(''); setDeleteError(''); }}>
                Cancel
              </button>
            </div>
            {deleteError && (
              <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#e85a5a', marginTop: 8 }}>{deleteError}</p>
            )}
          </div>
        )}
      </div>

      <Footer variant="minimal" />
    </div>
  );
}
