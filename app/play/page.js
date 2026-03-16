'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import * as api from '@/lib/api';
import { useAuth } from '@/lib/useAuth';
import { getToken } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// =============================================================================
// Theme, Font, and Size Configuration
// =============================================================================

const THEMES = {
  dark: {
    id: 'dark', label: 'Dark',
    bg: '#0a0e1a', bgPanel: '#0d1120', bgCard: '#111528', bgInput: '#0a0e1a',
    border: '#1e2540', borderLight: '#161c34',
    text: '#c8c0b0', textMuted: '#8a94a8', textDim: '#7082a4', textFaint: '#6b83a3',
    heading: '#d0c098', accent: '#c9a84c',
    danger: '#e8845a', success: '#8aba7a',
    resolutionBg: '#0e1420', resolutionBorder: '#1a2a3a', resolutionText: '#8aba7a',
    actionBg: '#111528', actionBorder: '#1e2540', actionText: '#8a94a8', actionHoverBg: '#151a30',
  },
  light: {
    id: 'light', label: 'Light',
    bg: '#f8f4ec', bgPanel: '#f0ebe0', bgCard: '#ffffff', bgInput: '#f8f4ec',
    border: '#d4cbb8', borderLight: '#e0d8c8',
    text: '#4a4030', textMuted: '#7a6a55', textDim: '#9a8a70', textFaint: '#b8a888',
    heading: '#3a2a15', accent: '#8a6a1a',
    danger: '#b04525', success: '#3a7a2a',
    resolutionBg: '#eef4e8', resolutionBorder: '#c0d4a8', resolutionText: '#3a6a2a',
    actionBg: '#f0ebe0', actionBorder: '#d4cbb8', actionText: '#5a4a35', actionHoverBg: '#e8e0d0',
  },
  sepia: {
    id: 'sepia', label: 'Sepia',
    bg: '#2a2218', bgPanel: '#241e14', bgCard: '#302820', bgInput: '#241e14',
    border: '#4a3a28', borderLight: '#3a3020',
    text: '#d8c8a0', textMuted: '#b0986a', textDim: '#8a7850', textFaint: '#6a5840',
    heading: '#f0dca8', accent: '#e0a840',
    danger: '#e09050', success: '#90b060',
    resolutionBg: '#1e2418', resolutionBorder: '#3a4828', resolutionText: '#90b060',
    actionBg: '#302820', actionBorder: '#4a3a28', actionText: '#c8b888', actionHoverBg: '#3a3028',
  },
};

const FONT_OPTIONS = [
  { id: 'lexie', label: 'Lexie Readable', family: "'Lexie Readable', sans-serif" },
  { id: 'alegreya', label: 'Alegreya', family: "'Alegreya', serif" },
  { id: 'alegreya-sans', label: 'Alegreya Sans', family: "'Alegreya Sans', sans-serif" },
  { id: 'system', label: 'System Default', family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  { id: 'georgia', label: 'Georgia', family: "Georgia, 'Times New Roman', serif" },
  { id: 'mono', label: 'Monospace', family: "'JetBrains Mono', 'Courier New', monospace" },
];

const SIZE_OPTIONS = [
  { id: 'small', label: 'Small', narrative: 13, ui: 11, sidebar: 310 },
  { id: 'medium', label: 'Medium', narrative: 15, ui: 12.5, sidebar: 340 },
  { id: 'large', label: 'Large', narrative: 17, ui: 14, sidebar: 380 },
  { id: 'xlarge', label: 'X-Large', narrative: 19, ui: 15, sidebar: 420 },
];

const SIDEBAR_TABS = [
  { id: 'character', label: 'Character' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'npcs', label: 'NPCs' },
  { id: 'glossary', label: 'Glossary' },
  { id: 'map', label: 'Map' },
  { id: 'journal', label: 'Journal' },
];

// =============================================================================
// SVG Icons
// =============================================================================

const TabIcons = {
  character: (color) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  inventory: (color) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  npcs: (color) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  glossary: (color) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  map: (color) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  ),
  journal: (color) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="12" y2="17" />
    </svg>
  ),
};

const BarIcons = {
  settings: (color) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  sidebar: (color) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  ),
  menu: (color) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  bug: (color) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="6" width="8" height="14" rx="4" /><path d="M19 10h2" /><path d="M3 10h2" />
      <path d="M19 14h2" /><path d="M3 14h2" /><path d="M19 18h2" /><path d="M3 18h2" />
      <path d="M16 2l-2 4" /><path d="M8 2l2 4" />
    </svg>
  ),
  lightbulb: (color) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6" /><path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
    </svg>
  ),
};

// =============================================================================
// Display Settings Persistence
// =============================================================================

function loadDisplaySettings() {
  if (typeof window === 'undefined') return { theme: 'dark', font: 'lexie', textSize: 'medium' };
  return {
    theme: localStorage.getItem('crucible_theme') || 'dark',
    font: localStorage.getItem('crucible_font') || 'lexie',
    textSize: localStorage.getItem('crucible_textSize') || 'medium',
  };
}

function saveDisplaySettings({ theme, font, textSize }) {
  localStorage.setItem('crucible_theme', theme);
  localStorage.setItem('crucible_font', font);
  localStorage.setItem('crucible_textSize', textSize);
}

// =============================================================================
// Bookmark Persistence (localStorage per game)
// =============================================================================

function loadBookmarks(gameId) {
  if (typeof window === 'undefined' || !gameId) return {};
  try { return JSON.parse(localStorage.getItem(`crucible_bookmarks_${gameId}`)) || {}; } catch { return {}; }
}

function saveBookmarks(gameId, bookmarks) {
  if (!gameId) return;
  localStorage.setItem(`crucible_bookmarks_${gameId}`, JSON.stringify(bookmarks));
}

// =============================================================================
// SSE Hook
// =============================================================================

function useSSE(gameId, onEvent) {
  const esRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const retryRef = useRef(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const connect = useCallback(() => {
    if (!gameId) return;
    const token = getToken();
    if (!token) return;

    if (esRef.current) { esRef.current.close(); }

    const url = `${API_BASE}/api/game/${gameId}/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => { setConnected(true); setReconnecting(false); };

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'heartbeat') return;
        onEventRef.current(data);
      } catch { /* ignore parse errors */ }
    };

    // Named event handlers
    const eventTypes = [
      'turn:resolution', 'turn:narrative', 'turn:state_changes',
      'turn:actions', 'turn:complete', 'turn:error', 'command:response',
    ];
    eventTypes.forEach(type => {
      es.addEventListener(type, (e) => {
        try {
          const data = JSON.parse(e.data);
          onEventRef.current({ type, ...data });
        } catch { /* ignore */ }
      });
    });

    es.onerror = () => {
      setConnected(false);
      es.close();
      setReconnecting(true);
      retryRef.current = setTimeout(connect, 3000);
    };
  }, [gameId]);

  useEffect(() => {
    connect();
    return () => {
      if (esRef.current) esRef.current.close();
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, [connect]);

  return { connected, reconnecting };
}

// =============================================================================
// Top Bar
// =============================================================================

function TopBar({ t, worldName, sidebarOpen, onToggleSidebar, onOpenSettings }) {
  return (
    <div style={{
      height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px', background: t.bgPanel, borderBottom: `1px solid ${t.border}`,
      flexShrink: 0, boxSizing: 'border-box',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/menu" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontFamily: "var(--font-cinzel)", fontSize: 16, fontWeight: 900, color: '#c9a84c', letterSpacing: '0.06em' }}>CRUCIBLE</span>
          <span style={{ fontFamily: "var(--font-cinzel)", fontSize: 9, fontWeight: 600, color: '#9a8545', letterSpacing: '0.18em' }}>RPG</span>
        </Link>
        {worldName && (
          <>
            <span style={{ color: t.border, fontSize: 14, userSelect: 'none' }}>|</span>
            <span style={{ fontFamily: 'inherit', fontSize: 13, color: t.textDim }}>{worldName}</span>
          </>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={onOpenSettings} aria-label="Settings" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}>
          {BarIcons.settings(t.textMuted)}
        </button>
        <button onClick={onToggleSidebar} aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}>
          {sidebarOpen ? BarIcons.sidebar(t.textMuted) : BarIcons.menu(t.textMuted)}
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// Turn Timeline Scrubber
// =============================================================================

function TurnTimeline({ t, turns, bookmarks, onScrollToTurn }) {
  if (!turns || turns.length === 0) return null;
  const lastTurn = turns[turns.length - 1]?.turn || 0;
  return (
    <div style={{
      height: 20, display: 'flex', alignItems: 'center', gap: 1,
      padding: '0 16px', background: t.bgPanel, borderBottom: `1px solid ${t.borderLight}`,
      flexShrink: 0,
    }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'end', gap: 1, height: 12 }}>
        {turns.map((turn, i) => {
          const isLast = i === turns.length - 1;
          const isBookmarked = bookmarks[turn.turn];
          const isRecent = i >= turns.length - 3;
          return (
            <div
              key={turn.turn}
              onClick={() => onScrollToTurn(turn.turn)}
              title={`Turn ${turn.turn}`}
              style={{
                flex: 1, maxWidth: 12, minWidth: 3,
                height: isLast ? 12 : isRecent ? 9 : 6,
                background: isBookmarked ? t.accent : isLast ? t.textMuted : isRecent ? t.textDim : t.border,
                borderRadius: 1, cursor: 'pointer',
                transition: 'height 0.2s, background 0.2s',
              }}
            />
          );
        })}
      </div>
      <span style={{
        fontFamily: "var(--font-jetbrains)", fontSize: 10, color: t.textFaint,
        marginLeft: 8, flexShrink: 0,
      }}>T{lastTurn}</span>
    </div>
  );
}

// =============================================================================
// Resolution Block
// =============================================================================

function ResolutionBlock({ t, sz, resolution }) {
  const [expanded, setExpanded] = useState(false);
  if (!resolution) return null;

  const text = resolution.text || resolution.compressed || '';
  const details = resolution.details || {};
  const isSuccess = text.toLowerCase().includes('success');

  return (
    <div style={{
      background: t.resolutionBg, border: `1px solid ${t.resolutionBorder}`,
      borderRadius: 6, padding: '8px 12px', marginBottom: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{
          fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui,
          color: isSuccess ? t.resolutionText : t.danger, lineHeight: 1.5,
          flex: 1,
        }}>{text}</span>
        <button
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? 'Collapse details' : 'Expand details'}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: "var(--font-alegreya-sans)", fontSize: 12,
            color: t.textDim, padding: '2px 6px', flexShrink: 0,
          }}
        >?</button>
      </div>
      {expanded && details && (
        <div style={{
          marginTop: 10, paddingTop: 10, borderTop: `1px solid ${t.resolutionBorder}`,
          display: 'flex', flexDirection: 'column', gap: 6,
          fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui, color: t.textDim,
        }}>
          {details.action && <div><span style={{ color: t.textMuted }}>Action:</span> {details.action}</div>}
          {details.stat && <div><span style={{ color: t.textMuted }}>Stat:</span> {details.stat}</div>}
          {details.skill && <div><span style={{ color: t.textMuted }}>Skill:</span> {details.skill}</div>}
          {details.equipment && <div><span style={{ color: t.textMuted }}>Equipment:</span> {details.equipment}</div>}
          {details.fortuneBalance && <div><span style={{ color: t.textMuted }}>Fortune&apos;s Balance:</span> {details.fortuneBalance}</div>}
          {details.crucibleRoll && <div><span style={{ color: t.textMuted }}>Crucible Roll:</span> {details.crucibleRoll}</div>}
          {details.d20Roll && <div><span style={{ color: t.textMuted }}>d20 Roll:</span> {details.d20Roll}</div>}
          {details.dc && <div><span style={{ color: t.textMuted }}>DC:</span> {details.dc}</div>}
          {details.total && <div><span style={{ color: t.textMuted }}>Total:</span> {details.total}</div>}
          {details.result && (
            <div><span style={{ color: t.textMuted }}>Result:</span>{' '}
              <span style={{ color: details.result.toLowerCase().includes('success') ? t.success : t.danger, fontWeight: 600 }}>{details.result}</span>
            </div>
          )}
          {details.debtOfEffort && <div><span style={{ color: t.textMuted }}>Debt of Effort:</span> {details.debtOfEffort}</div>}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Status Change Badges
// =============================================================================

const STATUS_BADGE_CONFIG = {
  condition_new: { icon: '\u26A0\uFE0F', colorKey: 'danger' },
  condition_escalated: { icon: '\u26A0\uFE0F', colorKey: 'danger' },
  condition_cleared: { icon: '\u2705', colorKey: 'success' },
  inventory_gained: { icon: '\uD83D\uDCE6', colorKey: 'accent' },
  inventory_lost: { icon: '\uD83D\uDCE6', colorKey: 'danger' },
  skill_gained: { icon: '\uD83D\uDCC8', colorKey: 'textMuted' },
};

function StatusChangeBadge({ t, sz, change }) {
  const config = STATUS_BADGE_CONFIG[change.type] || { icon: '', colorKey: 'textMuted' };
  // CON damage uses red
  const color = change.stat === 'CON' && change.type.startsWith('condition') ? '#e85a5a' : t[config.colorKey];
  return (
    <button
      onClick={() => { /* TODO: open entity popup */ }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '4px 10px', background: t.bgCard, border: `1px solid ${t.border}`,
        borderRadius: 4, cursor: 'pointer', transition: 'border-color 0.2s',
        fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui - 1, color,
      }}
    >
      <span>{config.icon}</span>
      <span>{change.label}</span>
      {change.detail && (
        <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: sz.ui - 2, color: t.textDim }}>[{change.detail}]</span>
      )}
    </button>
  );
}

// =============================================================================
// Narrative Text (with entity hover)
// =============================================================================

function NarrativeText({ t, sz, segments, streaming }) {
  if (!segments || segments.length === 0) {
    return streaming ? <span style={{ color: t.accent }}>|</span> : null;
  }
  return (
    <span>
      {segments.map((seg, i) => {
        if (seg.entity) {
          return (
            <span
              key={i}
              onClick={() => { /* TODO: open entity popup for seg.entity */ }}
              style={{
                cursor: 'pointer', transition: 'color 0.2s',
                borderBottom: `1px solid transparent`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = t.accent;
                e.currentTarget.style.borderBottomColor = t.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '';
                e.currentTarget.style.borderBottomColor = 'transparent';
              }}
            >{seg.text}</span>
          );
        }
        return <span key={i}>{seg.text}</span>;
      })}
      {streaming && <span style={{ color: t.accent, animation: 'blink 1s step-end infinite' }}>|</span>}
    </span>
  );
}

// =============================================================================
// Action Panel
// =============================================================================

function ActionPanel({ t, sz, options, onSubmit, waiting }) {
  const [customText, setCustomText] = useState('');

  if (waiting) {
    return (
      <div style={{
        marginTop: 16, padding: '12px 16px', textAlign: 'center',
        fontFamily: "var(--font-alegreya)", fontSize: sz.narrative,
        fontStyle: 'italic', color: t.textDim,
      }}>Waiting for the story to continue...</div>
    );
  }

  if (!options || options.length === 0) return null;

  const handleCustomSubmit = () => {
    if (!customText.trim()) return;
    onSubmit({ type: 'custom', text: customText.trim() });
    setCustomText('');
  };

  return (
    <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {options.map(opt => (
        <button
          key={opt.key}
          onClick={() => onSubmit({ type: 'option', key: opt.key })}
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            padding: '12px 16px', textAlign: 'left',
            background: t.actionBg, border: `1px solid ${t.actionBorder}`,
            borderRadius: 6, cursor: 'pointer',
            transition: 'background 0.2s, border-color 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = t.actionHoverBg; e.currentTarget.style.borderColor = t.accent; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = t.actionBg; e.currentTarget.style.borderColor = t.actionBorder; }}
        >
          <span style={{
            fontFamily: "var(--font-cinzel)", fontSize: sz.narrative, fontWeight: 700,
            color: t.accent, flexShrink: 0, width: 24,
          }}>{opt.key}</span>
          <span style={{
            fontFamily: 'inherit', fontSize: sz.narrative, color: t.actionText,
            lineHeight: 1.5,
          }}>{opt.text}</span>
        </button>
      ))}
      {/* Custom action input */}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <input
          value={customText}
          onChange={e => setCustomText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleCustomSubmit(); }}
          placeholder="Or type your own action..."
          style={{
            flex: 1, padding: '10px 14px',
            background: t.bgInput, border: `1px solid ${t.actionBorder}`,
            borderRadius: 6, fontFamily: 'inherit', fontSize: sz.narrative,
            color: t.text, outline: 'none',
          }}
        />
        <button
          onClick={handleCustomSubmit}
          disabled={!customText.trim()}
          style={{
            padding: '10px 16px', background: t.actionBg,
            border: `1px solid ${t.actionBorder}`, borderRadius: 6,
            cursor: customText.trim() ? 'pointer' : 'default',
            fontFamily: "var(--font-cinzel)", fontSize: 12, fontWeight: 700,
            color: customText.trim() ? t.accent : t.textDim,
          }}
        >{'\u2192'}</button>
      </div>
    </div>
  );
}

// =============================================================================
// Turn Block
// =============================================================================

function TurnBlock({ t, sz, turn, isLatest, isStreaming, bookmarked, onToggleBookmark, onSubmitAction, waiting }) {
  return (
    <div id={`turn-${turn.turn}`} style={{ marginBottom: 32 }}>
      {/* Turn header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        paddingBottom: 8, marginBottom: 12,
        borderBottom: `1px solid ${t.borderLight}`,
      }}>
        {turn.location && (
          <span style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui, color: t.textDim }}>
            {'\uD83D\uDCCD'} {turn.location}
          </span>
        )}
        {turn.time && (
          <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: sz.ui - 1, color: t.textFaint }}>
            {turn.timeEmoji || ''} {turn.time}
          </span>
        )}
        {turn.weather && (
          <span style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui - 1, color: t.textFaint }}>
            {turn.weatherEmoji || ''} {turn.weather}
          </span>
        )}
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontFamily: "var(--font-jetbrains)", fontSize: sz.ui - 1, color: t.textFaint,
          }}>T{turn.turn}</span>
          <button
            onClick={() => onToggleBookmark(turn.turn)}
            aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 2,
              fontSize: 14, color: bookmarked ? t.accent : t.textFaint,
              lineHeight: 1,
            }}
          >{bookmarked ? '\u2605' : '\u2606'}</button>
        </span>
      </div>

      {/* Resolution */}
      <ResolutionBlock t={t} sz={sz} resolution={turn.resolution} />

      {/* Narrative text */}
      <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
        <NarrativeText t={t} sz={sz} segments={turn.narrative} streaming={isLatest && isStreaming} />
      </div>

      {/* Status changes */}
      {turn.statusChanges && turn.statusChanges.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
          {turn.statusChanges.map((change, i) => (
            <StatusChangeBadge key={i} t={t} sz={sz} change={change} />
          ))}
        </div>
      )}

      {/* Actions (only on latest turn, not while streaming) */}
      {isLatest && !isStreaming && (
        <ActionPanel t={t} sz={sz} options={turn.options} onSubmit={onSubmitAction} waiting={waiting} />
      )}
    </div>
  );
}

// =============================================================================
// Session Recap
// =============================================================================

function SessionRecap({ t, sz, text }) {
  if (!text) return null;
  return (
    <div style={{
      marginBottom: 32, paddingTop: 16, borderTop: `1px solid ${t.borderLight}`,
    }}>
      <div style={{
        fontFamily: "var(--font-cinzel)", fontSize: sz.ui, fontWeight: 600,
        color: t.textDim, letterSpacing: '0.08em', textTransform: 'uppercase',
        marginBottom: 10,
      }}>Previously...</div>
      <div style={{
        fontFamily: "var(--font-alegreya)", fontSize: sz.narrative,
        fontStyle: 'italic', color: t.textMuted, lineHeight: 1.8,
        whiteSpace: 'pre-wrap',
      }}>{text}</div>
    </div>
  );
}

// =============================================================================
// Sidebar (unchanged from Prompt 1)
// =============================================================================

function Sidebar({ t, sz, width, activeTab, setActiveTab, badges }) {
  return (
    <div style={{
      width, minWidth: 260, maxWidth: 600,
      background: t.bgPanel, borderLeft: `1px solid ${t.border}`,
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      height: '100%', boxSizing: 'border-box',
    }}>
      <div style={{
        display: 'flex', borderBottom: `1px solid ${t.border}`,
        padding: '0 4px', flexShrink: 0, overflow: 'hidden',
      }}>
        {SIDEBAR_TABS.map(tab => {
          const isActive = activeTab === tab.id;
          const badgeCount = badges[tab.id] || 0;
          const iconFn = TabIcons[tab.id];
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} aria-label={tab.label} style={{
              flex: 1, padding: '10px 0 8px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 3, background: 'none', border: 'none',
              borderBottom: isActive ? `2px solid ${t.accent}` : '2px solid transparent',
              cursor: 'pointer', position: 'relative', transition: 'border-color 0.2s',
            }}>
              <div style={{ position: 'relative' }}>
                {iconFn && iconFn(isActive ? t.accent : t.textMuted)}
                {badgeCount > 0 && (
                  <span style={{
                    position: 'absolute', top: -4, right: -8,
                    background: t.danger, color: '#ffffff',
                    fontFamily: "var(--font-jetbrains)", fontSize: 9, fontWeight: 700,
                    width: 14, height: 14, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
                  }}>{badgeCount}</span>
                )}
              </div>
              <span style={{
                fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui - 1,
                color: isActive ? t.accent : t.textMuted,
                fontWeight: isActive ? 600 : 400, letterSpacing: '0.02em',
              }}>{tab.label}</span>
            </button>
          );
        })}
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui, color: t.textDim, textAlign: 'center', paddingTop: 40 }}>
          {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} content
        </div>
      </div>
      <div style={{ padding: '10px 12px', borderTop: `1px solid ${t.border}`, display: 'flex', gap: 8, flexShrink: 0 }}>
        <button style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 0', background: 'none', border: `1px solid ${t.border}`, borderRadius: 4, cursor: 'pointer', fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui, color: t.textMuted }}>
          {BarIcons.bug(t.textMuted)} Bug
        </button>
        <button style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 0', background: 'none', border: `1px solid ${t.border}`, borderRadius: 4, cursor: 'pointer', fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui, color: t.textMuted }}>
          {BarIcons.lightbulb(t.textMuted)} Suggest
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// Resize Handle
// =============================================================================

function ResizeHandle({ onDrag, t }) {
  const dragging = useRef(false);
  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    const onMouseMove = (e) => { if (dragging.current) onDrag(e.clientX); };
    const onMouseUp = () => {
      dragging.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [onDrag]);

  return (
    <div onMouseDown={onMouseDown} style={{ width: 6, cursor: 'col-resize', flexShrink: 0, background: t.border, transition: 'background 0.2s' }}
      onMouseEnter={(e) => { e.currentTarget.style.background = t.accent; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = t.border; }}
    />
  );
}

// =============================================================================
// Loading & Error States
// =============================================================================

function LoadingState({ t }) {
  return (
    <div style={{ minHeight: '100vh', background: t.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div style={{ width: 32, height: 32, border: `2px solid ${t.border}`, borderTopColor: t.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ fontFamily: "var(--font-alegreya)", fontSize: 17, fontStyle: 'italic', color: t.textMuted }}>Loading your adventure...</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorState({ t, message }) {
  return (
    <div style={{ minHeight: '100vh', background: t.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      <span style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 17, color: t.danger }}>{message}</span>
      <Link href="/menu" style={{ fontFamily: "var(--font-cinzel)", fontSize: 13, fontWeight: 600, color: t.accent, textDecoration: 'none', letterSpacing: '0.08em', padding: '10px 24px', border: '1px solid #3a3328', borderRadius: 4 }}>BACK TO MENU</Link>
    </div>
  );
}

// =============================================================================
// Main Play Page (Inner)
// =============================================================================

function PlayPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authChecked = useAuth();
  const gameId = searchParams.get('id') || searchParams.get('gameId');

  // --- Display settings ---
  const [displaySettings, setDisplaySettings] = useState(() => loadDisplaySettings());
  const { theme: themeId, font: fontId, textSize: sizeId } = displaySettings;
  const t = THEMES[themeId] || THEMES.dark;
  const fontOption = FONT_OPTIONS.find(f => f.id === fontId) || FONT_OPTIONS[0];
  const sz = SIZE_OPTIONS.find(s => s.id === sizeId) || SIZE_OPTIONS[1];

  const updateDisplay = useCallback((key, value) => {
    setDisplaySettings(prev => { const next = { ...prev, [key]: value }; saveDisplaySettings(next); return next; });
  }, []);

  // --- Game state ---
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Narrative state ---
  const [turns, setTurns] = useState([]);
  const [sessionRecap, setSessionRecap] = useState(null);
  const [streamingTurn, setStreamingTurn] = useState(null); // turn being built from SSE
  const [isStreaming, setIsStreaming] = useState(false);
  const [waiting, setWaiting] = useState(false); // waiting for server after action submission
  const [actionError, setActionError] = useState(null);

  // --- UI state ---
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(sz.sidebar);
  const [activeTab, setActiveTab] = useState('character');
  const [badges, setBadges] = useState({ character: 0, inventory: 0, npcs: 0, glossary: 0, map: 0, journal: 0 });
  const [bookmarks, setBookmarks] = useState({});
  const containerRef = useRef(null);
  const narrativeRef = useRef(null);
  const autoScrollRef = useRef(true);
  const turnRefs = useRef({});

  // --- Redirect if no game ID ---
  useEffect(() => {
    if (authChecked && !gameId) router.replace('/menu');
  }, [authChecked, gameId, router]);

  // --- Fetch game state ---
  useEffect(() => {
    if (!authChecked || !gameId) return;
    const fetchGame = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.get(`/api/games/${gameId}`);
        setGameState(data);
        // Parse turn history from game state
        const history = data.narrative || data.turns || data.recentHistory || [];
        setTurns(history);
        setSessionRecap(data.session_recap || data.sessionRecap || null);
        setBookmarks(loadBookmarks(gameId));
      } catch (err) {
        setError(err.message || 'Failed to load game.');
      } finally {
        setLoading(false);
      }
    };
    fetchGame();
  }, [authChecked, gameId]);

  // --- SSE event handler ---
  const handleSSEEvent = useCallback((event) => {
    const type = event.type || '';

    if (type === 'turn:resolution') {
      setIsStreaming(true);
      setStreamingTurn(prev => ({
        ...(prev || {}),
        turn: event.turn || prev?.turn,
        total: event.total || prev?.total,
        location: event.location || prev?.location,
        time: event.time || prev?.time,
        timeEmoji: event.timeEmoji || prev?.timeEmoji,
        weather: event.weather || prev?.weather,
        weatherEmoji: event.weatherEmoji || prev?.weatherEmoji,
        resolution: event.resolution || null,
        narrative: prev?.narrative || [],
        statusChanges: prev?.statusChanges || [],
        options: prev?.options || [],
      }));
    } else if (type === 'turn:narrative') {
      setStreamingTurn(prev => {
        if (!prev) return prev;
        const chunk = event.text || event.chunk || '';
        const narrative = [...(prev.narrative || [])];
        // Append to last segment or create new one
        if (narrative.length > 0 && !narrative[narrative.length - 1].entity) {
          narrative[narrative.length - 1] = { text: narrative[narrative.length - 1].text + chunk };
        } else {
          narrative.push({ text: chunk });
        }
        return { ...prev, narrative };
      });
    } else if (type === 'turn:state_changes') {
      setStreamingTurn(prev => prev ? { ...prev, statusChanges: event.changes || event.statusChanges || [] } : prev);
    } else if (type === 'turn:actions') {
      setStreamingTurn(prev => prev ? { ...prev, options: event.options || [] } : prev);
    } else if (type === 'turn:complete') {
      // Finalize the streaming turn and add it to history
      setStreamingTurn(prev => {
        if (prev) {
          setTurns(t => [...t, prev]);
        }
        return null;
      });
      setIsStreaming(false);
      setWaiting(false);
    } else if (type === 'turn:error') {
      setIsStreaming(false);
      setWaiting(false);
      setActionError(event.message || event.error || 'Something went wrong.');
    } else if (type === 'command:response') {
      // Non-advancing command response - could show in a toast or inline
      // For now, just log it
      console.log('Command response:', event);
    }
  }, []);

  // --- SSE connection ---
  const { connected, reconnecting } = useSSE(
    authChecked && gameId && !loading && !error ? gameId : null,
    handleSSEEvent
  );

  // --- Action submission ---
  const handleSubmitAction = useCallback(async (action) => {
    if (!gameId || waiting) return;
    setWaiting(true);
    setActionError(null);

    // Clear options from the latest turn so they disappear
    setTurns(prev => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      updated[updated.length - 1] = { ...updated[updated.length - 1], options: [] };
      return updated;
    });

    // Initialize streaming turn with basic info from last turn
    const lastTurn = turns[turns.length - 1] || streamingTurn;
    setStreamingTurn({
      turn: (lastTurn?.turn || 0) + 1,
      location: lastTurn?.location,
      time: null, weather: null,
      resolution: null, narrative: [], statusChanges: [], options: [],
    });

    try {
      await api.post(`/api/game/${gameId}/action`, action);
      // Server returns 202 when SSE is connected - data comes via SSE events
    } catch (err) {
      const message = err.message || 'Failed to submit action.';
      // Check for custom action rejection
      if (err.customActionRejected || message.includes('rejected')) {
        setActionError(message);
        // Re-enable previous options
        setTurns(prev => {
          if (prev.length === 0) return prev;
          const updated = [...prev];
          const last = updated[updated.length - 1];
          // Options were cleared above - server should resend them via SSE
          return updated;
        });
        setStreamingTurn(null);
      } else {
        setActionError(message);
        setStreamingTurn(null);
      }
      setWaiting(false);
      setIsStreaming(false);
    }
  }, [gameId, waiting, turns, streamingTurn]);

  // --- Bookmark toggle ---
  const toggleBookmark = useCallback((turnNum) => {
    setBookmarks(prev => {
      const next = { ...prev, [turnNum]: !prev[turnNum] };
      if (!next[turnNum]) delete next[turnNum];
      saveBookmarks(gameId, next);
      return next;
    });
  }, [gameId]);

  // --- Scroll to turn ---
  const scrollToTurn = useCallback((turnNum) => {
    const el = document.getElementById(`turn-${turnNum}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // --- Auto-scroll ---
  useEffect(() => {
    const el = narrativeRef.current;
    if (!el) return;
    const handleScroll = () => {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
      autoScrollRef.current = nearBottom;
    };
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll on new content
  const allTurns = streamingTurn ? [...turns, streamingTurn] : turns;
  useEffect(() => {
    if (autoScrollRef.current && narrativeRef.current) {
      narrativeRef.current.scrollTop = narrativeRef.current.scrollHeight;
    }
  }, [allTurns.length, streamingTurn?.narrative?.length]);

  // --- Sidebar resize ---
  const handleResize = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setSidebarWidth(Math.max(260, Math.min(600, rect.right - clientX)));
  }, []);

  useEffect(() => { setSidebarWidth(sz.sidebar); }, [sz.sidebar]);

  // --- Early returns ---
  if (!authChecked) return <LoadingState t={t} />;
  if (!gameId) return null;
  if (loading) return <LoadingState t={t} />;
  if (error) return <ErrorState t={t} message={error} />;

  const worldName = gameState?.world?.name || gameState?.setting?.settingName || gameState?.settingName || null;

  return (
    <div ref={containerRef} style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      background: t.bg, color: t.text,
      fontFamily: fontOption.family, fontSize: sz.narrative,
      overflow: 'hidden',
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes blink { 50% { opacity: 0; } }`}</style>

      <TopBar t={t} worldName={worldName} sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(prev => !prev)}
        onOpenSettings={() => { /* TODO: Open settings modal */ }}
      />

      <TurnTimeline t={t} turns={allTurns} bookmarks={bookmarks} onScrollToTurn={scrollToTurn} />

      {/* Reconnection indicator */}
      {reconnecting && (
        <div style={{
          padding: '4px 16px', background: t.bgCard, borderBottom: `1px solid ${t.border}`,
          fontFamily: "var(--font-alegreya-sans)", fontSize: 12, color: t.danger,
          textAlign: 'center', flexShrink: 0,
        }}>Reconnecting to server...</div>
      )}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Narrative panel */}
        <div ref={narrativeRef} style={{
          flex: 1, overflow: 'auto', padding: '24px 28px',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            maxWidth: 720, width: '100%', margin: '0 auto',
            fontFamily: "var(--font-alegreya)", fontSize: sz.narrative,
            color: t.text, lineHeight: 1.8,
          }}>
            {/* Session recap */}
            <SessionRecap t={t} sz={sz} text={sessionRecap} />

            {/* Action error */}
            {actionError && (
              <div style={{
                marginBottom: 16, padding: '10px 14px',
                background: t.bgCard, border: `1px solid ${t.danger}`,
                borderRadius: 6, fontFamily: "var(--font-alegreya-sans)",
                fontSize: sz.ui, color: t.danger,
              }}>
                {actionError}
                <button onClick={() => setActionError(null)} style={{
                  marginLeft: 12, background: 'none', border: 'none',
                  color: t.textDim, cursor: 'pointer', fontSize: sz.ui,
                }}>{'\u2715'}</button>
              </div>
            )}

            {/* Turn history */}
            {allTurns.map((turn, i) => {
              const isLast = i === allTurns.length - 1;
              const isStreamingThis = isLast && streamingTurn && turn === streamingTurn;
              return (
                <TurnBlock
                  key={turn.turn || i}
                  t={t} sz={sz}
                  turn={turn}
                  isLatest={isLast}
                  isStreaming={isStreamingThis || (isLast && isStreaming)}
                  bookmarked={!!bookmarks[turn.turn]}
                  onToggleBookmark={toggleBookmark}
                  onSubmitAction={handleSubmitAction}
                  waiting={waiting}
                />
              );
            })}

            {/* Empty state */}
            {allTurns.length === 0 && !sessionRecap && (
              <div style={{
                textAlign: 'center', paddingTop: 60,
                fontFamily: "var(--font-alegreya)", fontSize: sz.narrative,
                fontStyle: 'italic', color: t.textDim,
              }}>Your adventure is about to begin...</div>
            )}
          </div>
        </div>

        {sidebarOpen && (
          <>
            <ResizeHandle onDrag={handleResize} t={t} />
            <Sidebar t={t} sz={sz} width={sidebarWidth} activeTab={activeTab} setActiveTab={setActiveTab} badges={badges} />
          </>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Export with Suspense boundary
// =============================================================================

export default function PlayPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0a0e1a' }} />}>
      <PlayPageInner />
    </Suspense>
  );
}
