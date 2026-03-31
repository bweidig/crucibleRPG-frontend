'use client';

import { useState } from 'react';
import { post } from '@/lib/api';

const C = {
  bg: '#0a0e1a', panelBg: '#0d1120', cardBg: '#111528', inputBg: '#0a0e1a',
  resolutionBg: '#0e1420', text: '#c8c0b0', heading: '#d0c098', secondary: '#8a94a8',
  muted: '#7082a4', dim: '#6b83a3', accent: '#c9a84c', accentBright: '#ddb84e',
  danger: '#e8845a', success: '#8aba7a', border: '#1e2540', borderLight: '#161c34',
  overlay: 'rgba(0,0,0,0.6)',
};

const BUG_CATEGORIES = [
  { id: 'dice', label: 'Dice / Resolution' },
  { id: 'narrative', label: 'Story / Narrative' },
  { id: 'ui', label: 'UI / Display' },
  { id: 'inventory', label: 'Inventory / Items' },
  { id: 'npc', label: 'NPCs / Factions' },
  { id: 'other', label: 'Other' },
];

const SUGGEST_CATEGORIES = [
  { id: 'feature', label: 'New Feature' },
  { id: 'ui', label: 'UI Improvement' },
  { id: 'balance', label: 'Game Balance' },
  { id: 'story', label: 'Storytelling' },
  { id: 'other', label: 'Other' },
];

const LABEL_MAP = {
  gameId: 'Game ID',
  turnNumber: 'Turn',
  sessionTurn: 'Session Turn',
  characterName: 'Character',
  setting: 'Setting',
  storyteller: 'Storyteller',
  difficulty: 'Difficulty',
  lastPlayerAction: 'Last Action',
  lastNarrative: 'Last Narrative',
  'lastResolution.stat': 'Roll Stat',
  'lastResolution.effectiveValue': 'Effective Value',
  'lastResolution.skillUsed': 'Skill Used',
  'lastResolution.fortunesBalance': "Fortune's Balance",
  'lastResolution.diceRolled': 'Dice',
  'lastResolution.dc': 'DC',
  'lastResolution.total': 'Roll Total',
  'lastResolution.margin': 'Margin',
  'lastResolution.tier': 'Outcome Tier',
  'lastStateChanges.conditionsAdded': 'Conditions Added',
  'lastStateChanges.conditionsRemoved': 'Conditions Removed',
  'lastStateChanges.inventoryAdded': 'Items Gained',
  'lastStateChanges.inventoryRemoved': 'Items Lost',
  activeConditions: 'Active Conditions',
  currentLocation: 'Location',
  weather: 'Weather',
  'inGameTime.day': 'Day',
  'inGameTime.hour': 'Hour',
  prevPlayerAction: 'Previous Action',
  prevTurnNumber: 'Previous Turn',
  aiModel: 'AI Model',
  aiLatency: 'AI Latency',
  browser: 'Browser',
  windowSize: 'Window Size',
};

function flattenContext(ctx, prefix = '') {
  const flat = [];
  for (const [key, val] of Object.entries(ctx || {})) {
    if (val == null) continue;
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof val === 'object' && !Array.isArray(val)) {
      flat.push(...flattenContext(val, fullKey));
    } else if (Array.isArray(val) && val.length > 0) {
      flat.push([fullKey, val.map(v => typeof v === 'object' ? (v.name || JSON.stringify(v)) : v).join(', ')]);
    } else if (!Array.isArray(val)) {
      flat.push([fullKey, val]);
    }
  }
  return flat;
}

function ContextPreview({ mode, context }) {
  const [expanded, setExpanded] = useState(false);
  const entries = flattenContext(context);
  if (entries.length === 0) return null;

  return (
    <div style={{
      background: C.resolutionBg, border: `1px solid ${C.borderLight}`, borderRadius: 6,
      overflow: 'hidden', marginBottom: 16,
    }}>
      <button onClick={() => setExpanded(!expanded)} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', padding: '10px 14px', cursor: 'pointer',
        background: 'transparent', border: 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
          </svg>
          <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: C.dim }}>
            {mode === 'bug' ? 'Debug snapshot auto-attached' : 'Game context auto-attached'}
            <span style={{ color: C.muted, marginLeft: 6 }}>({entries.length} fields)</span>
          </span>
        </div>
        <span style={{ color: C.dim, fontSize: 10, transform: expanded ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}>{'\u25BC'}</span>
      </button>
      {expanded && (
        <div style={{ padding: '0 14px 12px', maxHeight: 300, overflowY: 'auto' }}>
          {entries.map(([key, val], i) => (
            <div key={key} style={{
              display: 'flex', justifyContent: 'space-between', padding: '3px 0',
              borderBottom: i < entries.length - 1 ? `1px solid ${C.borderLight}` : 'none',
              gap: 12,
            }}>
              <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: C.dim, flexShrink: 0 }}>
                {LABEL_MAP[key] || key}
              </span>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.secondary,
                textAlign: 'right', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {String(val)}
              </span>
            </div>
          ))}
          {mode === 'bug' && (
            <div style={{ fontFamily: "'Alegreya', serif", fontSize: 11, color: C.dim, fontStyle: 'italic', marginTop: 8 }}>
              Full AI prompt/response and server JSON also included.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ReportModal({ mode, gameId, gameState, turns, characterData, debugLog, onClose }) {
  const [category, setCategory] = useState(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const isBug = mode === 'bug';
  const categories = isBug ? BUG_CATEGORIES : SUGGEST_CATEGORIES;
  const title = isBug ? 'Bug Report' : 'Suggestion';
  const placeholder = isBug
    ? 'Describe what went wrong. What did you expect to happen?'
    : 'What would make the game better? Describe your idea.';
  const recipient = isBug ? 'bugs@crucibleRPG.com' : 'suggestions@crucibleRPG.com';

  // Get the last 1-2 turns for context
  const lastTurn = turns?.length > 0 ? turns[turns.length - 1] : null;
  const prevTurn = turns?.length > 1 ? turns[turns.length - 2] : null;

  // Get the most recent debug entry (if debug mode was on)
  const lastDebug = debugLog?.length > 0 ? debugLog[0] : null;

  // Build rich context
  const context = {
    // Game metadata
    gameId: gameId || null,
    turnNumber: lastTurn?.number || gameState?.clock?.totalTurn || null,
    sessionTurn: lastTurn?.sessionTurn || gameState?.clock?.sessionTurn || null,
    characterName: gameState?.character?.name || characterData?.character?.name || null,
    setting: gameState?.setting || null,
    storyteller: gameState?.storyteller || null,
    difficulty: gameState?.difficulty || gameState?.difficultyPreset || null,

    // Last turn — what happened
    lastPlayerAction: lastTurn?.playerAction || null,
    lastNarrative: lastTurn?.narrative ? lastTurn.narrative.substring(0, 500) : null,

    // Resolution data from last turn (the mechanical outcome)
    lastResolution: lastTurn?.resolution ? {
      stat: lastTurn.resolution.stat || null,
      effectiveValue: lastTurn.resolution.effectiveValue || null,
      skillUsed: lastTurn.resolution.skillUsed || null,
      fortunesBalance: lastTurn.resolution.fortunesBalance || null,
      diceRolled: lastTurn.resolution.diceRolled || null,
      dc: lastTurn.resolution.dc || null,
      total: lastTurn.resolution.total || null,
      margin: lastTurn.resolution.margin || null,
      tier: lastTurn.resolution.tier || lastTurn.resolution.tierName || null,
    } : null,

    // State changes from last turn
    lastStateChanges: lastTurn?.stateChanges ? {
      conditionsAdded: lastTurn.stateChanges.conditions?.added || [],
      conditionsRemoved: lastTurn.stateChanges.conditions?.removed || [],
      inventoryAdded: lastTurn.stateChanges.inventory?.added || [],
      inventoryRemoved: lastTurn.stateChanges.inventory?.removed || [],
    } : null,

    // Current character state (from sidebar data if available)
    currentStats: characterData?.stats ? Object.fromEntries(
      Object.entries(characterData.stats).map(([stat, data]) => [
        stat, { base: data.base, effective: data.effective }
      ])
    ) : null,
    activeConditions: characterData?.conditions?.map(c => ({
      name: c.name, stat: c.stat, penalty: c.penalty
    })) || null,

    // Location and time
    currentLocation: lastTurn?.location || gameState?.world?.currentLocation || null,
    weather: lastTurn?.weather || gameState?.clock?.weather || null,
    inGameTime: lastTurn?.clock ? {
      day: lastTurn.clock.currentDay,
      hour: lastTurn.clock.hour,
    } : null,

    // Previous turn (for context on multi-turn issues)
    prevPlayerAction: prevTurn?.playerAction || null,
    prevTurnNumber: prevTurn?.number || null,

    // Debug data if available
    aiModel: lastDebug?.ai?.model || null,
    aiLatency: lastDebug?.timing?.ai || null,

    // Browser
    browser: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    windowSize: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : null,
  };

  const canSend = message.trim().length > 0 && category;

  async function handleSend() {
    if (!canSend || sending) return;
    setSending(true);
    setError('');
    try {
      await post('/api/bug-report', {
        type: mode,
        category,
        message: message.trim(),
        gameId: gameId || null,
        context,
      });
      setSent(true);
    } catch (err) {
      if (err.status === 429) {
        setError("You've submitted too many reports recently. Please try again later.");
      } else {
        setError(err.message || 'Failed to send report.');
      }
    }
    setSending(false);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: C.overlay }} />
      <div onClick={e => e.stopPropagation()} style={{
        background: C.panelBg, border: `1px solid ${C.border}`, borderRadius: 12,
        width: 480, maxWidth: '95vw', maxHeight: '85vh', overflowY: 'auto',
        position: 'relative', zIndex: 1, padding: '24px 28px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
      }}>
        {/* Close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 14, right: 16, background: 'none', border: 'none',
          color: C.dim, fontSize: 18, cursor: 'pointer',
        }}>{'\u2715'}</button>

        {/* Sent state */}
        {sent ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: `${C.success}20`, border: `2px solid ${C.success}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <span style={{ fontSize: 24, color: C.success }}>{'\u2713'}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 18, fontWeight: 700, color: C.heading, marginBottom: 8 }}>
              {isBug ? 'Report Sent' : 'Suggestion Sent'}
            </div>
            <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: C.muted, lineHeight: 1.6 }}>
              {isBug ? "Thanks for helping us squash bugs. We'll look into it." : 'Thanks for the idea. We read every suggestion.'}
            </div>
            <button onClick={onClose} style={{
              marginTop: 20, padding: '10px 28px', borderRadius: 6, cursor: 'pointer',
              fontFamily: 'var(--font-alegreya-sans)', fontSize: 14,
              background: 'transparent', border: `1px solid ${C.border}`, color: C.muted,
            }}>Close</button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 6,
                background: isBug ? `${C.danger}15` : `${C.accent}15`,
                border: `1px solid ${isBug ? C.danger : C.accent}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {isBug ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.danger} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="8" y="6" width="8" height="14" rx="4" /><path d="M19 10h2" /><path d="M3 10h2" />
                    <path d="M19 14h2" /><path d="M3 14h2" /><path d="M19 18h2" /><path d="M3 18h2" />
                    <path d="M16 2l-2 4" /><path d="M8 2l2 4" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18h6" /><path d="M10 22h4" />
                    <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
                  </svg>
                )}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 18, fontWeight: 700, color: C.heading }}>{title}</div>
                <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: C.dim }}>Sends to {recipient}</div>
              </div>
            </div>

            {/* Category selector */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: C.muted, marginBottom: 8 }}>Category</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {categories.map(cat => (
                  <button key={cat.id} onClick={() => setCategory(cat.id)} style={{
                    padding: '5px 12px', borderRadius: 5, cursor: 'pointer',
                    fontFamily: 'var(--font-alegreya-sans)', fontSize: 13,
                    background: category === cat.id ? (isBug ? `${C.danger}15` : `${C.accent}15`) : 'transparent',
                    border: `1px solid ${category === cat.id ? (isBug ? C.danger : C.accent) : C.border}`,
                    color: category === cat.id ? (isBug ? C.danger : C.accent) : C.muted,
                    transition: 'all 0.2s',
                  }}>{cat.label}</button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: C.muted, marginBottom: 8 }}>
                {isBug ? 'What happened?' : 'Your idea'}
              </div>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={placeholder}
                rows={5}
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '12px 14px',
                  background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 6,
                  fontFamily: 'var(--font-alegreya-sans)', fontSize: 14,
                  color: C.text, outline: 'none', resize: 'vertical', lineHeight: 1.6,
                }}
                onFocus={e => { e.target.style.borderColor = isBug ? C.danger : C.accent; }}
                onBlur={e => { e.target.style.borderColor = C.border; }}
              />
            </div>

            {/* Context preview */}
            <ContextPreview mode={mode} context={context} />

            {/* Error */}
            {error && (
              <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#e85a5a', marginBottom: 10 }}>
                {error}
              </div>
            )}

            {/* Send button */}
            <button onClick={handleSend} disabled={!canSend || sending} style={{
              width: '100%', padding: '12px 0', borderRadius: 6, cursor: canSend && !sending ? 'pointer' : 'default',
              fontFamily: 'var(--font-cinzel)', fontSize: 14, fontWeight: 700, letterSpacing: '0.06em',
              background: canSend
                ? (isBug ? `linear-gradient(135deg, ${C.danger}, #d06040)` : `linear-gradient(135deg, ${C.accent}, ${C.accentBright})`)
                : C.cardBg,
              border: 'none',
              color: canSend ? C.bg : C.dim,
              opacity: sending ? 0.6 : 1,
              transition: 'all 0.2s',
            }}>
              {sending ? 'Sending...' : `Send ${title}`}
            </button>

            {/* Privacy note */}
            <div style={{
              fontFamily: 'var(--font-alegreya-sans)', fontSize: 11, color: C.dim,
              marginTop: 12, textAlign: 'center', lineHeight: 1.5,
            }}>
              {isBug
                ? "Your game state and the last turn's debug data are attached automatically to help us diagnose the issue."
                : 'Basic game context is attached to help us understand your perspective.'}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
