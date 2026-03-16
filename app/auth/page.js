'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { post, setToken, setUser } from '@/lib/api';
import styles from './page.module.css';

function ParticleField() {
  const [particles] = useState(() =>
    Array.from({ length: 35 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      duration: Math.random() * 12 + 8,
      delay: Math.random() * 8,
      opacity: Math.random() * 0.2 + 0.03,
    }))
  );

  return (
    <div className={styles.particleField}>
      {particles.map(p => (
        <div key={p.id} className={styles.particle} style={{
          left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size,
          '--p-opacity': p.opacity, opacity: p.opacity,
          animationDuration: `${p.duration}s`,
          animationDelay: `${p.delay}s`,
        }} />
      ))}
    </div>
  );
}

function InputField({ label, type = 'text', placeholder, value, onChange, autoComplete, children }) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{
        fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, fontWeight: 500,
        color: 'var(--text-muted)', letterSpacing: '0.03em',
        display: 'block', marginBottom: 7,
      }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%', background: 'var(--bg-input)',
            border: `1px solid ${focused ? 'var(--border-card-hover)' : 'var(--border-gold-faint)'}`,
            borderRadius: 6, padding: '13px 16px',
            fontFamily: 'var(--font-alegreya-sans)', fontSize: 16, color: 'var(--text-primary)',
            outline: 'none', boxSizing: 'border-box',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            boxShadow: focused ? '0 0 12px rgba(201,168,76,0.06)' : 'none',
          }}
        />
        {children}
      </div>
    </div>
  );
}

function Divider({ text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '24px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border-gold-faint)' }} />
      <span style={{
        fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: 'var(--gold-muted)',
      }}>{text}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border-gold-faint)' }} />
    </div>
  );
}

function SocialButton({ icon, label }) {
  return (
    <button className={styles.socialButton} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      {label}
    </button>
  );
}

function PasswordStrength({ password }) {
  if (!password) return null;

  let strength = 0;
  let label = 'Too Short';
  let color = '#c84a4a';

  if (password.length >= 8) { strength = 1; label = 'Minimum'; color = '#e8845a'; }
  if (password.length >= 10) { strength = 2; label = 'Fair'; color = '#e8c45a'; }
  if (password.length >= 12) { strength = 3; label = 'Good'; color = '#8aba7a'; }
  if (password.length >= 16) { strength = 4; label = 'Strong'; color = '#6aba7a'; }

  return (
    <div style={{ marginTop: -12, marginBottom: 18 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i <= strength ? color : 'var(--border-gold-faint)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: color,
        }}>{label}</span>
        <span style={{
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: 'var(--text-dim)',
        }}>{password.length} characters</span>
      </div>
    </div>
  );
}

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (mode === 'forgot') return; // placeholder — no endpoint yet

    // Client-side validation
    if (mode === 'signup') {
      if (!displayName.trim()) { setError('Display name is required.'); return; }
      if (!email.trim()) { setError('Email is required.'); return; }
      if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
      if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
      if (!inviteCode.trim()) { setError('Invite code is required.'); return; }
      if (!agreedToTerms) { setError('You must agree to the Terms of Service.'); return; }
    } else {
      if (!email.trim()) { setError('Email is required.'); return; }
      if (!password) { setError('Password is required.'); return; }
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const data = await post('/api/auth/signup', { email, password, displayName, inviteCode: inviteCode.trim() });
        setToken(data.token);
        if (data.user) setUser(data.user);
      } else {
        const data = await post('/api/auth/login', { email, password });
        setToken(data.token);
        if (data.user) setUser(data.user);
      }
      router.push('/menu');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function switchMode(newMode) {
    setMode(newMode);
    setError('');
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      <ParticleField />

      {/* Radial glow */}
      <div style={{
        position: 'absolute', width: 1000, height: 1000, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 65%)',
        top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none',
      }} />

      {/* Top-left wordmark */}
      <div style={{
        position: 'absolute', top: 22, left: 24,
        display: 'flex', alignItems: 'baseline', gap: 8,
      }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 22, fontWeight: 900, color: 'var(--accent-gold)', letterSpacing: '0.06em' }}>
            CRUCIBLE
          </span>
          <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 600, color: 'var(--gold-muted)', letterSpacing: '0.18em' }}>
            RPG
          </span>
        </Link>
      </div>

      {/* Card */}
      <form onSubmit={handleSubmit} style={{
        width: '100%', maxWidth: 440, padding: '40px 36px', position: 'relative', zIndex: 1,
        background: 'var(--bg-card)', border: '1px solid var(--border-gold-faint)', borderRadius: 12,
        backdropFilter: 'blur(20px)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <h1 style={{
            fontFamily: 'var(--font-cinzel)', fontSize: 24, fontWeight: 700, color: 'var(--text-heading)',
            marginBottom: 6,
          }}>
            {mode === 'signup' ? 'Create Your Account' : mode === 'signin' ? 'Welcome Back' : 'Reset Password'}
          </h1>
          <p style={{
            fontFamily: 'var(--font-alegreya)', fontSize: 16, fontStyle: 'italic',
            color: 'var(--text-muted)', margin: 0,
          }}>
            {mode === 'signup'
              ? 'Every story starts somewhere.'
              : mode === 'signin'
                ? 'Pick up where you left off.'
                : "We'll send you a reset link."}
          </p>
        </div>

        {/* Toggle tabs */}
        {mode !== 'forgot' && (
          <div style={{
            display: 'flex', marginBottom: 26, background: 'var(--bg-main)', borderRadius: 6, padding: 3,
            border: '1px solid var(--border-gold-faint)',
          }}>
            {[
              { id: 'signup', label: 'Sign Up' },
              { id: 'signin', label: 'Sign In' },
            ].map(tab => (
              <button key={tab.id} type="button" onClick={() => switchMode(tab.id)} style={{
                flex: 1, padding: '10px 0', cursor: 'pointer',
                fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, fontWeight: 600,
                color: mode === tab.id ? 'var(--accent-gold)' : 'var(--text-dim)',
                background: mode === tab.id ? 'var(--bg-gold-light)' : 'transparent',
                border: 'none', borderRadius: 4, transition: 'all 0.2s',
              }}>{tab.label}</button>
            ))}
          </div>
        )}

        {/* Social logins (placeholder) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <SocialButton icon="G" label="Continue with Google" />
          <SocialButton icon="&#127822;" label="Continue with Apple" />
        </div>

        <Divider text="or" />

        {/* Error message */}
        {error && (
          <div style={{
            background: '#201416', border: '1px solid #5a3020', borderRadius: 6,
            padding: '10px 14px', marginBottom: 18,
            fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: 'var(--color-danger)',
          }}>{error}</div>
        )}

        {/* Sign Up form */}
        {mode === 'signup' && (
          <>
            <InputField
              label="Invite Code"
              placeholder="Enter your invite code"
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
              autoComplete="off"
            />
            <InputField
              label="Display Name"
              placeholder="What other players will see"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              autoComplete="username"
            />
            <InputField
              label="Email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
            <InputField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
            >
              <button type="button" onClick={() => setShowPassword(!showPassword)} className={styles.passwordToggle}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </InputField>
            <PasswordStrength password={password} />
            <InputField
              label="Confirm Password"
              type="password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />

            {/* Terms */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 22,
            }}>
              <div
                onClick={() => setAgreedToTerms(!agreedToTerms)}
                style={{
                  width: 20, height: 20, borderRadius: 4, flexShrink: 0, marginTop: 1,
                  border: `1px solid ${agreedToTerms ? 'var(--accent-gold)' : 'var(--border-gold-light)'}`,
                  background: agreedToTerms ? 'var(--bg-gold-light)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {agreedToTerms && <span style={{ color: 'var(--accent-gold)', fontSize: 13, lineHeight: 1 }}>&#10003;</span>}
              </div>
              <span style={{
                fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5,
              }}>
                I agree to the{' '}
                <a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'underline' }}>Terms of Service</a>
                {' '}and{' '}
                <a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'underline' }}>Privacy Policy</a>
              </span>
            </div>
          </>
        )}

        {/* Sign In form */}
        {mode === 'signin' && (
          <>
            <InputField
              label="Email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
            <InputField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
            >
              <button type="button" onClick={() => setShowPassword(!showPassword)} className={styles.passwordToggle}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </InputField>
            <div style={{ textAlign: 'right', marginTop: -12, marginBottom: 20 }}>
              <button type="button" onClick={() => switchMode('forgot')} className={styles.textLink} style={{
                fontSize: 14, textDecoration: 'underline',
              }}>Forgot password?</button>
            </div>
          </>
        )}

        {/* Forgot Password form */}
        {mode === 'forgot' && (
          <>
            <InputField
              label="Email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
            <div style={{
              fontFamily: 'var(--font-alegreya-sans)', fontSize: 14,
              color: 'var(--text-muted)', textAlign: 'center', marginBottom: 18,
            }}>
              Password reset coming soon.
            </div>
          </>
        )}

        {/* Submit */}
        <button type="submit" className={styles.submitButton} disabled={loading || mode === 'forgot'}
          style={loading || mode === 'forgot' ? { opacity: 0.6, cursor: 'not-allowed' } : {}}>
          {loading
            ? 'Please wait...'
            : mode === 'signup' ? 'CREATE ACCOUNT' : mode === 'signin' ? 'SIGN IN' : 'SEND RESET LINK'}
        </button>

        {/* Back to sign in from forgot */}
        {mode === 'forgot' && (
          <div style={{ textAlign: 'center', marginTop: 18 }}>
            <button type="button" onClick={() => switchMode('signin')} className={styles.textLink} style={{ fontSize: 15 }}>
              &#8592; Back to Sign In
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
