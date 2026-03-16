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
// Sidebar Content Components
// =============================================================================

function PanelSection({ t, title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 4 }}>
      <button onClick={() => setOpen(!open)} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
        background: 'transparent', border: 'none', borderBottom: `1px solid ${t.borderLight}`,
        padding: '10px 0', cursor: 'pointer',
      }}>
        <span style={{ fontFamily: "var(--font-cinzel)", fontSize: 11, fontWeight: 600, color: t.textMuted, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{title}</span>
        <span style={{ color: t.textDim, fontSize: 11, transform: open ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}>{'\u25BC'}</span>
      </button>
      {open && <div style={{ padding: '10px 0' }}>{children}</div>}
    </div>
  );
}

function StatBar({ t, sz, stat, onClick }) {
  const pct = Math.min(100, (stat.effective / 20) * 100);
  const basePct = Math.min(100, (stat.base / 20) * 100);
  const hasCondition = stat.effective < stat.base;
  return (
    <div style={{ marginBottom: 10, cursor: 'pointer' }} onClick={() => onClick({ id: stat.name.toLowerCase(), type: 'Stat' })}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
        <span style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui, color: t.text }}>
          {stat.emoji} {stat.name}
        </span>
        <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: sz.ui, color: hasCondition ? t.danger : t.heading, fontWeight: 500 }}>
          {stat.effective.toFixed(1)}
          {hasCondition && <span style={{ color: t.textDim, fontSize: sz.ui - 2 }}> / {stat.base.toFixed(1)}</span>}
        </span>
      </div>
      <div style={{ height: 4, background: t.borderLight, borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
        {hasCondition && (
          <div style={{ position: 'absolute', height: '100%', width: `${basePct}%`, background: t.border, borderRadius: 2 }} />
        )}
        <div style={{
          height: '100%', width: `${pct}%`, position: 'relative',
          background: hasCondition ? 'linear-gradient(90deg, #e8845a, #c96a3a)' : 'linear-gradient(90deg, #907f5e, #b8a88a)',
          borderRadius: 2, transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  );
}

function ConditionCard({ t, sz, condition, onClick }) {
  const isCon = condition.stat === 'CON';
  const borderColor = isCon ? '#e85a5a' : t.danger;
  return (
    <div onClick={() => onClick({ id: condition.name.toLowerCase(), type: 'Condition' })} style={{
      background: t.bgInput, border: `1px solid ${borderColor}`, borderRadius: 6,
      padding: '7px 10px', marginBottom: 6, cursor: 'pointer', transition: 'border-color 0.2s',
    }}>
      <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui, fontWeight: 700, color: borderColor }}>
        {'\u26A0\uFE0F'} {condition.name}: {condition.penalty} {condition.stat}
      </div>
      <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui - 1, color: t.textMuted, marginTop: 2 }}>
        {condition.duration}{condition.escalation && condition.escalation !== 'None' ? ` \u00B7 Escalates: ${condition.escalation}` : ''}
      </div>
    </div>
  );
}

function SkillRow({ t, sz, skill, onClick }) {
  return (
    <div onClick={() => onClick({ id: skill.name.toLowerCase(), type: 'Skill' })} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '5px 4px', cursor: 'pointer', transition: 'background 0.2s', borderRadius: 3,
    }}
      onMouseEnter={e => { e.currentTarget.style.background = t.bgCard; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui, color: t.text }}>
        {skill.emoji || ''} {skill.name}
      </span>
      <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: sz.ui, color: t.accent, fontWeight: 500 }}>
        +{typeof skill.value === 'number' ? skill.value.toFixed(1) : skill.value}
      </span>
    </div>
  );
}

function AbilityCard({ t, sz, ability }) {
  return (
    <div style={{ padding: '8px 10px', background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 6, marginBottom: 6 }}>
      <div style={{ fontFamily: "var(--font-cinzel)", fontSize: sz.ui, fontWeight: 600, color: t.heading, marginBottom: 3 }}>
        {ability.emoji || ''} {ability.name}
      </div>
      <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui - 1, color: t.textMuted, marginBottom: 2 }}>{ability.effect}</div>
      {ability.strain && <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui - 1, color: t.danger }}>{ability.strain}</div>}
    </div>
  );
}

function CharacterTab({ t, sz, character, onEntityClick }) {
  if (!character) return <div style={{ fontFamily: "var(--font-alegreya)", fontSize: sz.ui, fontStyle: 'italic', color: t.textDim, textAlign: 'center', paddingTop: 30 }}>No character data</div>;

  const stats = character.stats || [];
  const skills = character.skills || [];
  const abilities = character.abilities || [];
  const conditions = character.conditions || [];

  return (
    <div>
      {/* Character header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: "var(--font-cinzel)", fontSize: sz.ui + 4, fontWeight: 700, color: t.heading }}>{character.name || 'Unknown'}</div>
        {character.title && <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui, color: t.textMuted, marginTop: 2 }}>{character.title}</div>}
      </div>

      <PanelSection t={t} title="Attributes">
        {stats.map(stat => <StatBar key={stat.name} t={t} sz={sz} stat={stat} onClick={onEntityClick} />)}
      </PanelSection>

      <PanelSection t={t} title="Skills" defaultOpen={skills.length <= 8}>
        {skills.length === 0
          ? <div style={{ fontFamily: "var(--font-alegreya)", fontSize: sz.ui, fontStyle: 'italic', color: t.textDim }}>No skills yet</div>
          : skills.map(skill => <SkillRow key={skill.name} t={t} sz={sz} skill={skill} onClick={onEntityClick} />)
        }
      </PanelSection>

      {abilities.length > 0 && (
        <PanelSection t={t} title="Abilities">
          {abilities.map(a => <AbilityCard key={a.name} t={t} sz={sz} ability={a} />)}
        </PanelSection>
      )}

      <PanelSection t={t} title="Conditions">
        {conditions.length === 0
          ? <div style={{ fontFamily: "var(--font-alegreya)", fontSize: sz.ui, fontStyle: 'italic', color: t.textDim }}>No active conditions</div>
          : conditions.map(c => <ConditionCard key={c.name} t={t} sz={sz} condition={c} onClick={onEntityClick} />)
        }
      </PanelSection>
    </div>
  );
}

// --- Paperdoll + Inventory ---

const EQUIP_SLOTS = [
  { id: 'helm', label: 'Helm', row: 0, col: 1 },
  { id: 'chest', label: 'Chest', row: 1, col: 1 },
  { id: 'mainHand', label: 'Main Hand', row: 1, col: 0 },
  { id: 'offHand', label: 'Off Hand', row: 1, col: 2 },
  { id: 'gloves', label: 'Gloves', row: 2, col: 0 },
  { id: 'boots', label: 'Boots', row: 2, col: 2 },
  { id: 'acc1', label: 'Accessory', row: 0, col: 0 },
  { id: 'acc2', label: 'Accessory', row: 0, col: 2 },
  { id: 'acc3', label: 'Accessory', row: 2, col: 1 },
];

function durabilityColor(cur, max) {
  if (max === 0) return '#8a94a8';
  const pct = cur / max;
  if (pct <= 0) return '#8a3a3a';
  if (pct <= 0.25) return '#e85a5a';
  if (pct <= 0.50) return '#e8845a';
  if (pct <= 0.75) return '#e8c45a';
  return '#8a94a8';
}

function Paperdoll({ t, sz, equipped, onEntityClick }) {
  const slots = equipped || {};
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4,
      marginBottom: 12,
    }}>
      {EQUIP_SLOTS.map(slot => {
        const item = slots[slot.id];
        return (
          <div key={slot.id}
            onClick={() => item && onEntityClick({ id: item.name?.toLowerCase(), type: 'Item' })}
            style={{
              padding: '6px 8px', borderRadius: 4,
              background: item ? t.bgCard : 'transparent',
              border: item ? `1px solid ${t.border}` : `1px dashed ${t.borderLight}`,
              cursor: item ? 'pointer' : 'default',
              minHeight: 40, display: 'flex', flexDirection: 'column', justifyContent: 'center',
              transition: 'border-color 0.2s',
              gridRow: slot.row + 1, gridColumn: slot.col + 1,
            }}
          >
            {item ? (
              <>
                <div style={{
                  fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui - 1, color: t.heading,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{item.name}</div>
                {item.tag && <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui - 2, color: t.textDim, fontStyle: 'italic' }}>{item.tag}</div>}
              </>
            ) : (
              <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui - 2, color: t.textFaint, textAlign: 'center' }}>{slot.label}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ResourceBoxes({ t, sz, inventory, currencyLabel }) {
  const rations = inventory?.rations ?? 0;
  const water = inventory?.water ?? 0;
  const coins = inventory?.coins ?? 0;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 12 }}>
      {[
        { icon: '\uD83C\uDF5E', value: rations, label: 'Rations' },
        { icon: '\uD83D\uDCA7', value: water, label: 'Water' },
        { icon: '\uD83E\uDE99', value: coins, label: currencyLabel || 'Coins' },
      ].map(r => (
        <div key={r.label} style={{
          padding: '8px 6px', background: t.bgCard, border: `1px solid ${t.border}`,
          borderRadius: 4, textAlign: 'center',
        }}>
          <div style={{ fontSize: 14 }}>{r.icon}</div>
          <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: sz.ui + 1, color: t.heading, fontWeight: 600 }}>{r.value}</div>
          <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui - 2, color: t.textDim }}>{r.label}</div>
        </div>
      ))}
    </div>
  );
}

function CapacityBar({ t, sz, current, max }) {
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0;
  const over = current > max;
  const near = pct > 80 && !over;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <span style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui, color: t.textMuted }}>
          {'\uD83C\uDF92'} Capacity
        </span>
        <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: sz.ui, color: over ? '#e85a5a' : t.heading, fontWeight: 500 }}>
          {current}/{max}
        </span>
      </div>
      <div style={{ height: 5, background: t.borderLight, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${Math.min(pct, 100)}%`, borderRadius: 3,
          background: over ? 'linear-gradient(90deg, #e85a5a, #c84a4a)' : near ? 'linear-gradient(90deg, #e8c45a, #e8845a)' : 'linear-gradient(90deg, #8aba7a, #7aba7a)',
          transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  );
}

function InventoryItemRow({ t, sz, item, onClick }) {
  const pct = item.maxDurability > 0 ? (item.durability / item.maxDurability) * 100 : 100;
  const durColor = durabilityColor(item.durability, item.maxDurability);
  const broken = item.durability === 0;
  return (
    <div onClick={() => onClick({ id: item.name.toLowerCase(), type: 'Item' })} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '6px 4px', borderBottom: `1px solid ${t.borderLight}`,
      cursor: 'pointer', transition: 'background 0.2s', opacity: broken ? 0.5 : 1,
    }}
      onMouseEnter={e => { e.currentTarget.style.background = t.bgCard; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
        <span style={{
          fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui, color: t.heading,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          textDecoration: broken ? 'line-through' : 'none',
        }}>{item.name}</span>
        {item.tag && <span style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui - 1, color: t.textDim, fontStyle: 'italic', flexShrink: 0 }}>({item.tag})</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 6 }}>
        <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 10, color: durColor, fontWeight: 600 }}>{item.durability}/{item.maxDurability}</span>
        <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 10, color: t.textDim }}>{(item.slots || 0).toFixed(1)}</span>
      </div>
    </div>
  );
}

function InventoryTab({ t, sz, inventory, equipped, currencyLabel, onEntityClick }) {
  if (!inventory) return <div style={{ fontFamily: "var(--font-alegreya)", fontSize: sz.ui, fontStyle: 'italic', color: t.textDim, textAlign: 'center', paddingTop: 30 }}>No inventory data</div>;

  const items = inventory.items || [];
  const current = inventory.current ?? 0;
  const max = inventory.max ?? 10;

  return (
    <div>
      <Paperdoll t={t} sz={sz} equipped={equipped} onEntityClick={onEntityClick} />
      <ResourceBoxes t={t} sz={sz} inventory={inventory} currencyLabel={currencyLabel} />
      <CapacityBar t={t} sz={sz} current={current} max={max} />

      <PanelSection t={t} title="Carried Items">
        {items.length === 0
          ? <div style={{ fontFamily: "var(--font-alegreya)", fontSize: sz.ui, fontStyle: 'italic', color: t.textDim }}>Nothing carried</div>
          : items.map(item => <InventoryItemRow key={item.name} t={t} sz={sz} item={item} onClick={onEntityClick} />)
        }
      </PanelSection>
    </div>
  );
}

// =============================================================================
// Entity Popup Modal
// =============================================================================

function EntityPopup({ t, sz, entity, glossary, gameId, onClose }) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const noteLoaded = useRef(false);

  // Find glossary entry
  const entry = (glossary || []).find(g => g.term?.toLowerCase() === entity?.id?.toLowerCase() || g.term?.toLowerCase() === entity?.name?.toLowerCase());

  // Load player note
  useEffect(() => {
    if (!entity || noteLoaded.current) return;
    const fetchNote = async () => {
      try {
        const res = await api.get(`/api/game/${gameId}/notes?entity=${encodeURIComponent(entity.id || entity.name || '')}`);
        setNote(res.note || res.text || '');
      } catch { /* no note yet */ }
      noteLoaded.current = true;
    };
    if (gameId) fetchNote();
  }, [entity, gameId]);

  const saveNote = async () => {
    if (!gameId) return;
    setSaving(true);
    try {
      await api.post(`/api/game/${gameId}/notes`, { entityId: entity.id || entity.name, entityType: entity.type, text: note });
    } catch { /* silently fail */ }
    setSaving(false);
  };

  if (!entity) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: '#000000aa' }} />
      <div onClick={e => e.stopPropagation()} style={{
        background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 10,
        padding: '24px 28px', maxWidth: 420, width: '90%', position: 'relative', zIndex: 1,
        maxHeight: '80vh', overflow: 'auto',
      }}>
        {/* Close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 12, right: 14, background: 'none', border: 'none',
          cursor: 'pointer', fontSize: 16, color: t.textDim,
        }}>{'\u2715'}</button>

        <div style={{ fontFamily: "var(--font-cinzel)", fontSize: 18, fontWeight: 700, color: t.heading, marginBottom: 8, paddingRight: 24 }}>
          {entity.name || entity.id || 'Unknown'}
        </div>

        {entity.type && <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 12, color: t.textDim, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{entity.type}</div>}

        {entry?.definition && (
          <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui, color: t.textMuted, lineHeight: 1.6, marginBottom: 16 }}>{entry.definition}</div>
        )}

        {/* Item-specific: durability */}
        {entry?.durability !== undefined && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui - 1, color: t.textMuted }}>Durability</span>
              <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: sz.ui, color: durabilityColor(entry.durability, entry.maxDurability), fontWeight: 600 }}>
                {entry.durability}/{entry.maxDurability}
              </span>
            </div>
            <div style={{ height: 4, background: t.borderLight, borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${entry.maxDurability > 0 ? (entry.durability / entry.maxDurability) * 100 : 0}%`,
                background: durabilityColor(entry.durability, entry.maxDurability), borderRadius: 2,
              }} />
            </div>
            {entry.quality && <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui - 1, color: t.textDim, marginTop: 4 }}>Quality: {entry.quality}</div>}
          </div>
        )}

        {/* Player notes */}
        <div style={{ marginTop: 8 }}>
          <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui - 1, color: t.textMuted, marginBottom: 6 }}>Your notes</div>
          <textarea value={note} onChange={e => setNote(e.target.value)} onBlur={saveNote} placeholder="Add a note..." style={{
            width: '100%', minHeight: 60, padding: '8px 10px',
            background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: 4,
            fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui, color: t.text,
            outline: 'none', resize: 'vertical', boxSizing: 'border-box',
          }} />
          {saving && <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 10, color: t.textFaint, marginTop: 2 }}>Saving...</div>}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// NPCs Tab
// =============================================================================

const DISPOSITION_COLORS = { Friendly: '#7aba7a', Neutral: '#8a94a8', Wary: '#e8c45a', Hostile: '#c84a4a' };

function NPCCard({ t, sz, npc, onClick }) {
  const dispColor = DISPOSITION_COLORS[npc.disposition] || t.textMuted;
  const relPct = Math.max(0, Math.min(100, (npc.relationship || 0.5) * 100));
  return (
    <div onClick={() => onClick({ id: npc.name.toLowerCase(), type: 'NPC', name: npc.name })} style={{
      padding: '10px 0', borderBottom: `1px solid ${t.borderLight}`, cursor: 'pointer',
      transition: 'background 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = t.bgCard; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontFamily: "var(--font-cinzel)", fontSize: sz.ui + 1, fontWeight: 600, color: t.heading }}>{npc.name}</span>
        <span style={{
          fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui - 1, color: dispColor,
          background: `${dispColor}18`, padding: '2px 8px', borderRadius: 3,
        }}>{npc.disposition}</span>
      </div>
      <div style={{ height: 3, background: t.borderLight, borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
        <div style={{
          height: '100%', width: `${relPct}%`, borderRadius: 2,
          background: 'linear-gradient(90deg, #c84a4a, #e8c45a, #7aba7a)', backgroundSize: '300% 100%',
          backgroundPosition: `${relPct}% 0`,
        }} />
      </div>
      {npc.notes && <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui - 1, color: t.textMuted, marginTop: 3, lineHeight: 1.4 }}>{npc.notes}</div>}
      <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: sz.ui - 2, color: t.textFaint, marginTop: 3 }}>
        Last seen: {npc.lastSeen || 'Unknown'}
      </div>
    </div>
  );
}

function NPCsTab({ t, sz, npcs, onEntityClick }) {
  if (!npcs || npcs.length === 0) {
    return <div style={{ fontFamily: "var(--font-alegreya)", fontSize: sz.ui, fontStyle: 'italic', color: t.textDim, textAlign: 'center', paddingTop: 30 }}>No NPCs encountered yet</div>;
  }
  return (
    <div>
      {npcs.map(npc => <NPCCard key={npc.name} t={t} sz={sz} npc={npc} onClick={onEntityClick} />)}
    </div>
  );
}

// =============================================================================
// Glossary Tab
// =============================================================================

const GLOSSARY_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'NPC', label: 'People' },
  { id: 'Location', label: 'Places' },
  { id: 'Faction', label: 'Factions' },
  { id: 'Item', label: 'Items' },
];

function GlossaryTab({ t, sz, glossary, onEntityClick }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const debounceRef = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const filtered = (glossary || [])
    .filter(e => category === 'all' || e.category === category)
    .filter(e => !debouncedSearch || e.term?.toLowerCase().includes(debouncedSearch.toLowerCase()) || e.definition?.toLowerCase().includes(debouncedSearch.toLowerCase()))
    .sort((a, b) => (a.term || '').localeCompare(b.term || ''));

  return (
    <div>
      {/* Search */}
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{
        width: '100%', padding: '8px 10px', marginBottom: 10,
        background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: 4,
        fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui, color: t.text, outline: 'none',
        boxSizing: 'border-box',
      }} />

      {/* Category filters */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
        {GLOSSARY_CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setCategory(cat.id)} style={{
            padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
            fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui - 1,
            color: category === cat.id ? t.accent : t.textMuted,
            background: category === cat.id ? t.bgCard : 'transparent',
            border: `1px solid ${category === cat.id ? t.accent : t.border}`,
            transition: 'all 0.2s',
          }}>{cat.label}</button>
        ))}
      </div>

      {/* Entries */}
      {filtered.length === 0 ? (
        <div style={{ fontFamily: "var(--font-alegreya)", fontSize: sz.ui, fontStyle: 'italic', color: t.textDim, textAlign: 'center', paddingTop: 20 }}>
          {debouncedSearch ? 'No matching entries' : 'No glossary entries yet'}
        </div>
      ) : filtered.map(entry => (
        <div key={entry.term} onClick={() => onEntityClick({ id: entry.term?.toLowerCase(), type: entry.category, name: entry.term })} style={{
          padding: '8px 0', borderBottom: `1px solid ${t.borderLight}`, cursor: 'pointer', transition: 'background 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = t.bgCard; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <div style={{ fontFamily: "var(--font-cinzel)", fontSize: sz.ui + 1, fontWeight: 600, color: t.heading, marginBottom: 3 }}>{entry.term}</div>
          <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui, color: t.textMuted, lineHeight: 1.45 }}>{entry.definition}</div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Map Tab (simplified list view)
// =============================================================================

// TODO: Replace with interactive node map from node-map-v2.jsx

function MapTab({ t, sz, locations, routes, onEntityClick }) {
  const currentLoc = (locations || []).find(l => l.current);

  return (
    <div>
      {/* Current location */}
      {currentLoc && (
        <div style={{
          padding: '10px 12px', marginBottom: 12,
          background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 6,
        }}>
          <span style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui, color: t.accent }}>
            {'\uD83D\uDCCD'} Current: {currentLoc.name}
          </span>
        </div>
      )}

      {/* Location list */}
      {(!locations || locations.length === 0) ? (
        <div style={{ fontFamily: "var(--font-alegreya)", fontSize: sz.ui, fontStyle: 'italic', color: t.textDim, textAlign: 'center', paddingTop: 20 }}>No locations discovered</div>
      ) : locations.map((loc, i) => (
        <div key={loc.name || i} onClick={() => onEntityClick({ id: loc.name?.toLowerCase(), type: 'Location', name: loc.name })} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '7px 4px',
          borderBottom: `1px solid ${t.borderLight}`, cursor: 'pointer', transition: 'background 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = t.bgCard; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <div style={{
            width: loc.current ? 10 : 7, height: loc.current ? 10 : 7,
            borderRadius: '50%', flexShrink: 0,
            background: loc.current ? t.accent : t.textDim,
            border: loc.current ? `2px solid ${t.accent}` : 'none',
          }} />
          <span style={{
            fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui,
            color: loc.current ? t.accent : t.textMuted, fontWeight: loc.current ? 600 : 400,
          }}>{loc.name}</span>
          {loc.type && <span style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui - 2, color: t.textFaint, fontStyle: 'italic', marginLeft: 'auto' }}>{loc.type}</span>}
        </div>
      ))}

      {/* Routes */}
      {routes && routes.length > 0 && (
        <PanelSection t={t} title="Routes" defaultOpen={false}>
          {routes.map((route, i) => (
            <div key={i} style={{
              fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui - 1, color: t.textDim,
              padding: '4px 0',
            }}>
              {route.from} {'\u2192'} {route.to}{route.travelTime ? ` (${route.travelTime})` : ''}
            </div>
          ))}
        </PanelSection>
      )}
    </div>
  );
}

// =============================================================================
// Journal Tab
// =============================================================================

function ObjectiveCard({ t, sz, obj, isServer, onAbandon, onDrop }) {
  const [confirmAbandon, setConfirmAbandon] = useState(false);
  const [hovering, setHovering] = useState(false);
  const hasProgress = obj.progress !== undefined && obj.total !== undefined;

  return (
    <div style={{
      padding: '10px 12px', background: t.bgCard, border: `1px solid ${t.border}`,
      borderRadius: 6, marginBottom: 8, position: 'relative',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ color: isServer ? t.accent : t.textDim, fontSize: sz.ui, flexShrink: 0, marginTop: 1 }}>
          {isServer ? '\u25C6' : '\u25CB'}
        </span>
        <div style={{ flex: 1 }}
          onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}
        >
          <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui, color: t.text, lineHeight: 1.4 }}>{obj.text}</div>
          {hasProgress && (
            <div style={{ marginTop: 6 }}>
              <div style={{ height: 4, background: t.borderLight, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${obj.total > 0 ? (obj.progress / obj.total) * 100 : 0}%`,
                  background: 'linear-gradient(90deg, #907f5e, #c9a84c)', borderRadius: 2,
                }} />
              </div>
              <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 10, color: t.textDim, marginTop: 2, display: 'inline-block' }}>
                [{obj.progress}/{obj.total}]
              </span>
            </div>
          )}
          {isServer && !confirmAbandon && (
            <button onClick={() => setConfirmAbandon(true)} style={{
              fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui - 2, color: t.textFaint,
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', marginTop: 4,
              textDecoration: 'underline',
            }}>Abandon</button>
          )}
          {!isServer && hovering && (
            <button onClick={() => onDrop && onDrop(obj.id)} style={{
              position: 'absolute', top: 8, right: 10,
              fontFamily: "var(--font-alegreya-sans)", fontSize: 14, color: t.textFaint,
              background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1,
            }}>{'\u00D7'}</button>
          )}
        </div>
      </div>

      {confirmAbandon && (
        <div style={{
          marginTop: 8, padding: '8px 10px', background: t.bgInput, border: `1px solid ${t.danger}`,
          borderRadius: 4, fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui - 1, color: t.danger,
          lineHeight: 1.5,
        }}>
          Abandoning triggers consequences: standing penalties, narrative fallout, and a permanent record. This is not a quiet delete.
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={() => { onAbandon && onAbandon(obj.id); setConfirmAbandon(false); }} style={{
              fontFamily: "var(--font-cinzel)", fontSize: 11, fontWeight: 600, color: '#ffffff',
              background: '#b83a3a', border: 'none', borderRadius: 4, padding: '5px 14px', cursor: 'pointer',
            }}>Confirm</button>
            <button onClick={() => setConfirmAbandon(false)} style={{
              fontFamily: "var(--font-cinzel)", fontSize: 11, fontWeight: 600, color: t.textMuted,
              background: 'transparent', border: `1px solid ${t.border}`, borderRadius: 4, padding: '5px 14px', cursor: 'pointer',
            }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function JournalTab({ t, sz, objectives, entityNotes, gameId, onSubmitAction }) {
  const [newObjective, setNewObjective] = useState('');
  const [scratchpad, setScratchpad] = useState('');
  const scratchLoaded = useRef(false);

  // Load scratchpad from localStorage
  useEffect(() => {
    if (scratchLoaded.current || !gameId) return;
    setScratchpad(localStorage.getItem(`crucible_scratchpad_${gameId}`) || '');
    scratchLoaded.current = true;
  }, [gameId]);

  // Save scratchpad
  const saveScratchpad = useCallback((text) => {
    setScratchpad(text);
    if (gameId) localStorage.setItem(`crucible_scratchpad_${gameId}`, text);
  }, [gameId]);

  const serverObjectives = (objectives || []).filter(o => o.source === 'server' || o.isServer);
  const playerObjectives = (objectives || []).filter(o => o.source === 'player' || !o.isServer);

  const handleAddObjective = () => {
    if (!newObjective.trim()) return;
    // Post as bracket command
    if (onSubmitAction) onSubmitAction({ type: 'custom', text: `[set_objective ${newObjective.trim()}]` });
    setNewObjective('');
  };

  const handleAbandon = (objId) => {
    if (onSubmitAction) onSubmitAction({ type: 'custom', text: `[abandon_objective ${objId}]` });
  };

  const handleDropPlayerObjective = async (objId) => {
    try {
      await api.del(`/api/game/${gameId}/notes/${objId}`);
    } catch { /* silent */ }
  };

  return (
    <div>
      <PanelSection t={t} title="Objectives">
        {serverObjectives.length === 0 && playerObjectives.length === 0 ? (
          <div style={{ fontFamily: "var(--font-alegreya)", fontSize: sz.ui, fontStyle: 'italic', color: t.textDim }}>
            No active objectives. The world is yours to direct.
          </div>
        ) : (
          <>
            {serverObjectives.map(obj => (
              <ObjectiveCard key={obj.id || obj.text} t={t} sz={sz} obj={obj} isServer onAbandon={handleAbandon} />
            ))}
            {playerObjectives.map(obj => (
              <ObjectiveCard key={obj.id || obj.text} t={t} sz={sz} obj={obj} isServer={false} onDrop={handleDropPlayerObjective} />
            ))}
          </>
        )}
        {/* Add objective input */}
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <input value={newObjective} onChange={e => setNewObjective(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAddObjective(); }}
            placeholder="Add a personal objective..."
            style={{
              flex: 1, padding: '7px 10px', background: t.bgInput, border: `1px solid ${t.border}`,
              borderRadius: 4, fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui,
              color: t.text, outline: 'none', boxSizing: 'border-box',
            }}
          />
          <button onClick={handleAddObjective} disabled={!newObjective.trim()} style={{
            padding: '7px 12px', background: t.bgCard, border: `1px solid ${t.border}`,
            borderRadius: 4, cursor: newObjective.trim() ? 'pointer' : 'default',
            fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui,
            color: newObjective.trim() ? t.accent : t.textFaint,
          }}>+</button>
        </div>
      </PanelSection>

      <PanelSection t={t} title="Entity Notes" defaultOpen={(entityNotes || []).length > 0}>
        {(!entityNotes || entityNotes.length === 0) ? (
          <div style={{ fontFamily: "var(--font-alegreya)", fontSize: sz.ui, fontStyle: 'italic', color: t.textDim }}>
            Add notes to any NPC, location, or item from their popup.
          </div>
        ) : entityNotes.map((note, i) => (
          <div key={note.entityId || i} style={{ padding: '8px 0', borderBottom: `1px solid ${t.borderLight}` }}>
            <div style={{ fontFamily: "var(--font-cinzel)", fontSize: sz.ui, fontWeight: 600, color: t.heading, marginBottom: 2 }}>{note.entityName || note.entityId}</div>
            <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui, color: t.textMuted, lineHeight: 1.4 }}>{note.text}</div>
            {note.turn && <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 10, color: t.textFaint, marginTop: 2 }}>Turn {note.turn}</div>}
          </div>
        ))}
      </PanelSection>

      <PanelSection t={t} title="Scratchpad">
        <textarea value={scratchpad} onChange={e => saveScratchpad(e.target.value)}
          placeholder="Freeform notes..."
          style={{
            width: '100%', minHeight: 100, padding: '8px 10px',
            background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: 4,
            fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui, color: t.text,
            outline: 'none', resize: 'vertical', boxSizing: 'border-box',
          }}
        />
        <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 10, color: t.textFaint, marginTop: 4 }}>Auto-saved</div>
      </PanelSection>
    </div>
  );
}

// =============================================================================
// Sidebar
// =============================================================================

function Sidebar({ t, sz, width, activeTab, setActiveTab, badges, character, inventory, equipped, currencyLabel, glossary, gameId, onEntityClick, npcs, locations, routes, objectives, entityNotes, onSubmitAction }) {
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
        {activeTab === 'character' && <CharacterTab t={t} sz={sz} character={character} onEntityClick={onEntityClick} />}
        {activeTab === 'inventory' && <InventoryTab t={t} sz={sz} inventory={inventory} equipped={equipped} currencyLabel={currencyLabel} onEntityClick={onEntityClick} />}
        {activeTab === 'npcs' && <NPCsTab t={t} sz={sz} npcs={npcs} onEntityClick={onEntityClick} />}
        {activeTab === 'glossary' && <GlossaryTab t={t} sz={sz} glossary={glossary} onEntityClick={onEntityClick} />}
        {activeTab === 'map' && <MapTab t={t} sz={sz} locations={locations} routes={routes} onEntityClick={onEntityClick} />}
        {activeTab === 'journal' && <JournalTab t={t} sz={sz} objectives={objectives} entityNotes={entityNotes} gameId={gameId} onSubmitAction={onSubmitAction} />}
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
  const [streamingTurn, setStreamingTurn] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [actionError, setActionError] = useState(null);

  // --- Character + Inventory state ---
  const [character, setCharacter] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [equipped, setEquipped] = useState({});
  const [currencyLabel, setCurrencyLabel] = useState('Coins');
  const [glossary, setGlossary] = useState([]);
  const [npcs, setNpcs] = useState([]);
  const [locations, setLocations] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [objectives, setObjectives] = useState([]);
  const [entityNotes, setEntityNotes] = useState([]);
  const [entityPopup, setEntityPopup] = useState(null);

  // --- UI state ---
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(sz.sidebar);
  const [activeTab, setActiveTabRaw] = useState('character');
  const setActiveTab = useCallback((tab) => {
    setActiveTabRaw(tab);
    // Clear badge for viewed tab
    setBadges(prev => prev[tab] > 0 ? { ...prev, [tab]: 0 } : prev);
  }, []);
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
        // Character + inventory
        setCharacter(data.character || null);
        setInventory(data.character?.inventory || data.inventory || null);
        setEquipped(data.character?.equipped || data.equipped || {});
        setCurrencyLabel(data.world?.currencyLabel || data.currencyLabel || 'Coins');
        // NPCs, locations, objectives
        setNpcs(data.npcs || []);
        setLocations(data.locations || data.map?.locations || []);
        setRoutes(data.routes || data.map?.routes || []);
        setObjectives(data.objectives || data.quests || []);
      } catch (err) {
        setError(err.message || 'Failed to load game.');
      } finally {
        setLoading(false);
      }
    };
    fetchGame();
  }, [authChecked, gameId]);

  // --- Fetch supplementary data on load ---
  useEffect(() => {
    if (!authChecked || !gameId || loading || error) return;
    const fetchSuppData = async () => {
      // Glossary
      try {
        const res = await api.get(`/api/game/${gameId}/glossary`);
        setGlossary(res.entries || res.glossary || res || []);
      } catch { /* endpoint may not be available */ }
      // Map
      try {
        const res = await api.get(`/api/game/${gameId}/map`);
        setLocations(res.locations || []);
        setRoutes(res.routes || []);
      } catch { /* endpoint may not be available */ }
      // Entity notes
      try {
        const res = await api.get(`/api/game/${gameId}/notes`);
        setEntityNotes(res.notes || res || []);
      } catch { /* endpoint may not be available */ }
    };
    fetchSuppData();
  }, [authChecked, gameId, loading, error]);

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
      const changes = event.changes || event.statusChanges || [];
      setStreamingTurn(prev => prev ? { ...prev, statusChanges: changes } : prev);
      // Update character/inventory from state changes
      if (event.character) setCharacter(event.character);
      if (event.inventory) setInventory(event.inventory);
      if (event.equipped) setEquipped(event.equipped);
      // Update badge counts for new items/entities
      const invCount = changes.filter(c => c.type === 'inventory_gained').length;
      const npcCount = changes.filter(c => c.type === 'npc_introduced').length;
      const glossCount = changes.filter(c => c.type === 'glossary_added').length;
      if (invCount || npcCount || glossCount) {
        setBadges(prev => ({
          ...prev,
          inventory: prev.inventory + invCount,
          npcs: prev.npcs + npcCount,
          glossary: prev.glossary + glossCount,
        }));
      }
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

  // --- Entity popup ---
  const handleEntityClick = useCallback((entity) => {
    setEntityPopup(entity);
  }, []);

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
            <Sidebar t={t} sz={sz} width={sidebarWidth} activeTab={activeTab} setActiveTab={setActiveTab} badges={badges}
              character={character} inventory={inventory} equipped={equipped} currencyLabel={currencyLabel}
              glossary={glossary} gameId={gameId} onEntityClick={handleEntityClick}
              npcs={npcs} locations={locations} routes={routes}
              objectives={objectives} entityNotes={entityNotes} onSubmitAction={handleSubmitAction} />
          </>
        )}
      </div>

      {/* Entity popup modal */}
      {entityPopup && (
        <EntityPopup t={t} sz={sz} entity={entityPopup} glossary={glossary} gameId={gameId} onClose={() => setEntityPopup(null)} />
      )}
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
