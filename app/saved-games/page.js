'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated, getUser } from '@/lib/api';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import ParticleField from '@/components/ParticleField';
import styles from './page.module.css';

// --- SAMPLE DATA ---

const SAMPLE_SAVES = [
  {
    id: 'save-1',
    characterName: 'Kael Ashford',
    title: 'Former Investigator',
    setting: 'Dark Fantasy',
    settingName: 'The Dockside Conspiracy',
    storyteller: 'The Chronicler',
    difficulty: 'Standard',
    turnCount: 48,
    dayCount: 3,
    lastPlayed: '2 hours ago',
    lastLocation: 'The Rusted Lantern, Dockside Quarter',
    summary: 'You arrived in the Dockside Quarter three days ago, following rumors of unmarked cargo. After eavesdropping on dockworkers at The Rusted Lantern, you learned that the Veymar consortium is moving something through the harbor under cover of night. Your ribs are still bruised from an alley encounter on day one.',
  },
  {
    id: 'save-2',
    characterName: 'Sera Voss',
    title: 'Smuggler Captain',
    setting: 'Sci-Fi',
    settingName: 'The Kepler Run',
    storyteller: 'The Noir',
    difficulty: 'Harsh',
    turnCount: 127,
    dayCount: 11,
    lastPlayed: '3 days ago',
    lastLocation: 'Cargo Bay 7, Freeport Station',
    summary: "Eleven days out from Port Calloway and the job has gone sideways. The cargo you were hired to move turned out to be a person, and now three factions want what's in your hold. Freeport Station was supposed to be a fuel stop, not a standoff.",
  },
  {
    id: 'save-3',
    characterName: 'Brother Aldric',
    title: 'Wandering Herbalist',
    setting: 'Sword & Soil',
    settingName: 'The Autumn March',
    storyteller: 'The Poet',
    difficulty: 'Brutal',
    turnCount: 312,
    dayCount: 34,
    lastPlayed: '2 weeks ago',
    lastLocation: 'The Greywood, Western Reach',
    summary: "The Greywood has been unkind. Thirty-four days of walking, foraging, and avoiding the patrols that burned your monastery. You've gathered enough herbs to trade, but the winter is closing in and the next settlement is still days away. The wound in your side is healing slowly.",
  },
  {
    id: 'save-4',
    characterName: 'Jinx',
    title: 'Street Kid',
    setting: 'Cyberpunk',
    settingName: 'Neon Divide',
    storyteller: 'The Chronicler',
    difficulty: 'Forgiving',
    turnCount: 15,
    dayCount: 1,
    lastPlayed: '1 month ago',
    lastLocation: 'Kowloon Block, Level 14',
    summary: "You woke up in a stranger's apartment on Level 14 with no memory of last night and a new tattoo on your wrist. Someone left a note with an address and the word 'midnight.' Your fixer hasn't returned your calls in two days.",
  },
];

// --- DIFFICULTY BADGE ---

function DifficultyBadge({ difficulty }) {
  const colors = {
    Forgiving: { text: 'var(--badge-forgiving-text)', bg: 'var(--badge-forgiving-bg)', border: 'var(--badge-forgiving-border)' },
    Standard: { text: 'var(--badge-standard-text)', bg: 'var(--badge-standard-bg)', border: 'var(--badge-standard-border)' },
    Harsh: { text: 'var(--badge-harsh-text)', bg: 'var(--badge-harsh-bg)', border: 'var(--badge-harsh-border)' },
    Brutal: { text: 'var(--badge-brutal-text)', bg: 'var(--badge-brutal-bg)', border: 'var(--badge-brutal-border)' },
  };
  const c = colors[difficulty] || colors.Standard;
  return (
    <span style={{
      fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 700,
      color: c.text, background: c.bg,
      padding: '4px 12px', borderRadius: 4, letterSpacing: '0.1em',
      border: `1px solid ${c.border}`,
    }}>{difficulty.toUpperCase()}</span>
  );
}

// --- STAT PAIR ---

function StatPair({ label, value, mono, wide }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: wide ? 200 : 'auto' }}>
      <span style={{
        fontFamily: 'var(--font-cinzel)', fontSize: 11, fontWeight: 600,
        color: 'var(--gold-muted)', letterSpacing: '0.14em',
      }}>{label}</span>
      <span style={{
        fontFamily: mono ? 'var(--font-jetbrains)' : 'var(--font-alegreya-sans)',
        fontSize: 15, fontWeight: 500,
        color: 'var(--text-stat-bright)',
      }}>{value}</span>
    </div>
  );
}

// --- STORY SUMMARY TOGGLE ---

function StorySummary({ summary }) {
  const [open, setOpen] = useState(false);
  const contentRef = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [summary]);

  return (
    <div>
      <button
        className={styles.storyToggle}
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 0 0', borderTop: '1px solid var(--border-card-separator)',
          background: 'none', border: 'none', borderTopStyle: 'solid', borderTopWidth: 1,
          borderTopColor: 'var(--border-card-separator)', cursor: 'pointer',
        }}
      >
        <span style={{
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 13,
          color: 'var(--text-secondary-bright)',
        }}>Story so far</span>
        <span style={{
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 11,
          color: 'var(--text-secondary-bright)',
        }}>{open ? '\u25B2' : '\u25BC'}</span>
      </button>
      <div style={{
        overflow: 'hidden',
        maxHeight: open ? height : 0,
        transition: 'max-height 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        <p ref={contentRef} style={{
          fontFamily: 'var(--font-alegreya)', fontSize: 14, fontStyle: 'italic',
          color: 'var(--text-secondary)', lineHeight: 1.6,
          padding: '12px 0',
          margin: 0,
        }}>{summary}</p>
      </div>
    </div>
  );
}

// --- DELETE CONFIRMATION MODAL ---

function DeleteModal({ save, onConfirm, onCancel }) {
  const [typed, setTyped] = useState('');
  const [shaking, setShaking] = useState(false);
  const matches = typed === save.characterName;

  const handleDelete = () => {
    if (matches) {
      onConfirm(save.id);
    } else {
      setShaking(true);
      setTimeout(() => setShaking(false), 400);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
      }} onClick={onCancel} />
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 10,
        padding: '32px 36px', maxWidth: 440, width: '90%',
        position: 'relative', zIndex: 1,
        animation: 'fadeInUp 0.3s ease',
      }}>
        {/* Warning icon */}
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: '#201620', border: '1px solid #361d27',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </div>

        <h3 style={{
          fontFamily: 'var(--font-cinzel)', fontSize: 18, fontWeight: 700,
          color: 'var(--text-heading)', textAlign: 'center', marginBottom: 8,
        }}>Delete this campaign?</h3>

        <p style={{
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 15,
          color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.6, marginBottom: 24,
        }}>
          This will permanently delete <strong style={{ color: 'var(--text-heading)' }}>{save.characterName}</strong>&apos;s
          campaign in <em>{save.settingName}</em>. {save.turnCount} turns of progress will be lost. This cannot be undone.
        </p>

        <label style={{
          fontFamily: 'var(--font-alegreya-sans)', fontSize: 13,
          color: 'var(--text-secondary-bright)', display: 'block', marginBottom: 8,
        }}>
          Type <strong style={{ color: 'var(--text-heading)' }}>{save.characterName}</strong> to confirm
        </label>

        <input
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={save.characterName}
          style={{
            width: '100%', padding: '10px 14px',
            background: 'var(--bg-main)', border: `1px solid ${matches ? '#79343a' : 'var(--border-primary)'}`,
            borderRadius: 6, fontFamily: 'var(--font-alegreya-sans)', fontSize: 15,
            color: 'var(--text-primary)', outline: 'none',
            transition: 'border-color 0.2s',
            animation: shaking ? 'shake 0.3s ease' : 'none',
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleDelete(); }}
          autoFocus
        />

        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button
            className={styles.deleteCancelBtn}
            onClick={onCancel}
            style={{
              flex: 1, padding: '11px 0',
              fontFamily: 'var(--font-cinzel)', fontSize: 13, fontWeight: 600,
              color: 'var(--text-secondary-bright)', letterSpacing: '0.06em',
              background: 'transparent', border: '1px solid var(--border-primary)', borderRadius: 6,
            }}
          >CANCEL</button>
          <button
            className={matches ? styles.deleteConfirmBtn : undefined}
            onClick={handleDelete}
            style={{
              flex: 1, padding: '11px 0',
              fontFamily: 'var(--font-cinzel)', fontSize: 13, fontWeight: 600,
              color: matches ? '#ffffff' : '#5a4a4a', letterSpacing: '0.06em',
              background: matches ? '#b83a3a' : '#2a1a1a',
              border: `1px solid ${matches ? '#c84a4a' : '#3a2020'}`, borderRadius: 6,
              cursor: matches ? 'pointer' : 'not-allowed',
              opacity: matches ? 1 : 0.5,
            }}
          >DELETE FOREVER</button>
        </div>
      </div>
    </div>
  );
}

// --- SAVE CARD ---

function SaveCard({ save, index, onLoad, onDelete }) {
  return (
    <div
      className={styles.saveCard}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-card)',
        borderRadius: 10, padding: '28px 32px',
        width: '100%',
        animation: `fadeInUp 0.5s ease ${0.1 + index * 0.08}s both`,
      }}
    >
      {/* Top row: character name + difficulty */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 6,
      }}>
        <div style={{
          fontFamily: 'var(--font-cinzel)', fontSize: 20, fontWeight: 700,
          color: 'var(--text-heading)', letterSpacing: '0.03em',
        }}>{save.characterName}</div>
        <DifficultyBadge difficulty={save.difficulty} />
      </div>

      {/* Title */}
      <div style={{
        fontFamily: 'var(--font-alegreya)', fontSize: 15, fontStyle: 'italic',
        color: 'var(--text-secondary-bright)', marginBottom: 16,
      }}>{save.title} &middot; {save.settingName}</div>

      {/* Stats row */}
      <div style={{
        display: 'flex', gap: 28, marginBottom: 20, flexWrap: 'wrap',
      }}>
        <StatPair label="SETTING" value={save.setting} />
        <StatPair label="STORYTELLER" value={save.storyteller} />
        <StatPair label="TURNS" value={save.turnCount.toString()} mono />
        <StatPair label="DAYS" value={save.dayCount.toString()} mono />
        <StatPair label="LAST LOCATION" value={save.lastLocation} wide />
      </div>

      {/* Story summary toggle */}
      <StorySummary summary={save.summary} />

      {/* Actions row */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderTop: '1px solid var(--border-card-separator)', paddingTop: 16,
        marginTop: 12,
      }}>
        {/* Last played */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary-bright)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          <span style={{
            fontFamily: 'var(--font-alegreya-sans)', fontSize: 13,
            color: 'var(--text-secondary-bright)',
          }}>{save.lastPlayed}</span>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {/* Delete */}
          <button
            className={styles.btnDanger}
            onClick={() => onDelete(save)}
            style={{
              background: 'none', border: 'none',
              fontFamily: 'var(--font-alegreya-sans)', fontSize: 13,
              color: 'var(--text-secondary-bright)', padding: '6px 10px',
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            Delete
          </button>

          {/* Load */}
          <button
            className={styles.btnPrimary}
            onClick={() => onLoad(save.id)}
            style={{
              fontFamily: 'var(--font-cinzel)', fontSize: 13, fontWeight: 700,
              color: 'var(--bg-main)', letterSpacing: '0.08em',
              background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-bright))',
              border: 'none', borderRadius: 5, padding: '10px 28px',
            }}
          >LOAD</button>
        </div>
      </div>
    </div>
  );
}

// --- EMPTY STATE ---

function EmptyState() {
  return (
    <div style={{
      textAlign: 'center', padding: '80px 24px',
      animation: 'fadeInUp 0.6s ease 0.2s both',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: '#13151c', border: '1px solid var(--border-primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 24px',
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--border-card)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      </div>
      <div style={{
        fontFamily: 'var(--font-cinzel)', fontSize: 20, fontWeight: 700,
        color: 'var(--text-heading)', marginBottom: 10,
      }}>No saved campaigns yet</div>
      <p style={{
        fontFamily: 'var(--font-alegreya)', fontSize: 16, fontStyle: 'italic',
        color: 'var(--text-secondary-bright)', lineHeight: 1.6, maxWidth: 380, margin: '0 auto 28px',
      }}>Every story starts with a single step. Create your first character and begin your adventure.</p>
      <Link
        href="/init"
        className={styles.btnPrimary}
        style={{
          fontFamily: 'var(--font-cinzel)', fontSize: 14, fontWeight: 700,
          color: 'var(--bg-main)', letterSpacing: '0.1em',
          background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-bright))',
          border: 'none', borderRadius: 5, padding: '14px 40px',
          textDecoration: 'none', display: 'inline-block',
        }}
      >BEGIN YOUR STORY</Link>
    </div>
  );
}

// --- MAIN ---

export default function SavedGamesPage() {
  const router = useRouter();
  const [saves, setSaves] = useState(SAMPLE_SAVES);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/auth'); return; }
    const user = getUser();
    if (user && !user.isPlaytester) { router.replace('/'); return; }
    setTimeout(() => setLoaded(true), 100);
  }, [router]);

  const handleDelete = (saveId) => {
    setSaves((prev) => prev.filter((s) => s.id !== saveId));
    setDeleteTarget(null);
  };

  return (
    <div className={styles.pageContainer} style={{
      minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)',
      position: 'relative', display: 'flex', flexDirection: 'column',
    }}>
      <ParticleField />
      <NavBar />

      {/* Content area */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '20px clamp(24px, 4vw, 56px) 60px',
        position: 'relative', zIndex: 1,
      }}>
        {/* Page header */}
        <div style={{
          textAlign: 'center', marginBottom: 40,
          opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(12px)',
          transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1) 0.15s',
        }}>
          <h1 style={{
            fontFamily: 'var(--font-cinzel)', fontSize: 'clamp(24px, 3vw, 32px)',
            fontWeight: 700, color: 'var(--text-heading)', letterSpacing: '0.04em',
            marginBottom: 10,
          }}>Saved Campaigns</h1>
          <p style={{
            fontFamily: 'var(--font-alegreya)', fontSize: 17, fontStyle: 'italic',
            color: 'var(--text-secondary-bright)',
          }}>
            {saves.length > 0
              ? `${saves.length} ${saves.length === 1 ? 'story' : 'stories'} in progress`
              : 'Your adventures will appear here'
            }
          </p>
        </div>

        {/* Save cards */}
        <div style={{
          width: '100%', maxWidth: 640,
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          {saves.length > 0
            ? saves.map((save, i) => (
                <SaveCard
                  key={save.id}
                  save={save}
                  index={i}
                  onLoad={(id) => console.log(`Loading campaign: ${id}`)}
                  onDelete={(s) => setDeleteTarget(s)}
                />
              ))
            : <EmptyState />
          }
        </div>
      </div>

      <Footer variant="minimal" />

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <DeleteModal
          save={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
