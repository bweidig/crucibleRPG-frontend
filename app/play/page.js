'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import * as api from '@/lib/api';
import { useAuth } from '@/lib/useAuth';

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
          <span style={{ fontFamily: "var(--font-cinzel)", fontSize: 16, fontWeight: 900, color: '#c9a84c', letterSpacing: '0.06em' }}>
            CRUCIBLE
          </span>
          <span style={{ fontFamily: "var(--font-cinzel)", fontSize: 9, fontWeight: 600, color: '#9a8545', letterSpacing: '0.18em' }}>
            RPG
          </span>
        </Link>
        {worldName && (
          <>
            <span style={{ color: t.border, fontSize: 14, userSelect: 'none' }}>|</span>
            <span style={{ fontFamily: 'inherit', fontSize: 13, color: t.textDim }}>
              {worldName}
            </span>
          </>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button
          onClick={onOpenSettings}
          aria-label="Settings"
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 4,
          }}
        >
          {BarIcons.settings(t.textMuted)}
        </button>
        <button
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 4,
          }}
        >
          {sidebarOpen ? BarIcons.sidebar(t.textMuted) : BarIcons.menu(t.textMuted)}
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// Sidebar
// =============================================================================

function Sidebar({ t, sz, width, activeTab, setActiveTab, badges }) {
  return (
    <div style={{
      width, minWidth: 260, maxWidth: 600,
      background: t.bgPanel, borderLeft: `1px solid ${t.border}`,
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      height: '100%', boxSizing: 'border-box',
    }}>
      {/* Tab bar */}
      <div style={{
        display: 'flex', borderBottom: `1px solid ${t.border}`,
        padding: '0 4px', flexShrink: 0, overflow: 'hidden',
      }}>
        {SIDEBAR_TABS.map(tab => {
          const isActive = activeTab === tab.id;
          const badgeCount = badges[tab.id] || 0;
          const iconFn = TabIcons[tab.id];
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-label={tab.label}
              style={{
                flex: 1, padding: '10px 0 8px', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 3, background: 'none', border: 'none',
                borderBottom: isActive ? `2px solid ${t.accent}` : '2px solid transparent',
                cursor: 'pointer', position: 'relative',
                transition: 'border-color 0.2s',
              }}
            >
              <div style={{ position: 'relative' }}>
                {iconFn && iconFn(isActive ? t.accent : t.textMuted)}
                {badgeCount > 0 && (
                  <span style={{
                    position: 'absolute', top: -4, right: -8,
                    background: t.danger, color: '#ffffff',
                    fontFamily: "var(--font-jetbrains)", fontSize: 9, fontWeight: 700,
                    width: 14, height: 14, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    lineHeight: 1,
                  }}>{badgeCount}</span>
                )}
              </div>
              <span style={{
                fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui - 1,
                color: isActive ? t.accent : t.textMuted,
                fontWeight: isActive ? 600 : 400,
                letterSpacing: '0.02em',
              }}>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content area */}
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        <div style={{
          fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui,
          color: t.textDim, textAlign: 'center', paddingTop: 40,
        }}>
          {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} content
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 12px', borderTop: `1px solid ${t.border}`,
        display: 'flex', gap: 8, flexShrink: 0,
      }}>
        <button style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '7px 0', background: 'none',
          border: `1px solid ${t.border}`, borderRadius: 4, cursor: 'pointer',
          fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui, color: t.textMuted,
        }}>
          {BarIcons.bug(t.textMuted)}
          Bug
        </button>
        <button style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '7px 0', background: 'none',
          border: `1px solid ${t.border}`, borderRadius: 4, cursor: 'pointer',
          fontFamily: "var(--font-alegreya-sans)", fontSize: sz.ui, color: t.textMuted,
        }}>
          {BarIcons.lightbulb(t.textMuted)}
          Suggest
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
    const onMouseMove = (e) => {
      if (dragging.current) onDrag(e.clientX);
    };
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
    <div
      onMouseDown={onMouseDown}
      style={{
        width: 6, cursor: 'col-resize', flexShrink: 0,
        background: t.border, transition: 'background 0.2s',
      }}
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
    <div style={{
      minHeight: '100vh', background: t.bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16,
    }}>
      <div style={{
        width: 32, height: 32, border: `2px solid ${t.border}`,
        borderTopColor: t.accent, borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <span style={{
        fontFamily: "var(--font-alegreya)", fontSize: 17, fontStyle: 'italic',
        color: t.textMuted,
      }}>Loading your adventure...</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorState({ t, message }) {
  return (
    <div style={{
      minHeight: '100vh', background: t.bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20,
    }}>
      <span style={{
        fontFamily: "var(--font-alegreya-sans)", fontSize: 17, color: t.danger,
      }}>{message}</span>
      <Link href="/menu" style={{
        fontFamily: "var(--font-cinzel)", fontSize: 13, fontWeight: 600,
        color: t.accent, textDecoration: 'none', letterSpacing: '0.08em',
        padding: '10px 24px', border: `1px solid #3a3328`, borderRadius: 4,
      }}>BACK TO MENU</Link>
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
    setDisplaySettings(prev => {
      const next = { ...prev, [key]: value };
      saveDisplaySettings(next);
      return next;
    });
  }, []);

  // --- Game state ---
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- UI state ---
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(sz.sidebar);
  const [activeTab, setActiveTab] = useState('character');
  const [badges] = useState({ character: 0, inventory: 0, npcs: 0, glossary: 0, map: 0, journal: 0 });
  const containerRef = useRef(null);

  // --- Redirect if no game ID ---
  useEffect(() => {
    if (authChecked && !gameId) {
      router.replace('/menu');
    }
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
      } catch (err) {
        setError(err.message || 'Failed to load game.');
      } finally {
        setLoading(false);
      }
    };
    fetchGame();
  }, [authChecked, gameId]);

  // --- Sidebar resize ---
  const handleResize = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newWidth = Math.max(260, Math.min(600, rect.right - clientX));
    setSidebarWidth(newWidth);
  }, []);

  // --- Update sidebar width when text size changes ---
  useEffect(() => {
    setSidebarWidth(sz.sidebar);
  }, [sz.sidebar]);

  // --- Early returns ---
  if (!authChecked) {
    return <LoadingState t={t} />;
  }

  if (!gameId) {
    return null; // redirect in progress
  }

  if (loading) {
    return <LoadingState t={t} />;
  }

  if (error) {
    return <ErrorState t={t} message={error} />;
  }

  // --- Derive world name from game state ---
  const worldName = gameState?.world?.name
    || gameState?.setting?.settingName
    || gameState?.settingName
    || null;

  return (
    <div
      ref={containerRef}
      style={{
        height: '100vh', display: 'flex', flexDirection: 'column',
        background: t.bg, color: t.text,
        fontFamily: fontOption.family, fontSize: sz.narrative,
        overflow: 'hidden',
      }}
    >
      {/* Top Bar */}
      <TopBar
        t={t}
        worldName={worldName}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(prev => !prev)}
        onOpenSettings={() => { /* TODO: Open settings modal */ }}
      />

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Narrative panel */}
        <div style={{
          flex: 1, overflow: 'auto', padding: '24px 28px',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            maxWidth: 720, width: '100%', margin: '0 auto',
            fontFamily: "var(--font-alegreya)", fontSize: sz.narrative,
            color: t.text, lineHeight: 1.8,
          }}>
            {/* Narrative content will be rendered here in future prompts */}
          </div>
        </div>

        {/* Resize handle + Sidebar */}
        {sidebarOpen && (
          <>
            <ResizeHandle onDrag={handleResize} t={t} />
            <Sidebar
              t={t}
              sz={sz}
              width={sidebarWidth}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              badges={badges}
            />
          </>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Export with Suspense boundary (required for useSearchParams)
// =============================================================================

export default function PlayPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0a0e1a' }} />}>
      <PlayPageInner />
    </Suspense>
  );
}
