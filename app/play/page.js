'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import * as api from '@/lib/api';
import { useAuth } from '@/lib/useAuth';
import { getToken } from '@/lib/api';
import TopBar from './components/TopBar';
import NarrativePanel from './components/NarrativePanel';
import ActionPanel from './components/ActionPanel';
import Sidebar from './components/Sidebar';
import SettingsModal, { THEMES, FONTS, SIZES } from './components/SettingsModal';
import EntityPopup from './components/EntityPopup';
import DebugPanel from './components/DebugPanel';
import styles from './play.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const SETTINGS_KEY = 'crucible_display_settings';
const DEFAULT_SETTINGS = { theme: 'dark', font: 'lexie', textSize: 'medium' };

function loadSettings() {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_SETTINGS;
}

function saveSettings(settings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch {}
}

// Build CSS variable overrides for the current display settings
function buildThemeStyle(settings) {
  const themeVars = THEMES[settings.theme] || THEMES.dark;
  const font = FONTS.find(f => f.id === settings.font) || FONTS[0];
  const size = SIZES.find(s => s.id === settings.textSize) || SIZES[1];
  return {
    ...themeVars,
    '--body-font': font.family,
    '--narrative-size': size.narrative,
    '--ui-size': size.ui,
  };
}

// =============================================================================
// PlayPage — Main game page with data fetching and state management
// =============================================================================

function PlayPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameId = searchParams.get('gameId');
  const authReady = useAuth();

  // ─── Core State ───
  const [gameState, setGameState] = useState(null);
  const [turns, setTurns] = useState([]);
  const [actions, setActions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [sseConnected, setSseConnected] = useState(false);

  // ─── Sidebar State ───
  const [characterData, setCharacterData] = useState(null);
  const [glossaryData, setGlossaryData] = useState(null);
  const [mapData, setMapData] = useState(null);
  const [notesData, setNotesData] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState({});

  // ─── Display Settings ───
  const [displaySettings, setDisplaySettings] = useState(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // ─── Entity Popup ───
  const [entityPopup, setEntityPopup] = useState(null);

  // ─── Debug Mode ───
  const [debugMode, setDebugModeState] = useState(false);
  const [debugLog, setDebugLog] = useState([]);

  const sseRef = useRef(null);
  const narrativeRef = useRef(null);

  // Load display settings from localStorage on mount
  useEffect(() => {
    setDisplaySettings(loadSettings());
  }, []);

  // Load debug mode from localStorage and register debug callback
  useEffect(() => {
    const stored = localStorage.getItem('crucible_debug');
    if (stored === 'true') {
      setDebugModeState(true);
      api.setDebugMode(true);
    }

    api.onDebugResponse((entry) => {
      setDebugLog(prev => [entry, ...prev]);
    });

    return () => api.onDebugResponse(null);
  }, []);

  // Keyboard shortcut: Ctrl+Shift+D toggles debug mode
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        setDebugModeState(prev => {
          const next = !prev;
          localStorage.setItem('crucible_debug', String(next));
          api.setDebugMode(next);
          return next;
        });
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Save display settings when they change
  const handleSettingsChange = useCallback((newSettings) => {
    setDisplaySettings(newSettings);
    saveSettings(newSettings);
  }, []);

  // ─── Refetch helpers ───
  const refetchCharacter = useCallback(() => {
    if (!gameId) return;
    api.get(`/api/game/${gameId}/character`).then(data => {
      setCharacterData(data);
    }).catch(err => console.error('Failed to refresh character:', err));
  }, [gameId]);

  const refetchNotes = useCallback(() => {
    if (!gameId) return;
    api.get(`/api/game/${gameId}/notes`).then(data => {
      setNotesData(data);
    }).catch(err => console.error('Failed to refresh notes:', err));
  }, [gameId]);

  // ─── Compute notifications from stateChanges ───
  const addNotifications = useCallback((stateChanges) => {
    if (!stateChanges) return;
    const notifs = {};
    const hasChanges = (group) =>
      group?.added?.length || group?.removed?.length || group?.modified?.length;

    if (hasChanges(stateChanges.conditions)) notifs.character = 1;
    if (hasChanges(stateChanges.inventory)) notifs.inventory = 1;

    if (Object.keys(notifs).length > 0) {
      setNotifications(prev => {
        const next = { ...prev };
        Object.entries(notifs).forEach(([k, v]) => {
          next[k] = (next[k] || 0) + v;
        });
        return next;
      });
    }
  }, []);

  // ─── Shared turn response handler (used by submitAction + TalkToGM escalation) ───
  const handleTurnResponse = useCallback((response, playerActionText = null) => {
    if (!response.turnAdvanced) return;

    setTurns(prev => [...prev, {
      number: response.turn.number,
      sessionTurn: response.turn.sessionTurn,
      narrative: response.narrative,
      resolution: response.resolution || null,
      stateChanges: response.stateChanges || null,
      playerAction: playerActionText,
      clock: response.stateChanges?.clock || null,
      weather: gameState?.clock?.weather || null,
      location: gameState?.world?.currentLocation || null,
      _isNew: true,
    }]);

    if (response.nextActions) {
      setActions(response.nextActions);
    }

    if (response.stateChanges?.clock) {
      setGameState(prev => prev ? {
        ...prev,
        clock: { ...prev.clock, ...response.stateChanges.clock }
      } : prev);
    }

    if (response.stateChanges) {
      addNotifications(response.stateChanges);
      refetchCharacter();
    }

    // Enrich latest debug entry with turn number
    if (response.turn?.number) {
      setDebugLog(prev => {
        if (prev.length === 0) return prev;
        const [latest, ...rest] = prev;
        return [{ ...latest, turnNumber: response.turn.number }, ...rest];
      });
    }
  }, [addNotifications, refetchCharacter, gameState]);

  // ─── Submit Action (Step 5 handler) ───
  const submitAction = useCallback(async (actionBody) => {
    if (!gameId || submitting) return;
    setSubmitting(true);
    setError(null);

    // Set debug action label before API call
    if (actionBody.choice) {
      api.setNextActionLabel(`choice: ${actionBody.choice}`);
    } else if (actionBody.custom) {
      api.setNextActionLabel(`custom: ${actionBody.custom}`);
    } else if (actionBody.command) {
      api.setNextActionLabel(`command: ${actionBody.command}`);
    }

    try {
      const response = await api.post(`/api/game/${gameId}/action`, actionBody);

      if (response.turnAdvanced) {
        let playerActionText = null;
        if (actionBody.choice) {
          const opt = actions?.options?.find(o => o.id === actionBody.choice);
          playerActionText = opt ? opt.text : `Choice ${actionBody.choice}`;
        } else if (actionBody.custom) {
          playerActionText = actionBody.custom;
        } else if (actionBody.command) {
          playerActionText = `[${actionBody.command}]`;
        }

        handleTurnResponse(response, playerActionText);
      }
    } catch (err) {
      console.error('Action failed:', err);
      setError(err.message || 'Action failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [gameId, submitting, actions, handleTurnResponse]);

  // ─── Page Load Flow (Steps 1–4) ───
  useEffect(() => {
    if (!authReady || !gameId) return;
    let cancelled = false;

    async function load() {
      try {
        // Step 1: Load game state
        const game = await api.get(`/api/games/${gameId}`);
        if (cancelled) return;

        if (game.status !== 'active') {
          router.replace('/menu');
          return;
        }
        if (!game.character) {
          router.replace(`/init?gameId=${gameId}`);
          return;
        }

        setGameState(game);

        // Convert recentNarrative to turn blocks
        if (game.recentNarrative && game.recentNarrative.length > 0) {
          const turnMap = new Map();
          for (const entry of game.recentNarrative) {
            if (!turnMap.has(entry.turn)) {
              turnMap.set(entry.turn, {
                number: entry.turn,
                narrative: null,
                playerAction: null,
                resolution: null,
                stateChanges: null,
                clock: null,
              });
            }
            const t = turnMap.get(entry.turn);
            if (entry.role === 'player' || entry.role === 'user') {
              if (entry.turn === 1 && entry.content === 'Begin the adventure') {
                t.playerAction = null;
              } else {
                t.playerAction = entry.content;
              }
            } else {
              t.narrative = t.narrative
                ? t.narrative + '\n\n' + entry.content
                : entry.content;
            }
          }
          setTurns(
            Array.from(turnMap.values()).sort((a, b) => a.number - b.number)
          );
        }

        // Step 2: Load supplementary data (parallel, fire-and-forget)
        api.get(`/api/game/${gameId}/state`).then(state => {
          if (cancelled) return;
          if (state?.narrative?.availableActions) {
            setActions(state.narrative.availableActions);
          }
        }).catch(err => console.error('Failed to load game state:', err));

        api.get(`/api/game/${gameId}/character`).then(data => {
          if (!cancelled) setCharacterData(data);
        }).catch(err => console.error('Failed to load character:', err));

        api.get(`/api/game/${gameId}/glossary`).then(data => {
          if (!cancelled) setGlossaryData(data);
        }).catch(err => console.error('Failed to load glossary:', err));

        api.get(`/api/game/${gameId}/map`).then(data => {
          if (!cancelled) setMapData(data);
        }).catch(err => console.error('Failed to load map:', err));

        api.get(`/api/game/${gameId}/notes`).then(data => {
          if (!cancelled) setNotesData(data);
        }).catch(err => console.error('Failed to load notes:', err));

        // Step 3: Establish SSE connection
        const token = getToken();
        if (token) {
          const es = new EventSource(
            `${API_BASE}/api/game/${gameId}/stream?token=${encodeURIComponent(token)}`
          );
          sseRef.current = es;

          es.addEventListener('connected', () => {
            if (!cancelled) setSseConnected(true);
          });

          es.addEventListener('command:response', (event) => {
            try {
              const data = JSON.parse(event.data);
              console.log('SSE command:response', data);
            } catch (err) {
              console.error('Failed to parse SSE command:response:', err);
            }
          });

          es.onerror = () => {
            if (!cancelled) setSseConnected(false);
          };
        }

        // Step 4: Auto-trigger first turn if this is a fresh game
        const isFreshGame =
          (!game.recentNarrative || game.recentNarrative.length === 0) &&
          (!game.clock?.totalTurn);

        if (isFreshGame) {
          try {
            api.setNextActionLabel('custom: Begin the adventure');
            const res = await api.post(`/api/game/${gameId}/action`, {
              custom: 'Begin the adventure',
            });
            if (cancelled) return;

            if (res.turnAdvanced) {
              setTurns([{
                number: res.turn.number,
                sessionTurn: res.turn.sessionTurn,
                narrative: res.narrative,
                resolution: res.resolution || null,
                stateChanges: res.stateChanges || null,
                playerAction: null,
                clock: res.stateChanges?.clock || null,
                weather: game.clock?.weather || null,
                location: null,
                _isNew: true,
              }]);

              if (res.nextActions) {
                setActions(res.nextActions);
              }

              if (res.stateChanges?.clock) {
                setGameState(prev => prev ? {
                  ...prev,
                  clock: { ...prev.clock, ...res.stateChanges.clock }
                } : prev);
              }
            }
          } catch (err) {
            console.error('Failed to trigger first turn:', err);
            if (!cancelled) {
              setError('Failed to start the adventure. Please refresh and try again.');
            }
          }
        }

      } catch (err) {
        console.error('Failed to load game:', err);
        if (!cancelled) {
          if (err.status === 404) {
            setError('Game not found.');
          } else if (err.status === 403) {
            setError('You do not have access to this game.');
          } else {
            setError(err.message || 'Failed to load game.');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
    };
  }, [authReady, gameId, router]);

  // ─── Redirect if no gameId ───
  useEffect(() => {
    if (authReady && !gameId) {
      router.replace('/menu');
    }
  }, [authReady, gameId, router]);

  // ─── Loading State ───
  if (!authReady || loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.wordmark}>
          <span className={styles.wordmarkCrucible}>CRUCIBLE</span>
          <span className={styles.wordmarkRpg}>RPG</span>
        </div>
        <p className={styles.loadingText}>Loading your adventure...</p>
      </div>
    );
  }

  // ─── Fatal Error State ───
  if (error && !gameState) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.wordmark}>
          <span className={styles.wordmarkCrucible}>CRUCIBLE</span>
          <span className={styles.wordmarkRpg}>RPG</span>
        </div>
        <p className={styles.errorText}>{error}</p>
        <button
          className={styles.returnButton}
          onClick={() => router.replace('/menu')}
        >
          Return to Menu
        </button>
      </div>
    );
  }

  // ─── Main Layout ───
  const themeStyle = buildThemeStyle(displaySettings);

  return (
    <div className={styles.pageContainer} style={themeStyle}>
      <TopBar
        setting={gameState?.setting}
        clock={gameState?.clock}
        sseConnected={sseConnected}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(prev => !prev)}
        onOpenSettings={() => setSettingsOpen(true)}
        debugMode={debugMode}
      />
      <div className={styles.mainContent}>
        <div className={styles.narrativeColumn}>
          <NarrativePanel
            ref={narrativeRef}
            turns={turns}
            sessionRecap={gameState?.sessionRecap}
            gameId={gameId}
            onTurnResponse={handleTurnResponse}
          />
          <ActionPanel
            actions={actions}
            submitting={submitting}
            error={error}
            onSubmit={submitAction}
          />
        </div>
        <Sidebar
          collapsed={!sidebarOpen}
          characterData={characterData}
          glossaryData={glossaryData}
          mapData={mapData}
          notesData={notesData}
          gameId={gameId}
          notifications={notifications}
          onClearNotification={(tabId) => setNotifications(prev => ({ ...prev, [tabId]: 0 }))}
          onNotesChange={refetchNotes}
          onEntityClick={setEntityPopup}
        />
      </div>

      {/* Debug Panel */}
      {debugMode && (
        <DebugPanel
          entries={debugLog}
          onClear={() => setDebugLog([])}
        />
      )}

      {/* Settings Modal */}
      {settingsOpen && (
        <SettingsModal
          settings={displaySettings}
          onSave={handleSettingsChange}
          onClose={() => setSettingsOpen(false)}
          gameId={gameId}
          gameState={gameState}
        />
      )}

      {/* Entity Popup */}
      {entityPopup && (
        <EntityPopup
          entity={entityPopup}
          glossaryData={glossaryData}
          notesData={notesData}
          gameId={gameId}
          onClose={() => setEntityPopup(null)}
          onNotesChange={refetchNotes}
        />
      )}
    </div>
  );
}

// =============================================================================
// Page Export — Suspense wrapper for useSearchParams
// =============================================================================

export default function Page() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh', background: '#0a0e1a', gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: '22px', fontWeight: 900, color: '#c9a84c' }}>
            CRUCIBLE
          </span>
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: '12px', fontWeight: 600, color: '#9a8545' }}>
            RPG
          </span>
        </div>
        <p style={{ color: '#8a94a8', fontFamily: "'Alegreya Sans', sans-serif" }}>
          Loading...
        </p>
      </div>
    }>
      <PlayPage />
    </Suspense>
  );
}
