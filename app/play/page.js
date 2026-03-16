'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
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

const STAT_META = {
  STR: { name: 'Strength', emoji: '\u{1F4AA}' },
  DEX: { name: 'Dexterity', emoji: '\u{1F3C3}' },
  CON: { name: 'Constitution', emoji: '\u{1F6E1}\uFE0F' },
  INT: { name: 'Intelligence', emoji: '\u{1F9E0}' },
  WIS: { name: 'Wisdom', emoji: '\u{1F441}\uFE0F' },
  CHA: { name: 'Charisma', emoji: '\u{1F3AD}' },
  POT: { name: 'Potency', emoji: '\u2728' },
};

function transformStats(statsObj) {
  if (!statsObj || typeof statsObj !== 'object') return [];
  if (Array.isArray(statsObj)) return statsObj;
  return Object.entries(statsObj)
    .filter(([abbr]) => STAT_META[abbr])
    .map(([abbr, val]) => ({
      name: STAT_META[abbr].name,
      abbr,
      emoji: STAT_META[abbr].emoji,
      base: typeof val === 'object' ? val.base : val,
      effective: typeof val === 'object' ? val.effective : val,
    }));
}

function transformResolution(res) {
  if (!res) return null;
  if (res.text || res.compressed) return res;
  return {
    text: res.tierName || (res.tier ? `${res.tier}: ${res.tierName || ''}` : ''),
    details: {
      action: res.action || null,
      stat: res.stat || null,
      skill: res.skillUsed || null,
      dc: res.dc || null,
      total: res.total || null,
      result: res.tierName || null,
      d20Roll: Array.isArray(res.diceRolled) ? res.diceRolled.join(', ') : res.dieSelected || null,
      crucibleRoll: res.dieSelected || null,
    },
    margin: res.margin,
    tier: res.tier,
    tierName: res.tierName,
    isCombat: res.isCombat,
  };
}

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

    es.onopen = () => { console.log('SSE connected:', url); setConnected(true); setReconnecting(false); };

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

    es.onerror = (err) => {
      console.error('SSE connection error:', err, `(readyState: ${es.readyState}, url: ${url})`);
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

function TopBar({ t, worldName, sidebarOpen, onToggleSidebar, onOpenSettings, connected, reconnecting, debugMode }) {
  const connColor = connected ? '#8aba7a' : reconnecting ? '#e8c45a' : '#e85a5a';
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
        {debugMode && (
          <span style={{ fontFamily: "var(--font-cinzel)", fontSize: 9, fontWeight: 700, color: '#e85a5a', background: '#2a0e0e', padding: '2px 8px', borderRadius: 3, letterSpacing: '0.1em' }}>DEBUG</span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {/* Connection status dot */}
        <div title={connected ? 'Connected' : reconnecting ? 'Reconnecting' : 'Disconnected'} style={{
          width: 7, height: 7, borderRadius: '50%', background: connColor, marginRight: 6,
          boxShadow: `0 0 4px ${connColor}`,
        }} />
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
// Dice Animation
// =============================================================================

const GLOW_COLORS = { none: 'transparent', gold: '#c9a84c', tarnished: '#8a6a3a', crimson: '#c84a4a' };

const DICE_TIMINGS = {
  cinematic: { crucible: 600, mortalSpin: 900, mortalLand: 1500, resolved: 1800, transition: 2800, stream: 3200 },
  efficient: { crucible: 400, mortalSpin: 600, mortalLand: 1000, resolved: 1200, transition: 1800, stream: 2100 },
  instant: null,
};

function MiniD20({ value, size = 72, glow = 'none', spinning = false, ghost = false, hideValue = false }) {
  const glowColor = GLOW_COLORS[glow] || 'transparent';
  const hasGlow = glow !== 'none' && !ghost;
  const valueColor = value === 20 ? '#c9a84c' : value === 1 ? '#e85a5a' : '#d0c098';

  return (
    <div style={{
      width: size, height: size, position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: ghost ? 0.2 : 1, transition: 'opacity 0.5s',
    }}>
      {hasGlow && (
        <div style={{
          position: 'absolute', inset: -4, borderRadius: '50%',
          boxShadow: `0 0 16px 4px ${glowColor}55, 0 0 6px 2px ${glowColor}33`,
          border: `2px solid ${glowColor}`,
        }} />
      )}
      <svg width={size} height={size} viewBox="0 0 100 100" style={{
        animation: spinning ? 'diceSpin 0.6s linear infinite' : 'none',
      }}>
        <polygon
          points="50,5 95,35 82,88 18,88 5,35"
          fill="#111528" stroke={hasGlow ? glowColor : '#1e2540'} strokeWidth="2"
        />
      </svg>
      <span style={{
        position: 'absolute', fontFamily: "var(--font-jetbrains)",
        fontSize: size * 0.3, fontWeight: 700,
        color: (spinning || hideValue) ? '#7082a4' : valueColor,
      }}>
        {spinning || hideValue ? '?' : value}
      </span>
    </div>
  );
}

function InlineDicePanel({ t, sz, diceRoll, resolution, diceMode, onComplete }) {
  const [phase, setPhase] = useState(0);
  const timerRef = useRef(null);

  const roll = diceRoll || {};
  const category = roll.category || 'MATCHED';
  const isMatched = category === 'MATCHED';
  const isOutmatched = category === 'OUTMATCHED';
  const isDominant = category === 'DOMINANT';
  const hasCrucible = !isMatched;

  const timing = diceMode === 'instant' ? null : DICE_TIMINGS[diceMode] || DICE_TIMINGS.efficient;

  // Auto-advance through phases
  useEffect(() => {
    if (!timing || !diceRoll) {
      setPhase(7);
      return;
    }
    setPhase(1);
    const advance = (nextPhase, delay) => {
      timerRef.current = setTimeout(() => setPhase(nextPhase), delay);
    };
    advance(2, timing.crucible);
    setTimeout(() => advance(3, 0), timing.mortalSpin);
    setTimeout(() => advance(4, 0), timing.mortalLand);
    setTimeout(() => advance(5, 0), timing.resolved);
    setTimeout(() => advance(6, 0), timing.transition);
    setTimeout(() => { setPhase(7); if (onComplete) onComplete(); }, timing.stream);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [diceRoll, timing, onComplete]);

  if (phase >= 7 || !diceRoll) return null;

  const crucibleValue = roll.crucible || roll.die;
  const mortalDie1 = roll.mortal?.die1 || roll.die;
  const mortalDie2 = roll.mortal?.die2;
  const keptValue = roll.kept || roll.die;
  const isNat20 = crucibleValue === 20;
  const isNat1 = crucibleValue === 1;

  // Category banner colors
  const catColor = isNat20 ? '#c9a84c' : isNat1 ? '#e85a5a' : category === 'DOMINANT' ? '#8a6a3a' : '#8a94a8';

  // Determine glow for mortal dice (phase 4+)
  const die1Glow = phase >= 4 ? (isOutmatched && mortalDie1 === keptValue ? 'gold' : isDominant && mortalDie1 === keptValue ? 'tarnished' : 'none') : 'none';
  const die2Glow = phase >= 4 && mortalDie2 ? (isOutmatched && mortalDie2 === keptValue ? 'gold' : isDominant && mortalDie2 === keptValue ? 'tarnished' : 'none') : 'none';
  const die1Ghost = phase >= 4 && mortalDie2 && mortalDie1 !== keptValue;
  const die2Ghost = phase >= 4 && mortalDie2 && mortalDie2 !== keptValue;

  // Result text for phase 5
  const resultText = resolution?.details?.result || resolution?.text || '';

  return (
    <div style={{
      padding: '16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      opacity: phase === 6 ? 0 : 1, transform: phase === 6 ? 'scaleY(0.8)' : 'scaleY(1)',
      transition: 'opacity 0.4s ease, transform 0.4s ease',
      overflow: 'hidden', maxHeight: phase === 6 ? 0 : 200,
    }}>
      {/* Category banner */}
      {phase >= 2 && hasCrucible && (
        <div style={{
          fontFamily: "var(--font-cinzel)", fontSize: 11, fontWeight: 700,
          color: catColor, letterSpacing: '0.15em',
          animation: 'fadeIn 0.3s ease',
        }}>{category}{isNat20 ? ' (NAT 20)' : isNat1 ? ' (NAT 1)' : ''}</div>
      )}

      {/* Dice row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Crucible die (Outmatched/Dominant only) */}
        {hasCrucible && phase >= 1 && (
          <MiniD20
            value={crucibleValue}
            size={phase <= 1 ? 80 : 56}
            spinning={phase <= 1}
            hideValue={phase < 2}
            glow={isNat20 ? 'gold' : isNat1 ? 'crimson' : 'none'}
          />
        )}

        {/* Mortal dice */}
        {(isMatched || phase >= 3) && (
          <>
            <MiniD20
              value={isMatched ? keptValue : mortalDie1}
              size={72}
              spinning={phase < (isMatched ? 2 : 4)}
              hideValue={phase < (isMatched ? 2 : 4)}
              glow={isMatched ? (phase >= 2 ? 'gold' : 'none') : die1Glow}
              ghost={die1Ghost}
            />
            {!isMatched && mortalDie2 !== undefined && (
              <MiniD20
                value={mortalDie2}
                size={72}
                spinning={phase < 4}
                hideValue={phase < 4}
                glow={die2Glow}
                ghost={die2Ghost}
              />
            )}
          </>
        )}
      </div>

      {/* Result flash */}
      {phase >= 5 && resultText && (
        <div style={{
          fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui + 1, fontWeight: 600,
          color: resultText.toLowerCase().includes('success') ? t.success : t.danger,
          animation: 'fadeIn 0.3s ease',
        }}>{resultText}</div>
      )}

      {/* Debt indicator */}
      {roll.debt && phase >= 4 && (
        <div style={{
          fontFamily: "var(--font-jetbrains)", fontSize: 10, color: t.danger,
          padding: '2px 8px', background: t.bgCard, border: `1px solid ${t.danger}`,
          borderRadius: 3,
        }}>DEBT: {roll.debt}</div>
      )}
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
          key={opt.id || opt.key}
          onClick={() => onSubmit({ type: 'option', key: opt.id || opt.key })}
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
          }}>{opt.id || opt.key}</span>
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

function TurnBlock({ t, sz, turn, isLatest, isStreaming, bookmarked, onToggleBookmark, onSubmitAction, waiting, diceMode }) {
  const [diceComplete, setDiceComplete] = useState(!isLatest || !turn.diceRoll);

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

      {/* Dice animation (latest turn only, when roll exists) */}
      {isLatest && turn.diceRoll && (
        <InlineDicePanel t={t} sz={sz} diceRoll={turn.diceRoll} resolution={turn.resolution}
          diceMode={diceMode} onComplete={() => setDiceComplete(true)} />
      )}

      {/* Resolution (shows after dice animation completes or for history turns) */}
      {(diceComplete || !isLatest) && <ResolutionBlock t={t} sz={sz} resolution={turn.resolution} />}

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
        {condition.durationType || condition.duration}{condition.escalation && condition.escalation !== 'None' ? ` \u00B7 Escalates: ${condition.escalation}` : ''}
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
        +{typeof (skill.modifier ?? skill.value) === 'number' ? (skill.modifier ?? skill.value).toFixed(1) : (skill.modifier ?? skill.value)}
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

  const stats = Array.isArray(character.stats) ? character.stats : transformStats(character.stats);
  const skills = Array.isArray(character.skills) ? character.skills : [];
  const abilities = Array.isArray(character.abilities) ? character.abilities : [];
  const conditions = Array.isArray(character.conditions) ? character.conditions : [];

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
  const coins = inventory?.currency?.raw ?? inventory?.coins ?? 0;
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
        <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 10, color: t.textDim }}>{(item.slotCost ?? item.slots ?? 0).toFixed(1)}</span>
      </div>
    </div>
  );
}

function InventoryTab({ t, sz, inventory, equipped, currencyLabel, onEntityClick }) {
  if (!inventory) return <div style={{ fontFamily: "var(--font-alegreya)", fontSize: sz.ui, fontStyle: 'italic', color: t.textDim, textAlign: 'center', paddingTop: 30 }}>No inventory data</div>;

  const items = Array.isArray(inventory.carried) ? inventory.carried : Array.isArray(inventory.items) ? inventory.items : [];
  const current = inventory.usedSlots ?? inventory.current ?? 0;
  const max = inventory.maxSlots ?? inventory.max ?? 10;

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
  const currentLoc = (locations || []).find(l => l.status === 'current' || l.current);

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
            width: (loc.status === 'current' || loc.current) ? 10 : 7, height: (loc.status === 'current' || loc.current) ? 10 : 7,
            borderRadius: '50%', flexShrink: 0,
            background: (loc.status === 'current' || loc.current) ? t.accent : t.textDim,
            border: (loc.status === 'current' || loc.current) ? `2px solid ${t.accent}` : 'none',
          }} />
          <span style={{
            fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui,
            color: (loc.status === 'current' || loc.current) ? t.accent : t.textMuted, fontWeight: (loc.status === 'current' || loc.current) ? 600 : 400,
          }}>{loc.name}</span>
          {loc.type && <span style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui - 2, color: t.textFaint, fontStyle: 'italic', marginLeft: 'auto' }}>{loc.type}</span>}
        </div>
      ))}

      {/* Routes */}
      {routes && routes.length > 0 && (
        <PanelSection t={t} title="Routes" defaultOpen={false}>
          {routes.map((route, i) => {
            const fromName = route.from || (locations || []).find(l => l.id === route.origin)?.name || route.origin;
            const toName = route.to || (locations || []).find(l => l.id === route.destination)?.name || route.destination;
            const travel = route.travelTime || (route.travelDays ? `${route.travelDays}d` : null);
            return (
              <div key={route.id || i} style={{
                fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui - 1, color: t.textDim,
                padding: '4px 0',
              }}>
                {fromName} {'\u2192'} {toName}{travel ? ` (${travel})` : ''}
              </div>
            );
          })}
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
// Settings Modal
// =============================================================================

const STORYTELLER_OPTIONS = [
  { id: 'chronicler', label: 'Chronicler', desc: 'The world as it is.' },
  { id: 'bard', label: 'Bard', desc: 'Every moment a legend in the making.' },
  { id: 'trickster', label: 'Trickster', desc: 'The world has a sense of humor.' },
  { id: 'poet', label: 'Poet', desc: 'Beauty in the breaking.' },
  { id: 'whisper', label: 'Whisper', desc: 'Everything is fine. Almost.' },
  { id: 'noir', label: 'Noir', desc: 'The city always wins.' },
  { id: 'custom', label: 'Custom', desc: 'Your voice, your rules.' },
];

const DIFFICULTY_PRESETS = {
  forgiving: { dcOffset: -2, progressionSpeed: 1.0, encounterPressure: 'low', survival: false, durability: false, fortuneBalance: true, simplifiedOutcomes: false },
  standard: { dcOffset: 0, progressionSpeed: 1.0, encounterPressure: 'standard', survival: true, durability: true, fortuneBalance: true, simplifiedOutcomes: false },
  harsh: { dcOffset: 2, progressionSpeed: 1.0, encounterPressure: 'high', survival: true, durability: true, fortuneBalance: true, simplifiedOutcomes: false },
  brutal: { dcOffset: 4, progressionSpeed: 0.75, encounterPressure: 'high', survival: true, durability: true, fortuneBalance: true, simplifiedOutcomes: false },
};

const DIFF_COLORS = { forgiving: '#7aba7a', standard: '#8a94a8', harsh: '#e8c45a', brutal: '#e85a5a' };

function SelectorRow({ t, sz, options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {options.map(opt => (
        <button key={opt.id || opt} onClick={() => onChange(opt.id || opt)} style={{
          padding: '5px 12px', borderRadius: 4, cursor: 'pointer',
          fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui,
          color: (value === (opt.id || opt)) ? t.accent : t.textMuted,
          background: (value === (opt.id || opt)) ? t.bgCard : 'transparent',
          border: `1px solid ${(value === (opt.id || opt)) ? t.accent : t.border}`,
          transition: 'all 0.2s',
        }}>{opt.label || opt}</button>
      ))}
    </div>
  );
}

function Toggle({ t, value, onChange }) {
  return (
    <button onClick={() => onChange(!value)} style={{
      width: 36, height: 20, borderRadius: 10, cursor: 'pointer',
      background: value ? t.accent : t.border, border: 'none',
      position: 'relative', transition: 'background 0.2s', flexShrink: 0,
    }}>
      <div style={{
        width: 16, height: 16, borderRadius: '50%',
        background: '#ffffff', position: 'absolute', top: 2,
        left: value ? 18 : 2, transition: 'left 0.2s',
      }} />
    </button>
  );
}

function SettingsModal({ t, sz, gameId, onClose, displaySettings, updateDisplay, gameSettings, setGameSettings }) {
  const [tab, setTab] = useState('game');
  const [storyteller, setStoryteller] = useState(gameSettings?.storyteller || 'chronicler');
  const [customStorytellerText, setCustomStorytellerText] = useState(gameSettings?.customStorytellerText || '');
  const [diffPreset, setDiffPreset] = useState(gameSettings?.difficultyPreset || 'standard');
  const [dials, setDials] = useState(gameSettings?.dials || DIFFICULTY_PRESETS.standard);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Checkpoint state
  const [checkpoints, setCheckpoints] = useState([
    { slot: 1, label: 'Slot 1', saved: false },
    { slot: 2, label: 'Slot 2', saved: false },
    { slot: 3, label: 'Slot 3', saved: false },
  ]);
  const [editingSlot, setEditingSlot] = useState(null);
  const [editLabel, setEditLabel] = useState('');

  // Fetch checkpoints on mount
  useEffect(() => {
    if (!gameId) return;
    const fetchCheckpoints = async () => {
      try {
        const res = await api.get(`/api/game/${gameId}/checkpoints`);
        if (res.checkpoints) setCheckpoints(res.checkpoints.map((c, i) => ({ slot: i + 1, ...c })));
      } catch { /* endpoint may not exist */ }
    };
    fetchCheckpoints();
  }, [gameId]);

  const selectPreset = (preset) => {
    setDiffPreset(preset);
    setDials(DIFFICULTY_PRESETS[preset] || DIFFICULTY_PRESETS.standard);
  };

  const updateDial = (key, value) => {
    setDials(prev => ({ ...prev, [key]: value }));
    setDiffPreset('custom');
  };

  const saveStoryteller = async () => {
    if (!gameId) return;
    setSaving(true);
    try {
      const capitalized = storyteller.charAt(0).toUpperCase() + storyteller.slice(1);
      const body = storyteller === 'custom'
        ? { selection: 'Custom', customText: customStorytellerText }
        : { selection: capitalized };
      await api.put(`/api/game/${gameId}/settings/storyteller`, body);
      setFeedback('Storyteller updated');
      setTimeout(() => setFeedback(null), 2000);
    } catch { setFeedback('Failed to save'); }
    setSaving(false);
  };

  const saveDifficulty = async () => {
    if (!gameId) return;
    setSaving(true);
    try {
      await api.put(`/api/game/${gameId}/settings/difficulty`, { preset: diffPreset, dials });
      setFeedback('Difficulty updated');
      setTimeout(() => setFeedback(null), 2000);
    } catch { setFeedback('Failed to save'); }
    setSaving(false);
  };

  const handleCheckpointAction = async (slot, action) => {
    if (!gameId) return;
    try {
      if (action === 'save') {
        await api.post(`/api/game/${gameId}/action`, { type: 'custom', text: `[checkpoint ${slot}]` });
        setCheckpoints(prev => prev.map(c => c.slot === slot ? { ...c, saved: true } : c));
      } else if (action === 'load') {
        await api.post(`/api/game/${gameId}/action`, { type: 'custom', text: `[restore_checkpoint ${slot}]` });
      } else if (action === 'clear') {
        await api.post(`/api/game/${gameId}/action`, { type: 'custom', text: `[delete_checkpoint ${slot}]` });
        setCheckpoints(prev => prev.map(c => c.slot === slot ? { ...c, saved: false, label: `Slot ${slot}` } : c));
      }
    } catch { /* silent */ }
  };

  const handleShare = async (mode) => {
    if (!gameId) return;
    try {
      const res = await api.post(`/api/game/${gameId}/snapshots`, { type: mode });
      if (res.shareUrl || res.token) {
        const url = res.shareUrl || `crucibleRPG.com/snapshot/${res.token}`;
        await navigator.clipboard.writeText(url);
        setFeedback('Link copied!');
        setTimeout(() => setFeedback(null), 2500);
      }
    } catch { setFeedback('Failed to create snapshot'); }
  };

  const handleSaveSnapshot = async () => {
    if (!gameId) return;
    try {
      await api.post(`/api/game/${gameId}/snapshots`, { type: 'branch', name: 'Manual Save' });
      setFeedback('Snapshot saved!');
      setTimeout(() => setFeedback(null), 2500);
    } catch { setFeedback('Failed to save snapshot'); }
  };

  const dcWarning = dials.dcOffset < -2 || dials.dcOffset > 4;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: '#000000aa' }} />
      <div onClick={e => e.stopPropagation()} style={{
        background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 10,
        padding: '24px 28px', maxWidth: 460, width: '90%', position: 'relative', zIndex: 1,
        maxHeight: '85vh', overflow: 'auto',
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 14, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: t.textDim }}>{'\u2715'}</button>

        <div style={{ fontFamily: "var(--font-cinzel)", fontSize: 18, fontWeight: 700, color: t.heading, marginBottom: 16 }}>Settings</div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${t.border}`, paddingBottom: 8 }}>
          {[{ id: 'game', label: 'Game' }, { id: 'display', label: 'Display' }, { id: 'world', label: 'World' }].map(st => (
            <button key={st.id} onClick={() => setTab(st.id)} style={{
              padding: '6px 16px', borderRadius: 4, cursor: 'pointer',
              fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui, fontWeight: 600,
              color: tab === st.id ? t.accent : t.textMuted,
              background: tab === st.id ? t.bgPanel : 'transparent',
              border: 'none',
            }}>{st.label}</button>
          ))}
        </div>

        {/* Game settings tab */}
        {tab === 'game' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Storyteller */}
            <div>
              <div style={{ fontFamily: "var(--font-cinzel)", fontSize: 12, fontWeight: 600, color: t.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Storyteller</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {STORYTELLER_OPTIONS.map(s => (
                  <button key={s.id} onClick={() => setStoryteller(s.id)} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 12px', borderRadius: 4, cursor: 'pointer',
                    background: storyteller === s.id ? t.bgPanel : 'transparent',
                    border: `1px solid ${storyteller === s.id ? t.accent : t.border}`,
                    fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui, color: storyteller === s.id ? t.accent : t.text,
                    transition: 'all 0.2s',
                  }}>
                    <span style={{ fontWeight: 600 }}>{s.label}</span>
                    <span style={{ fontSize: sz.ui - 1, color: t.textDim, fontStyle: 'italic' }}>{s.desc}</span>
                  </button>
                ))}
              </div>
              {storyteller === 'custom' && (
                <div style={{ marginTop: 8, position: 'relative' }}>
                  <textarea value={customStorytellerText} onChange={e => { if (e.target.value.length <= 500) setCustomStorytellerText(e.target.value); }}
                    placeholder="Describe your narrative voice, or name storytellers to blend."
                    style={{
                      width: '100%', minHeight: 60, padding: '8px 10px',
                      background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: 4,
                      fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui, color: t.text,
                      outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                    }}
                  />
                  <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 10, color: customStorytellerText.length > 450 ? t.danger : t.textFaint, position: 'absolute', bottom: 6, right: 8 }}>
                    {customStorytellerText.length}/500
                  </span>
                </div>
              )}
              <button onClick={saveStoryteller} disabled={saving} style={{
                marginTop: 8, padding: '6px 16px', borderRadius: 4, cursor: 'pointer',
                fontFamily: "var(--font-cinzel)", fontSize: 11, fontWeight: 600,
                color: t.accent, background: 'transparent', border: `1px solid ${t.accent}`,
              }}>{saving ? 'Saving...' : 'Save Storyteller'}</button>
            </div>

            {/* Difficulty */}
            <div>
              <div style={{ fontFamily: "var(--font-cinzel)", fontSize: 12, fontWeight: 600, color: t.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
                Difficulty{diffPreset === 'custom' && <span style={{ color: t.danger, marginLeft: 8, fontSize: 10, fontFamily: "var(--font-alegreya-sans)", textTransform: 'none' }}>Custom</span>}
              </div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                {['forgiving', 'standard', 'harsh', 'brutal'].map(p => (
                  <button key={p} onClick={() => selectPreset(p)} style={{
                    flex: 1, padding: '6px 0', borderRadius: 4, cursor: 'pointer',
                    fontFamily: "var(--font-cinzel)", fontSize: 11, fontWeight: 700,
                    color: diffPreset === p ? '#0a0e1a' : DIFF_COLORS[p],
                    background: diffPreset === p ? DIFF_COLORS[p] : 'transparent',
                    border: `1px solid ${DIFF_COLORS[p]}`,
                    textTransform: 'capitalize',
                  }}>{p}</button>
                ))}
              </div>
              {/* DC Offset slider */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui - 1, color: t.textMuted }}>DC Offset</span>
                  <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: sz.ui, color: t.heading }}>{dials.dcOffset > 0 ? '+' : ''}{dials.dcOffset}</span>
                </div>
                <input type="range" min={-10} max={10} step={1} value={dials.dcOffset} onChange={e => updateDial('dcOffset', Number(e.target.value))} style={{ width: '100%', accentColor: t.accent }} />
                {dcWarning && <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 11, color: t.danger, marginTop: 4 }}>Beyond designed range. Encounter balance may feel off.</div>}
              </div>
              {/* Progression Speed */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui - 1, color: t.textMuted }}>Progression Speed</span>
                  <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: sz.ui, color: t.heading }}>{dials.progressionSpeed?.toFixed(2)}x</span>
                </div>
                <input type="range" min={0} max={5} step={0.25} value={dials.progressionSpeed || 1} onChange={e => updateDial('progressionSpeed', Number(e.target.value))} style={{ width: '100%', accentColor: t.accent }} />
              </div>
              {/* Encounter Pressure */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui - 1, color: t.textMuted, marginBottom: 6 }}>Encounter Pressure</div>
                <SelectorRow t={t} sz={sz} options={[{ id: 'low', label: 'Low' }, { id: 'standard', label: 'Standard' }, { id: 'high', label: 'High' }]} value={dials.encounterPressure} onChange={v => updateDial('encounterPressure', v)} />
              </div>
              {/* Toggles */}
              {[
                { key: 'survival', label: 'Survival', desc: 'Track rations, water, and malnourishment' },
                { key: 'durability', label: 'Durability', desc: 'Items degrade with use' },
                { key: 'fortuneBalance', label: "Fortune's Balance", desc: 'Outmatched/Matched/Dominant dice' },
                { key: 'simplifiedOutcomes', label: 'Simplified Outcomes', desc: 'Binary pass/fail' },
              ].map(tog => (
                <div key={tog.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui, color: t.text }}>{tog.label}</div>
                    <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui - 2, color: t.textDim }}>{tog.desc}</div>
                  </div>
                  <Toggle t={t} value={!!dials[tog.key]} onChange={v => updateDial(tog.key, v)} />
                </div>
              ))}
              <button onClick={saveDifficulty} disabled={saving} style={{
                marginTop: 4, padding: '6px 16px', borderRadius: 4, cursor: 'pointer',
                fontFamily: "var(--font-cinzel)", fontSize: 11, fontWeight: 600,
                color: t.accent, background: 'transparent', border: `1px solid ${t.accent}`,
              }}>{saving ? 'Saving...' : 'Save Difficulty'}</button>
            </div>

            <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 11, color: t.textFaint, fontStyle: 'italic' }}>
              Changes take effect on the next relevant game event. No retroactive recalculation.
            </div>
          </div>
        )}

        {/* Display tab */}
        {tab === 'display' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui, color: t.textMuted, marginBottom: 8 }}>Theme</div>
              <SelectorRow t={t} sz={sz} options={Object.values(THEMES).map(th => ({ id: th.id, label: th.label }))} value={displaySettings.theme} onChange={v => updateDisplay('theme', v)} />
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui, color: t.textMuted, marginBottom: 8 }}>Font</div>
              <SelectorRow t={t} sz={sz} options={FONT_OPTIONS} value={displaySettings.font} onChange={v => updateDisplay('font', v)} />
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui, color: t.textMuted, marginBottom: 8 }}>Text Size</div>
              <SelectorRow t={t} sz={sz} options={SIZE_OPTIONS} value={displaySettings.textSize} onChange={v => updateDisplay('textSize', v)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui, color: t.text }}>Click to Roll</div>
                <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui - 2, color: t.textDim }}>Require click to start dice animation</div>
              </div>
              <Toggle t={t} value={displaySettings.clickToRoll || false} onChange={v => updateDisplay('clickToRoll', v)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui, color: t.text }}>Instant Mode</div>
                <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui - 2, color: t.textDim }}>Skip dice animation entirely</div>
              </div>
              <Toggle t={t} value={displaySettings.instantMode || false} onChange={v => updateDisplay('instantMode', v)} />
            </div>
          </div>
        )}

        {/* World tab */}
        {tab === 'world' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Share */}
            <div>
              <div style={{ fontFamily: "var(--font-cinzel)", fontSize: 12, fontWeight: 600, color: t.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Share This World</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => handleShare('fresh_start')} style={{
                  flex: 1, padding: '10px 8px', borderRadius: 4, cursor: 'pointer',
                  fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui, color: t.text,
                  background: t.bgPanel, border: `1px solid ${t.border}`,
                }}>As it began</button>
                <button onClick={() => handleShare('branch')} style={{
                  flex: 1, padding: '10px 8px', borderRadius: 4, cursor: 'pointer',
                  fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui, color: t.text,
                  background: t.bgPanel, border: `1px solid ${t.border}`,
                }}>As it is now</button>
              </div>
            </div>
            {/* Save snapshot */}
            <div>
              <div style={{ fontFamily: "var(--font-cinzel)", fontSize: 12, fontWeight: 600, color: t.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Save World Snapshot</div>
              <button onClick={handleSaveSnapshot} style={{
                padding: '8px 20px', borderRadius: 4, cursor: 'pointer',
                fontFamily: "var(--font-cinzel)", fontSize: 11, fontWeight: 600,
                color: t.accent, background: 'transparent', border: `1px solid ${t.accent}`,
              }}>Save Snapshot</button>
            </div>
            {/* Checkpoints */}
            <div>
              <div style={{ fontFamily: "var(--font-cinzel)", fontSize: 12, fontWeight: 600, color: t.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Checkpoints</div>
              {checkpoints.map(cp => (
                <div key={cp.slot} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                  padding: '8px 0', borderBottom: `1px solid ${t.borderLight}`,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {editingSlot === cp.slot ? (
                      <input value={editLabel} onChange={e => setEditLabel(e.target.value)}
                        onBlur={() => { setCheckpoints(prev => prev.map(c => c.slot === cp.slot ? { ...c, label: editLabel } : c)); setEditingSlot(null); }}
                        onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
                        autoFocus
                        style={{
                          width: '100%', padding: '2px 4px', background: t.bgInput,
                          border: `1px solid ${t.border}`, borderRadius: 3,
                          fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui, color: t.text, outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    ) : (
                      <span onClick={() => { setEditingSlot(cp.slot); setEditLabel(cp.label); }} style={{
                        fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui, color: cp.saved ? t.text : t.textDim,
                        cursor: 'pointer',
                      }}>
                        {cp.label}{cp.turn ? ` \u2014 T${cp.turn}` : ''}{cp.location ? `, ${cp.location}` : ''}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {!cp.saved ? (
                      <button onClick={() => handleCheckpointAction(cp.slot, 'save')} style={{
                        padding: '3px 10px', borderRadius: 3, cursor: 'pointer',
                        fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui - 1, color: t.accent,
                        background: 'transparent', border: `1px solid ${t.accent}`,
                      }}>Save</button>
                    ) : (
                      <>
                        <button onClick={() => handleCheckpointAction(cp.slot, 'load')} style={{
                          padding: '3px 10px', borderRadius: 3, cursor: 'pointer',
                          fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui - 1, color: t.success,
                          background: 'transparent', border: `1px solid ${t.success}`,
                        }}>Load</button>
                        <button onClick={() => handleCheckpointAction(cp.slot, 'clear')} style={{
                          padding: '3px 10px', borderRadius: 3, cursor: 'pointer',
                          fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui - 1, color: t.danger,
                          background: 'transparent', border: `1px solid ${t.danger}`,
                        }}>Clear</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feedback */}
        {feedback && <div style={{ marginTop: 12, fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui, color: t.success, textAlign: 'center' }}>{feedback}</div>}
      </div>
    </div>
  );
}

// =============================================================================
// Talk to GM
// =============================================================================

function TalkToGM({ t, sz, gameId }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [canEscalate, setCanEscalate] = useState(false);

  const handleSubmit = async () => {
    if (!input.trim() || !gameId || loading) return;
    const question = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: question }]);
    setLoading(true);
    setCanEscalate(false);
    try {
      const res = await api.post(`/api/game/${gameId}/talk-to-gm`, { question });
      setMessages(prev => [...prev, { role: 'gm', text: res.answer || res.response || 'No response.' }]);
      setCanEscalate(res.canEscalate !== false);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'gm', text: err.message || 'Something went wrong.' }]);
    }
    setLoading(false);
  };

  const handleEscalate = async () => {
    if (!gameId || loading) return;
    setLoading(true);
    setCanEscalate(false);
    setMessages(prev => [...prev, { role: 'system', text: 'Escalating to AI (costs one turn)...' }]);
    try {
      const res = await api.post(`/api/game/${gameId}/talk-to-gm/escalate`);
      setMessages(prev => [...prev, { role: 'gm', text: res.answer || res.response || 'No response.' }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'gm', text: err.message || 'Escalation failed.' }]);
    }
    setLoading(false);
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} aria-label="Talk to GM" style={{
        position: 'absolute', bottom: 20, right: 20,
        width: 40, height: 40, borderRadius: '50%',
        background: t.bgCard, border: `1px solid ${t.border}`,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 2px 12px ${t.border}`,
        zIndex: 10,
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    );
  }

  return (
    <div style={{
      position: 'absolute', bottom: 20, right: 20,
      width: 320, maxHeight: 400,
      background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 10,
      display: 'flex', flexDirection: 'column',
      boxShadow: `0 4px 24px ${t.border}`, zIndex: 10,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 14px', borderBottom: `1px solid ${t.border}`,
      }}>
        <span style={{ fontFamily: "var(--font-cinzel)", fontSize: 13, fontWeight: 600, color: t.heading }}>Talk to GM</span>
        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textDim, fontSize: 14 }}>{'\u2715'}</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflow: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260 }}>
        {messages.length === 0 && (
          <div style={{ fontFamily: "var(--font-alegreya)", fontSize: sz.ui, fontStyle: 'italic', color: t.textDim, textAlign: 'center', paddingTop: 20 }}>
            Ask about rules, mechanics, or your situation. First question is free.
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{
            fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui, lineHeight: 1.5,
            color: msg.role === 'user' ? t.text : msg.role === 'system' ? t.textDim : t.textMuted,
            fontStyle: msg.role === 'system' ? 'italic' : 'normal',
            padding: msg.role === 'gm' ? '8px 10px' : '4px 0',
            background: msg.role === 'gm' ? t.bgPanel : 'transparent',
            borderRadius: msg.role === 'gm' ? 6 : 0,
          }}>
            {msg.role === 'user' && <span style={{ color: t.accent, fontWeight: 600 }}>You: </span>}
            {msg.text}
          </div>
        ))}
        {loading && <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui, color: t.textDim, fontStyle: 'italic' }}>Thinking...</div>}
        {canEscalate && !loading && (
          <button onClick={handleEscalate} style={{
            padding: '6px 12px', borderRadius: 4, cursor: 'pointer', alignSelf: 'flex-start',
            fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui - 1,
            color: t.danger, background: 'transparent', border: `1px solid ${t.danger}`,
          }}>Ask the AI (costs 1 turn)</button>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: '8px 10px', borderTop: `1px solid ${t.border}`, display: 'flex', gap: 6 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
          placeholder="Ask the GM a question..."
          style={{
            flex: 1, padding: '7px 10px', background: t.bgInput,
            border: `1px solid ${t.border}`, borderRadius: 4,
            fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui, color: t.text, outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <button onClick={handleSubmit} disabled={!input.trim() || loading} style={{
          padding: '7px 12px', borderRadius: 4, cursor: input.trim() ? 'pointer' : 'default',
          fontFamily: "var(--font-cinzel)", fontSize: 11, fontWeight: 700,
          color: input.trim() ? t.accent : t.textFaint,
          background: 'transparent', border: `1px solid ${input.trim() ? t.accent : t.border}`,
        }}>{'\u2192'}</button>
      </div>
    </div>
  );
}

// =============================================================================
// Error Boundary
// =============================================================================

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      const t = this.props.t || THEMES.dark;
      return (
        <div style={{ padding: 20, textAlign: 'center' }}>
          <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 14, color: t.danger, marginBottom: 8 }}>Something went wrong in this panel.</div>
          <button onClick={() => this.setState({ hasError: false })} style={{
            fontFamily: "var(--font-alegreya-sans)", fontSize: 12, color: t.textMuted,
            background: 'none', border: `1px solid ${t.border}`, borderRadius: 4, padding: '4px 12px', cursor: 'pointer',
          }}>Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// =============================================================================
// Debug Panel
// =============================================================================

function DebugPanel({ t, sz, turns, debugData, gameId }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('dice');
  const [selectedTurn, setSelectedTurn] = useState(null);

  const currentTurn = selectedTurn || (turns.length > 0 ? turns[turns.length - 1]?.turn : 0);
  const turnData = debugData[currentTurn] || {};

  const tabs = [
    { id: 'dice', label: 'Dice Math' },
    { id: 'diff', label: 'State Diff' },
    { id: 'manifest', label: 'Context' },
    { id: 'tokens', label: 'Tokens' },
    { id: 'json', label: 'Server JSON' },
    { id: 'ai', label: 'AI Prompt' },
  ];

  const exportSession = () => {
    const data = JSON.stringify({ gameId, turns: debugData, exportedAt: new Date().toISOString() }, null, 2);
    navigator.clipboard.writeText(data).catch(() => {});
  };

  return (
    <div style={{ flexShrink: 0, borderTop: `2px solid #e85a5a` }}>
      {/* Handle bar */}
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 16px', background: '#1a0e0e', border: 'none', cursor: 'pointer',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: "var(--font-cinzel)", fontSize: 10, fontWeight: 700, color: '#e85a5a', letterSpacing: '0.1em' }}>DEBUG</span>
          <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 10, color: t.textDim }}>T{currentTurn}</span>
          {turnData.tokens && <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 10, color: t.textDim }}>{turnData.tokens?.thisTurn?.totalTokens || 0} tok</span>}
        </div>
        <span style={{ color: t.textDim, fontSize: 10 }}>{open ? '\u25BC' : '\u25B2'}</span>
      </button>

      {open && (
        <div style={{ background: '#0d0808', maxHeight: 400, overflow: 'auto' }}>
          {/* Header with turn selector + export */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderBottom: `1px solid #2a1a1a` }}>
            <select value={currentTurn} onChange={e => setSelectedTurn(Number(e.target.value))} style={{
              background: '#1a0e0e', border: `1px solid #3a1a1a`, borderRadius: 3, padding: '3px 8px',
              fontFamily: "var(--font-jetbrains)", fontSize: 11, color: t.textMuted, outline: 'none',
            }}>
              {turns.map(turn => <option key={turn.turn} value={turn.turn}>Turn {turn.turn}</option>)}
            </select>
            <button onClick={exportSession} style={{
              marginLeft: 'auto', padding: '3px 10px', borderRadius: 3, cursor: 'pointer',
              fontFamily: "var(--font-alegreya-sans)", fontSize: 10, color: t.textMuted,
              background: 'transparent', border: `1px solid #3a1a1a`,
            }}>Export Session</button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: `1px solid #2a1a1a`, padding: '0 8px' }}>
            {tabs.map(dt => (
              <button key={dt.id} onClick={() => setTab(dt.id)} style={{
                padding: '6px 12px', border: 'none', cursor: 'pointer',
                fontFamily: "var(--font-alegreya-sans)", fontSize: 10,
                color: tab === dt.id ? '#e85a5a' : t.textDim,
                background: 'transparent',
                borderBottom: tab === dt.id ? '2px solid #e85a5a' : '2px solid transparent',
              }}>{dt.label}</button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ padding: 16, fontFamily: "var(--font-jetbrains)", fontSize: 11, color: t.textMuted, lineHeight: 1.6 }}>
            {tab === 'dice' && (
              turnData.diceMath ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div>Category: <span style={{ color: '#e85a5a' }}>{turnData.diceMath.category}</span></div>
                  {turnData.diceMath.reason && <div style={{ color: t.textDim }}>{turnData.diceMath.reason}</div>}
                  {turnData.diceMath.stat && <div>Stat: {turnData.diceMath.stat.emoji} {turnData.diceMath.stat.name} {turnData.diceMath.stat.effective} (base {turnData.diceMath.stat.base}{turnData.diceMath.stat.penalty ? `, penalty ${turnData.diceMath.stat.penalty}` : ''})</div>}
                  {turnData.diceMath.skill && <div>Skill: {turnData.diceMath.skill.name} +{turnData.diceMath.skill.value}</div>}
                  {turnData.diceMath.formula && <div>Formula: {turnData.diceMath.formula}</div>}
                  {turnData.diceMath.dc && <div>DC: {turnData.diceMath.dc.final} ({turnData.diceMath.dc.source})</div>}
                  {turnData.diceMath.margin !== undefined && <div>Margin: <span style={{ color: turnData.diceMath.margin >= 0 ? t.success : t.danger }}>{turnData.diceMath.margin > 0 ? '+' : ''}{turnData.diceMath.margin}</span></div>}
                  {turnData.diceMath.tier && <div>Tier: {turnData.diceMath.tier.number} ({turnData.diceMath.tier.label})</div>}
                  {turnData.diceMath.debt && <div style={{ color: t.danger }}>Debt: {turnData.diceMath.debt.amount} ({turnData.diceMath.debt.source})</div>}
                </div>
              ) : <div style={{ color: t.textDim, fontStyle: 'italic' }}>No dice data for this turn</div>
            )}

            {tab === 'diff' && (
              turnData.stateDiff && turnData.stateDiff.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {turnData.stateDiff.map((d, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, padding: '4px 0', borderBottom: '1px solid #1a1010' }}>
                      <span style={{ color: t.textDim, width: 80, flexShrink: 0 }}>{d.field}</span>
                      <span style={{ color: t.textFaint }}>{d.before || '(none)'}</span>
                      <span style={{ color: t.textDim }}>{'\u2192'}</span>
                      <span style={{ color: d.delta?.startsWith('+') ? t.success : d.delta?.startsWith('-') ? '#e85a5a' : '#e8c45a' }}>{d.after || '(none)'}</span>
                      {d.delta && <span style={{ color: t.textFaint, marginLeft: 'auto' }}>{d.delta}</span>}
                    </div>
                  ))}
                </div>
              ) : <div style={{ color: t.textDim, fontStyle: 'italic' }}>No state changes this turn</div>
            )}

            {tab === 'manifest' && (
              turnData.manifest ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div>Budget: {turnData.manifest.budget?.used || 0} / {turnData.manifest.budget?.total || 0} tokens</div>
                  <div style={{ height: 6, background: '#1a1010', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 3,
                      width: `${turnData.manifest.budget?.total ? (turnData.manifest.budget.used / turnData.manifest.budget.total) * 100 : 0}%`,
                      background: 'linear-gradient(90deg, #8aba7a, #e8c45a, #e85a5a)',
                    }} />
                  </div>
                  {['L1', 'L2', 'L3', 'L4'].map(layer => {
                    const l = turnData.manifest.layers?.[layer];
                    if (!l) return null;
                    return (
                      <div key={layer} style={{ padding: '4px 0' }}>
                        <div style={{ color: '#e85a5a', marginBottom: 2 }}>{layer}: {l.label} ({l.total} tok)</div>
                        {l.sections?.map((s, i) => <div key={i} style={{ paddingLeft: 12, color: t.textDim }}>{s.name}: {s.tokens}</div>)}
                        {l.triggers?.map((tr, i) => <div key={i} style={{ paddingLeft: 12, color: t.textDim }}>{tr.type}: {tr.entity} ({tr.tokens})</div>)}
                      </div>
                    );
                  })}
                </div>
              ) : <div style={{ color: t.textDim, fontStyle: 'italic' }}>No context manifest data</div>
            )}

            {tab === 'tokens' && (
              turnData.tokens ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ color: '#e85a5a', marginBottom: 4 }}>This Turn</div>
                  <div>Prompt: {turnData.tokens.thisTurn?.promptTokens || 0} (cached: {turnData.tokens.thisTurn?.cachedPromptTokens || 0})</div>
                  <div>Completion: {turnData.tokens.thisTurn?.completionTokens || 0}</div>
                  <div>Total: {turnData.tokens.thisTurn?.totalTokens || 0}</div>
                  <div>Model: {turnData.tokens.thisTurn?.model || 'unknown'}</div>
                  <div>Cost: ${turnData.tokens.thisTurn?.estimatedCost?.toFixed(4) || '0.0000'}</div>
                  {turnData.tokens.session && (
                    <>
                      <div style={{ color: '#e85a5a', marginTop: 8, marginBottom: 4 }}>Session</div>
                      <div>Turns: {turnData.tokens.session.turns || 0}</div>
                      <div>Total tokens: {turnData.tokens.session.totalTokens || 0}</div>
                      <div>Total cost: ${turnData.tokens.session.totalCost?.toFixed(4) || '0.0000'}</div>
                      <div>Avg/turn: {turnData.tokens.session.avgTokensPerTurn || 0} tok, ${turnData.tokens.session.avgCostPerTurn?.toFixed(4) || '0.0000'}</div>
                    </>
                  )}
                </div>
              ) : <div style={{ color: t.textDim, fontStyle: 'italic' }}>No token data</div>
            )}

            {tab === 'json' && (
              <div>
                {turnData.serverRequest && (
                  <details style={{ marginBottom: 8 }}>
                    <summary style={{ color: '#e85a5a', cursor: 'pointer' }}>Request</summary>
                    <pre style={{ padding: 8, background: '#0a0606', borderRadius: 4, overflow: 'auto', maxHeight: 200, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{JSON.stringify(turnData.serverRequest, null, 2)}</pre>
                  </details>
                )}
                {turnData.serverResponse && (
                  <details>
                    <summary style={{ color: '#e85a5a', cursor: 'pointer' }}>Response</summary>
                    <pre style={{ padding: 8, background: '#0a0606', borderRadius: 4, overflow: 'auto', maxHeight: 200, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{JSON.stringify(turnData.serverResponse, null, 2)}</pre>
                  </details>
                )}
                {!turnData.serverRequest && !turnData.serverResponse && <div style={{ color: t.textDim, fontStyle: 'italic' }}>No server data</div>}
              </div>
            )}

            {tab === 'ai' && (
              <div>
                {turnData.aiSystemPrompt && (
                  <details style={{ marginBottom: 8 }}>
                    <summary style={{ color: '#e85a5a', cursor: 'pointer' }}>System Prompt ({turnData.aiSystemPrompt.length} chars)</summary>
                    <pre style={{ padding: 8, background: '#0a0606', borderRadius: 4, overflow: 'auto', maxHeight: 200, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{turnData.aiSystemPrompt}</pre>
                  </details>
                )}
                {turnData.aiUserMessage && (
                  <details style={{ marginBottom: 8 }} open>
                    <summary style={{ color: '#e85a5a', cursor: 'pointer' }}>User Message</summary>
                    <pre style={{ padding: 8, background: '#0a0606', borderRadius: 4, overflow: 'auto', maxHeight: 150, whiteSpace: 'pre-wrap' }}>{turnData.aiUserMessage}</pre>
                  </details>
                )}
                {turnData.aiResponse && (
                  <details open>
                    <summary style={{ color: '#e85a5a', cursor: 'pointer' }}>AI Response</summary>
                    <pre style={{ padding: 8, background: '#0a0606', borderRadius: 4, overflow: 'auto', maxHeight: 200, whiteSpace: 'pre-wrap' }}>{turnData.aiResponse}</pre>
                  </details>
                )}
                {!turnData.aiSystemPrompt && !turnData.aiResponse && <div style={{ color: t.textDim, fontStyle: 'italic' }}>No AI data</div>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Report Modal (Bug Report / Suggest)
// =============================================================================

const BUG_CATEGORIES = ['Dice / Resolution', 'Story / Narrative', 'UI / Display', 'Inventory / Items', 'NPCs / Factions', 'Other'];
const SUGGEST_CATEGORIES = ['New Feature', 'UI Improvement', 'Game Balance', 'Storytelling', 'Other'];

function ReportModal({ t, sz, mode, gameId, gameState, character, onClose }) {
  const [category, setCategory] = useState(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);

  const isBug = mode === 'bug';
  const accentColor = isBug ? '#e85a5a' : t.accent;
  const categories = isBug ? BUG_CATEGORIES : SUGGEST_CATEGORIES;
  const endpoint = isBug ? '/api/bug-report' : '/api/suggestion';

  const contextItems = isBug ? [
    { label: 'Game', value: gameId || 'Unknown' },
    { label: 'Character', value: character?.name || 'Unknown' },
    { label: 'Turn', value: String(gameState?.currentTurn || '?') },
    { label: 'Location', value: gameState?.location || '?' },
    { label: 'Storyteller', value: gameState?.storyteller || '?' },
    { label: 'Difficulty', value: gameState?.difficulty || '?' },
    { label: 'Active Conditions', value: (character?.conditions || []).map(c => c.name).join(', ') || 'None' },
  ] : [
    { label: 'Game', value: gameId || 'Unknown' },
    { label: 'Character', value: character?.name || 'Unknown' },
    { label: 'Turn', value: String(gameState?.currentTurn || '?') },
    { label: 'Storyteller', value: gameState?.storyteller || '?' },
    { label: 'Difficulty', value: gameState?.difficulty || '?' },
  ];

  const handleSubmit = async () => {
    if (!category || !message.trim()) return;
    setSending(true);
    try {
      await api.post(endpoint, { gameId, category, message: message.trim(), context: Object.fromEntries(contextItems.map(c => [c.label, c.value])) });
    } catch { /* best effort */ }
    setSending(false);
    setSent(true);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: '#000000aa' }} />
      <div onClick={e => e.stopPropagation()} style={{
        background: t.bgCard, border: `1px solid ${accentColor}44`, borderRadius: 10,
        padding: '24px 28px', maxWidth: 440, width: '90%', position: 'relative', zIndex: 1,
        maxHeight: '85vh', overflow: 'auto',
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 14, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: t.textDim }}>{'\u2715'}</button>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>{isBug ? '\uD83D\uDC1B' : '\uD83D\uDCA1'}</div>
            <div style={{ fontFamily: "var(--font-alegreya)", fontSize: 16, color: t.text, marginBottom: 8 }}>
              {isBug ? 'Thanks for helping us squash bugs. We\'ll look into it.' : 'Thanks for the idea. We read every suggestion.'}
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 18 }}>{isBug ? '\uD83D\uDC1B' : '\uD83D\uDCA1'}</span>
              <span style={{ fontFamily: "var(--font-cinzel)", fontSize: 18, fontWeight: 700, color: accentColor }}>
                {isBug ? 'Bug Report' : 'Suggestion'}
              </span>
            </div>

            {/* Categories */}
            <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui - 1, color: t.textMuted, marginBottom: 8 }}>Category</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
              {categories.map(cat => (
                <button key={cat} onClick={() => setCategory(cat)} style={{
                  padding: '5px 10px', borderRadius: 4, cursor: 'pointer',
                  fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui - 1,
                  color: category === cat ? accentColor : t.textMuted,
                  background: category === cat ? `${accentColor}15` : 'transparent',
                  border: `1px solid ${category === cat ? accentColor : t.border}`,
                }}>{cat}</button>
              ))}
            </div>

            {/* Message */}
            <textarea value={message} onChange={e => setMessage(e.target.value)}
              placeholder={isBug ? 'Describe what went wrong. What did you expect to happen?' : 'What would make the game better? Describe your idea.'}
              style={{
                width: '100%', minHeight: 80, padding: '10px 12px', marginBottom: 12,
                background: t.bgInput, border: `1px solid ${t.border}`, borderRadius: 6,
                fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui, color: t.text,
                outline: 'none', resize: 'vertical', boxSizing: 'border-box',
              }}
            />

            {/* Context preview */}
            <button onClick={() => setContextOpen(!contextOpen)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui - 2, color: t.textDim,
              padding: 0, marginBottom: 8, textDecoration: 'underline',
            }}>{contextOpen ? 'Hide' : 'See'} what&apos;s attached</button>
            {contextOpen && (
              <div style={{ padding: '8px 10px', background: t.bgPanel, border: `1px solid ${t.borderLight}`, borderRadius: 4, marginBottom: 12, fontSize: sz.ui - 1 }}>
                {contextItems.map(c => (
                  <div key={c.label} style={{ display: 'flex', gap: 8, padding: '2px 0', fontFamily: "var(--font-alegreya-sans)", color: t.textDim }}>
                    <span style={{ color: t.textMuted, width: 100, flexShrink: 0 }}>{c.label}</span>
                    <span>{c.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Submit */}
            <button onClick={handleSubmit} disabled={!category || !message.trim() || sending} style={{
              width: '100%', padding: '10px 0', borderRadius: 6, cursor: (category && message.trim()) ? 'pointer' : 'default',
              fontFamily: "var(--font-cinzel)", fontSize: 13, fontWeight: 700,
              color: (category && message.trim()) ? '#0a0e1a' : t.textDim,
              background: (category && message.trim()) ? accentColor : t.bgPanel,
              border: 'none', letterSpacing: '0.08em',
            }}>{sending ? 'Sending...' : isBug ? 'Send Report' : 'Send Suggestion'}</button>
          </>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Sidebar
// =============================================================================

function Sidebar({ t, sz, width, activeTab, setActiveTab, badges, character, inventory, equipped, currencyLabel, glossary, gameId, onEntityClick, npcs, locations, routes, objectives, entityNotes, onSubmitAction, onBugReport, onSuggest }) {
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
        <ErrorBoundary t={t}>
          {activeTab === 'character' && <CharacterTab t={t} sz={sz} character={character} onEntityClick={onEntityClick} />}
          {activeTab === 'inventory' && <InventoryTab t={t} sz={sz} inventory={inventory} equipped={equipped} currencyLabel={currencyLabel} onEntityClick={onEntityClick} />}
          {activeTab === 'npcs' && <NPCsTab t={t} sz={sz} npcs={npcs} onEntityClick={onEntityClick} />}
          {activeTab === 'glossary' && <GlossaryTab t={t} sz={sz} glossary={glossary} onEntityClick={onEntityClick} />}
          {activeTab === 'map' && <MapTab t={t} sz={sz} locations={locations} routes={routes} onEntityClick={onEntityClick} />}
          {activeTab === 'journal' && <JournalTab t={t} sz={sz} objectives={objectives} entityNotes={entityNotes} gameId={gameId} onSubmitAction={onSubmitAction} />}
        </ErrorBoundary>
      </div>
      <div style={{ padding: '10px 12px', borderTop: `1px solid ${t.border}`, display: 'flex', gap: 8, flexShrink: 0 }}>
        <button onClick={onBugReport} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 0', background: 'none', border: `1px solid ${t.border}`, borderRadius: 4, cursor: 'pointer', fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui, color: t.textMuted }}>
          {BarIcons.bug(t.textMuted)} Bug
        </button>
        <button onClick={onSuggest} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 0', background: 'none', border: `1px solid ${t.border}`, borderRadius: 4, cursor: 'pointer', fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui, color: t.textMuted }}>
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [gameSettings, setGameSettings] = useState(null);
  const [reportMode, setReportMode] = useState(null); // 'bug' | 'suggest' | null
  const [debugMode, setDebugMode] = useState(false);
  const [debugData, setDebugData] = useState({});

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

  // --- Debug mode from URL param ---
  useEffect(() => {
    if (searchParams.get('debug') === 'true') setDebugMode(true);
  }, [searchParams]);

  // --- Keyboard shortcuts ---
  useEffect(() => {
    const handler = (e) => {
      // Ctrl+Shift+D = toggle debug
      if (e.ctrlKey && e.shiftKey && e.key === 'D') { e.preventDefault(); setDebugMode(prev => !prev); return; }
      // Escape = close modals
      if (e.key === 'Escape') {
        if (entityPopup) { setEntityPopup(null); return; }
        if (settingsOpen) { setSettingsOpen(false); return; }
        if (reportMode) { setReportMode(null); return; }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [entityPopup, settingsOpen, reportMode]);

  // --- Redirect if no game ID ---
  useEffect(() => {
    if (authChecked && !gameId) router.replace('/menu');
  }, [authChecked, gameId, router]);

  // --- Fetch game state ---
  const gameLoadedRef = useRef(false);
  useEffect(() => {
    if (!authChecked || !gameId) return;
    let cancelled = false;
    const fetchGame = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.get(`/api/games/${gameId}`);
        if (cancelled) return;
        setGameState(data);
        // Transform recentNarrative into turns format
        const rawNarrative = Array.isArray(data.recentNarrative) ? data.recentNarrative : [];
        const history = rawNarrative.map(entry => ({
          turn: entry.turn || 0,
          narrative: [{ text: entry.content || '' }],
          resolution: null,
          statusChanges: [],
          options: [],
        }));
        setTurns(history);
        setSessionRecap(data.sessionRecap || null);
        setBookmarks(loadBookmarks(gameId));
        // Character from game state (basic — full data comes from /character endpoint)
        if (data.character) {
          const charData = {
            ...data.character,
            stats: transformStats(data.character.stats),
          };
          console.log('setCharacter [game state fetch]:', charData);
          setCharacter(charData);
        }
        // Extract game settings for the settings modal
        setGameSettings({
          storyteller: data.storyteller?.toLowerCase() || 'chronicler',
          difficultyPreset: data.difficultyPreset || data.difficulty || 'standard',
          dials: data.dials || {},
        });
        // TODO: No backend endpoint for NPCs list
        // TODO: No backend endpoint for objectives list
        gameLoadedRef.current = true;
      } catch (err) {
        if (cancelled) return;
        setError(err.message || 'Failed to load game.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchGame();
    return () => { cancelled = true; };
  }, [authChecked, gameId]);

  // --- Fetch supplementary data after game state loads ---
  useEffect(() => {
    if (!gameLoadedRef.current || !authChecked || !gameId || loading || error) return;
    let cancelled = false;
    const fetchSuppData = async () => {
      // Character + inventory (detailed)
      try {
        const res = await api.get(`/api/game/${gameId}/character`);
        if (cancelled) return;
        if (res.character) {
          console.log('setCharacter [character endpoint]:', { character: res.character, stats: res.stats, skills: res.skills, conditions: res.conditions });
          setCharacter(prev => {
            const merged = {
              ...(prev || {}),
              ...res.character,
              stats: transformStats(res.stats || prev?.stats),
              skills: Array.isArray(res.skills) ? res.skills : (prev?.skills || []),
              conditions: Array.isArray(res.conditions) ? res.conditions : (prev?.conditions || []),
              companions: Array.isArray(res.companions) ? res.companions : [],
            };
            console.log('setCharacter [character endpoint] merged result:', merged);
            return merged;
          });
        } else {
          console.warn('Character endpoint returned no character field:', res);
        }
        if (!cancelled && res.inventory) {
          setInventory(res.inventory);
          setEquipped(Array.isArray(res.inventory.equipped) ? res.inventory.equipped : []);
          setCurrencyLabel(res.inventory.currency?.display || 'Coins');
        }
      } catch (err) {
        // Character endpoint failed — keep whatever data we got from game state fetch
        console.error('Character fetch failed:', err.message || err, `(GET /api/game/${gameId}/character)`);
      }
      if (cancelled) return;
      // Glossary
      try {
        const res = await api.get(`/api/game/${gameId}/glossary`);
        if (!cancelled) setGlossary(Array.isArray(res.entries) ? res.entries : []);
      } catch (err) { console.error('Glossary fetch failed:', err.message || err); }
      if (cancelled) return;
      // Map
      try {
        const res = await api.get(`/api/game/${gameId}/map`);
        if (!cancelled) {
          setLocations(Array.isArray(res.locations) ? res.locations : []);
          setRoutes(Array.isArray(res.routes) ? res.routes : []);
        }
      } catch (err) { console.error('Map fetch failed:', err.message || err); }
      if (cancelled) return;
      // Entity notes
      try {
        const res = await api.get(`/api/game/${gameId}/notes`);
        if (!cancelled) setEntityNotes(Array.isArray(res.notes) ? res.notes : []);
      } catch (err) { console.error('Notes fetch failed:', err.message || err); }
    };
    fetchSuppData();
    return () => { cancelled = true; };
  }, [authChecked, gameId, loading, error]);

  // --- SSE event handler ---
  const handleSSEEvent = useCallback((event) => {
    const type = event.type || '';

    if (type === 'turn:resolution') {
      // Backend sends { turn: { number, sessionTurn }, resolution: { ... } }
      const turnInfo = event.turn || {};
      const turnNumber = typeof turnInfo === 'object' ? turnInfo.number : turnInfo;
      setIsStreaming(true);
      setStreamingTurn(prev => ({
        ...(prev || {}),
        turn: turnNumber || prev?.turn,
        total: event.total || prev?.total,
        location: event.location || prev?.location,
        time: event.time || prev?.time,
        timeEmoji: event.timeEmoji || prev?.timeEmoji,
        weather: event.weather || prev?.weather,
        weatherEmoji: event.weatherEmoji || prev?.weatherEmoji,
        resolution: transformResolution(event.resolution) || null,
        diceRoll: event.resolution ? {
          die: event.resolution.dieSelected,
          category: event.resolution.isCombat ? 'COMBAT' : 'MATCHED',
          mortal: Array.isArray(event.resolution.diceRolled) && event.resolution.diceRolled.length > 1
            ? { die1: event.resolution.diceRolled[0], die2: event.resolution.diceRolled[1] }
            : null,
          kept: event.resolution.dieSelected,
        } : null,
        narrative: prev?.narrative || [],
        statusChanges: prev?.statusChanges || [],
        options: prev?.options || [],
      }));
    } else if (type === 'turn:narrative') {
      setStreamingTurn(prev => {
        if (!prev) return prev;
        const chunk = event.chunk || event.text || '';
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
      // Backend sends { conditions, inventory, clock, quests, factions, stats }
      // Build status change badges from the structured data
      const changes = [];
      if (event.conditions) {
        (Array.isArray(event.conditions.added) ? event.conditions.added : []).forEach(c =>
          changes.push({ type: 'condition_new', label: c.name || c, stat: c.stat, detail: c.penalty ? `${c.penalty} ${c.stat}` : null })
        );
        (Array.isArray(event.conditions.removed) ? event.conditions.removed : []).forEach(c =>
          changes.push({ type: 'condition_cleared', label: c.name || c, stat: c.stat })
        );
      }
      if (event.inventory) {
        (Array.isArray(event.inventory.added) ? event.inventory.added : []).forEach(item =>
          changes.push({ type: 'inventory_gained', label: item.name || item })
        );
        (Array.isArray(event.inventory.removed) ? event.inventory.removed : []).forEach(item =>
          changes.push({ type: 'inventory_lost', label: item.name || item })
        );
      }
      setStreamingTurn(prev => prev ? { ...prev, statusChanges: changes } : prev);
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
      console.log('Command response:', event);
    }

    // Capture debug data from any event that includes it
    if (event.debug && event.turn) {
      setDebugData(prev => ({
        ...prev,
        [event.turn]: { ...(prev[event.turn] || {}), ...event.debug },
      }));
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

  const worldName = gameState?.setting || null;
  const diceMode = displaySettings.instantMode ? 'instant' : 'efficient';

  return (
    <div ref={containerRef} style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      background: t.bg, color: t.text,
      fontFamily: fontOption.family, fontSize: sz.narrative,
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes blink { 50% { opacity: 0; } }
        @keyframes diceSpin { 0% { transform: rotate(0deg) scale(1); } 50% { transform: rotate(180deg) scale(1.05); } 100% { transform: rotate(360deg) scale(1); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      <TopBar t={t} worldName={worldName} sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(prev => !prev)}
        onOpenSettings={() => setSettingsOpen(true)}
        connected={connected} reconnecting={reconnecting} debugMode={debugMode}
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
          position: 'relative',
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
                  diceMode={diceMode}
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

          {/* Talk to GM button */}
          <TalkToGM t={t} sz={sz} gameId={gameId} />
        </div>

        {sidebarOpen && (
          <>
            <ResizeHandle onDrag={handleResize} t={t} />
            <Sidebar t={t} sz={sz} width={sidebarWidth} activeTab={activeTab} setActiveTab={setActiveTab} badges={badges}
              character={character} inventory={inventory} equipped={equipped} currencyLabel={currencyLabel}
              glossary={glossary} gameId={gameId} onEntityClick={handleEntityClick}
              npcs={npcs} locations={locations} routes={routes}
              objectives={objectives} entityNotes={entityNotes} onSubmitAction={handleSubmitAction}
              onBugReport={() => setReportMode('bug')} onSuggest={() => setReportMode('suggest')} />
          </>
        )}
      </div>

      {/* Entity popup modal */}
      {entityPopup && (
        <EntityPopup t={t} sz={sz} entity={entityPopup} glossary={glossary} gameId={gameId} onClose={() => setEntityPopup(null)} />
      )}

      {/* Debug panel */}
      {debugMode && <DebugPanel t={t} sz={sz} turns={allTurns} debugData={debugData} gameId={gameId} />}

      {/* Settings modal */}
      {settingsOpen && (
        <SettingsModal t={t} sz={sz} gameId={gameId} onClose={() => setSettingsOpen(false)}
          displaySettings={displaySettings} updateDisplay={updateDisplay}
          gameSettings={gameSettings} setGameSettings={setGameSettings} />
      )}

      {/* Report modals */}
      {reportMode && (
        <ReportModal t={t} sz={sz} mode={reportMode} gameId={gameId}
          gameState={gameState} character={character}
          onClose={() => setReportMode(null)} />
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
