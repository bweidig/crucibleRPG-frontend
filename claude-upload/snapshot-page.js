'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import * as api from '@/lib/api';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import ParticleField from '@/components/ParticleField';

function formatDate(iso) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return null; }
}

function typeLabel(type) {
  if (type === 'fresh_start') return 'Fresh Start';
  if (type === 'branch') return 'Branch';
  return type || 'Snapshot';
}

function StatBlock({ label, value }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontFamily: 'var(--font-jetbrains)', fontSize: 22, fontWeight: 700,
        color: 'var(--accent-gold)', lineHeight: 1,
      }}>{value}</div>
      <div style={{
        fontFamily: 'var(--font-cinzel)', fontSize: 11, fontWeight: 600,
        color: 'var(--text-muted)', letterSpacing: '0.08em',
        textTransform: 'uppercase', marginTop: 6,
      }}>{label}</div>
    </div>
  );
}

function MetaRow({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, padding: '8px 0' }}>
      <span style={{
        fontFamily: 'var(--font-cinzel)', fontSize: 11, fontWeight: 600,
        color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase',
      }}>{label}</span>
      <span style={{
        fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, color: 'var(--text-primary)',
        textAlign: 'right',
      }}>{value}</span>
    </div>
  );
}

export default function SnapshotLandingPage() {
  const router = useRouter();
  const params = useParams();
  const token = params?.token;

  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { setLoaded(true); }, []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.fetchSnapshotPreview(token);
        if (cancelled) return;
        setSnapshot(res.snapshot || res);
      } catch (err) {
        if (cancelled) return;
        if (err.status === 404) {
          setError('not_found');
        } else {
          setError(err.message || 'Failed to load this world.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const handleImport = useCallback(async () => {
    if (!token || importing) return;
    setImportError(null);

    if (!api.isAuthenticated()) {
      router.push(`/auth?redirect=/snapshot/${token}`);
      return;
    }

    setImporting(true);
    try {
      const res = await api.importSharedSnapshot(token);
      const newGameId = res.gameId;
      if (!newGameId) throw new Error('Import returned no game id.');
      try { sessionStorage.removeItem('crucible_init_gameId'); } catch {}
      router.push(`/init?gameId=${newGameId}`);
    } catch (err) {
      setImportError(err.message || 'Failed to import this world. Please try again.');
      setImporting(false);
    }
  }, [token, importing, router]);

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)',
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden', paddingTop: 72,
    }}>
      <ParticleField />
      <NavBar />

      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', zIndex: 1,
        padding: '24px clamp(16px, 5vw, 32px)',
      }}>
        <div style={{
          width: '100%', maxWidth: 540, padding: 'clamp(24px, 4vw, 40px) clamp(20px, 4vw, 36px)',
          background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 12,
          backdropFilter: 'blur(20px)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
          opacity: loaded ? 1 : 0, transition: 'opacity 0.4s ease',
        }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{
                fontFamily: 'var(--font-cinzel)', fontSize: 13, fontWeight: 600,
                color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase',
              }}>Loading world...</div>
            </div>
          )}

          {!loading && error === 'not_found' && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <h1 style={{
                fontFamily: 'var(--font-cinzel)', fontSize: 22, fontWeight: 700,
                color: 'var(--text-heading)', marginBottom: 14,
              }}>This world is no longer available</h1>
              <p style={{
                fontFamily: 'var(--font-alegreya-sans)', fontSize: 15, color: 'var(--text-secondary)',
                lineHeight: 1.6, marginBottom: 28,
              }}>The share link has expired, or the world's creator has removed it.</p>
              <Link href="/" style={{
                display: 'inline-block',
                fontFamily: 'var(--font-cinzel)', fontSize: 13, fontWeight: 600,
                color: 'var(--accent-gold)', background: 'transparent',
                border: '1px solid var(--border-card)', borderRadius: 6, padding: '12px 28px',
                textDecoration: 'none', letterSpacing: '0.08em',
              }}>Back to Home</Link>
            </div>
          )}

          {!loading && error && error !== 'not_found' && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <h1 style={{
                fontFamily: 'var(--font-cinzel)', fontSize: 20, fontWeight: 700,
                color: 'var(--text-heading)', marginBottom: 14,
              }}>Something went wrong</h1>
              <p style={{
                fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: 'var(--color-danger)',
                lineHeight: 1.6, marginBottom: 24,
              }}>{error}</p>
              <Link href="/" style={{
                display: 'inline-block',
                fontFamily: 'var(--font-cinzel)', fontSize: 13, fontWeight: 600,
                color: 'var(--accent-gold)', background: 'transparent',
                border: '1px solid var(--border-card)', borderRadius: 6, padding: '12px 28px',
                textDecoration: 'none', letterSpacing: '0.08em',
              }}>Back to Home</Link>
            </div>
          )}

          {!loading && !error && snapshot && (
            <>
              <div style={{
                textAlign: 'center', paddingBottom: 20,
                borderBottom: '1px solid var(--border-gold-faint)', marginBottom: 22,
              }}>
                <div style={{
                  fontFamily: 'var(--font-cinzel)', fontSize: 11, fontWeight: 600,
                  color: 'var(--text-muted)', letterSpacing: '0.14em',
                  textTransform: 'uppercase', marginBottom: 12,
                }}>Shared World</div>
                <h1 style={{
                  fontFamily: 'var(--font-cinzel)', fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 700,
                  color: 'var(--text-heading)', margin: 0, lineHeight: 1.2,
                }}>{snapshot.worldName || snapshot.name || 'Untitled World'}</h1>
                {snapshot.worldName && snapshot.name && (
                  <div style={{
                    fontFamily: 'var(--font-alegreya-sans)', fontSize: 14,
                    color: 'var(--text-muted)', lineHeight: 1.4, marginTop: 8,
                  }}>{snapshot.name}</div>
                )}
                {snapshot.description && (
                  <p style={{
                    fontFamily: 'var(--font-alegreya)', fontSize: 16, fontStyle: 'italic',
                    color: 'var(--text-secondary)', lineHeight: 1.55,
                    marginTop: 14, marginBottom: 0,
                  }}>{snapshot.description}</p>
                )}
              </div>

              <div style={{
                display: 'flex', justifyContent: 'space-around', alignItems: 'center',
                padding: '4px 0 20px', gap: 12,
              }}>
                <StatBlock label="Factions" value={snapshot.factionCount ?? 0} />
                <StatBlock label="NPCs" value={snapshot.npcCount ?? 0} />
                <StatBlock label="Locations" value={snapshot.locationCount ?? 0} />
              </div>

              {((snapshot.factionNames?.length > 0) || (snapshot.locationNames?.length > 0)) && (
                <div style={{
                  borderTop: '1px solid var(--border-gold-faint)',
                  padding: '14px 0',
                }}>
                  {snapshot.factionNames?.length > 0 && (
                    <div style={{ marginBottom: snapshot.locationNames?.length > 0 ? 12 : 0 }}>
                      <div style={{
                        fontFamily: 'var(--font-cinzel)', fontSize: 11, fontWeight: 600,
                        color: 'var(--text-muted)', letterSpacing: '0.08em',
                        textTransform: 'uppercase', marginBottom: 4,
                      }}>Factions</div>
                      <div style={{
                        fontFamily: 'var(--font-alegreya-sans)', fontSize: 14,
                        color: '#b0bec5', lineHeight: 1.5,
                      }}>{snapshot.factionNames.join(', ')}</div>
                    </div>
                  )}
                  {snapshot.locationNames?.length > 0 && (
                    <div>
                      <div style={{
                        fontFamily: 'var(--font-cinzel)', fontSize: 11, fontWeight: 600,
                        color: 'var(--text-muted)', letterSpacing: '0.08em',
                        textTransform: 'uppercase', marginBottom: 4,
                      }}>Locations</div>
                      <div style={{
                        fontFamily: 'var(--font-alegreya-sans)', fontSize: 14,
                        color: '#b0bec5', lineHeight: 1.5,
                      }}>{snapshot.locationNames.join(', ')}</div>
                    </div>
                  )}
                </div>
              )}

              <div style={{
                padding: '14px 0',
                borderTop: '1px solid var(--border-gold-faint)',
                borderBottom: '1px solid var(--border-gold-faint)',
                marginBottom: 24,
              }}>
                {!snapshot.worldName && <MetaRow label="Setting" value={snapshot.setting} />}
                <MetaRow label="Storyteller" value={snapshot.storyteller} />
                <MetaRow label="Type" value={typeLabel(snapshot.type)} />
                <MetaRow label="Created by" value={snapshot.createdBy} />
                <MetaRow label="Date" value={formatDate(snapshot.createdAt)} />
              </div>

              {importError && (
                <div style={{
                  background: '#201416', border: '1px solid #5a3020', borderRadius: 6,
                  padding: '10px 14px', marginBottom: 16,
                  fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: 'var(--color-danger)',
                }}>{importError}</div>
              )}

              <button
                type="button"
                onClick={handleImport}
                disabled={importing}
                style={{
                  width: '100%', padding: '14px 24px',
                  background: 'transparent',
                  border: '1px solid var(--accent-gold)', borderRadius: 6,
                  fontFamily: 'var(--font-cinzel)', fontSize: 14, fontWeight: 700,
                  color: 'var(--accent-gold)', letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: importing ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s, color 0.2s',
                  opacity: importing ? 0.6 : 1,
                }}
                onMouseEnter={e => {
                  if (!importing) {
                    e.currentTarget.style.background = 'var(--accent-gold)';
                    e.currentTarget.style.color = 'var(--bg-main)';
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--accent-gold)';
                }}
              >
                {importing ? 'Importing...' : 'Import This World'}
              </button>

              <p style={{
                fontFamily: 'var(--font-alegreya)', fontSize: 14, fontStyle: 'italic',
                color: 'var(--text-muted)', textAlign: 'center',
                marginTop: 14, marginBottom: 0,
              }}>Start your own story in this world.</p>

              <div style={{ textAlign: 'center', marginTop: 22 }}>
                <Link href="/menu" style={{
                  fontFamily: 'var(--font-alegreya-sans)', fontSize: 13,
                  color: 'var(--text-muted)', textDecoration: 'none',
                  borderBottom: '1px solid var(--border-gold-faint)', paddingBottom: 1,
                }}>or create your own world &rarr;</Link>
              </div>
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
