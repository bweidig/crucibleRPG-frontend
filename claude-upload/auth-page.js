'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import Link from 'next/link';
import { post, setToken, setUser } from '@/lib/api';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import ParticleField from '@/components/ParticleField';
import styles from './page.module.css';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

function InputField({ label, type = 'text', placeholder, value, onChange, autoComplete, children }) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ marginBottom: 16 }}>
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
            border: `1px solid ${focused ? 'var(--border-card-hover)' : 'rgba(201, 168, 76, 0.22)'}`,
            borderRadius: 6, padding: '13px 16px',
            fontFamily: 'var(--font-alegreya-sans)', fontSize: 16, color: 'var(--text-primary)',
            outline: 'none', boxSizing: 'border-box',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            boxShadow: focused ? 'rgba(201,168,76,0.15) 0 0 0 3px, rgba(201,168,76,0.08) 0 0 16px' : 'none',
          }}
        />
        {children}
      </div>
    </div>
  );
}

function Divider({ text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '18px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border-gold-faint)' }} />
      <span style={{
        fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: 'var(--gold-muted)',
      }}>{text}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border-gold-faint)' }} />
    </div>
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
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [confirmedAge, setConfirmedAge] = useState(false);
  const [playtestRequest, setPlaytestRequest] = useState(false);
  const [playtestAbout, setPlaytestAbout] = useState('');
  const [playtestSource, setPlaytestSource] = useState('');
  const [signupComplete, setSignupComplete] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [gsiReady, setGsiReady] = useState(false);

  const googleBtnRef = useRef(null);
  const modeRef = useRef(mode);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  const handleGoogleResponse = useCallback(async (response) => {
    setError('');
    setLoading(true);
    try {
      const data = await post('/api/auth/google', {
        credential: response.credential,
      });
      setToken(data.token);
      if (data.user) setUser(data.user);
      router.push(data.user?.isPlaytester ? '/menu' : '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Render the Google button once GSI script loads
  useEffect(() => {
    if (!gsiReady || !GOOGLE_CLIENT_ID || !googleBtnRef.current) return;
    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        type: 'standard',
        theme: 'filled_black',
        size: 'large',
        text: 'continue_with',
        width: 368,
        logo_alignment: 'left',
      });
    } catch (e) {
      console.error('Google Sign-In init error:', e);
    }
  }, [gsiReady, handleGoogleResponse]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (mode === 'forgot') return;

    if (mode === 'signup') {
      if (!displayName.trim()) { setError('Display name is required.'); return; }
      if (!email.trim()) { setError('Email is required.'); return; }
      if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
      if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
      if (!agreedToTerms) { setError('You must agree to the Terms of Service.'); return; }
      if (!confirmedAge) { setError('You must confirm you are 18 or older.'); return; }
    } else {
      if (!email.trim()) { setError('Email is required.'); return; }
      if (!password) { setError('Password is required.'); return; }
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const body = { email, password, displayName };
        if (playtestRequest) {
          body.playtestRequest = true;
          body.playtestAbout = playtestAbout.trim() || null;
          body.playtestSource = playtestSource.trim() || null;
        }
        const data = await post('/api/auth/signup', body);
        setToken(data.token);
        if (data.user) setUser(data.user);
        if (playtestRequest) {
          setSignupComplete(true);
          return;
        }
      } else {
        const data = await post('/api/auth/login', { email, password });
        setToken(data.token);
        if (data.user) setUser(data.user);
      }
      router.push('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function switchMode(newMode) {
    setMode(newMode);
    setError('');
    setConfirmedAge(false);
  }

  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setLoaded(true); }, []);

  return (
    <div className={styles.pageContainer} style={{
      minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)',
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden', paddingTop: 72,
    }}>
      <ParticleField />
      <NavBar />

      {/* Google Identity Services script */}
      {GOOGLE_CLIENT_ID && (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onLoad={() => setGsiReady(true)}
        />
      )}

      {/* Center the form card in remaining space */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', zIndex: 1,
        padding: '24px clamp(16px, 5vw, 32px)',
      }}>
        {/* Card */}
        <form onSubmit={handleSubmit} className={styles.authCard} style={{
        width: '100%', maxWidth: 440, padding: '32px 28px', position: 'relative', zIndex: 1,
        background: 'var(--bg-card)', border: '1px solid rgba(201,168,76,0.08)', borderRadius: 12,
        backdropFilter: 'blur(20px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      }}>
        {/* Signup complete confirmation */}
        {signupComplete ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <h1 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 22, fontWeight: 700, color: 'var(--accent-gold)', marginBottom: 16 }}>
              You're on the list.
            </h1>
            <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 28 }}>
              We'll review your request and let you know when your access is ready. In the meantime, feel free to explore the site.
            </p>
            <Link href="/" style={{
              fontFamily: 'var(--font-cinzel)', fontSize: 13, fontWeight: 600,
              color: 'var(--accent-gold)', background: 'transparent',
              border: '1px solid var(--border-card)', borderRadius: 6, padding: '12px 28px',
              textDecoration: 'none', letterSpacing: '0.08em',
            }}>Back to Home</Link>
          </div>
        ) : (
        <>
        {/* Header */}
        <div className={loaded ? styles.stagger0 : styles.staggerHidden} style={{ textAlign: 'center', marginBottom: 20 }}>
          <h1 style={{
            fontFamily: 'var(--font-cinzel)', fontSize: 28, fontWeight: 700, color: 'var(--text-heading)',
            marginBottom: 14,
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
          <div className={loaded ? styles.stagger1 : styles.staggerHidden} style={{
            display: 'flex', marginBottom: 20, background: 'rgba(0, 0, 0, 0.25)', borderRadius: 6, padding: 3,
            border: '1px solid var(--border-gold-faint)',
          }}>
            {[
              { id: 'signup', label: 'Sign Up' },
              { id: 'signin', label: 'Sign In' },
            ].map(tab => (
              <button key={tab.id} type="button" onClick={() => switchMode(tab.id)}
                className={mode === tab.id ? styles.tabActive : styles.tabInactive}
                style={{
                  flex: 1, padding: '10px 0', cursor: 'pointer',
                  fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, fontWeight: 600,
                  borderRadius: 4,
                }}>{tab.label}</button>
            ))}
          </div>
        )}

        <div className={loaded ? styles.stagger2 : styles.staggerHidden}>
        {/* Google Sign-In button */}
        {mode !== 'forgot' && GOOGLE_CLIENT_ID && (
          <div style={{ marginBottom: 0 }}>
            <div ref={googleBtnRef} style={{
              position: 'absolute', width: 0, height: 0, overflow: 'hidden', opacity: 0, pointerEvents: 'none',
            }} />
            <button type="button" className={styles.googleBtn} onClick={() => {
              const iframe = googleBtnRef.current?.querySelector('div[role="button"]');
              if (iframe) { iframe.click(); return; }
              try { window.google.accounts.id.prompt(); } catch {}
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#ffffff" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#ffffff" fillOpacity="0.85" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.28 5.4l3.56-2.77.01-.54z" fill="#ffffff" fillOpacity="0.7" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.72 14.97.5 12 .5 7.7.5 3.99 2.97 2.18 6.57l3.66 2.84c.87-2.6 3.3-4.03 6.16-4.03z" fill="#ffffff" fillOpacity="0.55" />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>
        )}
        </div>

        <div className={loaded ? styles.stagger3 : styles.staggerHidden}>
        <Divider text="or" />
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            background: '#201416', border: '1px solid #5a3020', borderRadius: 6,
            padding: '10px 14px', marginBottom: 18,
            fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: 'var(--color-danger)',
          }}>{error}</div>
        )}

        <div className={loaded ? styles.stagger4 : styles.staggerHidden}>
        {/* Sign Up form */}
        {mode === 'signup' && (
          <>
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
                  border: `1px solid ${agreedToTerms ? 'var(--accent-gold)' : 'var(--text-dim)'}`,
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
                <a href="/terms" target="_blank" className={styles.legalLink}>Terms of Service</a>
                {' '}and{' '}
                <a href="/privacy" target="_blank" className={styles.legalLink}>Privacy Policy</a>
              </span>
            </div>

            {/* Age confirmation */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 22,
            }}>
              <div
                onClick={() => setConfirmedAge(!confirmedAge)}
                style={{
                  width: 20, height: 20, borderRadius: 4, flexShrink: 0, marginTop: 1,
                  border: `1px solid ${confirmedAge ? 'var(--accent-gold)' : 'var(--text-dim)'}`,
                  background: confirmedAge ? 'var(--bg-gold-light)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {confirmedAge && <span style={{ color: 'var(--accent-gold)', fontSize: 13, lineHeight: 1 }}>&#10003;</span>}
              </div>
              <span style={{
                fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5,
              }}>I am 18 years of age or older</span>
            </div>

            {/* Playtest request */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: playtestRequest ? 12 : 22,
            }}>
              <div
                onClick={() => setPlaytestRequest(!playtestRequest)}
                style={{
                  width: 20, height: 20, borderRadius: 4, flexShrink: 0, marginTop: 1,
                  border: `1px solid ${playtestRequest ? 'var(--accent-gold)' : 'var(--text-dim)'}`,
                  background: playtestRequest ? 'var(--bg-gold-light)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {playtestRequest && <span style={{ color: 'var(--accent-gold)', fontSize: 13, lineHeight: 1 }}>&#10003;</span>}
              </div>
              <span style={{
                fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5,
              }}>I'd like to request playtest access</span>
            </div>

            {playtestRequest && (
              <div style={{ marginBottom: 22, overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 7 }}>Tell us a bit about yourself</label>
                  <textarea
                    value={playtestAbout}
                    onChange={e => setPlaytestAbout(e.target.value)}
                    placeholder="What kind of games do you play?"
                    maxLength={1000}
                    rows={3}
                    style={{
                      width: '100%', background: 'var(--bg-input)',
                      border: '1px solid rgba(201, 168, 76, 0.22)',
                      borderRadius: 6, padding: '13px 16px',
                      fontFamily: 'var(--font-alegreya-sans)', fontSize: 16, color: 'var(--text-primary)',
                      outline: 'none', boxSizing: 'border-box', resize: 'vertical',
                    }}
                  />
                </div>
                <InputField
                  label="How did you hear about CrucibleRPG?"
                  placeholder="A friend, social media, search..."
                  value={playtestSource}
                  onChange={e => setPlaytestSource(e.target.value)}
                />
              </div>
            )}
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

        </div>{/* end stagger4 */}

        {/* Submit */}
        <div className={loaded ? styles.stagger5 : styles.staggerHidden}>
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
        </div>{/* end stagger5 */}
        </>
        )}
      </form>
      </div>

      <Footer />
    </div>
  );
}
