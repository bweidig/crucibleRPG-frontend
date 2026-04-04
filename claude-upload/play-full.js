// ──── FILE: app/play/page.js ────
'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
import ReportModal from './components/ReportModal';
import { buildGlossaryTermSet } from '@/lib/renderLinkedText';
import styles from './play.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const SETTINGS_KEY = 'crucible_display_settings';
const DEFAULT_SETTINGS = { theme: 'dark', font: 'alegreya', textSize: 'medium' };

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
  const isLexie = settings.font === 'lexie';
  return {
    ...themeVars,
    '--body-font': font.family,
    '--narrative-size': size.narrative,
    '--ui-size': size.ui,
    ...(isLexie ? {
      '--font-alegreya': "'Lexie Readable', sans-serif",
      '--font-alegreya-sans': "'Lexie Readable', sans-serif",
      '--font-jetbrains': "'Lexie Readable', sans-serif",
    } : {}),
  };
}

// =============================================================================
// PlayPage — Main game page with data fetching and state management
// =============================================================================

function PlayPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameId = searchParams.get('gameId') || searchParams.get('id');
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

  // ─── Report Modal ───
  const [reportMode, setReportMode] = useState(null); // null | 'bug' | 'suggest'

  // ─── Compass ───
  const [compassOpen, setCompassOpen] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);

  // ─── Loading Overlay ───
  const [overlayDismissed, setOverlayDismissed] = useState(false);
  const [enterReady, setEnterReady] = useState(false);
  const [overlayFading, setOverlayFading] = useState(false);
  const [loreIndex, setLoreIndex] = useState(0);
  const [loreFade, setLoreFade] = useState(true);
  const [tipIndex, setTipIndex] = useState(0);
  const [tipFade, setTipFade] = useState(true);

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
    const user = api.getUser();
    if (stored === null && user?.isDebug) {
      // First visit with debug flag — auto-enable
      setDebugModeState(true);
      api.setDebugMode(true);
      localStorage.setItem('crucible_debug', 'true');
    } else if (stored === 'true') {
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

  const refetchGlossary = useCallback(() => {
    if (!gameId) return;
    api.get(`/api/game/${gameId}/glossary`).then(data => {
      setGlossaryData(data);
    }).catch(err => console.error('Failed to refresh glossary:', err));
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

    // Merge stateChanges.clock with gameState.clock so weather, currentDay, etc.
    // persist even when the action response only sends { day, hour, minute }
    const turnClock = response.stateChanges?.clock
      ? { ...gameState?.clock, ...response.stateChanges.clock }
      : gameState?.clock || null;

    // Extract reflection from mechanicalResults (Long Rest end-of-day reflection)
    const reflection = response.mechanicalResults?.reflection || response.stateChanges?.reflection || null;

    setTurns(prev => [...prev, {
      number: response.turn.number,
      sessionTurn: response.turn.sessionTurn,
      narrative: response.narrative,
      resolution: response.resolution || null,
      stateChanges: response.stateChanges || null,
      reflection,
      playerAction: playerActionText,
      clock: turnClock,
      weather: turnClock?.weather || null,
      location: gameState?.world?.currentLocation || null,
      _isNew: true,
    }]);

    if (response.nextActions) {
      setActions(response.nextActions);
    }

    // Clear session recap after the first action so it never re-appears
    // (handles component remount edge cases where the ref would reset)
    setGameState(prev => {
      if (!prev) return prev;
      const updates = { sessionRecap: null };
      if (response.stateChanges?.clock) {
        updates.clock = { ...prev.clock, ...response.stateChanges.clock };
      }
      return { ...prev, ...updates };
    });

    if (response.stateChanges) {
      addNotifications(response.stateChanges);
      refetchCharacter();
      refetchGlossary();
    }

    // Enrich latest debug entry with turn number
    if (response.turn?.number) {
      setDebugLog(prev => {
        if (prev.length === 0) return prev;
        const [latest, ...rest] = prev;
        return [{ ...latest, turnNumber: response.turn.number }, ...rest];
      });
    }
  }, [addNotifications, refetchCharacter, refetchGlossary, gameState]);

  // ─── Compass Escalation Handler ───
  const handleCompassEscalate = useCallback(async () => {
    if (!gameId || hintLoading) return;
    setHintLoading(true);
    setCompassOpen(false);
    setSubmitting(true);

    try {
      const res = await api.post(`/api/game/${gameId}/talk-to-gm/escalate`, {
        question: 'What should I do next? What are my options right now?',
      });
      if (res.turnAdvanced) {
        handleTurnResponse(res, '[GM Guidance]');
      }
    } catch (err) {
      console.error('Compass escalation failed:', err);
      setError(err.message || 'Failed to get guidance from the GM.');
    } finally {
      setHintLoading(false);
      setSubmitting(false);
    }
  }, [gameId, hintLoading, handleTurnResponse]);

  // ─── Meta Response Handler (My Story tab → GM aside in narrative) ───
  const handleMetaResponse = useCallback((content) => {
    setTurns(prev => [...prev, {
      type: 'gm_aside',
      content,
      timestamp: Date.now(),
    }]);
  }, []);

  // ─── Compute lastResolution and lastStateChanges for TalkToGM contextual chip ───
  const lastResolutionTurn = turns.slice().reverse().find(t => t.resolution);
  const lastResolution = lastResolutionTurn?.resolution || null;
  const lastStateChanges = lastResolutionTurn?.stateChanges || null;

  // Build glossary term set for bracket-notation linking in narrative
  const glossaryTerms = useMemo(() => buildGlossaryTermSet(glossaryData), [glossaryData]);

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
          // Store world data (currentLocation, factionStandings, etc.) for turn headers
          if (state?.world) {
            setGameState(prev => prev ? { ...prev, world: state.world } : prev);
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
              const firstTurnClock = res.stateChanges?.clock
                ? { ...game.clock, ...res.stateChanges.clock }
                : game.clock || null;

              setTurns([{
                number: res.turn.number,
                sessionTurn: res.turn.sessionTurn,
                narrative: res.narrative,
                resolution: res.resolution || null,
                stateChanges: res.stateChanges || null,
                playerAction: null,
                clock: firstTurnClock,
                weather: firstTurnClock?.weather || null,
                location: game.world?.currentLocation || null,
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

  // ─── Redirect if no gameId or not playtester ───
  useEffect(() => {
    if (authReady && !gameId) {
      router.replace('/menu');
    }
    if (authReady && gameId) {
      const user = api.getUser();
      if (user && !user.isPlaytester) router.replace('/');
    }
  }, [authReady, gameId, router]);

  // ─── Loading Overlay Lifecycle ───
  const showOverlay = !overlayDismissed && (!authReady || loading || !enterReady || !overlayFading);
  const dataReady = authReady && !loading;
  const isReturningGame = dataReady && gameState && (
    (gameState.recentNarrative?.length > 0) ||
    (gameState.clock?.totalTurn > 0)
  );

  // When data finishes loading, hold 1.5s then show ENTER button
  useEffect(() => {
    if (dataReady && !enterReady) {
      const t = setTimeout(() => setEnterReady(true), 1500);
      return () => clearTimeout(t);
    }
  }, [dataReady, enterReady]);

  // Lore fragment cycling — stops when data is ready so "Your story begins..." doesn't blink
  const LORE_FRAGMENTS = ['The world takes shape...', 'Setting the stage...', 'Preparing your first scene...', 'Populating the streets...', 'Seeding rumors and secrets...', 'Lighting the lanterns...'];
  useEffect(() => {
    if (overlayDismissed || dataReady) return;
    const interval = setInterval(() => {
      setLoreFade(false);
      setTimeout(() => { setLoreIndex(prev => (prev + 1) % LORE_FRAGMENTS.length); setLoreFade(true); }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, [overlayDismissed, dataReady]);

  // Tip cycling
  const OVERLAY_TIPS = [
    'Your stats come from your backstory. Who you are shapes what you can do.',
    'Injuries stick around. A broken arm doesn\'t heal between scenes.',
    'The AI gives you options, but you can always type your own action.',
    'Pack light. Carry too much and your body pays for it.',
    'Your storyteller shapes every word. You can switch them mid-game if the tone isn\'t right.',
    'A Natural 20 is always a critical success. No matter the odds.',
    'The world remembers what you do. Your choices ripple forward.',
    'Every NPC has their own goals. Not all of them align with yours.',
    'You can talk your way out of most fights. Whether you should is another question.',
    'Weapons wear down with use. Take care of your gear or it won\'t take care of you.',
    'Every hero needs a crucible. The hardest moments reveal the most.',
    'Magic costs something. Every spell draws from your Potency and your endurance.',
    'Rest isn\'t free. You need a safe place and enough time.',
    'The difficulty dials are yours. You can adjust them mid-game in Settings.',
    'Not every fight needs a winner. Escape is always an option.',
    'Skill checks use real math. Your stats, your skills, and one d20.',
    'You can file bug reports and suggestions from the sidebar during play.',
    'Conditions stack. Two injuries to the same limb are worse than one.',
  ];
  useEffect(() => {
    if (overlayDismissed) return;
    const interval = setInterval(() => {
      setTipFade(false);
      setTimeout(() => { setTipIndex(prev => (prev + 1) % OVERLAY_TIPS.length); setTipFade(true); }, 400);
    }, 5500);
    return () => clearInterval(interval);
  }, [overlayDismissed]);

  function handleEnterWorld() {
    setOverlayFading(true);
    setTimeout(() => setOverlayDismissed(true), 600);
  }

  // Read summary from sessionStorage
  const loadingSummary = typeof window !== 'undefined' ? (() => {
    try { return JSON.parse(sessionStorage.getItem('crucible_loading_summary')); } catch { return null; }
  })() : null;

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
        <div className={`${styles.narrativeColumn} ${!sidebarOpen ? styles.narrativeExpanded : ''}`}>
          <NarrativePanel
            ref={narrativeRef}
            turns={turns}
            sessionRecap={gameState?.sessionRecap}
            worldBriefing={gameState?.worldBriefing}
            gameId={gameId}
            onTurnResponse={handleTurnResponse}
            lastResolution={lastResolution}
            lastStateChanges={lastStateChanges}
            onMetaResponse={handleMetaResponse}
            glossaryTerms={glossaryTerms}
            onEntityClick={setEntityPopup}
          />
          <ActionPanel
            actions={actions}
            submitting={submitting}
            error={error}
            onSubmit={submitAction}
            compassOpen={compassOpen}
            onToggleCompass={() => setCompassOpen(prev => !prev)}
            objectives={gameState?.world}
            currentLocation={gameState?.world?.currentLocation}
            onEscalate={handleCompassEscalate}
            hintLoading={hintLoading}
            glossaryTerms={glossaryTerms}
            onEntityClick={setEntityPopup}
          />
        </div>
        <Sidebar
          collapsed={!sidebarOpen}
          characterData={characterData}
          glossaryData={glossaryData}
          glossaryTerms={glossaryTerms}
          mapData={mapData}
          notesData={notesData}
          gameId={gameId}
          notifications={notifications}
          onClearNotification={(tabId) => setNotifications(prev => ({ ...prev, [tabId]: 0 }))}
          onNotesChange={refetchNotes}
          onEntityClick={setEntityPopup}
          onOpenReport={setReportMode}
          debugMode={debugMode}
          isDebugUser={!!api.getUser()?.isDebug}
          onToggleDebug={() => {
            setDebugModeState(prev => {
              const next = !prev;
              localStorage.setItem('crucible_debug', String(next));
              api.setDebugMode(next);
              return next;
            });
          }}
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
          onGameStateReload={() => { window.location.reload(); }}
        />
      )}

      {/* Entity Popup */}
      {entityPopup && (
        <EntityPopup
          entity={entityPopup}
          glossaryData={glossaryData}
          glossaryTerms={glossaryTerms}
          notesData={notesData}
          gameId={gameId}
          onClose={() => setEntityPopup(null)}
          onNotesChange={refetchNotes}
          onEntityClick={setEntityPopup}
        />
      )}

      {/* Bug Report / Suggestion Modal */}
      {reportMode && (
        <ReportModal
          mode={reportMode}
          gameId={gameId}
          gameState={gameState}
          turns={turns}
          characterData={characterData}
          debugLog={debugLog}
          onClose={() => setReportMode(null)}
        />
      )}

      {/* Loading Overlay */}
      {!overlayDismissed && (
        <div className={styles.loadingOverlay} style={{
          opacity: overlayFading ? 0 : 1,
          transition: 'opacity 0.6s ease',
          pointerEvents: overlayFading ? 'none' : 'auto',
        }}>
          <style>{`
            @keyframes ember0 { 0%{transform:translate(0,0)}12%{transform:translate(18px,-14px)}25%{transform:translate(30px,8px)}37%{transform:translate(14px,28px)}50%{transform:translate(-12px,20px)}62%{transform:translate(-28px,4px)}75%{transform:translate(-16px,-22px)}87%{transform:translate(6px,-30px)}100%{transform:translate(0,0)} }
            @keyframes ember1 { 0%{transform:translate(0,0)}14%{transform:translate(-22px,16px)}28%{transform:translate(-8px,34px)}42%{transform:translate(20px,24px)}57%{transform:translate(32px,-4px)}71%{transform:translate(12px,-26px)}85%{transform:translate(-14px,-18px)}100%{transform:translate(0,0)} }
            @keyframes ember2 { 0%{transform:translate(0,0)}11%{transform:translate(26px,12px)}22%{transform:translate(18px,-20px)}33%{transform:translate(-8px,-32px)}44%{transform:translate(-30px,-10px)}55%{transform:translate(-22px,18px)}66%{transform:translate(-4px,30px)}77%{transform:translate(20px,16px)}88%{transform:translate(28px,-6px)}100%{transform:translate(0,0)} }
            @keyframes ember3 { 0%{transform:translate(0,0)}13%{transform:translate(-16px,-24px)}26%{transform:translate(10px,-30px)}39%{transform:translate(28px,-8px)}52%{transform:translate(22px,20px)}65%{transform:translate(-6px,28px)}78%{transform:translate(-26px,10px)}91%{transform:translate(-20px,-12px)}100%{transform:translate(0,0)} }
            @keyframes ember4 { 0%{transform:translate(0,0)}10%{transform:translate(14px,22px)}20%{transform:translate(32px,8px)}30%{transform:translate(24px,-18px)}40%{transform:translate(4px,-28px)}50%{transform:translate(-20px,-22px)}60%{transform:translate(-30px,2px)}70%{transform:translate(-18px,24px)}80%{transform:translate(6px,30px)}90%{transform:translate(22px,14px)}100%{transform:translate(0,0)} }
            @keyframes ember5 { 0%{transform:translate(0,0)}12%{transform:translate(-24px,8px)}25%{transform:translate(-14px,28px)}37%{transform:translate(12px,22px)}50%{transform:translate(26px,0px)}62%{transform:translate(16px,-24px)}75%{transform:translate(-10px,-28px)}87%{transform:translate(-28px,-6px)}100%{transform:translate(0,0)} }
            @keyframes ember6 { 0%{transform:translate(0,0)}14%{transform:translate(20px,-16px)}28%{transform:translate(8px,-34px)}42%{transform:translate(-18px,-20px)}57%{transform:translate(-28px,8px)}71%{transform:translate(-10px,26px)}85%{transform:translate(16px,18px)}100%{transform:translate(0,0)} }
            @keyframes ember7 { 0%{transform:translate(0,0)}11%{transform:translate(-12px,20px)}22%{transform:translate(8px,32px)}33%{transform:translate(26px,14px)}44%{transform:translate(30px,-10px)}55%{transform:translate(14px,-26px)}66%{transform:translate(-12px,-22px)}77%{transform:translate(-28px,-4px)}88%{transform:translate(-20px,16px)}100%{transform:translate(0,0)} }
            @keyframes shimmer { 0%{background-position:200% center}100%{background-position:-200% center} }
          `}</style>

          {/* Particle field */}
          <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
            {Array.from({ length: 20 }, (_, i) => (
              <div key={i} style={{
                position: 'absolute', left: `${(i * 37 + 13) % 100}%`, top: `${(i * 53 + 7) % 100}%`,
                width: Math.random() * 2.5 + 0.8, height: Math.random() * 2.5 + 0.8,
                borderRadius: '50%', background: '#c9a84c',
                opacity: Math.random() * 0.25 + 0.08,
              }} />
            ))}
          </div>

          {/* Radial glow */}
          <div style={{
            position: 'absolute', width: 500, height: 500, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(201,168,76,0.04) 0%, transparent 70%)',
            top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none',
          }} />

          {/* Wordmark */}
          <Link href="/menu" style={{ position: 'absolute', top: 22, left: 24, display: 'flex', alignItems: 'baseline', gap: 8, zIndex: 2, textDecoration: 'none' }}>
            <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 22, fontWeight: 900, color: '#c9a84c', letterSpacing: '0.06em' }}>CRUCIBLE</span>
            <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 600, color: '#9a8545', letterSpacing: '0.18em' }}>RPG</span>
          </Link>

          {/* Center content */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
            {/* Character summary bar */}
            {loadingSummary && (
              <div style={{ display: 'flex', gap: 20, marginBottom: 44, flexWrap: 'wrap', justifyContent: 'center' }}>
                {[
                  { label: 'Character', value: loadingSummary.characterName },
                  { label: 'World', value: loadingSummary.isPrebuilt
                    ? loadingSummary.worldName
                    : `${loadingSummary.worldName || 'New World'}${loadingSummary.settingArchetype && loadingSummary.settingArchetype !== loadingSummary.worldName ? ` (${loadingSummary.settingArchetype})` : ''}`
                  },
                  { label: 'Voice', value: loadingSummary.storyteller },
                  { label: 'Difficulty', value: loadingSummary.difficulty },
                ].filter(item => item.value).map((item, i, arr) => (
                  <div key={i} style={{
                    textAlign: 'center', padding: '0 20px',
                    borderRight: i < arr.length - 1 ? '1px solid #1e2540' : 'none',
                  }}>
                    <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, fontWeight: 600, color: '#4a5a70', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 5 }}>{item.label}</div>
                    <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 16, fontWeight: 600, color: '#8a94a8', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Phase label — matches init overlay pattern */}
            <div style={{
              fontFamily: 'var(--font-cinzel)', fontSize: 14, fontWeight: 700,
              color: '#c9a84c', letterSpacing: '0.18em', textTransform: 'uppercase',
              marginBottom: 32,
            }}>{isReturningGame ? 'WELCOME BACK' : 'PROLOGUE'}</div>

            {/* Firefly embers */}
            <div style={{ width: 160, height: 160, position: 'relative' }}>
              {[
                { x: 60, y: 40, size: 4, anim: 'ember0', dur: 17, delay: 0, color: '#c9a84c', glow: 11 },
                { x: 100, y: 70, size: 3, anim: 'ember1', dur: 19, delay: 0.3, color: '#ddb84e', glow: 9 },
                { x: 40, y: 90, size: 5, anim: 'ember2', dur: 15, delay: 0.6, color: '#c9a84c', glow: 14 },
                { x: 110, y: 110, size: 3, anim: 'ember3', dur: 21, delay: 0.2, color: '#ddb84e', glow: 10 },
                { x: 70, y: 120, size: 4, anim: 'ember4', dur: 16, delay: 0.8, color: '#c9a84c', glow: 12 },
                { x: 30, y: 50, size: 5, anim: 'ember5', dur: 18, delay: 1.0, color: '#ddb84e', glow: 13 },
                { x: 120, y: 30, size: 3, anim: 'ember6', dur: 20, delay: 0.5, color: '#c9a84c', glow: 9 },
                { x: 80, y: 80, size: 4, anim: 'ember7', dur: 14, delay: 1.2, color: '#ddb84e', glow: 11 },
              ].map((e, i) => (
                <div key={i} style={{
                  position: 'absolute', left: e.x, top: e.y,
                  width: e.size, height: e.size, borderRadius: '50%',
                  background: e.color, opacity: 0.65 + i * 0.025,
                  boxShadow: `0 0 ${e.glow}px rgba(201,168,76,0.6), 0 0 ${Math.round(e.glow * 2.5)}px rgba(201,168,76,0.2)`,
                  animation: `${e.anim} ${e.dur}s linear ${e.delay}s infinite`,
                }} />
              ))}
            </div>

            {/* Lore fragment */}
            <div style={{ marginTop: 30, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{
                fontFamily: 'var(--font-alegreya)', fontSize: 19, fontStyle: 'italic',
                color: dataReady ? '#c9a84c' : '#5a6a88',
                fontWeight: dataReady ? 700 : 400,
                opacity: loreFade ? 1 : 0, transition: 'opacity 0.3s, color 0.5s',
              }}>
                {dataReady ? (isReturningGame ? 'Your story continues...' : 'Your story begins...') : LORE_FRAGMENTS[loreIndex]}
              </span>
            </div>

            {/* ENTER button */}
            <div style={{
              marginTop: 36, height: 54,
              opacity: enterReady ? 1 : 0, transform: enterReady ? 'translateY(0)' : 'translateY(10px)',
              transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
              pointerEvents: enterReady ? 'auto' : 'none',
            }}>
              <button onClick={handleEnterWorld} style={{
                fontFamily: 'var(--font-cinzel)', fontSize: 15, fontWeight: 700,
                color: '#0a0e1a', letterSpacing: '0.08em',
                background: 'linear-gradient(135deg, #c9a84c, #ddb84e, #c9a84c)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 3s linear infinite',
                border: 'none', borderRadius: 6, padding: '14px 36px',
                cursor: 'pointer',
                boxShadow: '0 0 24px rgba(201,168,76,0.3)',
                transition: 'box-shadow 0.2s ease',
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 36px rgba(201,168,76,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 24px rgba(201,168,76,0.3)'; }}
              >
                ENTER {(gameState?.world?.currentLocation || loadingSummary?.worldName || 'THE WORLD').toUpperCase()}
              </button>
            </div>

            {/* Tips */}
            <div style={{ marginTop: 52, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, maxWidth: 500 }}>
              <div style={{ width: 40, height: 1, background: 'linear-gradient(90deg, transparent, #3a3328, transparent)' }} />
              <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, fontWeight: 600, color: '#3a4a60', letterSpacing: '0.2em', textTransform: 'uppercase' }}>TIP</div>
              <div style={{ textAlign: 'center', minHeight: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{
                  fontFamily: 'var(--font-alegreya-sans)', fontSize: 16, color: '#5a6a88',
                  lineHeight: 1.7, margin: 0, padding: '0 20px',
                  opacity: tipFade ? 1 : 0, transition: 'opacity 0.4s',
                }}>
                  {OVERLAY_TIPS[tipIndex]}
                </p>
              </div>
            </div>
          </div>
        </div>
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
        <p style={{ color: '#8a94a8', fontFamily: "var(--font-alegreya-sans)" }}>
          Loading...
        </p>
      </div>
    }>
      <PlayPage />
    </Suspense>
  );
}

// ─��── FILE: app/play/components/ActionPanel.js ────
import { useState, useCallback, useEffect, useRef } from 'react';
import { renderLinkedText } from '@/lib/renderLinkedText';
import styles from './ActionPanel.module.css';

// ─── Compass SVG Icon ───
function CompassIcon({ size = 18, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className} aria-hidden="true">
      <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.2" />
      <polygon points="9,3 10.5,8 9,7 7.5,8" fill="currentColor" />
      <polygon points="9,15 10.5,10 9,11 7.5,10" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

// ─── Pin SVG Icon ───
function PinIcon({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 13 13" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M6.5 1C4.57 1 3 2.57 3 4.5C3 7.25 6.5 12 6.5 12S10 7.25 10 4.5C10 2.57 8.43 1 6.5 1Z" stroke="currentColor" strokeWidth="1.1" fill="none" />
      <circle cx="6.5" cy="4.5" r="1.3" fill="currentColor" />
    </svg>
  );
}

// ─── Direction Popover ───
function CompassPopover({ objectives, currentLocation, onEscalate, onClose, glossaryTerms, onEntityClick }) {
  const popoverRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    function handleClick(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    }
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const quests = objectives?.quests || objectives?.activeQuests || [];
  const playerObjectives = objectives?.objectives || objectives?.playerObjectives || [];
  const hasObjectives = quests.length > 0 || playerObjectives.length > 0;

  // Cap combined items at 5
  const allItems = [];
  for (const q of quests) {
    if (allItems.length >= 5) break;
    const desc = q.stage != null ? (q.stageDescription || q.title) : q.title;
    allItems.push({ marker: '\u25C6', text: desc || String(q) });
  }
  for (const o of playerObjectives) {
    if (allItems.length >= 5) break;
    const text = typeof o === 'string' ? o : o.text || o.title || String(o);
    allItems.push({ marker: '\u25CB', text });
  }
  const overflow = (quests.length + playerObjectives.length) - allItems.length;

  return (
    <div className={styles.compassPopover} ref={popoverRef}>
      <div className={styles.compassHeader}>
        <div className={styles.compassHeaderLeft}>
          <CompassIcon size={14} />
          <span className={styles.compassHeaderLabel}>YOUR BEARINGS</span>
        </div>
        <button className={styles.compassClose} onClick={onClose} aria-label="Close">&times;</button>
      </div>

      {currentLocation && (
        <div className={styles.compassLocation}>
          <PinIcon />
          <span>{currentLocation}</span>
        </div>
      )}

      {hasObjectives ? (
        <div className={styles.compassObjectives}>
          {allItems.map((item, i) => (
            <div key={i} className={styles.compassObjectiveItem}>
              <span className={styles.compassMarker}>{item.marker}</span>
              <span>{renderLinkedText(item.text, glossaryTerms, onEntityClick)}</span>
            </div>
          ))}
          {overflow > 0 && (
            <div className={styles.compassOverflow}>and {overflow} more in your journal.</div>
          )}
        </div>
      ) : !currentLocation ? (
        <div className={styles.compassEmpty}>
          Your story is open. Try exploring, talking to someone nearby, or writing your own objective in the Notes tab.
        </div>
      ) : null}

      <div className={styles.compassEscalateRow}>
        <button className={styles.compassEscalateButton} onClick={() => { onClose(); onEscalate(); }}>
          Ask the GM for guidance
        </button>
        <span className={styles.compassTurnCost}>Costs 1 turn</span>
      </div>
    </div>
  );
}

export default function ActionPanel({
  actions, submitting, error, onSubmit,
  compassOpen, onToggleCompass, objectives, currentLocation, onEscalate, hintLoading,
  glossaryTerms, onEntityClick,
}) {
  const [customText, setCustomText] = useState('');

  const handleChoice = useCallback((id) => {
    onSubmit({ choice: id });
  }, [onSubmit]);

  const handleCustom = useCallback(() => {
    const text = customText.trim();
    if (!text) return;
    onSubmit({ custom: text });
    setCustomText('');
  }, [customText, onSubmit]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCustom();
    }
  }, [handleCustom]);

  // Nothing to show if no actions loaded yet
  if (!actions) return null;

  const options = Array.isArray(actions.options) ? actions.options : [];
  const customAllowed = actions.customAllowed !== false;

  return (
    <div className={styles.actionPanel}>
      <div className={styles.actionInner}>
        {error && <div className={styles.errorText}>{error}</div>}

        {compassOpen && (
          <CompassPopover
            objectives={objectives}
            currentLocation={currentLocation}
            onEscalate={onEscalate}
            onClose={onToggleCompass}
            glossaryTerms={glossaryTerms}
            onEntityClick={onEntityClick}
          />
        )}

        {submitting ? (
          <div className={styles.submittingText}>
            {hintLoading ? 'Consulting the GM...' : 'Processing your action...'}
          </div>
        ) : (
          <>
            {options.length > 0 && (
              <div className={styles.options}>
                {options.map(opt => (
                  <button
                    key={opt.id}
                    className={styles.optionButton}
                    onClick={() => handleChoice(opt.id)}
                    disabled={submitting}
                  >
                    <span className={styles.optionKey}>{opt.id}</span>
                    <span className={styles.optionText}>{opt.text}</span>
                  </button>
                ))}
              </div>
            )}

            {customAllowed && (
              <div className={styles.customRow}>
                <input
                  type="text"
                  className={styles.customInput}
                  placeholder="Or describe your own action..."
                  value={customText}
                  onChange={e => setCustomText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={submitting}
                  maxLength={500}
                  aria-label="Custom action"
                />
                <button
                  className={styles.submitButton}
                  onClick={handleCustom}
                  disabled={submitting || !customText.trim()}
                  aria-label="Submit custom action"
                >
                  GO
                </button>
                <button
                  className={styles.compassButton}
                  onClick={onToggleCompass}
                  disabled={submitting}
                  aria-label="Get your bearings"
                  title="Get your bearings"
                >
                  <CompassIcon size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─��── FILE: app/play/components/CharacterTab.js ────
import PanelSection from './PanelSection';
import styles from './CharacterTab.module.css';
import sidebarStyles from './Sidebar.module.css';

const BASE_STAT_ORDER = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const STAT_LABELS = {
  str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA', pot: 'POT',
};
const STAT_FULL = {
  str: 'Strength', dex: 'Dexterity', con: 'Constitution',
  int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma', pot: 'Potency',
};

function StatBar({ statKey, stat, onEntityClick }) {
  const effective = stat.effective ?? stat.base ?? 0;
  const base = stat.base ?? 0;
  const hasPenalty = effective < base;
  const pctEffective = Math.min((effective / 20) * 100, 100);
  const pctBase = Math.min((base / 20) * 100, 100);

  return (
    <div className={styles.statRow} title={STAT_FULL[statKey]} onClick={() => onEntityClick?.({ term: STAT_LABELS[statKey], type: 'stat' })} style={{ cursor: 'pointer' }}>
      <div className={styles.statHeader}>
        <span className={styles.statName}>{STAT_LABELS[statKey]}</span>
        <span className={`${styles.statValue} ${hasPenalty ? styles.statPenalized : styles.statNormal}`}>
          {effective.toFixed(1)}
          {hasPenalty && <span className={styles.statBase}> / {base.toFixed(1)}</span>}
        </span>
      </div>
      <div className={styles.barTrack}>
        {hasPenalty && (
          <div className={styles.barBase} style={{ width: `${pctBase}%` }} />
        )}
        <div
          className={`${styles.barFill} ${hasPenalty ? styles.barPenalized : styles.barNormal}`}
          style={{ width: `${pctEffective}%` }}
        />
      </div>
    </div>
  );
}

export default function CharacterTab({ data, onEntityClick }) {
  if (!data) {
    return <div className={sidebarStyles.loadingState}>Loading character...</div>;
  }

  const stats = data.stats || {};
  const skills = Array.isArray(data.skills) ? data.skills : [];
  const conditions = Array.isArray(data.conditions) ? data.conditions : [];
  const companions = Array.isArray(data.companions) ? data.companions : [];

  // Build penalty lookup from per-stat condition breakdowns (these drive the
  // correct effective stat values, so they are authoritative for display).
  const statPenalties = {};
  for (const [key, stat] of Object.entries(stats)) {
    if (Array.isArray(stat.conditions)) {
      for (const c of stat.conditions) {
        statPenalties[`${(c.name || '').toLowerCase()}|${key}`] = c.penalty;
      }
    }
  }

  const activeSkills = skills.filter(s => s.type === 'active');
  const foundationalSkills = skills.filter(s => s.type === 'foundational');
  const passiveSkills = skills.filter(s => s.type === 'passive');
  const spellPatterns = Array.isArray(data.spellPatterns) ? data.spellPatterns : [];

  const handleSkillClick = (name, type) => {
    onEntityClick?.({ term: name, type: type || 'skill' });
  };

  return (
    <div>
      {data.character?.name && (
        <div style={{
          fontFamily: 'var(--font-cinzel)', fontSize: '15px', fontWeight: 700,
          color: 'var(--text-heading)', marginBottom: '12px'
        }}>
          {data.character.name}
        </div>
      )}

      <PanelSection title="Stats">
        {(() => {
          const order = [...BASE_STAT_ORDER];
          const potStat = stats.pot;
          if (potStat && (potStat.base > 0 || potStat.effective > 0)) order.push('pot');
          return order.map(key => {
            const stat = stats[key];
            if (!stat) return null;
            return <StatBar key={key} statKey={key} stat={stat} onEntityClick={onEntityClick} />;
          });
        })()}
      </PanelSection>

      <PanelSection title="Skills">
        {skills.length === 0 ? (
          <div className={sidebarStyles.emptyState}>No skills yet</div>
        ) : (
          <>
            {foundationalSkills.length > 0 && (
              <div className={styles.skillGroup}>
                <div className={styles.skillGroupLabel}>Foundational</div>
                {foundationalSkills.map((skill, i) => (
                  <div key={`f-${i}`} className={styles.skillRow} onClick={() => handleSkillClick(skill.name, 'skill')} style={{ cursor: 'pointer' }}>
                    <span className={styles.skillNameClickable}>{skill.name}</span>
                    <span className={styles.skillModifier}>+{skill.modifier?.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            )}
            {activeSkills.length > 0 && (
              <div className={styles.skillGroup}>
                <div className={styles.skillGroupLabel}>Active</div>
                {activeSkills.map((skill, i) => (
                  <div key={`a-${i}`} className={styles.skillRow} onClick={() => handleSkillClick(skill.name, 'skill')} style={{ cursor: 'pointer' }}>
                    <span className={styles.skillNameClickable}>{skill.name}</span>
                    <span className={styles.skillModifier}>+{skill.modifier?.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            )}
            {passiveSkills.length > 0 && (
              <div className={styles.skillGroup}>
                <div className={styles.skillGroupLabel}>Passive Masteries</div>
                {passiveSkills.map((skill, i) => (
                  <div key={`p-${i}`} className={styles.skillRow} onClick={() => handleSkillClick(skill.name, 'skill')} style={{ cursor: 'pointer' }}>
                    <span className={styles.skillNameClickable}>{skill.name}</span>
                    <span className={styles.skillModifier}>+{skill.modifier?.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </PanelSection>

      {spellPatterns.length > 0 && (
        <PanelSection title="Spell Patterns">
          {spellPatterns.map((pattern, i) => (
            <div key={pattern.patternId || i} className={styles.skillRow} onClick={() => handleSkillClick(pattern.name, 'spell')} style={{ cursor: 'pointer' }}>
              <span className={styles.skillNameClickable}>{pattern.name}</span>
              <span className={styles.skillModifier}>+{pattern.modifier?.toFixed(1)}</span>
            </div>
          ))}
        </PanelSection>
      )}

      <PanelSection title="Conditions" defaultOpen={conditions.length > 0}>
        {conditions.length === 0 ? (
          <div className={sidebarStyles.emptyState}>No active conditions</div>
        ) : (
          conditions.map((cond, i) => {
            const isCon = (cond.stat || '').toLowerCase() === 'con';
            const statKey = `${(cond.name || '').toLowerCase()}|${(cond.stat || '').toLowerCase()}`;
            const val = statPenalties[statKey] ?? cond.penalty ?? 0;
            const isBuff = cond.isBuff === true;
            const absVal = Math.abs(val);
            const signedVal = isBuff ? `+${absVal.toFixed(1)}` : `\u2212${absVal.toFixed(1)}`;
            return (
              <div key={cond.id || i} className={styles.conditionCard} onClick={() => onEntityClick?.({ term: cond.name, type: 'condition', id: cond.id })} style={{ cursor: 'pointer' }}>
                <div className={`${styles.conditionHeader} ${isCon ? styles.conditionHeaderCon : ''}`}>
                  {cond.name}: <span className={isBuff ? styles.conditionBuff : styles.conditionPenalty}>{signedVal}</span> {(cond.stat || '').toUpperCase()}
                </div>
                <div className={styles.conditionDetail}>
                  {cond.durationType?.replace(/_/g, ' ')}
                  {cond.escalation ? ` \u00b7 Escalates \u2192 ${cond.escalation}` : ''}
                </div>
              </div>
            );
          })
        )}
      </PanelSection>

      {companions.length > 0 && (
        <PanelSection title="Companions">
          {companions.map((comp, i) => (
            <div key={comp.id || i} className={styles.skillRow}>
              <span className={styles.skillName}>{comp.name}</span>
              <span className={styles.skillModifier}>{comp.specialty}</span>
            </div>
          ))}
        </PanelSection>
      )}
    </div>
  );
}

// ─��── FILE: app/play/components/DebugPanel.js ────
'use client';

import React, { useState, useRef, useCallback } from 'react';
import styles from './DebugPanel.module.css';

// =============================================================================
// Formatting Helpers
// =============================================================================

function fmtTime(date) {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function fmtDateTime(date) {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  let h = date.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${mo}-${d} ${h}:${min} ${ampm}`;
}

function fmtCost(cost) {
  if (cost == null) return null;
  return `$${cost.toFixed(4)}`;
}

function shortPath(url) {
  let p = url.replace(/\/api\/game\/\d+\//, '/');
  p = p.replace(/\/api\/games\/\d+/, '/games/:id');
  return p;
}

function fmtClockTime(c) {
  if (!c) return '??:??';
  return `${String(c.hour ?? 0).padStart(2, '0')}:${String(c.minute ?? 0).padStart(2, '0')}`;
}

function fmtChangeList(group) {
  if (!group) return '(none)';
  const parts = [];
  if (Array.isArray(group.added)) {
    group.added.forEach(c => parts.push(`+${typeof c === 'string' ? c : c.name || JSON.stringify(c)}`));
  }
  if (Array.isArray(group.removed)) {
    group.removed.forEach(c => parts.push(`-${typeof c === 'string' ? c : c.name || JSON.stringify(c)}`));
  }
  if (Array.isArray(group.modified)) {
    group.modified.forEach(c => parts.push(`~${typeof c === 'string' ? c : c.name || JSON.stringify(c)}`));
  }
  return parts.length ? parts.join(', ') : '(none)';
}

function parseActionLabel(label) {
  if (!label) return { text: '?', type: '' };
  if (label.startsWith('choice: ')) return { text: `Choice ${label.slice(8)}`, type: 'choice' };
  if (label.startsWith('custom: ')) return { text: label.slice(8), type: 'custom' };
  if (label.startsWith('command: ')) return { text: label.slice(9), type: 'command' };
  return { text: label, type: '' };
}

function itemName(item) {
  return typeof item === 'string' ? item : item.name || JSON.stringify(item);
}

// =============================================================================
// Plain Text Export
// =============================================================================

const KNOWN_DEBUG_KEYS = ['timing', 'ai', 'resolution', 'stateChanges', 'narrative', 'context', 'rowCounts', 'turn', 'turnCost', 'turnCostBreakdown', 'gameTotalCost'];

function entryToText(entry) {
  const d = entry.debug || {};
  const lines = [];
  const isAdvancing = entry.method === 'POST' && (entry.url.includes('/action') || entry.url.includes('/talk-to-gm'));
  const turnNum = entry.turnNumber || d.turn;

  // Header
  if (isAdvancing && turnNum) {
    lines.push(`=== TURN ${turnNum} — ${fmtDateTime(entry.timestamp)} ===`);
    const action = parseActionLabel(entry.actionLabel);
    lines.push(`Action: "${action.text}"${action.type ? ` (${action.type})` : ''}`);
    lines.push(`Endpoint: ${entry.method} ${entry.url}`);
  } else {
    lines.push(`=== ${entry.method} ${entry.url} — ${fmtDateTime(entry.timestamp)} ===`);
  }

  // Timing
  const t = d.timing || {};
  const totalMs = t.total || entry.durationMs;
  const timingParts = [];
  if (t.ai) timingParts.push(`AI: ${t.ai}ms`);
  if (t.db) timingParts.push(`DB: ${t.db}ms`);
  if (t.parse) timingParts.push(`Parse: ${t.parse}ms`);
  const timingDetail = timingParts.length ? ` (${timingParts.join(', ')})` : '';
  lines.push(`Status: ${entry.status} | Total: ${totalMs}ms${timingDetail}`);

  // [ai-cost] line
  if (d.turnCostBreakdown) {
    const parts = Object.entries(d.turnCostBreakdown).map(([task, cost]) => `${task}: ${fmtCost(cost)}`);
    if (d.turnCost != null) parts.push(`total: ${fmtCost(d.turnCost)}`);
    lines.push(`[ai-cost] ${parts.join(' | ')}`);
  } else if (d.ai) {
    lines.push(`[ai-cost] ${d.ai.task || 'narrative'}: ${d.ai.model || '?'} ${fmtCost(d.ai.estimatedCost) || '?'}`);
  }

  // AI Call
  if (d.ai) {
    lines.push('');
    lines.push('AI Call:');
    lines.push(`  Provider: ${d.ai.provider || '?'} | Model: ${d.ai.model || '?'} | Task: ${d.ai.task || '?'}`);
    const tok = d.ai.tokens || {};
    lines.push(`  Tokens: ${tok.prompt || 0} in / ${tok.completion || 0} out / ${tok.total || 0} total${tok.cached ? ` (${tok.cached} cached)` : ''}`);
    lines.push(`  Estimated Cost: ${fmtCost(d.ai.estimatedCost) || '?'} | Attempts: ${d.ai.attempts || 1}`);
  }

  // Resolution
  if (d.resolution) {
    const r = d.resolution;
    lines.push('');
    lines.push('Resolution:');
    const stat = (r.stat || '???').toUpperCase();
    const effVal = r.effectiveValue ?? r.effective ?? '?';
    const skillStr = r.skillUsed ? ` + ${r.skillUsed}(${r.skillModifier ?? 0})` : '';
    const equipStr = ` + Equip(${r.equipmentQuality ?? 0})`;
    const dieStr = ` + d20(${r.dieSelected ?? '?'})`;
    lines.push(`  ${stat} ${effVal}${skillStr}${equipStr}${dieStr} = ${r.total ?? '?'} vs DC ${r.dc ?? '?'}`);
    lines.push(`  Fortune's Balance: ${r.fortunesBalance || '?'} | Debt: ${r.debtPenalty ?? 0} | Combat: ${r.isCombat ? 'Yes' : 'No'}`);
    const margin = r.margin != null ? (r.margin >= 0 ? '+' : '') + r.margin : '?';
    lines.push(`  Margin: ${margin} | Tier: ${r.tier || '?'} ${r.tierName || ''}`);
  }

  // State Changes
  if (d.stateChanges) {
    const sc = d.stateChanges;
    lines.push('');
    lines.push('State Changes:');
    lines.push(`  DB Tables: ${Array.isArray(sc.tablesWritten) ? sc.tablesWritten.join(', ') : '(none)'}`);
    lines.push(`  Conditions: ${fmtChangeList(sc.conditions)}`);
    lines.push(`  Inventory: ${fmtChangeList(sc.inventory)}`);
    lines.push(`  NPCs Created: ${Array.isArray(sc.npcsCreated) && sc.npcsCreated.length ? sc.npcsCreated.join(', ') : '(none)'}`);
    lines.push(`  NPCs Updated: ${Array.isArray(sc.npcsUpdated) && sc.npcsUpdated.length ? sc.npcsUpdated.join(', ') : '(none)'}`);
    lines.push(`  Locations Created: ${Array.isArray(sc.locationsCreated) && sc.locationsCreated.length ? sc.locationsCreated.join(', ') : '(none)'}`);
    if (sc.clock) {
      const b = sc.clock.before || {};
      const a = sc.clock.after || {};
      lines.push(`  Clock: Day ${b.day ?? '?'} ${fmtClockTime(b)} \u2192 Day ${a.day ?? '?'} ${fmtClockTime(a)}`);
    } else {
      lines.push('  Clock: (no change)');
    }
    lines.push(`  Skills: ${Array.isArray(sc.skillsChanged) && sc.skillsChanged.length ? sc.skillsChanged.join(', ') : '(none)'}`);
  }

  // Narrative
  if (d.narrative) {
    const n = d.narrative;
    lines.push('');
    lines.push('Narrative:');
    lines.push(`  AI Response: ${n.aiResponseLength ?? '?'} chars | Narrative: ${n.narrativeLength ?? '?'} chars | Options: ${n.optionsGenerated ?? '?'}`);
    const parseErrs = Array.isArray(n.parseErrors) && n.parseErrors.length ? n.parseErrors.join(', ') : 'none';
    lines.push(`  Parse Errors: ${parseErrs} | JSON Repair: ${n.jsonRepair ? 'yes' : 'no'}`);
  }

  // Context
  if (d.context) {
    const ctx = d.context;
    const layers = ctx.layers || {};
    lines.push('');
    lines.push('Context Budget:');
    lines.push(`  L1: ${layers.L1 ?? 0} | L2: ${layers.L2 ?? 0} | L3: ${layers.L3 ?? 0} | L4: ${layers.L4 ?? 0} | Total: ${layers.total ?? 0} tokens`);
    if (Array.isArray(ctx.npcs) && ctx.npcs.length) lines.push(`  NPCs: ${ctx.npcs.join(', ')}`);
    if (Array.isArray(ctx.locations) && ctx.locations.length) lines.push(`  Locations: ${ctx.locations.join(', ')}`);
    lines.push(`  Active Anchors: ${ctx.activeAnchors ?? 0}`);
  }

  // Row Counts (GET endpoints)
  if (d.rowCounts) {
    lines.push('');
    lines.push(`Rows: ${Object.entries(d.rowCounts).map(([k, v]) => `${v} ${k}`).join(', ')}`);
  }

  return lines.join('\n');
}

function allEntriesToText(entries) {
  return entries.map(entryToText).join('\n\n' + '\u2500'.repeat(60) + '\n\n');
}

// =============================================================================
// Developer View — Detail Section Components
// =============================================================================

function TimingSection({ timing, clientMs }) {
  const total = timing?.total || clientMs;
  const ai = timing?.ai || 0;
  const db = timing?.db || 0;
  const parse = timing?.parse || 0;
  const other = Math.max(0, total - ai - db - parse);

  const segments = [
    { label: 'AI', value: ai, color: '#6b8aff' },
    { label: 'DB', value: db, color: '#8aba7a' },
    { label: 'Parse', value: parse, color: '#e8c45a' },
    { label: 'Other', value: other, color: '#7082a4' },
  ].filter(s => s.value > 0);

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Timing</div>
      <div className={styles.timingBar}>
        {segments.map(seg => (
          <div
            key={seg.label}
            className={styles.timingSegment}
            style={{ flex: seg.value, background: seg.color }}
            title={`${seg.label}: ${seg.value}ms`}
          />
        ))}
      </div>
      <div className={styles.timingLabels}>
        {segments.map(seg => (
          <span key={seg.label} className={styles.timingLabel}>
            <span className={styles.timingDot} style={{ background: seg.color }} />
            {seg.label}: {(seg.value / 1000).toFixed(1)}s
          </span>
        ))}
        <span className={styles.timingLabel} style={{ marginLeft: 'auto' }}>
          Total: {(total / 1000).toFixed(1)}s
        </span>
      </div>
    </div>
  );
}

function AiSection({ ai }) {
  const tok = ai.tokens || {};
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>AI Call</div>
      <div className={styles.kvGrid}>
        <span className={styles.kvLabel}>Provider</span>
        <span className={styles.kvValue}>{ai.provider || '?'}</span>
        <span className={styles.kvLabel}>Model</span>
        <span className={styles.kvValue}>{ai.model || '?'}</span>
        <span className={styles.kvLabel}>Task</span>
        <span className={styles.kvValue}>{ai.task || '?'}</span>
        <span className={styles.kvLabel}>Tokens</span>
        <span className={styles.kvValue}>
          {(tok.prompt || 0).toLocaleString()} in / {(tok.completion || 0).toLocaleString()} out / {(tok.total || 0).toLocaleString()} total
          {tok.cached ? ` (${tok.cached.toLocaleString()} cached)` : ''}
        </span>
        <span className={styles.kvLabel}>Cost</span>
        <span className={styles.kvValueAccent}>{fmtCost(ai.estimatedCost) || '?'}</span>
        <span className={styles.kvLabel}>Attempts</span>
        <span className={styles.kvValue}>{ai.attempts || 1}</span>
      </div>
    </div>
  );
}

function ResolutionSection({ resolution }) {
  const r = resolution;
  const stat = (r.stat || '?').toUpperCase();
  const margin = r.margin != null ? (r.margin >= 0 ? '+' : '') + Number(r.margin).toFixed(1) : '?';
  const marginColor = r.margin >= 0 ? '#8aba7a' : '#e8845a';

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Resolution</div>
      <div className={styles.resolutionBlock}>
        <div className={styles.kvGrid}>
          <span className={styles.kvLabel}>Stat</span>
          <span className={styles.kvValue}>{stat} {r.effectiveValue ?? r.effective ?? '?'}</span>
          {r.skillUsed && (
            <React.Fragment>
              <span className={styles.kvLabel}>Skill</span>
              <span className={styles.kvValue}>{r.skillUsed} (+{r.skillModifier ?? 0})</span>
            </React.Fragment>
          )}
          <span className={styles.kvLabel}>Equipment</span>
          <span className={styles.kvValue}>{r.equipmentQuality ?? 0}</span>
          <span className={styles.kvLabel}>Fortune&apos;s Balance</span>
          <span className={styles.kvValue}>{r.fortunesBalance || '?'}</span>
          {r.crucibleRoll != null && (
            <React.Fragment>
              <span className={styles.kvLabel}>Crucible Roll</span>
              <span className={styles.kvValue}>{r.crucibleRoll}{r.crucibleExtreme ? ' (EXTREME)' : ''}</span>
            </React.Fragment>
          )}
          <span className={styles.kvLabel}>Dice</span>
          <span className={styles.kvValue}>
            [{Array.isArray(r.diceRolled) ? r.diceRolled.join(', ') : r.dieSelected || '?'}] &rarr; {r.dieSelected}
          </span>
          <span className={styles.kvLabel}>DC</span>
          <span className={styles.kvValue}>{r.dc ?? '?'}</span>
          <span className={styles.kvLabel}>Total</span>
          <span className={styles.kvValue}>{r.total ?? '?'}</span>
          <span className={styles.kvLabel}>Result</span>
          <span className={styles.kvValue} style={{ color: marginColor }}>
            {margin} &rarr; {r.tier} {r.tierName || ''}
          </span>
          {r.debtPenalty != null && r.debtPenalty !== 0 && (
            <React.Fragment>
              <span className={styles.kvLabel}>Debt</span>
              <span className={styles.kvValueDanger}>{r.debtPenalty}</span>
            </React.Fragment>
          )}
          <span className={styles.kvLabel}>Combat</span>
          <span className={styles.kvValue}>{r.isCombat ? 'Yes' : 'No'}</span>
        </div>
      </div>
    </div>
  );
}

function StateChangesSection({ stateChanges }) {
  const sc = stateChanges;
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>State Changes</div>
      <div className={styles.kvGrid}>
        <span className={styles.kvLabel}>DB Tables</span>
        <span className={styles.kvValue}>{Array.isArray(sc.tablesWritten) ? sc.tablesWritten.join(', ') : '(none)'}</span>
        <span className={styles.kvLabel}>Conditions</span>
        <span className={styles.kvValue}>{fmtChangeList(sc.conditions)}</span>
        <span className={styles.kvLabel}>Inventory</span>
        <span className={styles.kvValue}>{fmtChangeList(sc.inventory)}</span>
        <span className={styles.kvLabel}>NPCs Created</span>
        <span className={styles.kvValue}>{Array.isArray(sc.npcsCreated) && sc.npcsCreated.length ? sc.npcsCreated.join(', ') : '(none)'}</span>
        <span className={styles.kvLabel}>NPCs Updated</span>
        <span className={styles.kvValue}>{Array.isArray(sc.npcsUpdated) && sc.npcsUpdated.length ? sc.npcsUpdated.join(', ') : '(none)'}</span>
        <span className={styles.kvLabel}>Locations</span>
        <span className={styles.kvValue}>{Array.isArray(sc.locationsCreated) && sc.locationsCreated.length ? sc.locationsCreated.join(', ') : '(none)'}</span>
        {sc.clock && (
          <React.Fragment>
            <span className={styles.kvLabel}>Clock</span>
            <span className={styles.kvValue}>
              Day {sc.clock.before?.day ?? '?'} {fmtClockTime(sc.clock.before)} &rarr; Day {sc.clock.after?.day ?? '?'} {fmtClockTime(sc.clock.after)}
            </span>
          </React.Fragment>
        )}
        <span className={styles.kvLabel}>Skills</span>
        <span className={styles.kvValue}>{Array.isArray(sc.skillsChanged) && sc.skillsChanged.length ? sc.skillsChanged.join(', ') : '(none)'}</span>
      </div>
    </div>
  );
}

function NarrativeSection({ narrative }) {
  const n = narrative;
  const hasErrors = Array.isArray(n.parseErrors) && n.parseErrors.length > 0;
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Narrative</div>
      <div className={styles.kvGrid}>
        <span className={styles.kvLabel}>AI Response</span>
        <span className={styles.kvValue}>{n.aiResponseLength ?? '?'} chars</span>
        <span className={styles.kvLabel}>Narrative</span>
        <span className={styles.kvValue}>{n.narrativeLength ?? '?'} chars</span>
        <span className={styles.kvLabel}>Options</span>
        <span className={styles.kvValue}>{n.optionsGenerated ?? '?'}</span>
        <span className={styles.kvLabel}>Parse Errors</span>
        <span className={hasErrors ? styles.kvValueDanger : styles.kvValue}>
          {hasErrors ? n.parseErrors.join(', ') : 'none'}
        </span>
        <span className={styles.kvLabel}>JSON Repair</span>
        <span className={n.jsonRepair ? styles.kvValueWarning : styles.kvValue}>
          {n.jsonRepair ? 'yes' : 'no'}
        </span>
      </div>
    </div>
  );
}

function ContextSection({ context }) {
  const ctx = context;
  const layers = ctx.layers || {};
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Context Budget</div>
      <div className={styles.contextLayers}>
        {['L1', 'L2', 'L3', 'L4'].map(key => (
          <div key={key} className={styles.layerChip}>
            <span className={styles.layerKey}>{key}</span>
            <span className={styles.layerVal}>{(layers[key] || 0).toLocaleString()}</span>
          </div>
        ))}
        <div className={styles.layerChipAccent}>
          <span className={styles.layerKey}>Total</span>
          <span className={styles.layerVal} style={{ color: '#c9a84c' }}>
            {(layers.total || 0).toLocaleString()}
          </span>
        </div>
      </div>
      {Array.isArray(ctx.npcs) && ctx.npcs.length > 0 && (
        <div className={styles.contextRow}>
          <span className={styles.kvLabel}>NPCs</span>
          <span className={styles.kvValue}>{ctx.npcs.join(', ')}</span>
        </div>
      )}
      {Array.isArray(ctx.locations) && ctx.locations.length > 0 && (
        <div className={styles.contextRow}>
          <span className={styles.kvLabel}>Locations</span>
          <span className={styles.kvValue}>{ctx.locations.join(', ')}</span>
        </div>
      )}
      <div className={styles.contextRow}>
        <span className={styles.kvLabel}>Active Anchors</span>
        <span className={styles.kvValue}>{ctx.activeAnchors ?? 0}</span>
      </div>
    </div>
  );
}

function RowCountsSection({ rowCounts }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Row Counts</div>
      <div className={styles.kvGrid}>
        {Object.entries(rowCounts).map(([key, val]) => (
          <React.Fragment key={key}>
            <span className={styles.kvLabel}>{key}</span>
            <span className={styles.kvValue}>{val}</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function RawFallbackSection({ debug }) {
  const unknownKeys = Object.keys(debug).filter(k => !KNOWN_DEBUG_KEYS.includes(k));
  if (unknownKeys.length === 0) return null;
  const unknownData = Object.fromEntries(unknownKeys.map(k => [k, debug[k]]));
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Other Debug Data</div>
      <pre className={styles.rawJson}>{JSON.stringify(unknownData, null, 2)}</pre>
    </div>
  );
}

// =============================================================================
// Developer View — Entry Row
// =============================================================================

function EntryRow({ entry, expanded, onToggle }) {
  const d = entry.debug || {};
  const statusColor = entry.status >= 500 ? '#e8845a' : entry.status >= 400 ? '#e8c45a' : '#8aba7a';
  const duration = d.timing?.total || entry.durationMs;
  const cost = d.turnCost ?? d.ai?.estimatedCost;
  const path = shortPath(entry.url);
  const turnNum = entry.turnNumber || d.turn;
  const [copied, setCopied] = useState(false);

  // Build action display for summary line
  let actionDisplay = '';
  const isAction = entry.url.includes('/action');
  if (isAction && turnNum) {
    actionDisplay = `Turn ${turnNum}: "${entry.actionLabel || '?'}"`;
  } else if (entry.method === 'GET' && d.rowCounts) {
    actionDisplay = Object.entries(d.rowCounts).map(([k, v]) => `${v} ${k}`).join(', ');
  } else if (entry.actionLabel) {
    actionDisplay = entry.actionLabel;
  }

  const handleCopy = (e) => {
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(entryToText(entry)).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    } catch { /* clipboard not available */ }
  };

  return (
    <div className={styles.entryRow}>
      <div className={styles.entrySummary} onClick={onToggle}>
        <span className={styles.entryTime}>[{fmtTime(entry.timestamp)}]</span>
        <span className={styles.entrySep}>&mdash;</span>
        <span className={styles.entryMethod}>{entry.method} {path}</span>
        <span className={styles.entrySep}>&mdash;</span>
        <span className={styles.entryStatus} style={{ color: statusColor }}>{entry.status}</span>
        <span className={styles.entrySep}>&mdash;</span>
        <span className={styles.entryDuration}>{duration}ms</span>
        {cost != null && (
          <>
            <span className={styles.entrySep}>&mdash;</span>
            <span className={styles.entryCost}>{fmtCost(cost)}</span>
          </>
        )}
        {actionDisplay && (
          <>
            <span className={styles.entrySep}>&mdash;</span>
            <span className={styles.entryAction}>{actionDisplay}</span>
          </>
        )}
        <span className={styles.entryChevron}>{expanded ? '\u25BC' : '\u25B6'}</span>
      </div>
      {expanded && (
        <div className={styles.entryDetail}>
          <div className={styles.detailActions}>
            <button
              className={copied ? styles.copyEntryBtnSuccess : styles.copyEntryBtn}
              onClick={handleCopy}
            >
              {copied ? '\u2713 Copied' : 'Copy Entry'}
            </button>
          </div>
          <TimingSection timing={d.timing} clientMs={entry.durationMs} />
          {d.ai && <AiSection ai={d.ai} />}
          {d.turnCostBreakdown && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Cost Breakdown</div>
              <div className={styles.kvGrid}>
                {Object.entries(d.turnCostBreakdown).map(([task, taskCost]) => (
                  <React.Fragment key={task}>
                    <span className={styles.kvLabel}>{task}</span>
                    <span className={styles.kvValueAccent}>{fmtCost(taskCost)}</span>
                  </React.Fragment>
                ))}
                {d.turnCost != null && (
                  <React.Fragment>
                    <span className={styles.kvLabel}>Turn Total</span>
                    <span className={styles.kvValueAccent}>{fmtCost(d.turnCost)}</span>
                  </React.Fragment>
                )}
              </div>
            </div>
          )}
          {d.resolution && <ResolutionSection resolution={d.resolution} />}
          {d.stateChanges && <StateChangesSection stateChanges={d.stateChanges} />}
          {d.narrative && <NarrativeSection narrative={d.narrative} />}
          {d.context && <ContextSection context={d.context} />}
          {d.rowCounts && <RowCountsSection rowCounts={d.rowCounts} />}
          <RawFallbackSection debug={d} />
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Designer View — Section Components
// =============================================================================

function DesignerResolution({ resolution }) {
  const r = resolution;
  const stat = (r.stat || '?').toUpperCase();
  const effVal = r.effectiveValue ?? r.effective ?? '?';
  const parts = [`${stat} ${effVal}`];
  if (r.skillUsed) parts.push(`${r.skillUsed} ${r.skillModifier ?? 0}`);
  if (r.equipmentQuality) parts.push(`Equip ${r.equipmentQuality}`);
  parts.push(`d20(${r.dieSelected ?? '?'})`);
  const mathLine = `${parts.join(' + ')} = ${r.total ?? '?'} vs DC ${r.dc ?? '?'}`;

  const margin = r.margin != null ? (r.margin >= 0 ? '+' : '') + Number(r.margin).toFixed(1) : '?';
  const fb = r.fortunesBalance || '?';
  const tierStr = [r.tierName, r.tier ? `(${r.tier})` : null].filter(Boolean).join(' ');
  const detailLine = `Fortune\u2019s Balance: ${fb} | Margin: ${margin} | Tier: ${tierStr || '?'}`;
  const marginColor = r.margin >= 0 ? '#8aba7a' : '#e8845a';

  return (
    <div className={styles.dSection}>
      <div className={styles.dSectionTitle}>Resolution</div>
      <div className={styles.dResLine}>{mathLine}</div>
      <div className={styles.dResLine} style={{ color: marginColor }}>{detailLine}</div>
    </div>
  );
}

function DesignerStateChanges({ stateChanges }) {
  const sc = stateChanges;
  const lines = [];

  // Conditions
  if (sc.conditions) {
    (sc.conditions.added || []).forEach(c => {
      const name = itemName(c);
      const detail = typeof c === 'object' && c.penalty != null
        ? ` (${c.penalty} ${(c.stat || '').toUpperCase()}, ${(c.durationType || '').replace(/_/g, ' ')})`
        : typeof c === 'object' && c.durationType ? ` (${c.durationType.replace(/_/g, ' ')})` : '';
      lines.push({ emoji: '\u26A0\uFE0F', text: `Condition Added: ${name}${detail}`, cls: 'warning' });
    });
    (sc.conditions.removed || []).forEach(c => {
      lines.push({ emoji: '\u2705', text: `Condition Removed: ${itemName(c)}`, cls: 'success' });
    });
    (sc.conditions.modified || []).forEach(c => {
      lines.push({ emoji: '\u26A0\uFE0F', text: `Condition Changed: ${itemName(c)}`, cls: 'warning' });
    });
  }

  // Inventory
  if (sc.inventory) {
    (sc.inventory.added || []).forEach(item => {
      lines.push({ emoji: '\uD83D\uDCE6', text: `Gained: ${itemName(item)}`, cls: '' });
    });
    (sc.inventory.removed || []).forEach(item => {
      lines.push({ emoji: '\uD83D\uDCE6', text: `Lost: ${itemName(item)}`, cls: 'warning' });
    });
  }

  // Clock
  if (sc.clock) {
    const b = sc.clock.before || {};
    const a = sc.clock.after || {};
    lines.push({ emoji: '\uD83D\uDD50', text: `Clock: Day ${b.day ?? '?'} ${fmtClockTime(b)} \u2192 Day ${a.day ?? '?'} ${fmtClockTime(a)}`, cls: '' });
  }

  // NPCs
  if (Array.isArray(sc.npcsCreated) && sc.npcsCreated.length) {
    sc.npcsCreated.forEach(n => lines.push({ emoji: '\uD83D\uDC64', text: `NPC Met: ${n}`, cls: '' }));
  }
  if (Array.isArray(sc.npcsUpdated) && sc.npcsUpdated.length) {
    sc.npcsUpdated.forEach(n => lines.push({ emoji: '\uD83D\uDC64', text: `NPC Updated: ${n}`, cls: '' }));
  }

  // Locations
  if (Array.isArray(sc.locationsCreated) && sc.locationsCreated.length) {
    sc.locationsCreated.forEach(l => lines.push({ emoji: '\uD83D\uDCCD', text: `Location Discovered: ${l}`, cls: '' }));
  }

  // Skills
  if (Array.isArray(sc.skillsChanged) && sc.skillsChanged.length) {
    sc.skillsChanged.forEach(s => lines.push({ emoji: '\u2694\uFE0F', text: `Skill Changed: ${s}`, cls: '' }));
  }

  if (lines.length === 0) return null;

  return (
    <div className={styles.dSection}>
      <div className={styles.dSectionTitle}>State Changes</div>
      {lines.map((line, i) => (
        <div key={i} className={`${styles.dChangeLine} ${line.cls === 'warning' ? styles.dChangeWarning : line.cls === 'success' ? styles.dChangeSuccess : ''}`}>
          <span className={styles.dChangeEmoji}>{line.emoji}</span>
          <span>{line.text}</span>
        </div>
      ))}
    </div>
  );
}

function DesignerNpcs({ context }) {
  if (!context?.npcs?.length) return null;
  const npcParts = context.npcs.map(npc => {
    if (typeof npc === 'string') return npc;
    if (npc.name) return `${npc.name}${npc.disposition != null ? `: ${npc.disposition}${npc.attitude ? ` (${npc.attitude})` : ''}` : ''}`;
    return JSON.stringify(npc);
  });

  return (
    <div className={styles.dSection}>
      <div className={styles.dSectionTitle}>NPCs Active</div>
      <div className={styles.dNpcLine}>{npcParts.join(' | ')}</div>
    </div>
  );
}

function DesignerContextBudget({ context }) {
  if (!context?.layers) return null;
  const layers = context.layers;
  const parts = ['L1', 'L2', 'L3', 'L4']
    .map(k => `${k}: ${layers[k] ? layers[k].toLocaleString() + ' tok' : '\u2014'}`)
  if (layers.total) parts.push(`Total: ${layers.total.toLocaleString()} tok`);
  const complexity = context.sceneComplexity;

  return (
    <div className={styles.dSection}>
      <div className={styles.dSectionTitle}>Context Budget</div>
      <div className={styles.dContextLine}>
        {parts.join(' | ')}
        {complexity ? ` | Complexity: ${complexity}` : ''}
      </div>
    </div>
  );
}

function DesignerAiCalls({ debug }) {
  const d = debug;
  const breakdown = d.turnCostBreakdown;

  if (breakdown) {
    return (
      <div className={styles.dSection}>
        <div className={styles.dSectionTitle}>AI Calls</div>
        {Object.entries(breakdown).map(([task, cost]) => (
          <div key={task} className={styles.dAiLine}>
            <span className={styles.dAiTask}>{task}</span>: <span className={styles.dAiCost}>{fmtCost(cost)}</span>
          </div>
        ))}
        {d.turnCost != null && (
          <div className={styles.dAiLine} style={{ borderTop: '1px solid #2a2a44', paddingTop: 3, marginTop: 3 }}>
            <span className={styles.dAiTask}>total</span>: <span className={styles.dAiCost}>{fmtCost(d.turnCost)}</span>
          </div>
        )}
      </div>
    );
  }

  // Fallback: single AI call info
  if (d.ai) {
    const tok = d.ai.tokens || {};
    return (
      <div className={styles.dSection}>
        <div className={styles.dSectionTitle}>AI Calls</div>
        <div className={styles.dAiLine}>
          <span className={styles.dAiTask}>{d.ai.task || 'narrative'}</span>: {d.ai.model || '?'} &mdash; <span className={styles.dAiCost}>{fmtCost(d.ai.estimatedCost) || '?'}</span>
          {' '}({(tok.completion || 0).toLocaleString()} tok out{tok.cached ? `, ${tok.cached.toLocaleString()} cached` : ''})
        </div>
      </div>
    );
  }

  return null;
}

// =============================================================================
// Designer View — Turn Card
// =============================================================================

function DesignerTurnCard({ entry, expanded, onToggle }) {
  const d = entry.debug || {};
  const r = d.resolution;
  const turnNum = entry.turnNumber || d.turn;
  const action = parseActionLabel(entry.actionLabel);
  const stat = r ? (r.stat || '?').toUpperCase() : null;
  const tierStr = r ? [r.tierName, r.tier ? `(${r.tier})` : null].filter(Boolean).join(' ') : null;
  const cost = d.turnCost ?? d.ai?.estimatedCost;
  const duration = d.timing?.total || entry.durationMs;
  const durationSec = (duration / 1000).toFixed(1);

  return (
    <div className={styles.turnCard}>
      <div className={styles.turnCardSummary} onClick={onToggle}>
        <span className={styles.turnNum}>Turn {turnNum || '?'}:</span>
        <span className={styles.turnAction}>&ldquo;{action.text}&rdquo;</span>
        {tierStr && <><span className={styles.turnSep}>&mdash;</span><span className={styles.turnOutcome}>{tierStr}</span></>}
        {stat && <><span className={styles.turnSep}>&mdash;</span><span className={styles.turnStat}>{stat}</span></>}
        {cost != null && <><span className={styles.turnSep}>&mdash;</span><span className={styles.turnCost}>{fmtCost(cost)}</span></>}
        <span className={styles.turnSep}>&mdash;</span>
        <span className={styles.turnDuration}>{durationSec}s</span>
        <span className={styles.turnChevron}>{expanded ? '\u25BC' : '\u25B6'}</span>
      </div>
      {expanded && (
        <div className={styles.turnCardDetail}>
          {r && <DesignerResolution resolution={r} />}
          {d.stateChanges && <DesignerStateChanges stateChanges={d.stateChanges} />}
          <DesignerNpcs context={d.context} />
          <DesignerContextBudget context={d.context} />
          <DesignerAiCalls debug={d} />
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Shared — Cost Bar
// =============================================================================

function CostBar({ entries }) {
  // Most recent entry with gameTotalCost
  const gameTotalEntry = entries.find(e => e.debug?.gameTotalCost != null);
  const gameTotalCost = gameTotalEntry?.debug?.gameTotalCost;

  // Most recent POST /action entry for turn cost
  const lastTurnEntry = entries.find(e =>
    e.method === 'POST' && e.url.includes('/action') && e.debug
  );
  const turnCost = lastTurnEntry?.debug?.turnCost ?? lastTurnEntry?.debug?.ai?.estimatedCost;
  const breakdown = lastTurnEntry?.debug?.turnCostBreakdown;

  return (
    <div className={styles.costBar}>
      <div className={styles.costBarLine}>
        <span className={styles.costLabel}>Game Total:</span>
        <span className={styles.costValue}>{gameTotalCost != null ? fmtCost(gameTotalCost) : '\u2014'}</span>
        <span className={styles.costSep}>|</span>
        <span className={styles.costLabel}>Last Turn:</span>
        <span className={styles.costValue}>{turnCost != null ? fmtCost(turnCost) : '\u2014'}</span>
      </div>
      {breakdown && (
        <div className={styles.costBreakdown}>
          ({Object.entries(breakdown).map(([task, taskCost], i) => (
            <span key={task}>{i > 0 && ' \u00B7 '}{task}: {fmtCost(taskCost)}</span>
          ))})
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Main Debug Panel
// =============================================================================

export default function DebugPanel({ entries, onClear }) {
  const [collapsed, setCollapsed] = useState(false);
  const [height, setHeight] = useState(300);
  const [expandedId, setExpandedId] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [view, setView] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('crucible_debug_view') || 'designer';
    }
    return 'designer';
  });
  const panelRef = useRef(null);

  const handleViewChange = (v) => {
    setView(v);
    setExpandedId(null);
    if (typeof window !== 'undefined') localStorage.setItem('crucible_debug_view', v);
  };

  // Drag to resize
  const handleDragStart = useCallback((e) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = height;

    const handleDrag = (moveEvent) => {
      const delta = startY - moveEvent.clientY;
      setHeight(Math.max(100, Math.min(window.innerHeight - 100, startHeight + delta)));
    };

    const handleDragEnd = () => {
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', handleDragEnd);
    };

    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', handleDragEnd);
  }, [height]);

  const handleCopyAll = useCallback(() => {
    try {
      navigator.clipboard.writeText(allEntriesToText(entries)).then(() => {
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 1500);
      });
    } catch { /* clipboard not available */ }
  }, [entries]);

  // Filter turn entries for designer view
  const turnEntries = entries.filter(e =>
    e.method === 'POST' && (e.url.includes('/action') || e.url.includes('/talk-to-gm'))
  );

  return (
    <div
      ref={panelRef}
      className={styles.panel}
      style={{ height: collapsed ? 36 : height }}
    >
      {/* Drag handle (only when expanded) */}
      {!collapsed && (
        <div className={styles.dragHandle} onMouseDown={handleDragStart}>
          <div className={styles.dragGrip} />
        </div>
      )}

      {/* Header bar */}
      <div className={styles.headerBar} onClick={() => setCollapsed(prev => !prev)}>
        <div className={styles.headerLeft}>
          <span className={styles.headerLabel}>
            {collapsed ? '\u25B2' : '\u25BC'} DEBUG
          </span>
          <span className={styles.headerCount}>
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>
        <div className={styles.headerRight}>
          <button
            className={copyFeedback ? styles.headerBtnSuccess : styles.headerBtn}
            onClick={(e) => { e.stopPropagation(); handleCopyAll(); }}
          >
            {copyFeedback ? '\u2713 Copied' : 'Copy All'}
          </button>
          <button
            className={styles.headerBtn}
            onClick={(e) => { e.stopPropagation(); onClear(); }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Panels below header (only when expanded) */}
      {!collapsed && (
        <>
          {/* Sticky cost bar */}
          <CostBar entries={entries} />

          {/* View toggle */}
          <div className={styles.viewToggle}>
            <button
              className={view === 'designer' ? styles.viewTabActive : styles.viewTab}
              onClick={() => handleViewChange('designer')}
            >Designer</button>
            <button
              className={view === 'developer' ? styles.viewTabActive : styles.viewTab}
              onClick={() => handleViewChange('developer')}
            >Developer</button>
          </div>

          {/* Scrollable content */}
          <div className={styles.contentArea}>
            {view === 'designer' ? (
              turnEntries.length === 0 ? (
                <div className={styles.emptyState}>No turns yet. Take an action to see turn data here.</div>
              ) : (
                turnEntries.map(entry => (
                  <DesignerTurnCard
                    key={entry.id}
                    entry={entry}
                    expanded={expandedId === entry.id}
                    onToggle={() => setExpandedId(prev => prev === entry.id ? null : entry.id)}
                  />
                ))
              )
            ) : (
              entries.length === 0 ? (
                <div className={styles.emptyState}>No debug entries yet. API responses with _debug data will appear here.</div>
              ) : (
                entries.map(entry => (
                  <EntryRow
                    key={entry.id}
                    entry={entry}
                    expanded={expandedId === entry.id}
                    onToggle={() => setExpandedId(prev => prev === entry.id ? null : entry.id)}
                  />
                ))
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─��── FILE: app/play/components/EntityPopup.js ────
import { useState, useEffect, useCallback } from 'react';
import * as api from '@/lib/api';
import { renderLinkedText } from '@/lib/renderLinkedText';
import styles from './EntityPopup.module.css';

function getDurabilityColor(dur, max) {
  if (!max) return '#8a94a8';
  const pct = (dur / max) * 100;
  if (pct === 0) return '#8a3a3a';
  if (pct <= 25) return '#e85a5a';
  if (pct <= 50) return '#e8845a';
  if (pct <= 75) return '#e8c45a';
  return '#8aba7a';
}

export default function EntityPopup({ entity, glossaryData, glossaryTerms, notesData, gameId, onClose, onNotesChange, onEntityClick }) {
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Look up entity in glossary
  const entries = glossaryData?.entries || [];
  const match = entries.find(e =>
    (e.term || '').toLowerCase() === (entity.term || '').toLowerCase()
  );

  // Find existing notes for this entity
  const notes = (notesData?.notes || []).filter(n =>
    (n.entityName || '').toLowerCase() === (entity.term || '').toLowerCase() ||
    (n.entityType === entity.type && n.entityId === entity.id)
  );

  // Item durability from entity data (if passed directly)
  const hasDurability = entity.durability != null && entity.maxDurability != null;

  const handleSaveNote = useCallback(async () => {
    const text = noteText.trim();
    if (!text || !gameId || saving) return;

    setSaving(true);
    try {
      const body = {
        entityType: entity.type || 'general',
        text,
      };
      if (entity.id != null) body.entityId = entity.id;
      await api.post(`/api/game/${gameId}/notes`, body);
      setNoteText('');
      onNotesChange?.();
    } catch (err) {
      console.error('Failed to save note:', err);
    } finally {
      setSaving(false);
    }
  }, [noteText, gameId, saving, entity, onNotesChange]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.entityName}>{entity.term || entity.name || 'Unknown'}</span>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">&times;</button>
        </div>

        <div className={styles.body}>
          {match ? (
            <>
              <div className={styles.category}>{match.category}</div>
              <div className={styles.definition}>{renderLinkedText(match.definition, glossaryTerms, onEntityClick)}</div>
            </>
          ) : (
            <div className={styles.notFound}>
              No glossary entry found for this entity.
            </div>
          )}

          {/* Durability bar for items */}
          {hasDurability && (
            <div className={styles.durabilitySection}>
              <div className={styles.durabilityLabel}>Durability</div>
              <div className={styles.durBarTrack}>
                <div
                  className={styles.durBarFill}
                  style={{
                    width: `${entity.maxDurability > 0 ? (entity.durability / entity.maxDurability) * 100 : 0}%`,
                    background: getDurabilityColor(entity.durability, entity.maxDurability),
                  }}
                />
              </div>
              <span className={styles.durValue} style={{ color: getDurabilityColor(entity.durability, entity.maxDurability) }}>
                {entity.durability} / {entity.maxDurability}
              </span>
            </div>
          )}

          {/* Mechanical Properties (for equipment items) */}
          {entity.equipmentCategory && (() => {
            const props = [];
            const cat = entity.equipmentCategory.toLowerCase();
            const qualityVal = entity.quality ?? entity.qualityBonus;

            if (cat === 'weapon') {
              if (entity.damageModifier != null) props.push({ label: 'Damage', value: entity.damageModifier, signed: true });
              if (qualityVal != null) props.push({ label: 'Quality Bonus', value: qualityVal, signed: true });
              if (Array.isArray(entity.tags) && entity.tags.length > 0) props.push({ label: 'Tags', text: entity.tags.join(', ') });
              if (entity.elementTag) props.push({ label: 'Element', text: entity.elementTag, element: true });
            } else if (cat === 'armor') {
              if (entity.armorMitigation != null) props.push({ label: 'Mitigation', value: entity.armorMitigation });
              if (entity.armorType) props.push({ label: 'Type', text: entity.armorType.charAt(0).toUpperCase() + entity.armorType.slice(1) });
              if (qualityVal != null) props.push({ label: 'Quality Bonus', value: qualityVal, signed: true });
            } else if (cat === 'implement') {
              if (entity.channelModifier != null) props.push({ label: 'Channel', value: entity.channelModifier, signed: true });
              if (qualityVal != null) props.push({ label: 'Quality Bonus', value: qualityVal, signed: true });
              if (entity.elementTag) props.push({ label: 'Element', text: entity.elementTag, element: true });
            } else if (cat === 'shield') {
              props.push({ label: 'Defense', value: 1.0, signed: true });
              if (qualityVal != null) props.push({ label: 'Quality Bonus', value: qualityVal, signed: true });
            }

            if (props.length === 0) return null;

            return (
              <div className={styles.propertiesSection}>
                <div className={styles.propertiesLabel}>PROPERTIES</div>
                {props.map((p, i) => (
                  <div key={i} className={styles.propertyRow}>
                    <span className={styles.propertyName}>{p.label}</span>
                    {p.text != null ? (
                      <span className={p.element ? styles.propertyElement : styles.propertyText}>{p.text}</span>
                    ) : (
                      <span className={styles.propertyValue} style={{ color: p.value < 0 ? 'var(--color-danger)' : 'var(--accent-gold)' }}>
                        {p.signed ? (p.value >= 0 ? '+' : '') : ''}{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Player Notes */}
          <div className={styles.notesSection}>
            <div className={styles.notesLabel}>Your Notes</div>

            {notes.length > 0 && (
              <div className={styles.notesList}>
                {notes.map(n => (
                  <div key={n.id} className={styles.existingNote}>{n.text}</div>
                ))}
              </div>
            )}

            <textarea
              className={styles.noteInput}
              placeholder="Add a note..."
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              maxLength={500}
            />
            <button
              className={styles.noteSaveButton}
              onClick={handleSaveNote}
              disabled={saving || !noteText.trim()}
            >
              {saving ? 'Saving...' : 'Save Note'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─��── FILE: app/play/components/GlossaryTab.js ────
import { useState, useMemo } from 'react';
import { renderLinkedText } from '@/lib/renderLinkedText';
import styles from './GlossaryTab.module.css';
import sidebarStyles from './Sidebar.module.css';

const TABS = [
  { id: 'all', label: 'All', match: null },
  { id: 'npc', label: 'People', match: 'npc' },
  { id: 'location', label: 'Places', match: 'location' },
  { id: 'faction', label: 'Factions', match: 'faction' },
  { id: 'item', label: 'Items', match: 'item' },
  { id: 'other', label: 'Other', match: null },
];

const KNOWN_CATEGORIES = new Set(['npc', 'location', 'faction', 'item']);

export default function GlossaryTab({ data, characterData, glossaryTerms, onEntityClick }) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  if (!data) {
    return <div className={sidebarStyles.loadingState}>Loading glossary...</div>;
  }

  const entries = Array.isArray(data.entries) ? data.entries : [];

  // Count per tab for badges
  const counts = useMemo(() => {
    const c = { all: entries.length, npc: 0, location: 0, faction: 0, item: 0, other: 0 };
    entries.forEach(e => {
      const cat = (e.category || '').toLowerCase();
      if (KNOWN_CATEGORIES.has(cat)) c[cat]++;
      else c.other++;
    });
    return c;
  }, [entries]);

  // Filter entries by active tab + search term
  const filtered = useMemo(() => {
    return entries.filter(e => {
      const cat = (e.category || '').toLowerCase();
      if (activeTab === 'all') { /* no category filter */ }
      else if (activeTab === 'other') { if (KNOWN_CATEGORIES.has(cat)) return false; }
      else if (cat !== activeTab) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (e.term || '').toLowerCase().includes(q) ||
             (e.definition || '').toLowerCase().includes(q);
    });
  }, [entries, search, activeTab]);

  if (entries.length === 0) {
    return <div className={sidebarStyles.emptyState}>No glossary entries yet.</div>;
  }

  return (
    <div>
      {/* Category tabs */}
      <div className={styles.tabRow}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab(tab.id)}
            aria-label={`Filter: ${tab.label}`}
          >
            {tab.label}
            {counts[tab.id] > 0 && tab.id !== 'all' && (
              <span className={styles.tabCount}>{counts[tab.id]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        className={styles.searchInput}
        placeholder="Search entries..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        aria-label="Search glossary"
      />

      <div className={styles.resultCount}>{filtered.length} entries</div>

      {filtered.map(entry => (
        <div key={entry.id || entry.term} className={styles.entryCard} onClick={() => {
          const entity = { term: entry.term, type: entry.category, id: entry.id };
          // For items, merge mechanical data from character inventory if available
          if ((entry.category || '').toLowerCase() === 'item' && characterData) {
            const allItems = [...(characterData.inventory?.equipped || []), ...(characterData.inventory?.carried || [])];
            const match = allItems.find(i => i.name === entry.term);
            if (match) Object.assign(entity, match, { term: entry.term, type: 'item' });
          }
          onEntityClick?.(entity);
        }}>
          <div className={styles.entryTerm}>{entry.term}</div>
          <div className={styles.entryMeta}>
            <span className={styles.entryCategory}>{entry.category}</span>
            {entry.discoveredAt && (
              <span className={styles.entryDiscovered}>{entry.discoveredAt}</span>
            )}
          </div>
          <div className={styles.entryDef}>{renderLinkedText(entry.definition, glossaryTerms, onEntityClick)}</div>
        </div>
      ))}

      {filtered.length === 0 && search.trim() && (
        <div className={sidebarStyles.emptyState}>No entries match your search.</div>
      )}
    </div>
  );
}

// ─��── FILE: app/play/components/InlineDicePanel.js ────
import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './InlineDicePanel.module.css';

// ─── MiniD20 SVG (from mockup pattern) ───

function MiniD20({ value, size = 42, glow = 'none', spinning = false, ghostFaces = false, desaturated = false }) {
  const glowColors = { none: 'transparent', gold: '#c9a84c', tarnished: '#8a6a3a', crimson: '#c84a4a' };
  const gc = glowColors[glow] || 'transparent';

  return (
    <div className={spinning ? styles.dieSpinning : undefined} style={{
      width: size, height: size, position: 'relative', display: 'inline-flex',
      filter: desaturated ? 'saturate(0) brightness(0.6)' : undefined,
      transition: 'opacity 0.4s, transform 0.3s',
    }}>
      {glow !== 'none' && (
        <div style={{
          position: 'absolute', inset: -3, borderRadius: '50%',
          boxShadow: `0 0 12px 3px ${gc}44, 0 0 5px 2px ${gc}33`,
          border: `1.5px solid ${gc}`,
        }} />
      )}
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <polygon
          points="50,5 95,35 82,90 18,90 5,35"
          fill={desaturated ? '#2a2520' : '#1a1714'}
          stroke={glow !== 'none' ? gc : '#3a3328'}
          strokeWidth="2.5"
        />
        <line x1="50" y1="5" x2="18" y2="90" stroke="#2a252033" strokeWidth="1" />
        <line x1="50" y1="5" x2="82" y2="90" stroke="#2a252033" strokeWidth="1" />
        <line x1="5" y1="35" x2="82" y2="90" stroke="#2a252033" strokeWidth="1" />
        <line x1="95" y1="35" x2="18" y2="90" stroke="#2a252033" strokeWidth="1" />
        <text
          x="50" y="58" textAnchor="middle" dominantBaseline="middle"
          style={{ fontFamily: "var(--font-jetbrains)" }}
          fontSize={size > 50 ? '28' : size > 35 ? '24' : '18'}
          fontWeight="600"
          fill={
            spinning ? '#5a5040' :
            value === 20 ? '#c9a84c' :
            value === 1 ? '#e85a5a' :
            desaturated ? '#5a5040' :
            '#d0c098'
          }
        >
          {spinning ? '?' : value}
        </text>
        {ghostFaces && !spinning && (
          <>
            <text x="22" y="32" textAnchor="middle" fontSize="9" fill="#3a3328" style={{ fontFamily: "var(--font-jetbrains)", textDecoration: 'line-through' }}>1</text>
            <text x="78" y="32" textAnchor="middle" fontSize="9" fill="#3a3328" style={{ fontFamily: "var(--font-jetbrains)", textDecoration: 'line-through' }}>20</text>
          </>
        )}
      </svg>
    </div>
  );
}

// ─── Category Tag ───

function CategoryTag({ category }) {
  const upper = (category || 'matched').toUpperCase();
  const tagClass = upper === 'OUTMATCHED' ? styles.categoryTagOutmatched
    : upper === 'DOMINANT' ? styles.categoryTagDominant
    : styles.categoryTagMatched;
  const labelClass = upper === 'OUTMATCHED' ? styles.categoryLabelOutmatched
    : upper === 'DOMINANT' ? styles.categoryLabelDominant
    : styles.categoryLabelMatched;
  const icon = upper === 'OUTMATCHED' ? '\u2191' : upper === 'DOMINANT' ? '\u2193' : '\u2014';
  const desc = upper === 'MATCHED' ? '1d20 (full range)'
    : upper === 'OUTMATCHED' ? '2d20 take highest'
    : '2d20 take lowest';

  return (
    <div className={`${styles.categoryTag} ${tagClass}`}>
      <span className={`${styles.categoryLabel} ${labelClass}`}>{upper} {icon}</span>
      <span className={styles.categoryDesc}>{desc}</span>
    </div>
  );
}

// ─── Main Component ───
// resolution fields from API_CONTRACT.md:
//   fortunesBalance: "matched" | "outmatched" | "dominant"
//   crucibleRoll: number | null
//   crucibleExtreme: "nat20" | "nat1" | null
//   diceRolled: number[] (1 elem for matched, 2 for outmatched/dominant)
//   dieSelected: number (the kept value)
//   debtPenalty: number

export default function InlineDicePanel({ resolution, animate = false, onComplete }) {
  if (!resolution) { onComplete?.(); return null; }

  const [phase, setPhase] = useState(animate ? -1 : 99);
  const [extremeFlash, setExtremeFlash] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const panelRef = useRef(null);
  const completedRef = useRef(false);

  const category = (resolution.fortunesBalance || 'matched').toLowerCase();
  const isMatched = category === 'matched';
  const isOutmatched = category === 'outmatched';
  const isDominant = category === 'dominant';
  const hasCC = resolution.crucibleRoll != null;
  const isExtreme = resolution.crucibleExtreme != null;
  const isNat20 = resolution.crucibleExtreme === 'nat20';
  const isNat1 = resolution.crucibleExtreme === 'nat1';
  const diceRolled = Array.isArray(resolution.diceRolled) ? resolution.diceRolled : [];
  const hasMortal = diceRolled.length >= 2 && !isExtreme;

  // Determine kept/discarded for Outmatched/Dominant
  let keptVal = null;
  let discVal = null;
  if (hasMortal && diceRolled.length >= 2) {
    if (isOutmatched) {
      keptVal = Math.max(diceRolled[0], diceRolled[1]);
      discVal = Math.min(diceRolled[0], diceRolled[1]);
    } else if (isDominant) {
      keptVal = Math.min(diceRolled[0], diceRolled[1]);
      discVal = Math.max(diceRolled[0], diceRolled[1]);
    }
  }

  const fireComplete = useCallback(() => {
    if (!completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  }, [onComplete]);

  // Animation phases with timeouts
  // phase -1 = waiting for visibility, 0 = spinning, 1+ = landing phases, 99 = done (no animation)
  const [visible, setVisible] = useState(!animate);

  // Step 1: Wait for IntersectionObserver to confirm visibility (scroll handled by NarrativePanel)
  useEffect(() => {
    if (!animate) {
      setVisible(true);
      return;
    }

    completedRef.current = false;
    setPhase(-1);
    setVisible(false);
    setTransitioning(false);

    const el = panelRef.current;
    if (!el) { setVisible(true); return; }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          setVisible(true);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);

    // Safety fallback: if observer never fires (e.g. element is in a hidden panel), start after 1.5s
    const fallback = setTimeout(() => { observer.disconnect(); setVisible(true); }, 1500);

    return () => { observer.disconnect(); clearTimeout(fallback); };
  }, [resolution.dieSelected, resolution.crucibleRoll, animate]);

  // Step 2: Once visible, run the animation phase sequence
  // After resolved hold, transition the dice panel out before firing onComplete
  useEffect(() => {
    if (!animate || !visible) return;

    const timers = [];
    const t = (fn, d) => timers.push(setTimeout(fn, d));

    // Short pause after becoming visible so the player registers the dice before they spin
    const pause = 200;

    if (isMatched) {
      t(() => setPhase(0), pause);
      t(() => setPhase(1), pause + 800);
      if (isExtreme) {
        t(() => setExtremeFlash(true), pause + 800);
        t(() => setExtremeFlash(false), pause + 1400);
      }
      t(() => setTransitioning(true), pause + 800 + 1000);
      t(() => fireComplete(), pause + 800 + 1000 + 450);
    } else if (hasCC && isExtreme) {
      t(() => setPhase(0), pause);
      t(() => setPhase(1), pause + 800);
      t(() => setExtremeFlash(true), pause + 800);
      t(() => setExtremeFlash(false), pause + 1500);
      t(() => setTransitioning(true), pause + 800 + 1200);
      t(() => fireComplete(), pause + 800 + 1200 + 450);
    } else if (hasCC && hasMortal) {
      t(() => setPhase(0), pause);
      t(() => setPhase(1), pause + 600);
      t(() => setPhase(2), pause + 1000);
      t(() => setPhase(3), pause + 1600);
      t(() => setPhase(4), pause + 2100);
      t(() => setTransitioning(true), pause + 2100 + 1000);
      t(() => fireComplete(), pause + 2100 + 1000 + 450);
    } else {
      t(() => setPhase(0), pause);
      t(() => setPhase(1), pause + 600);
      t(() => setTransitioning(true), pause + 600 + 1000);
      t(() => fireComplete(), pause + 600 + 1000 + 450);
    }

    return () => timers.forEach(clearTimeout);
  }, [visible, animate, fireComplete]);

  // Non-animated: show final state immediately
  useEffect(() => {
    if (!animate) {
      setPhase(99);
      fireComplete();
    }
  }, [animate, fireComplete]);

  // For non-animated (historical) turns, treat any phase >= 1 as "show final state"
  const p = phase === 99 ? 99 : phase;
  const showFinal = p >= 1;
  const showMortalSpin = p >= 2;
  const showMortalLand = p >= 3;
  const showResolved = p >= 4;
  const isSpinning = p === 0 || p === -1;

  // Large dice during animation, compact for historical turns
  const isLarge = animate && !transitioning && phase !== 99;

  // Extreme flash class
  const flashClass = extremeFlash ? (isNat20 ? styles.extremeFlashGold : styles.extremeFlashRed) : '';

  // Panel classes: transition support for animated turns
  const panelClass = [
    styles.dicePanel,
    flashClass,
    animate ? styles.dicePanelAnimated : '',
    transitioning ? styles.dicePanelShrunk : '',
  ].filter(Boolean).join(' ');

  // Dice area classes: larger spacing during animation
  const diceAreaClass = `${styles.diceArea}${isLarge ? ` ${styles.diceAreaAnimated}` : ''}`;

  // ─── Matched: single d20 ───
  if (isMatched) {
    const val = resolution.dieSelected;
    const isRollNat20 = val === 20;
    const isRollNat1 = val === 1;

    return (
      <div ref={panelRef} className={panelClass}>
        <CategoryTag category={category} />
        <div className={diceAreaClass}>
          <MiniD20
            value={val}
            size={isLarge ? 80 : 52}
            spinning={isSpinning}
            glow={showFinal ? (isRollNat20 ? 'gold' : isRollNat1 ? 'crimson' : 'none') : 'none'}
          />
        </div>
        {showFinal && (isRollNat20 || isRollNat1) && (
          <div className={`${styles.extremeCallout} ${isRollNat20 ? styles.extremeNat20 : styles.extremeNat1}`}>
            {isRollNat20 ? 'NATURAL 20' : 'NATURAL 1'}
          </div>
        )}
      </div>
    );
  }

  // ─── Outmatched / Dominant ───

  const keptGlow = isOutmatched ? 'gold' : 'tarnished';
  const discGlow = isDominant ? 'gold' : 'none';

  // Extreme on crucible: no mortal dice, just the crucible
  if (hasCC && isExtreme) {
    return (
      <div ref={panelRef} className={panelClass}>
        <CategoryTag category={category} />
        <div className={diceAreaClass}>
          <MiniD20
            value={resolution.crucibleRoll}
            size={isLarge ? 80 : 52}
            spinning={isSpinning}
            glow={showFinal ? (isNat20 ? 'gold' : 'crimson') : 'none'}
          />
        </div>
        {showFinal && (
          <div className={`${styles.extremeCallout} ${isNat20 ? styles.extremeNat20 : styles.extremeNat1}`}>
            {isNat20 ? 'FATE INTERVENES' : 'FATE STRIKES'}
          </div>
        )}
      </div>
    );
  }

  // Normal Outmatched/Dominant with mortal dice
  return (
    <div ref={panelRef} className={panelClass}>
      <CategoryTag category={category} />
      <div className={diceAreaClass}>
        {/* Left mortal die */}
        {hasMortal && (
          <div style={{
            opacity: !showMortalSpin ? 0.1 : showResolved ? (diceRolled[0] === discVal ? 0.2 : 1) : 1,
            transition: 'opacity 0.4s, transform 0.3s',
            transform: showResolved && diceRolled[0] === keptVal ? 'scale(1.08)' : 'scale(1)',
          }}>
            <MiniD20
              value={diceRolled[0]}
              size={isLarge ? 72 : 42}
              spinning={showMortalSpin && !showMortalLand}
              ghostFaces={showMortalLand}
              glow={showResolved ? (diceRolled[0] === keptVal ? keptGlow : discGlow) : 'none'}
              desaturated={showResolved && diceRolled[0] === discVal && isOutmatched}
            />
          </div>
        )}

        {/* Center crucible die */}
        <div style={{
          opacity: showMortalSpin ? 0.15 : showFinal ? 0.4 : 1,
          transition: 'opacity 0.4s',
        }}>
          <MiniD20
            value={resolution.crucibleRoll}
            size={isLarge ? (showMortalSpin ? 56 : 80) : (showMortalSpin ? 32 : 42)}
            spinning={isSpinning}
          />
          {showFinal && !showMortalSpin && (
            <div className={styles.crucibleLabel}>Crucible: {resolution.crucibleRoll}</div>
          )}
        </div>

        {/* Right mortal die */}
        {hasMortal && (
          <div style={{
            opacity: !showMortalSpin ? 0.1 : showResolved ? (diceRolled[1] === discVal ? 0.2 : 1) : 1,
            transition: 'opacity 0.4s, transform 0.3s',
            transform: showResolved && diceRolled[1] === keptVal ? 'scale(1.08)' : 'scale(1)',
          }}>
            <MiniD20
              value={diceRolled[1]}
              size={isLarge ? 72 : 42}
              spinning={showMortalSpin && !showMortalLand}
              ghostFaces={showMortalLand}
              glow={showResolved ? (diceRolled[1] === keptVal ? keptGlow : discGlow) : 'none'}
              desaturated={showResolved && diceRolled[1] === discVal && isOutmatched}
            />
          </div>
        )}
      </div>

      {/* Mortal dice kept/discarded label */}
      {hasMortal && showResolved && (
        <div className={styles.mortalLabel}>
          Mortal Dice: <span className={styles.mortalKept}>[{keptVal}]</span>{' '}
          <span className={styles.mortalDiscarded}>{discVal}</span>
          {isDominant && <span className={styles.dominantNote}>fortune humbles the expert</span>}
        </div>
      )}

      {/* Debt of Effort indicator */}
      {resolution.debtPenalty > 0 && showResolved && (
        <div style={{ textAlign: 'center', marginTop: 4 }}>
          <span className={styles.debtTag}>
            -{resolution.debtPenalty.toFixed(1)} DEBT
          </span>
        </div>
      )}
    </div>
  );
}

// ─��── FILE: app/play/components/InventoryTab.js ────
import PanelSection from './PanelSection';
import styles from './InventoryTab.module.css';
import sidebarStyles from './Sidebar.module.css';

// Durability color coding per design spec:
// 76%+ green, 51-75% yellow, 26-50% orange, 1-25% red, 0% dark red
function getDurabilityColor(durability, maxDurability) {
  if (!maxDurability || maxDurability === 0) return '#8a94a8';
  const pct = (durability / maxDurability) * 100;
  if (pct === 0) return '#8a3a3a';
  if (pct <= 25) return '#e85a5a';
  if (pct <= 50) return '#e8845a';
  if (pct <= 75) return '#e8c45a';
  return '#8aba7a';
}

function ColumnHeaders({ items }) {
  const hasQuality = items.some(item => item.qualityBonus !== 0 && item.qualityBonus != null);
  return (
    <div className={styles.columnHeaders}>
      <span className={styles.colHeaderSpacer} />
      <div className={styles.colHeaderRight}>
        <span className={styles.colHeader} style={{ width: 40 }} />
        <span className={styles.colHeader} style={{ width: 38 }}>DUR</span>
        {hasQuality && <span className={styles.colHeader} style={{ width: 32 }}>QUAL</span>}
        <span className={styles.colHeader} style={{ width: 28 }}>WT</span>
      </div>
    </div>
  );
}

function ItemRow({ item, isEquipped, onEntityClick }) {
  const durPct = item.maxDurability > 0
    ? (item.durability / item.maxDurability) * 100
    : 100;
  const durColor = getDurabilityColor(item.durability, item.maxDurability);
  const broken = item.durability === 0;

  return (
    <div className={isEquipped ? styles.itemRowEquipped : styles.itemRow} style={{ opacity: broken ? 0.5 : 1, cursor: 'pointer' }} onClick={() => onEntityClick?.({ ...item, term: item.name, type: 'item' })}>
      <div className={styles.itemLeft}>
        {isEquipped && <span className={styles.equippedDot} title="Equipped" />}
        <span className={`${styles.itemName} ${broken ? styles.itemNameBroken : ''}`}>
          {item.name}
        </span>
        {item.heirloom && <span className={styles.heirloomBadge}>heirloom</span>}
        {item.materialQuality && (
          <span className={styles.itemQuality}>{item.materialQuality}</span>
        )}
      </div>
      <div className={styles.itemRight}>
        <div className={styles.durBarTrack}>
          <div
            className={styles.durBarFill}
            style={{ width: `${durPct}%`, background: durColor }}
          />
        </div>
        <span className={styles.itemDurability} style={{ color: durColor }}>
          {item.durability}/{item.maxDurability}
        </span>
        {item.qualityBonus !== 0 && item.qualityBonus != null && (
          <span className={styles.qualityBonus}>
            {item.qualityBonus > 0 ? '+' : ''}{item.qualityBonus.toFixed(1)}
          </span>
        )}
        <span className={styles.itemSlots}>{item.slotCost?.toFixed(1)}</span>
      </div>
    </div>
  );
}

export default function InventoryTab({ data, onEntityClick }) {
  if (!data) {
    return <div className={sidebarStyles.loadingState}>Loading inventory...</div>;
  }

  const inventory = data.inventory;
  if (!inventory) {
    return <div className={sidebarStyles.emptyState}>No inventory data</div>;
  }

  const equipped = Array.isArray(inventory.equipped) ? inventory.equipped : [];
  const carried = Array.isArray(inventory.carried) ? inventory.carried : [];

  return (
    <div>
      {/* Header: slots + encumbrance */}
      <div className={styles.header}>
        <span className={styles.slots}>
          {inventory.usedSlots?.toFixed(1)} / {inventory.maxSlots?.toFixed(1)} slots
        </span>
        {inventory.encumbrance && (
          <span className={styles.encumbrance}>{inventory.encumbrance}</span>
        )}
      </div>

      {/* Currency — display string only, never raw */}
      {inventory.currency?.display && (
        <div className={styles.currency}>{inventory.currency.display}</div>
      )}

      <PanelSection title="Equipped">
        {equipped.length === 0 ? (
          <div className={sidebarStyles.emptyState}>Nothing equipped</div>
        ) : (
          <>
            <ColumnHeaders items={equipped} />
            {equipped.map(item => <ItemRow key={item.id || item.name} item={item} isEquipped onEntityClick={onEntityClick} />)}
          </>
        )}
      </PanelSection>

      <PanelSection title="Carried">
        {carried.length === 0 ? (
          <div className={sidebarStyles.emptyState}>Nothing carried</div>
        ) : (
          <>
            <ColumnHeaders items={carried} />
            {carried.map(item => <ItemRow key={item.id || item.name} item={item} onEntityClick={onEntityClick} />)}
          </>
        )}
      </PanelSection>
    </div>
  );
}

// ─��── FILE: app/play/components/MapTab.js ────
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import * as api from '@/lib/api';
import styles from './MapTab.module.css';
import sidebarStyles from './Sidebar.module.css';

// =============================================================================
// Constants
// =============================================================================

const DANGER_COLORS = {
  safe: '#8aba7a', low: '#8a94a8', moderate: '#e8c45a', high: '#e8845a', extreme: '#e85a5a',
};

const TERRAIN_DASH = {
  road: 'none', trail: '6,4', wilderness: '2,4', mountain: '8,3,2,3',
  water: '10,4', underground: '4,4', urban: 'none',
};

function getDangerColor(level) {
  if (typeof level === 'string') return DANGER_COLORS[level] || '#8a94a8';
  if (level == null || level === 0) return '#8aba7a';
  if (level === 1) return '#8a94a8';
  if (level === 2) return '#e8c45a';
  if (level === 3) return '#e8845a';
  return '#e85a5a';
}

function getDangerLabel(level) {
  if (typeof level === 'string') return level;
  if (level == null || level === 0) return 'safe';
  if (level === 1) return 'low';
  if (level === 2) return 'moderate';
  if (level === 3) return 'high';
  return 'extreme';
}

// =============================================================================
// Force-Directed Layout
// =============================================================================

function computeLayout(locations, routes, width, height) {
  if (!locations.length) return {};
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.30;
  const pos = {};

  locations.forEach((loc, i) => {
    const angle = (i / locations.length) * Math.PI * 2 - Math.PI / 2;
    pos[loc.id] = {
      x: cx + Math.cos(angle) * radius + (Math.random() - 0.5) * 10,
      y: cy + Math.sin(angle) * radius + (Math.random() - 0.5) * 10,
      vx: 0, vy: 0,
    };
  });

  const edges = routes.map(r => ({
    source: r.origin,
    target: r.destination,
    idealLen: Math.max(55, (r.travelDays || 1) * 38 + 45),
  }));

  const iterations = 250;
  const padding = 36;

  for (let iter = 0; iter < iterations; iter++) {
    const alpha = 1 - iter / iterations;
    const repulsion = 3600 * alpha;
    const springK = 0.05;
    const centerPull = 0.01 * alpha;

    for (const id in pos) { pos[id].vx = 0; pos[id].vy = 0; }

    const ids = Object.keys(pos);
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = pos[ids[i]], b = pos[ids[j]];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = repulsion / (dist * dist);
        const fx = (dx / dist) * force, fy = (dy / dist) * force;
        a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
      }
    }

    for (const edge of edges) {
      const a = pos[edge.source], b = pos[edge.target];
      if (!a || !b) continue;
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const displacement = dist - edge.idealLen;
      const force = springK * displacement;
      const fx = (dx / dist) * force, fy = (dy / dist) * force;
      a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
    }

    for (const id in pos) {
      pos[id].vx += (cx - pos[id].x) * centerPull;
      pos[id].vy += (cy - pos[id].y) * centerPull;
    }

    const damping = 0.82;
    for (const id in pos) {
      pos[id].x += pos[id].vx * damping;
      pos[id].y += pos[id].vy * damping;
      pos[id].x = Math.max(padding, Math.min(width - padding, pos[id].x));
      pos[id].y = Math.max(padding, Math.min(height - padding, pos[id].y));
    }
  }

  const result = {};
  for (const id in pos) result[id] = { x: pos[id].x, y: pos[id].y };
  return result;
}

// =============================================================================
// SVG Components
// =============================================================================

function MapRoute({ route, positions, isHovered }) {
  const start = positions[route.origin];
  const end = positions[route.destination];
  if (!start || !end) return null;

  const dangerColor = getDangerColor(route.dangerLevel);
  const dashArray = TERRAIN_DASH[route.terrain] || 'none';
  const mx = (start.x + end.x) / 2;
  const my = (start.y + end.y) / 2;
  const dx = end.x - start.x, dy = end.y - start.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = -dy / len, ny = dx / len;

  return (
    <g>
      <line
        x1={start.x} y1={start.y} x2={end.x} y2={end.y}
        stroke={dangerColor}
        strokeWidth={isHovered ? 2.2 : 1.2}
        strokeDasharray={dashArray}
        opacity={isHovered ? 0.85 : route.known ? 0.35 : 0.15}
        strokeLinecap="round"
        style={{ transition: 'opacity 0.2s, stroke-width 0.2s' }}
      />
      {!route.known && (
        <text x={mx} y={my - 9} textAnchor="middle" fill={dangerColor} fontSize="8"
          style={{ fontFamily: "var(--font-jetbrains)" }} opacity="0.4">?</text>
      )}
      <text
        x={mx + nx * 9} y={my + ny * 9}
        textAnchor="middle" dominantBaseline="central"
        fill={dangerColor} fontSize="8"
        style={{ fontFamily: "var(--font-jetbrains)" }} fontWeight="500"
        opacity={isHovered ? 0.9 : 0.45}
        style={{ transition: 'opacity 0.2s', pointerEvents: 'none' }}
      >
        {route.travelDays}d
      </text>
    </g>
  );
}

function MapNode({ loc, x, y, isHovered, onHover, onLeave, onClick }) {
  const isCurrent = loc.status === 'current';
  const isVisited = loc.status === 'visited';
  const isDiscovered = loc.status === 'discovered';
  const hasKids = loc.hasChildren;
  const nodeSize = isCurrent ? 16 : isVisited ? 12 : 9;
  const fillColor = isCurrent ? '#c9a84c' : isVisited ? '#8a94a8' : 'transparent';
  const strokeColor = isCurrent ? '#ddb84e' : isVisited ? '#5a6a88' : '#3a4a60';
  const labelColor = isCurrent ? '#c9a84c' : isVisited ? '#8a94a8' : '#6b83a3';

  return (
    <g style={{ cursor: 'pointer' }} onMouseEnter={onHover} onMouseLeave={onLeave} onClick={onClick}>
      {isCurrent && (
        <circle cx={x} cy={y} r={14} fill="none" stroke="#c9a84c" strokeWidth="1" opacity="0.2">
          <animate attributeName="r" values="12;16;12" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0.08;0.2" dur="3s" repeatCount="indefinite" />
        </circle>
      )}
      {isHovered && (
        <circle cx={x} cy={y} r={nodeSize / 2 + 6} fill="none" stroke="#c9a84c" strokeWidth="1" opacity="0.3" />
      )}
      {hasKids && !isCurrent && (
        <circle cx={x} cy={y} r={nodeSize / 2 + 3} fill="none"
          stroke={isHovered ? '#c9a84c' : strokeColor}
          strokeWidth="0.8" strokeDasharray="3,2"
          opacity={isHovered ? 0.5 : 0.25} />
      )}
      <circle cx={x} cy={y} r={nodeSize / 2}
        fill={fillColor}
        stroke={isHovered ? '#c9a84c' : strokeColor}
        strokeWidth={isCurrent ? 2 : isDiscovered ? 1.5 : 1}
        strokeDasharray={isDiscovered ? '2,2' : 'none'}
      />
      {isCurrent && <circle cx={x} cy={y} r={2.5} fill="#0a0e1a" />}
      {hasKids && (
        <g transform={`translate(${x + nodeSize / 2 + 3}, ${y - nodeSize / 2 - 3})`}>
          <circle cx="0" cy="0" r="5" fill="#111528" stroke={isHovered ? '#c9a84c' : '#1e2540'} strokeWidth="0.8" />
          <text x="0" y="0.5" textAnchor="middle" dominantBaseline="central"
            fill={isHovered ? '#c9a84c' : '#6b83a3'}
            fontSize="7" style={{ fontFamily: "var(--font-jetbrains)" }} fontWeight="700">+</text>
        </g>
      )}
      <text x={x} y={y + nodeSize / 2 + 13} textAnchor="middle"
        fill={isHovered ? '#c9a84c' : labelColor} fontSize="9.5"
        style={{ fontFamily: "var(--font-alegreya-sans)" }}
        fontWeight={isCurrent ? 700 : isVisited ? 500 : 400}
        style={{ transition: 'fill 0.15s', pointerEvents: 'none' }}
      >
        {loc.name}
      </text>
    </g>
  );
}

// =============================================================================
// Tooltip
// =============================================================================

function Tooltip({ data, type, mousePos }) {
  if (!data) return null;

  const tooltipWidth = 210;
  let tx = mousePos.clientX + 14;
  let ty = mousePos.clientY - 12;
  if (tx + tooltipWidth > window.innerWidth - 10) tx = mousePos.clientX - tooltipWidth - 14;
  if (ty < 10) ty = 10;
  if (ty + 100 > window.innerHeight - 10) ty = window.innerHeight - 120;

  if (type === 'route') {
    const dc = getDangerColor(data.dangerLevel);
    return (
      <div className={styles.tooltip} style={{ left: tx, top: ty, borderColor: `${dc}33` }}>
        <div className={styles.tooltipMeta}>
          <span style={{
            fontFamily: "var(--font-jetbrains)", fontSize: 11,
            color: '#d0c098',
          }}>
            {data.travelDays} day{data.travelDays > 1 ? 's' : ''}
          </span>
          <span className={styles.tooltipBadge} style={{ color: dc, background: `${dc}18` }}>
            {getDangerLabel(data.dangerLevel)}
          </span>
          <span className={styles.tooltipType}>{data.terrain}</span>
        </div>
        {!data.known && (
          <div style={{ fontFamily: "var(--font-alegreya)", fontSize: 9, color: '#e8c45a', fontStyle: 'italic' }}>
            Unconfirmed route
          </div>
        )}
      </div>
    );
  }

  const loc = data;
  const dc = getDangerColor(loc.dangerLevel);

  return (
    <div className={styles.tooltip} style={{ left: tx, top: ty }}>
      <div className={styles.tooltipTitle} style={{ color: loc.status === 'current' ? '#c9a84c' : '#d0c098' }}>
        {loc.name}
      </div>
      <div className={styles.tooltipMeta}>
        <span className={styles.tooltipBadge} style={{ color: dc, background: `${dc}18` }}>
          {getDangerLabel(loc.dangerLevel)}
        </span>
        <span className={styles.tooltipType}>{loc.type}</span>
      </div>
      {loc.controllingFaction && (
        <div style={{ fontSize: 10, fontFamily: "var(--font-alegreya-sans)", color: '#7082a4' }}>
          Controlled by {loc.controllingFaction}
        </div>
      )}
      {loc.hasChildren && <div className={styles.tooltipHint}>Click to explore inside</div>}
    </div>
  );
}

// =============================================================================
// Legend
// =============================================================================

function MapLegend() {
  return (
    <div className={styles.legend}>
      <div className={styles.legendItem}>
        <div className={styles.legendDot} style={{ background: '#c9a84c', border: '1.5px solid #ddb84e' }} />
        <span className={styles.legendLabel}>Current</span>
      </div>
      <div className={styles.legendItem}>
        <div className={styles.legendDot} style={{ background: '#8a94a8', border: '1px solid #5a6a88' }} />
        <span className={styles.legendLabel}>Visited</span>
      </div>
      <div className={styles.legendItem}>
        <div className={styles.legendDot} style={{ background: 'transparent', border: '1.5px dashed #3a4a60' }} />
        <span className={styles.legendLabel}>Known</span>
      </div>
      <div className={styles.legendBreak} />
      {Object.entries(DANGER_COLORS).map(([level, color]) => (
        <div key={level} className={styles.legendItem}>
          <div className={styles.legendLine} style={{ background: color }} />
          <span className={styles.legendLabel} style={{ textTransform: 'capitalize' }}>{level}</span>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Location List
// =============================================================================

function LocationList({ locations, onSelect, onZoom }) {
  const statusOrder = { current: 0, visited: 1, discovered: 2 };
  const sorted = [...locations].sort((a, b) => (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3));

  return (
    <div>
      <div className={styles.locationListHeader}>Known Locations</div>
      {sorted.map(loc => {
        const isCurrent = loc.status === 'current';
        const dc = getDangerColor(loc.dangerLevel);
        const dotBg = isCurrent ? '#c9a84c' : loc.status === 'visited' ? '#8a94a8' : 'transparent';
        const dotBorder = loc.status === 'discovered'
          ? '1px dashed #6b83a3'
          : `1px solid ${isCurrent ? '#c9a84c' : '#5a6a88'}`;

        return (
          <div key={loc.id} className={styles.locationListItem}
            onClick={() => loc.hasChildren ? onZoom(loc.id) : onSelect(loc)}
          >
            <div className={styles.locationListDot} style={{ background: dotBg, border: dotBorder }} />
            <span className={styles.locationListName} style={{
              color: isCurrent ? '#c9a84c' : loc.status === 'visited' ? '#d0c098' : '#6b83a3',
              fontWeight: isCurrent ? 600 : 400,
            }}>
              {loc.name}
            </span>
            <span className={styles.locationListDanger} style={{ color: dc }}>
              {getDangerLabel(loc.dangerLevel)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// =============================================================================
// SVG Icons
// =============================================================================

function ZoomInIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function ZoomOutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function ResetViewIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
    </svg>
  );
}

// =============================================================================
// Main MapTab Component
// =============================================================================

export default function MapTab({ data: initialData, gameId, onEntityClick }) {
  const [mapData, setMapData] = useState(initialData);
  const [currentLevel, setCurrentLevel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredRoute, setHoveredRoute] = useState(null);
  const [mousePos, setMousePos] = useState({ clientX: 0, clientY: 0 });
  const [positions, setPositions] = useState({});
  const [dims, setDims] = useState({ width: 320, height: 450 });
  const containerRef = useRef(null);

  // ─── Viewport zoom / pan state ───
  const [zoom, setZoom] = useState(1.0);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef(null);

  const resetView = useCallback(() => {
    setZoom(1.0);
    setPanX(0);
    setPanY(0);
  }, []);

  // Update from props when at top level
  useEffect(() => {
    if (initialData && !currentLevel) {
      setMapData(initialData);
    }
  }, [initialData, currentLevel]);

  // Measure container width for responsive SVG
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const w = Math.floor(entry.contentRect.width);
        const h = Math.floor(entry.contentRect.height);
        if (w > 0 && h > 0) setDims({ width: w, height: Math.max(h, 450) });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const locations = Array.isArray(mapData?.locations) ? mapData.locations : [];
  const routes = Array.isArray(mapData?.routes) ? mapData.routes : [];

  // Compute layout when data or dimensions change
  useEffect(() => {
    if (locations.length > 0 && dims.width > 0) {
      setPositions(computeLayout(locations, routes, dims.width, dims.height));
    }
  }, [mapData, dims.width, dims.height]);

  // ─── Mouse wheel zoom (non-passive to allow preventDefault) ───
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const step = e.deltaY > 0 ? -0.15 : 0.15;
      const newZoom = Math.max(0.5, Math.min(3.0, zoom + step));
      if (newZoom === zoom) return;

      // Zoom toward cursor position
      const rect = el.getBoundingClientRect();
      const mouseRelX = e.clientX - rect.left;
      const mouseRelY = e.clientY - rect.top;
      const vw = dims.width / zoom;
      const vh = dims.height / zoom;
      const svgX = panX + (mouseRelX / rect.width) * vw;
      const svgY = panY + (mouseRelY / rect.height) * vh;
      const newVw = dims.width / newZoom;
      const newVh = dims.height / newZoom;
      setPanX(svgX - (mouseRelX / rect.width) * newVw);
      setPanY(svgY - (mouseRelY / rect.height) * newVh);
      setZoom(newZoom);
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [zoom, panX, panY, dims]);

  // ─── Click-and-drag to pan ───
  const handleCanvasMouseDown = useCallback((e) => {
    // Only pan when zoomed in past 1x, and only on left button
    if (zoom <= 1.0 || e.button !== 0) return;
    e.preventDefault();
    setDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY, panX, panY };
  }, [zoom, panX, panY]);

  const handleCanvasMouseMove = useCallback((e) => {
    setMousePos({ clientX: e.clientX, clientY: e.clientY });
    if (!dragging || !dragStartRef.current) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const vw = dims.width / zoom;
    const vh = dims.height / zoom;
    setPanX(dragStartRef.current.panX - (dx / rect.width) * vw);
    setPanY(dragStartRef.current.panY - (dy / rect.height) * vh);
  }, [dragging, zoom, dims]);

  const handleCanvasMouseUp = useCallback(() => {
    setDragging(false);
    dragStartRef.current = null;
  }, []);

  // Release drag if mouse leaves the window
  useEffect(() => {
    if (!dragging) return;
    const handleUp = () => { setDragging(false); dragStartRef.current = null; };
    document.addEventListener('mouseup', handleUp);
    return () => document.removeEventListener('mouseup', handleUp);
  }, [dragging]);

  // Navigate to a sub-level or back to top
  const navigateToLevel = useCallback(async (levelId) => {
    if (!gameId) return;
    setLoading(true);
    setHoveredNode(null);
    setHoveredRoute(null);
    resetView();
    try {
      const path = levelId
        ? `/api/game/${gameId}/map?level=${levelId}`
        : `/api/game/${gameId}/map`;
      const data = await api.get(path);
      setMapData(data);
      setCurrentLevel(levelId || null);
    } catch (err) {
      console.error('Failed to load map level:', err);
    } finally {
      setLoading(false);
    }
  }, [gameId, resetView]);

  const handleNodeClick = useCallback((loc) => {
    if (dragging) return; // Don't trigger clicks during drag
    if (loc.hasChildren) {
      navigateToLevel(loc.id);
    } else {
      onEntityClick?.({ term: loc.name, type: 'location', id: loc.id });
    }
  }, [navigateToLevel, onEntityClick, dragging]);

  // Build breadcrumbs from API response or navigation state
  const breadcrumbs = Array.isArray(mapData?.breadcrumbs) ? mapData.breadcrumbs : [];
  const canZoomOut = mapData?.parent != null;
  const zoomInTarget = locations.find(l => l.status === 'current' && l.hasChildren);
  const canZoomIn = !!zoomInTarget;
  const currentLocName = locations.find(l => l.status === 'current')?.name;
  const layoutReady = Object.keys(positions).length === locations.length && locations.length > 0;

  const hoveredLoc = hoveredNode != null ? locations.find(l => l.id === hoveredNode) : null;
  const hoveredRouteObj = hoveredRoute != null ? routes.find(r => r.id === hoveredRoute) : null;

  // Loading/empty states
  if (!mapData) {
    return <div className={sidebarStyles.loadingState}>Loading map...</div>;
  }
  if (locations.length === 0 && !loading) {
    return <div className={sidebarStyles.emptyState}>No locations discovered yet.</div>;
  }

  return (
    <div className={styles.container}>
      {/* Current location */}
      {currentLocName && (
        <div className={styles.currentLocation}>
          Current: <span className={styles.currentLocationName}>{currentLocName}</span>
        </div>
      )}

      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className={styles.breadcrumbs}>
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.id ?? i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {i > 0 && <span className={styles.breadcrumbSep}><ChevronIcon /></span>}
              <button
                className={styles.breadcrumbItem}
                onClick={() => navigateToLevel(crumb.id || null)}
              >
                {crumb.name || crumb.label}
              </button>
            </span>
          ))}
          {mapData.label && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className={styles.breadcrumbSep}><ChevronIcon /></span>
              <span className={styles.breadcrumbCurrent}>{mapData.label}</span>
            </span>
          )}
        </div>
      )}

      {/* Map canvas */}
      <div
        ref={containerRef}
        className={
          dragging ? styles.mapCanvasGrabbing
            : zoom > 1.0 ? styles.mapCanvasGrab
            : styles.mapCanvas
        }
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
      >
        {loading && <div className={styles.loadingOverlay}>Loading...</div>}
        {layoutReady && !loading && (
          <svg
            className={styles.mapSvg}
            viewBox={`${panX} ${panY} ${dims.width / zoom} ${dims.height / zoom}`}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Grid lines */}
            {[0.2, 0.4, 0.6, 0.8].map(pct => (
              <g key={pct}>
                <line x1={dims.width * pct} y1={0} x2={dims.width * pct} y2={dims.height}
                  stroke="#d0c098" strokeWidth="0.3" opacity="0.04" />
                <line x1={0} y1={dims.height * pct} x2={dims.width} y2={dims.height * pct}
                  stroke="#d0c098" strokeWidth="0.3" opacity="0.04" />
              </g>
            ))}

            {/* Routes (hit area + visible line) */}
            {routes.map(route => (
              <g key={route.id}
                onMouseEnter={() => { if (!dragging) setHoveredRoute(route.id); }}
                onMouseLeave={() => setHoveredRoute(null)}
                style={{ cursor: dragging ? undefined : 'pointer' }}
              >
                <line
                  x1={positions[route.origin]?.x} y1={positions[route.origin]?.y}
                  x2={positions[route.destination]?.x} y2={positions[route.destination]?.y}
                  stroke="transparent" strokeWidth="12"
                />
                <MapRoute route={route} positions={positions} isHovered={hoveredRoute === route.id} />
              </g>
            ))}

            {/* Nodes */}
            {locations.map(loc => (
              <MapNode key={loc.id} loc={loc}
                x={positions[loc.id]?.x || 0} y={positions[loc.id]?.y || 0}
                isHovered={hoveredNode === loc.id}
                onHover={() => { if (!dragging) { setHoveredNode(loc.id); setHoveredRoute(null); } }}
                onLeave={() => setHoveredNode(null)}
                onClick={() => handleNodeClick(loc)}
              />
            ))}
          </svg>
        )}

        {/* Zoom controls */}
        <div className={styles.zoomControls}>
          <button
            className={styles.zoomBtn}
            onClick={() => { if (canZoomIn) navigateToLevel(zoomInTarget.id); }}
            disabled={!canZoomIn}
            title="Drill into location"
          >
            <ZoomInIcon />
          </button>
          <button
            className={styles.zoomBtn}
            onClick={() => { if (canZoomOut) navigateToLevel(mapData.parent); }}
            disabled={!canZoomOut}
            title="Zoom out to parent"
          >
            <ZoomOutIcon />
          </button>
          <button
            className={styles.zoomBtn}
            onClick={resetView}
            disabled={zoom === 1.0 && panX === 0 && panY === 0}
            title="Reset view"
          >
            <ResetViewIcon />
          </button>
        </div>

        {/* Level label + zoom indicator */}
        <div className={styles.levelLabel}>
          {mapData.label}
          {zoom !== 1.0 && (
            <span style={{ marginLeft: 8, fontFamily: "var(--font-jetbrains)" }}>
              {zoom.toFixed(1)}x
            </span>
          )}
        </div>
      </div>

      {/* Legend */}
      <MapLegend />

      {/* Location list */}
      <LocationList
        locations={locations}
        onSelect={(loc) => onEntityClick?.({ term: loc.name, type: 'location', id: loc.id })}
        onZoom={navigateToLevel}
      />

      {/* Tooltip (fixed position, escapes sidebar) */}
      {(hoveredLoc || hoveredRouteObj) && (
        <Tooltip
          data={hoveredLoc || hoveredRouteObj}
          type={hoveredRouteObj ? 'route' : 'location'}
          mousePos={mousePos}
        />
      )}
    </div>
  );
}

// ─��── FILE: app/play/components/NarrativePanel.js ────
import { useRef, useEffect, forwardRef } from 'react';
import TurnBlock from './TurnBlock';
import TalkToGM from './TalkToGM';
import { renderLinkedText } from '@/lib/renderLinkedText';
import styles from './NarrativePanel.module.css';

// Small compass icon for GM aside header
function AsideCompassIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.2" />
      <polygon points="9,3 10.5,8 9,7 7.5,8" fill="currentColor" />
      <polygon points="9,15 10.5,10 9,11 7.5,10" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

const NarrativePanel = forwardRef(function NarrativePanel({
  turns, sessionRecap, worldBriefing, gameId, onTurnResponse,
  lastResolution, lastStateChanges, onMetaResponse,
  glossaryTerms, onEntityClick,
}, ref) {
  const newTurnRef = useRef(null);
  const bottomRef = useRef(null);
  const scrollRef = useRef(null);
  const recapShownRef = useRef(false);

  // Auto-scroll: first turn of new game → top; subsequent new turns → turn header; saved game load → bottom
  useEffect(() => {
    if (turns.length === 0) return;
    const lastTurn = turns[turns.length - 1];
    if (lastTurn._isNew && turns.length === 1) {
      // New game: first turn just arrived — scroll to top so player sees prologue
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    } else if (lastTurn._isNew && newTurnRef.current) {
      requestAnimationFrame(() => {
        newTurnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } else {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [turns.length]);

  return (
    <div className={styles.narrativeWrapper}>
      <div className={styles.narrativeScroll} ref={(el) => { scrollRef.current = el; if (typeof ref === 'function') ref(el); else if (ref) ref.current = el; }}>
        <div className={styles.narrativeInner}>
          {worldBriefing && (
            <div className={styles.worldBriefing}>
              <div className={styles.briefingLabel}>Prologue</div>
              <div className={styles.briefingText}>{renderLinkedText(worldBriefing, glossaryTerms, onEntityClick)}</div>
            </div>
          )}

          {turns.length === 0 && (
            <div className={styles.emptyState}>Starting your adventure...</div>
          )}

          {turns.map((turn, i) => {
            const isLast = i === turns.length - 1;
            const isNew = !!turn._isNew;

            // GM aside entries (non-turn)
            if (turn.type === 'gm_aside') {
              return (
                <div key={`aside-${turn.timestamp ?? i}`} className={styles.gmAside}>
                  <div className={styles.gmAsideHeader}>
                    <AsideCompassIcon />
                    <span className={styles.gmAsideLabel}>GM</span>
                  </div>
                  <div className={styles.gmAsideBody}>{renderLinkedText(turn.content, glossaryTerms, onEntityClick)}</div>
                </div>
              );
            }

            // Show recap card only once per session — above the first turn rendered on load
            const showRecap = isLast && sessionRecap && !recapShownRef.current && !isNew;
            if (showRecap) recapShownRef.current = true;

            return (
              <div key={turn.number ?? i}>
                {showRecap && (
                  <div className={styles.sessionRecap}>
                    <div className={styles.recapHeader}>PREVIOUSLY...</div>
                    <div className={styles.recapText}>{renderLinkedText(sessionRecap, glossaryTerms, onEntityClick)}</div>
                  </div>
                )}
                <TurnBlock
                  turn={turn}
                  isNew={isNew}
                  glossaryTerms={glossaryTerms}
                  onEntityClick={onEntityClick}
                  ref={isLast && isNew ? newTurnRef : undefined}
                />
              </div>
            );
          })}

          <div ref={bottomRef} />
        </div>
      </div>

      <TalkToGM
        gameId={gameId}
        onTurnResponse={onTurnResponse}
        lastResolution={lastResolution}
        lastStateChanges={lastStateChanges}
        onMetaResponse={onMetaResponse}
        glossaryTerms={glossaryTerms}
        onEntityClick={onEntityClick}
      />
    </div>
  );
});

export default NarrativePanel;

// ─��── FILE: app/play/components/NotesTab.js ────
import { useState, useCallback } from 'react';
import * as api from '@/lib/api';
import styles from './NotesTab.module.css';
import sidebarStyles from './Sidebar.module.css';

const ENTITY_TYPES = [
  { value: 'general', label: 'General' },
  { value: 'npc', label: 'NPC' },
  { value: 'location', label: 'Location' },
  { value: 'faction', label: 'Faction' },
  { value: 'item', label: 'Item' },
  { value: 'quest', label: 'Quest' },
];

export default function NotesTab({ data, gameId, onNotesChange }) {
  const [entityType, setEntityType] = useState('general');
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [formError, setFormError] = useState(null);

  const handleAdd = useCallback(async () => {
    const text = noteText.trim();
    if (!text || !gameId) return;

    setSaving(true);
    setFormError(null);

    try {
      await api.post(`/api/game/${gameId}/notes`, {
        entityType,
        text,
      });
      setNoteText('');
      onNotesChange?.();
    } catch (err) {
      console.error('Failed to create note:', err);
      setFormError(err.message || 'Failed to save note.');
    } finally {
      setSaving(false);
    }
  }, [gameId, entityType, noteText, onNotesChange]);

  const handleDelete = useCallback(async (noteId) => {
    if (!gameId) return;
    setDeleting(noteId);

    try {
      await api.del(`/api/game/${gameId}/notes/${noteId}`);
      onNotesChange?.();
    } catch (err) {
      console.error('Failed to delete note:', err);
    } finally {
      setDeleting(null);
    }
  }, [gameId, onNotesChange]);

  if (!data) {
    return <div className={sidebarStyles.loadingState}>Loading notes...</div>;
  }

  const notes = Array.isArray(data.notes) ? data.notes : [];

  return (
    <div>
      {notes.length === 0 ? (
        <div className={sidebarStyles.emptyState}>No notes yet. Add one below.</div>
      ) : (
        notes.map(note => (
          <div key={note.id} className={styles.noteCard}>
            <div className={styles.noteHeader}>
              <span className={styles.noteEntity}>
                {note.entityName || note.entityType}
              </span>
              <span className={styles.noteType}>{note.entityType}</span>
            </div>
            <div className={styles.noteText}>{note.text}</div>
            <div className={styles.noteFooter}>
              <span className={styles.noteDate}>
                {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : ''}
              </span>
              <button
                className={styles.deleteButton}
                onClick={() => handleDelete(note.id)}
                disabled={deleting === note.id}
                aria-label={`Delete note about ${note.entityName || note.entityType}`}
              >
                {deleting === note.id ? '...' : 'Delete'}
              </button>
            </div>
          </div>
        ))
      )}

      {/* Add Note Form */}
      <div className={styles.addForm}>
        <span className={styles.formLabel}>Add Note</span>
        <div className={styles.formRow}>
          <select
            className={styles.entityTypeSelect}
            value={entityType}
            onChange={e => setEntityType(e.target.value)}
            aria-label="Note category"
          >
            {ENTITY_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <textarea
          className={styles.noteInput}
          placeholder="Write a note..."
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
          maxLength={500}
          aria-label="Note text"
        />
        <div style={{ marginTop: '8px' }}>
          <button
            className={styles.addButton}
            onClick={handleAdd}
            disabled={saving || !noteText.trim()}
          >
            {saving ? 'Saving...' : 'Save Note'}
          </button>
        </div>
        {formError && <div className={styles.formError}>{formError}</div>}
      </div>
    </div>
  );
}

// ─��── FILE: app/play/components/NPCTab.js ────
import { renderLinkedText } from '@/lib/renderLinkedText';
import styles from './NPCTab.module.css';
import sidebarStyles from './Sidebar.module.css';

export default function NPCTab({ glossaryData, glossaryTerms, onEntityClick }) {
  if (!glossaryData) {
    return <div className={sidebarStyles.loadingState}>Loading...</div>;
  }

  const entries = Array.isArray(glossaryData.entries) ? glossaryData.entries : [];
  // Filter glossary entries for NPC-category items (case-insensitive)
  const npcs = entries.filter(e =>
    (e.category || '').toLowerCase() === 'npc'
  );

  if (npcs.length === 0) {
    return <div className={sidebarStyles.emptyState}>No NPCs encountered yet.</div>;
  }

  return (
    <div>
      {npcs.map(npc => (
        <div key={npc.id || npc.term} className={styles.npcCard} onClick={() => onEntityClick?.({ term: npc.term, type: 'npc', id: npc.id })} style={{ cursor: 'pointer' }}>
          <div className={styles.npcHeader}>
            <span className={styles.npcName}>{npc.term}</span>
            <span className={styles.npcCategory}>NPC</span>
          </div>
          <div className={styles.npcDefinition}>{renderLinkedText(npc.definition, glossaryTerms, onEntityClick)}</div>
          {npc.discoveredAt && (
            <div className={styles.npcDiscovered}>Discovered: {npc.discoveredAt}</div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─��── FILE: app/play/components/PanelSection.js ────
import { useState } from 'react';
import styles from './PanelSection.module.css';

export default function PanelSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={styles.section}>
      <button className={styles.header} onClick={() => setOpen(!open)}>
        <span className={styles.title}>{title}</span>
        <span className={`${styles.arrow} ${open ? styles.arrowOpen : ''}`}>{'\u25BC'}</span>
      </button>
      {open && <div className={styles.content}>{children}</div>}
    </div>
  );
}

// ─��── FILE: app/play/components/ReflectionBlock.js ────
import styles from './ReflectionBlock.module.css';
import { renderNarrative } from '@/lib/renderLinkedText';

function gainTypeIcon(type) {
  if (type === 'stat') return '\u25B2';       // ▲
  if (type === 'spell_pattern') return '\u2726'; // ✦
  return '\u25CF';                               // ● (skill default)
}

function gainTypeClass(type) {
  if (type === 'stat') return styles.gainStat;
  if (type === 'spell_pattern') return styles.gainSpell;
  return styles.gainSkill;
}

export default function ReflectionBlock({ reflection, glossaryTerms, onEntityClick }) {
  if (!reflection) return null;

  // Blocked state — starvation prevents reflection
  if (reflection.blocked) {
    return (
      <div className={styles.reflectionBlock}>
        <div className={styles.header}>
          <span className={styles.headerIcon}>{'\u2726'}</span>
          <span className={styles.headerLabel}>Reflection</span>
        </div>
        <p className={styles.blockedText}>
          Your body aches for rest, but hunger gnaws too deeply for real recovery.
        </p>
      </div>
    );
  }

  // No narrative — nothing to show
  if (!reflection.narrative) return null;

  const gains = Array.isArray(reflection.gains) ? reflection.gains : [];
  const overflow = Array.isArray(reflection.overflow) ? reflection.overflow : [];
  const questBonuses = Array.isArray(reflection.questBonuses) ? reflection.questBonuses : [];
  const hasGains = gains.length > 0;

  return (
    <div className={styles.reflectionBlock}>
      <div className={styles.header}>
        <span className={styles.headerIcon}>{'\u2726'}</span>
        <span className={styles.headerLabel}>Reflection</span>
      </div>

      <div className={styles.narrative}>
        {renderNarrative(reflection.narrative, glossaryTerms, onEntityClick)}
      </div>

      {questBonuses.length > 0 && (
        <div className={styles.questBonuses}>
          {questBonuses.map((qb, i) => (
            <div key={i} className={styles.questLine}>
              {qb.questTitle} completed
              {qb.skillTarget && ` \u2014 ${qb.skillTarget} ${qb.skillBonus}`}
              {qb.statTarget && `, ${qb.statTarget} ${qb.statBonus}`}
            </div>
          ))}
        </div>
      )}

      {hasGains && (
        <div className={styles.gainsTable}>
          {gains.map((g, i) => (
            <div key={i} className={styles.gainRow}>
              <span className={styles.gainName}>
                <span className={`${styles.gainIcon} ${gainTypeClass(g.type)}`}>{gainTypeIcon(g.type)}</span>
                {g.name}
              </span>
              <span className={styles.gainAmount}>{g.displayAmount}</span>
            </div>
          ))}
        </div>
      )}

      {overflow.length > 0 && (
        <div className={styles.overflowLine}>
          Overflow: {overflow.map(o => `${o.name} ${o.displayAmount}`).join(', ')} — carried to next Reflection
        </div>
      )}
    </div>
  );
}

// ─��── FILE: app/play/components/ReportModal.js ────
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
                fontFamily: "var(--font-jetbrains)", fontSize: 11, color: C.secondary,
                textAlign: 'right', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {String(val)}
              </span>
            </div>
          ))}
          {mode === 'bug' && (
            <div style={{ fontFamily: "var(--font-alegreya)", fontSize: 11, color: C.dim, fontStyle: 'italic', marginTop: 8 }}>
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

// ─��── FILE: app/play/components/ResolutionBlock.js ────
import { useState } from 'react';
import styles from './ResolutionBlock.module.css';

function fmt(n) {
  if (n == null) return '?';
  return typeof n === 'number' ? n.toFixed(1) : String(n);
}

export default function ResolutionBlock({ resolution }) {
  const [expanded, setExpanded] = useState(false);

  if (!resolution) return null;

  const stat = (resolution.stat || '').toUpperCase();
  const skill = resolution.skillUsed || null;
  const modifier = resolution.skillModifier;
  const isSuccess = resolution.margin >= 0;
  const marginSign = resolution.margin > 0 ? '+' : '';
  const balance = (resolution.fortunesBalance || 'matched');
  const balanceDisplay = balance.charAt(0).toUpperCase() + balance.slice(1);

  return (
    <div className={styles.resolutionBlock}>
      {/* Compressed summary — click to toggle */}
      <div
        className={styles.compressed}
        onClick={() => setExpanded(prev => !prev)}
        style={expanded ? { borderRadius: '6px 6px 0 0' } : undefined}
      >
        <div className={styles.summaryText}>
          <span className={styles.summaryAction}>{resolution.action ? resolution.action.split(':').pop().trim() : 'Action'}</span>
          <span className={styles.summaryDivider}>{' | '}</span>
          <span className={styles.summaryStat}>{stat} {fmt(resolution.total != null ? resolution.total - (resolution.dieSelected || 0) - (modifier || 0) : null)}</span>
          {skill && <span>{` + ${skill} ${fmt(modifier)}`}</span>}
          <span className={styles.summaryDice}>{` + d20(${resolution.dieSelected})`}</span>
          <span className={styles.summaryCalc}>{` = ${fmt(resolution.total)} vs DC ${fmt(resolution.dc)}`}</span>
          <span className={styles.summaryDivider}>{' | '}</span>
          <span className={isSuccess ? styles.summarySuccess : styles.summaryFailure}>
            {marginSign}{fmt(resolution.margin)}: {resolution.tierName}
          </span>
        </div>
        <button
          className={styles.toggleButton}
          onClick={(e) => { e.stopPropagation(); setExpanded(prev => !prev); }}
          title="Roll breakdown"
          aria-label={expanded ? 'Hide roll details' : 'Show roll details'}
        >
          ?
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className={styles.expanded}>
          <div className={styles.detailGrid}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Action:</span>
              <span className={styles.detailValue}>{resolution.action || 'Unknown'}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Stat:</span>
              <span className={styles.detailValue}>{stat}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Skill:</span>
              <span className={styles.detailValue}>
                {skill ? `${skill} (+${fmt(modifier)})` : 'None'}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Equipment:</span>
              <span className={styles.detailValueNum}>
                {resolution.equipmentQuality != null ? `${resolution.equipmentQuality > 0 ? '+' : ''}${fmt(resolution.equipmentQuality)}` : 'None'}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Fortune:</span>
              <span className={styles.detailValue}>{balanceDisplay}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Crucible Roll:</span>
              <span className={styles.detailValueNum}>
                {resolution.crucibleRoll != null
                  ? `d20(${resolution.crucibleRoll})${resolution.crucibleExtreme ? ` \u2014 ${resolution.crucibleExtreme === 'nat20' ? 'Natural 20!' : 'Natural 1'}` : ''}`
                  : 'N/A'
                }
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>d20 Roll:</span>
              <span className={styles.detailValueNum}>{resolution.dieSelected}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>DC:</span>
              <span className={styles.detailValueNum}>{fmt(resolution.dc)}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Total:</span>
              <span className={styles.detailValueNum}>{fmt(resolution.total)}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Result:</span>
              <span className={isSuccess ? styles.summarySuccess : styles.summaryFailure}>
                {marginSign}{fmt(resolution.margin)}: {resolution.tierName} ({resolution.tier})
              </span>
            </div>
            {resolution.debtPenalty > 0 && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Debt:</span>
                <span className={styles.detailDebt}>-{fmt(resolution.debtPenalty)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─��── FILE: app/play/components/SettingsModal.js ────
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import * as api from '@/lib/api';
import styles from './SettingsModal.module.css';

// =============================================================================
// Exports used by page.js — do not remove
// =============================================================================

export const THEMES = {
  dark: {
    '--bg-main': '#0a0e1a', '--bg-panel': '#0d1120', '--bg-card': '#111528',
    '--bg-input': '#0a0e1a', '--bg-resolution': '#0e1420',
    '--text-primary': '#c8c0b0', '--text-heading': '#d0c098', '--text-narrative': '#d4c4a0',
    '--text-secondary': '#8a94a8', '--text-secondary-bright': '#8a9ab8',
    '--text-stat-bright': '#b0b8cc', '--text-muted': '#7082a4', '--text-dim': '#6b83a3',
    '--accent-gold': '#c9a84c', '--accent-bright': '#ddb84e',
    '--color-danger': '#e8845a', '--color-success': '#8aba7a',
    '--border-primary': '#1e2540', '--border-light': '#161c34', '--border-card': '#3a3328',
    '--border-card-hover': '#564b2e', '--border-card-separator': '#2a2622',
    '--brown-muted': '#948373', '--brown-dim': '#948270', '--brown-gold': '#907f5e',
    '--border-gold-faint': '#16181e', '--bg-gold-faint': '#0e111b',
    '--resolution-label': '#738660', '--resolution-dim': '#668954',
  },
  light: {
    '--bg-main': '#f8f4ec', '--bg-panel': '#f0ebe0', '--bg-card': '#ffffff',
    '--bg-input': '#f0ebe0', '--bg-resolution': '#eef4e8',
    '--text-primary': '#4a4030', '--text-heading': '#3a2a15', '--text-narrative': '#4a3a20',
    '--text-secondary': '#7a6a55', '--text-secondary-bright': '#6a5a45',
    '--text-stat-bright': '#5a4a35', '--text-muted': '#9a8a70', '--text-dim': '#b8a888',
    '--accent-gold': '#8a6a1a', '--accent-bright': '#7a5a10',
    '--color-danger': '#b04525', '--color-success': '#3a7a2a',
    '--border-primary': '#d4cbb8', '--border-light': '#e0d8c8', '--border-card': '#c8bba8',
    '--border-card-hover': '#b0a490', '--border-card-separator': '#d8d0c0',
    '--brown-muted': '#8a7a65', '--brown-dim': '#9a8a70', '--brown-gold': '#7a6a4a',
    '--border-gold-faint': '#d8d0c0', '--bg-gold-faint': '#f4f0e8',
    '--resolution-label': '#5a7a4a', '--resolution-dim': '#4a6a3a',
  },
  sepia: {
    '--bg-main': '#2a2218', '--bg-panel': '#241e14', '--bg-card': '#302820',
    '--bg-input': '#241e14', '--bg-resolution': '#1e2418',
    '--text-primary': '#d8c8a0', '--text-heading': '#f0dca8', '--text-narrative': '#dcd0a8',
    '--text-secondary': '#b0986a', '--text-secondary-bright': '#c0a878',
    '--text-stat-bright': '#d0b880', '--text-muted': '#8a7850', '--text-dim': '#6a5840',
    '--accent-gold': '#e0a840', '--accent-bright': '#d09830',
    '--color-danger': '#e09050', '--color-success': '#90b060',
    '--border-primary': '#4a3a28', '--border-light': '#3a3020', '--border-card': '#5a4830',
    '--border-card-hover': '#6a5838', '--border-card-separator': '#4a3a28',
    '--brown-muted': '#a08a60', '--brown-dim': '#8a7850', '--brown-gold': '#b09040',
    '--border-gold-faint': '#3a3020', '--bg-gold-faint': '#282018',
    '--resolution-label': '#7a9050', '--resolution-dim': '#6a8040',
  },
};

export const FONTS = [
  { id: 'alegreya', label: 'Alegreya', family: "'Alegreya Sans', sans-serif" },
  { id: 'lexie', label: 'Lexie Readable', family: "'Lexie Readable', sans-serif" },
];

export const SIZES = [
  { id: 'small', label: 'Small', narrative: '13px', ui: '11px' },
  { id: 'medium', label: 'Medium', narrative: '15px', ui: '12.5px' },
  { id: 'large', label: 'Large', narrative: '17px', ui: '14px' },
  { id: 'xlarge', label: 'X-Large', narrative: '19px', ui: '15px' },
];

// =============================================================================
// Constants
// =============================================================================

const STORYTELLERS = [
  { id: 'Chronicler', name: 'Chronicler', oneLiner: 'The world as it is.' },
  { id: 'Bard', name: 'Bard', oneLiner: 'Every moment a legend in the making.' },
  { id: 'Trickster', name: 'Trickster', oneLiner: 'The world has a sense of humor.' },
  { id: 'Poet', name: 'Poet', oneLiner: 'Beauty in the breaking.' },
  { id: 'Whisper', name: 'Whisper', oneLiner: 'Everything is fine. Almost.' },
  { id: 'Noir', name: 'Noir', oneLiner: 'The city always wins.' },
  { id: 'Custom', name: 'Custom', oneLiner: 'Your voice, your rules.' },
];

const DIFFICULTY_PRESETS = [
  { id: 'forgiving', label: 'Forgiving', color: '#7aba7a', bg: '#142018', dcOffset: -2, fateDc: 8, survivalEnabled: false, durabilityEnabled: false, progressionSpeed: 100, encounterPressure: 'low', fortunesBalanceEnabled: true, simplifiedOutcomes: false },
  { id: 'standard', label: 'Standard', color: '#8a94a8', bg: '#161a20', dcOffset: 0, fateDc: 12, survivalEnabled: true, durabilityEnabled: true, progressionSpeed: 100, encounterPressure: 'standard', fortunesBalanceEnabled: true, simplifiedOutcomes: false },
  { id: 'harsh', label: 'Harsh', color: '#e8c45a', bg: '#1e1a12', dcOffset: 2, fateDc: 16, survivalEnabled: true, durabilityEnabled: true, progressionSpeed: 100, encounterPressure: 'high', fortunesBalanceEnabled: true, simplifiedOutcomes: false },
  { id: 'brutal', label: 'Brutal', color: '#e85a5a', bg: '#201416', dcOffset: 4, fateDc: 18, survivalEnabled: true, durabilityEnabled: true, progressionSpeed: 100, encounterPressure: 'high', fortunesBalanceEnabled: true, simplifiedOutcomes: false },
];

// =============================================================================
// Shared Sub-Components
// =============================================================================

function SectionLabel({ children, extra }) {
  return (
    <div style={{
      fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 600,
      color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase',
      marginBottom: 10, marginTop: 20, display: 'flex', alignItems: 'center',
    }}>
      {children}
      {extra}
    </div>
  );
}

function Toggle({ label, value, onChange, description, disabled }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 0', borderBottom: '1px solid #161c34',
      opacity: disabled ? 0.5 : 1,
    }}>
      <div>
        <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 14, color: '#c8c0b0' }}>{label}</div>
        {description && (
          <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 12, color: '#6b83a3', marginTop: 2 }}>{description}</div>
        )}
      </div>
      <button onClick={() => !disabled && onChange(!value)} style={{
        width: 44, height: 24, borderRadius: 12, cursor: disabled ? 'default' : 'pointer',
        background: value ? '#c9a84c' : '#111528',
        border: `1px solid ${value ? '#c9a84c' : '#1e2540'}`,
        position: 'relative', transition: 'all 0.2s', flexShrink: 0, marginLeft: 12,
      }}>
        <div style={{
          width: 18, height: 18, borderRadius: '50%',
          background: value ? '#0a0e1a' : '#8a94a8',
          position: 'absolute', top: 2,
          left: value ? 22 : 2,
          transition: 'left 0.2s, background 0.2s',
        }} />
      </button>
    </div>
  );
}

function SliderControl({ label, value, min, max, step, format, onChange, description, warning }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid #161c34' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <div>
          <span style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 14, color: '#c8c0b0' }}>{label}</span>
          {description && (
            <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 12, color: '#6b83a3', marginTop: 2 }}>{description}</div>
          )}
        </div>
        <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 14, fontWeight: 500, color: '#c9a84c', flexShrink: 0 }}>
          {format ? format(value) : value}
        </span>
      </div>
      <div style={{ position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 4, borderRadius: 2,
          background: '#111528', border: '1px solid #161c34',
        }} />
        <div style={{
          position: 'absolute', left: 0, height: 4, borderRadius: 2,
          width: `${pct}%`, background: warning ? '#e8845a' : '#c9a84c', opacity: 0.6,
          transition: 'width 0.15s',
        }} />
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value))} />
      </div>
      {warning && (
        <div style={{ fontFamily: "var(--font-alegreya)", fontSize: 11, color: '#e8845a', marginTop: 4, fontStyle: 'italic' }}>
          {warning}
        </div>
      )}
    </div>
  );
}

function SelectorRow({ label, options, value, onChange, description }) {
  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid #161c34' }}>
      <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 14, color: '#c8c0b0', marginBottom: 6 }}>{label}</div>
      {description && (
        <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 12, color: '#6b83a3', marginBottom: 8 }}>{description}</div>
      )}
      <div style={{ display: 'flex', gap: 4 }}>
        {options.map(opt => (
          <button key={opt.id} onClick={() => onChange(opt.id)} style={{
            flex: 1, padding: '6px 0', cursor: 'pointer', borderRadius: 5,
            fontFamily: "var(--font-alegreya-sans)", fontSize: 13,
            border: `1px solid ${value === opt.id ? '#c9a84c' : '#1e2540'}`,
            background: value === opt.id ? '#1a1810' : 'transparent',
            color: value === opt.id ? '#c9a84c' : '#7082a4',
            transition: 'all 0.2s',
          }}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// AI Model Section (playtester-only)
// =============================================================================

const TASK_LABELS = {
  narrative: 'Narrative (story writing)',
  summarization: 'Summarization (per-turn)',
  zone_generation: 'Zone Generation',
  classification: 'Action Classification',
  npc_flesh_out: 'NPC Flesh-out',
  campaign_summary: 'Campaign Summary',
  session_recap: 'Session Recap',
  briefing: 'Briefing Command',
  character_proposal: 'Character Proposal',
};

const PROVIDER_LABELS = { openai: 'OpenAI', anthropic: 'Anthropic', google: 'Google' };

function groupByProvider(models) {
  const groups = {};
  (models || []).forEach(m => {
    const p = m.provider || 'other';
    if (!groups[p]) groups[p] = [];
    groups[p].push(m);
  });
  return groups;
}

function ModelSelect({ value, models, defaultModelId, defaultLabel, inherited, onChange, className }) {
  const groups = groupByProvider(models);
  return (
    <select
      className={className}
      value={value || ''}
      onChange={e => onChange(e.target.value || null)}
      style={inherited && !value ? { color: '#6b83a3', fontStyle: 'italic' } : undefined}
    >
      <option value="">
        Default{defaultLabel ? ` (${defaultLabel})` : ''}
      </option>
      {Object.entries(groups).map(([provider, pModels]) => (
        <optgroup key={provider} label={PROVIDER_LABELS[provider] || provider}>
          {pModels.map(m => (
            <option key={m.id} value={m.id}>{m.label}{m.tier === 'fast' ? ' \u2022 fast' : m.tier === 'nano' ? ' \u2022 nano' : ''}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

function AiModelSection({ gameId }) {
  const user = api.getUser();
  const isPlaytester = user?.isPlaytester;

  const [aiData, setAiData] = useState(null);   // null=loading, false=hidden
  const [overrides, setOverrides] = useState({});
  const [advancedMode, setAdvancedMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successKey, setSuccessKey] = useState(null);
  const [error, setError] = useState(null);

  // Fetch on mount
  useEffect(() => {
    if (!gameId || !isPlaytester) {
      setAiData(false);
      return;
    }
    api.get(`/api/game/${gameId}/settings/ai-model`).then(data => {
      setAiData(data);
      setOverrides(data.overrides || {});
      const hasPerTask = Object.entries(data.overrides || {}).some(([k, v]) => k !== 'all' && v != null);
      if (hasPerTask) setAdvancedMode(true);
    }).catch(() => {
      setAiData(false);
    });
  }, [gameId, isPlaytester]);

  const updateOverride = useCallback(async (key, modelId) => {
    if (!gameId) return;
    const prevOverrides = { ...overrides };
    const value = modelId || null;
    setOverrides(prev => ({ ...prev, [key]: value }));
    setSaving(true);
    setError(null);
    try {
      const res = await api.put(`/api/game/${gameId}/settings/ai-model`, { overrides: { [key]: value } });
      if (res.overrides) setOverrides(res.overrides);
      setSuccessKey(key);
      setTimeout(() => setSuccessKey(null), 1500);
    } catch (err) {
      setOverrides(prevOverrides);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, [gameId, overrides]);

  const resetAll = useCallback(async () => {
    if (!gameId) return;
    const prevOverrides = { ...overrides };
    const resetBody = {};
    Object.keys(overrides).forEach(k => { resetBody[k] = null; });
    setOverrides(prev => Object.fromEntries(Object.keys(prev).map(k => [k, null])));
    setSaving(true);
    setError(null);
    try {
      const res = await api.put(`/api/game/${gameId}/settings/ai-model`, { overrides: resetBody });
      if (res.overrides) setOverrides(res.overrides);
      setSuccessKey('reset');
      setTimeout(() => setSuccessKey(null), 1500);
    } catch (err) {
      setOverrides(prevOverrides);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, [gameId, overrides]);

  // Don't render for non-playtesters or on fetch failure
  if (!isPlaytester || aiData === false) return null;

  // Loading skeleton
  if (aiData === null) {
    return (
      <div>
        <SectionLabel>AI Models</SectionLabel>
        <div className={styles.loadingSkeleton} style={{ width: '60%' }} />
        <div className={styles.loadingSkeleton} style={{ width: '100%', marginTop: 6 }} />
        <div className={styles.loadingSkeleton} style={{ width: '80%', marginTop: 6 }} />
      </div>
    );
  }

  const { defaults = {}, availableModels = [], taskTypes = [] } = aiData;
  const modelLabelById = {};
  availableModels.forEach(m => { modelLabelById[m.id] = m.label; });

  const hasAnyOverride = Object.values(overrides).some(v => v != null);
  const hasPerTaskOverrides = Object.entries(overrides).some(([k, v]) => k !== 'all' && v != null);

  return (
    <div>
      <SectionLabel extra={
        <>
          <span className={styles.devBadge}>Playtester</span>
          {saving && <span className={styles.savingDot} />}
        </>
      }>
        AI Models
      </SectionLabel>

      {/* Simple mode: All AI Tasks dropdown */}
      <div className={styles.modelRow}>
        <div className={styles.modelRowLabel}>
          <span className={styles.modelRowName}>
            All AI Tasks
            {successKey === 'all' && <span className={styles.modelSuccessCheck}>{'\u2713'}</span>}
          </span>
          {hasAnyOverride && (
            <button
              className={styles.resetButton}
              onClick={resetAll}
              disabled={saving}
            >
              {successKey === 'reset' ? '\u2713 Reset' : 'Reset to defaults'}
            </button>
          )}
        </div>
        <ModelSelect
          className={styles.modelSelect}
          value={overrides.all}
          models={availableModels}
          defaultLabel={null}
          onChange={v => updateOverride('all', v)}
        />
        {hasPerTaskOverrides && !advancedMode && (
          <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 12, color: '#e8c45a', marginTop: 6 }}>
            Some tasks have individual overrides.{' '}
            <button onClick={() => setAdvancedMode(true)} style={{
              background: 'none', border: 'none', color: '#c9a84c', cursor: 'pointer',
              fontFamily: "var(--font-alegreya-sans)", fontSize: 12, textDecoration: 'underline', padding: 0,
            }}>
              Show details
            </button>
          </div>
        )}
      </div>

      {/* Advanced toggle */}
      <div style={{ padding: '8px 0', borderBottom: '1px solid #161c34' }}>
        <button onClick={() => setAdvancedMode(!advancedMode)} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          fontFamily: "var(--font-alegreya-sans)", fontSize: 13,
          color: advancedMode ? '#c9a84c' : '#7082a4',
          transition: 'color 0.15s',
        }}>
          {advancedMode ? '\u25BC' : '\u25B6'} Configure per task
        </button>
      </div>

      {/* Per-task dropdowns */}
      {advancedMode && taskTypes.map(task => {
        const taskOverride = overrides[task];
        const allOverride = overrides.all;
        const effectiveModel = taskOverride || allOverride || defaults[task];
        const inheritedFrom = !taskOverride && allOverride ? 'All Tasks' : null;

        return (
          <div key={task} className={styles.modelRow}>
            <div className={styles.modelRowLabel}>
              <span className={styles.modelRowName}>
                {TASK_LABELS[task] || task}
                {successKey === task && <span className={styles.modelSuccessCheck}>{'\u2713'}</span>}
              </span>
              {inheritedFrom && (
                <span className={styles.modelRowInherited}>
                  via {inheritedFrom}: {modelLabelById[allOverride] || allOverride}
                </span>
              )}
            </div>
            <ModelSelect
              className={styles.modelSelect}
              value={taskOverride}
              models={availableModels}
              defaultModelId={defaults[task]}
              defaultLabel={modelLabelById[defaults[task]] || defaults[task]}
              inherited={!!inheritedFrom}
              onChange={v => updateOverride(task, v)}
            />
          </div>
        );
      })}

      {error && <div className={styles.errorText}>{error}</div>}
    </div>
  );
}

// =============================================================================
// Tab 1: Game Settings
// =============================================================================

function GameSettingsTab({ gameId, gameState }) {
  // ─── Storyteller State ───
  const [storyteller, setStoryteller] = useState(gameState?.storyteller || 'Chronicler');
  const [customDirective, setCustomDirective] = useState('');
  const [stSaving, setStSaving] = useState(false);
  const [stError, setStError] = useState(null);

  // ─── Difficulty State ───
  const dials = gameState?.dials || {};
  const [preset, setPreset] = useState(gameState?.difficultyPreset || gameState?.difficulty || 'standard');
  const [dcOffset, setDcOffset] = useState(dials.dcOffset ?? 0);
  const [survivalEnabled, setSurvivalEnabled] = useState(dials.survivalEnabled ?? true);
  const [durabilityEnabled, setDurabilityEnabled] = useState(dials.durabilityEnabled ?? true);
  const [progressionSpeed, setProgressionSpeed] = useState((dials.progressionSpeed ?? 100) / 100);
  const [encounterPressure, setEncounterPressure] = useState(dials.encounterPressure ?? 'standard');
  const [fortunesBalanceEnabled, setFortunesBalanceEnabled] = useState(dials.fortunesBalanceEnabled ?? true);
  const [simplifiedOutcomes, setSimplifiedOutcomes] = useState(dials.simplifiedOutcomes ?? false);
  const [diffError, setDiffError] = useState(null);
  const [diffSaving, setDiffSaving] = useState(false);
  const saveTimeoutRef = useRef(null);

  // ─── Fetch difficulty presets on mount ───
  useEffect(() => {
    if (!gameId) return;
    api.get(`/api/init/${gameId}/difficulty-presets`).then(res => {
      if (res.current?.preset) setPreset(res.current.preset);
    }).catch(() => { /* fall back to gameState values */ });
  }, [gameId]);

  // ─── Storyteller API ───
  const saveStoryteller = useCallback(async (name, directive) => {
    if (!gameId) return;
    setStSaving(true);
    setStError(null);
    try {
      const body = name === 'Custom'
        ? { selection: 'Custom', customText: directive || '' }
        : { selection: name };
      await api.put(`/api/game/${gameId}/settings/storyteller`, body);
    } catch (err) {
      setStError(err.message);
    } finally {
      setStSaving(false);
    }
  }, [gameId]);

  const handleStorytellerSelect = (name) => {
    setStoryteller(name);
    setStError(null);
    if (name !== 'Custom') saveStoryteller(name);
  };

  const handleDirectiveBlur = () => {
    if (storyteller === 'Custom') saveStoryteller('Custom', customDirective);
  };

  // ─── Difficulty API (debounced for sliders) ───
  const saveDifficulty = useCallback((body) => {
    if (!gameId) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setDiffSaving(true);
    setDiffError(null);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await api.put(`/api/game/${gameId}/settings/difficulty`, body);
      } catch (err) {
        setDiffError(err.message);
      } finally {
        setDiffSaving(false);
      }
    }, 400);
  }, [gameId]);

  useEffect(() => {
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, []);

  const applyPreset = (p) => {
    setPreset(p.id);
    setDcOffset(p.dcOffset);
    setSurvivalEnabled(p.survivalEnabled);
    setDurabilityEnabled(p.durabilityEnabled);
    setProgressionSpeed(p.progressionSpeed / 100);
    setEncounterPressure(p.encounterPressure);
    setFortunesBalanceEnabled(p.fortunesBalanceEnabled);
    setSimplifiedOutcomes(p.simplifiedOutcomes);
    saveDifficulty({ preset: p.id });
  };

  const changeDial = (snakeName, value) => {
    setPreset('custom');
    saveDifficulty({ overrides: { [snakeName]: value } });
  };

  const dcWarning = dcOffset > 4 || dcOffset < -2
    ? 'Beyond designed range; encounter balance may feel off.'
    : null;

  const selectedST = STORYTELLERS.find(s => s.id === storyteller);

  return (
    <div>
      {/* ── Storyteller ── */}
      <SectionLabel extra={stSaving ? <span className={styles.savingDot} /> : null}>
        Storyteller
      </SectionLabel>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
        {STORYTELLERS.map(st => (
          <button key={st.id} onClick={() => handleStorytellerSelect(st.id)} style={{
            padding: '6px 12px', cursor: 'pointer', borderRadius: 5,
            fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 600,
            border: `1px solid ${storyteller === st.id ? '#c9a84c' : '#1e2540'}`,
            background: storyteller === st.id ? '#1a1810' : 'transparent',
            color: storyteller === st.id ? '#c9a84c' : '#7082a4',
            transition: 'all 0.2s', letterSpacing: '0.04em',
          }}>
            {st.name}
          </button>
        ))}
      </div>
      {storyteller !== 'Custom' && selectedST && (
        <div style={{
          fontFamily: "var(--font-alegreya)", fontSize: 14, fontStyle: 'italic',
          color: '#8a9ab8', padding: '6px 0 4px',
        }}>
          &ldquo;{selectedST.oneLiner}&rdquo;
        </div>
      )}
      {storyteller === 'Custom' && (
        <div style={{ marginTop: 6 }}>
          <textarea
            value={customDirective}
            onChange={e => { if (e.target.value.length <= 500) setCustomDirective(e.target.value); }}
            onBlur={handleDirectiveBlur}
            placeholder="Describe your narrative voice, or name storytellers to blend."
            maxLength={500}
            style={{
              width: '100%', boxSizing: 'border-box', minHeight: 80, padding: '10px 12px',
              background: '#0a0e1a', border: '1px solid #1e2540', borderRadius: 6,
              fontFamily: "var(--font-alegreya-sans)", fontSize: 14, color: '#c8c0b0',
              outline: 'none', resize: 'vertical', lineHeight: 1.5,
            }}
          />
          <div style={{
            fontFamily: "var(--font-jetbrains)", fontSize: 11,
            color: customDirective.length >= 450 ? '#e8845a' : '#6b83a3',
            textAlign: 'right', marginTop: 4,
          }}>
            {customDirective.length}/500
          </div>
        </div>
      )}
      {stError && <div className={styles.errorText}>{stError}</div>}

      {/* ── Difficulty ── */}
      <SectionLabel extra={diffSaving ? <span className={styles.savingDot} /> : null}>
        Difficulty
      </SectionLabel>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {DIFFICULTY_PRESETS.map(p => (
          <button key={p.id} onClick={() => applyPreset(p)} style={{
            flex: 1, padding: '8px 0', cursor: 'pointer', borderRadius: 5,
            fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 700,
            border: `1px solid ${preset === p.id ? p.color + '66' : '#1e2540'}`,
            background: preset === p.id ? p.bg : 'transparent',
            color: preset === p.id ? p.color : '#7082a4',
            transition: 'all 0.2s', letterSpacing: '0.06em',
          }}>
            {p.label}
          </button>
        ))}
      </div>
      {preset === 'custom' && (
        <div style={{ fontFamily: "var(--font-alegreya)", fontSize: 12, color: '#6b83a3', fontStyle: 'italic', marginBottom: 4 }}>
          Custom; one or more dials adjusted from preset
        </div>
      )}

      <SliderControl
        label="DC Offset" value={dcOffset} min={-4} max={6} step={1}
        format={v => (v >= 0 ? `+${v}` : `${v}`)}
        onChange={v => { setDcOffset(v); changeDial('dc_offset', v); }}
        description="Flat modifier applied to all DCs"
        warning={dcWarning}
      />
      <SliderControl
        label="Progression Speed" value={progressionSpeed} min={0.25} max={3} step={0.25}
        format={v => `${v.toFixed(2)}\u00d7`}
        onChange={v => { setProgressionSpeed(v); changeDial('progression_speed', Math.round(v * 100)); }}
        description={progressionSpeed === 0 ? 'All stat/skill gains frozen' : 'Multiplier on stat and skill gains'}
      />
      <SelectorRow
        label="Encounter Pressure" value={encounterPressure}
        options={[{ id: 'low', label: 'Low' }, { id: 'standard', label: 'Standard' }, { id: 'high', label: 'High' }]}
        onChange={v => { setEncounterPressure(v); changeDial('encounter_pressure', v); }}
        description="Frequency and tension of random encounters"
      />
      <Toggle label="Survival" value={survivalEnabled}
        onChange={v => { setSurvivalEnabled(v); changeDial('survival_enabled', v); }}
        description="Track rations, water, and malnourishment" />
      <Toggle label="Durability" value={durabilityEnabled}
        onChange={v => { setDurabilityEnabled(v); changeDial('durability_enabled', v); }}
        description="Items degrade with use and need repair" />
      <Toggle label="Fortune's Balance" value={fortunesBalanceEnabled}
        onChange={v => { setFortunesBalanceEnabled(v); changeDial('fortunes_balance_enabled', v); }}
        description="Outmatched/Matched/Dominant dice categorization" />
      <Toggle label="Simplified Outcomes" value={simplifiedOutcomes}
        onChange={v => { setSimplifiedOutcomes(v); changeDial('simplified_outcomes', v); }}
        description="Binary pass/fail instead of 6-tier system" />

      {diffError && <div className={styles.errorText}>{diffError}</div>}

      {/* ── AI Models (playtester only) ── */}
      <AiModelSection gameId={gameId} />

      <div style={{
        fontFamily: "var(--font-alegreya-sans)", fontSize: 12, color: '#6b83a3',
        marginTop: 16, fontStyle: 'italic',
      }}>
        Changes take effect on the next relevant game event. No retroactive recalculation.
      </div>
    </div>
  );
}

// =============================================================================
// Tab 2: Display
// =============================================================================

function DisplayTab({ settings, onSave }) {
  const update = (key, value) => onSave({ ...settings, [key]: value });
  const isLexie = settings.font === 'lexie';

  return (
    <div>
      {/* Lexie Readable Toggle */}
      <SectionLabel>Reading Font</SectionLabel>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 0', borderBottom: '1px solid #161c34',
      }}>
        <div>
          <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 14, color: '#c8c0b0' }}>
            Lexie Readable
          </div>
          <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 12, color: '#6b83a3', marginTop: 2 }}>
            Dyslexia-friendly font
          </div>
        </div>
        <button onClick={() => update('font', isLexie ? 'alegreya' : 'lexie')} style={{
          width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
          background: isLexie ? '#c9a84c' : '#111528',
          border: `1px solid ${isLexie ? '#c9a84c' : '#1e2540'}`,
          position: 'relative', transition: 'all 0.2s', flexShrink: 0, marginLeft: 12,
        }}>
          <div style={{
            width: 18, height: 18, borderRadius: '50%',
            background: isLexie ? '#0a0e1a' : '#8a94a8',
            position: 'absolute', top: 2,
            left: isLexie ? 22 : 2,
            transition: 'left 0.2s, background 0.2s',
          }} />
        </button>
      </div>

      <SectionLabel>Text Size</SectionLabel>
      <div style={{ display: 'flex', gap: 6 }}>
        {SIZES.map(s => (
          <button key={s.id} onClick={() => update('textSize', s.id)} style={{
            flex: 1, padding: '8px 0', cursor: 'pointer', borderRadius: 6,
            fontFamily: "var(--font-alegreya-sans)", fontSize: 13,
            border: `1px solid ${settings.textSize === s.id ? '#c9a84c' : '#1e2540'}`,
            background: settings.textSize === s.id ? '#1a1810' : 'transparent',
            color: settings.textSize === s.id ? '#c9a84c' : '#7082a4',
            transition: 'all 0.2s',
          }}>
            {s.label}
          </button>
        ))}
      </div>

      <div style={{
        fontFamily: "var(--font-alegreya-sans)", fontSize: 12, color: '#6b83a3',
        marginTop: 16, fontStyle: 'italic',
      }}>
        Settings are saved automatically and persist across sessions.
      </div>
    </div>
  );
}

// =============================================================================
// Tab 3: World
// =============================================================================

function WorldTab({ gameId, gameState, onGameStateReload, onClose }) {
  const currentTurn = gameState?.clock?.totalTurn || gameState?.clock?.sessionTurn || 0;
  const campaignName = gameState?.setting || 'My World';

  // ─── Checkpoints ───
  const [checkpoints, setCheckpoints] = useState(null); // null=loading, false=error
  const [cpBusy, setCpBusy] = useState(null); // slot number or 'loading'
  const [cpError, setCpError] = useState(null);
  const [cpConfirm, setCpConfirm] = useState(null); // { action: 'load'|'delete', cp }

  const fetchCheckpoints = useCallback(async () => {
    if (!gameId) return;
    try {
      const res = await api.get(`/api/game/${gameId}/checkpoints`);
      setCheckpoints(res.checkpoints || []);
    } catch {
      setCheckpoints(false);
    }
  }, [gameId]);

  useEffect(() => { fetchCheckpoints(); }, [fetchCheckpoints]);

  const clearCpError = () => { setTimeout(() => setCpError(null), 5000); };

  const handleSaveCheckpoint = async (slotNum) => {
    setCpBusy(slotNum);
    setCpError(null);
    try {
      const name = `Slot ${slotNum} \u2014 Turn ${currentTurn}`;
      await api.post(`/api/game/${gameId}/action`, { command: 'checkpoint', name });
      await fetchCheckpoints();
    } catch (err) {
      setCpError(err.message); clearCpError();
    } finally { setCpBusy(null); }
  };

  const handleLoadCheckpoint = async (cp) => {
    setCpBusy('loading');
    setCpError(null);
    try {
      await api.post(`/api/game/${gameId}/action`, { command: 'restore_checkpoint', target: cp.name });
      setCpConfirm(null);
      onGameStateReload?.();
    } catch (err) {
      setCpError(err.message); clearCpError();
      setCpBusy(null);
    }
  };

  const handleDeleteCheckpoint = async (cp) => {
    setCpBusy(cp.id);
    setCpError(null);
    try {
      await api.post(`/api/game/${gameId}/action`, { command: 'delete_checkpoint', target: cp.name });
      setCpConfirm(null);
      await fetchCheckpoints();
    } catch (err) {
      setCpError(err.message); clearCpError();
    } finally { setCpBusy(null); }
  };

  // ─── Snapshot ───
  const [snapName, setSnapName] = useState(`${campaignName} \u2014 Turn ${currentTurn}`);
  const [snapSaving, setSnapSaving] = useState(false);
  const [snapSuccess, setSnapSuccess] = useState(false);
  const [snapError, setSnapError] = useState(null);

  const handleSaveSnapshot = async () => {
    if (!snapName.trim() || !gameId) return;
    setSnapSaving(true);
    setSnapError(null);
    try {
      await api.post(`/api/game/${gameId}/snapshot`, {
        name: snapName.trim(), description: null, type: 'branch', visibility: 'private',
      });
      setSnapSuccess(true);
      setTimeout(() => setSnapSuccess(false), 2500);
    } catch (err) {
      setSnapError(err.message); setTimeout(() => setSnapError(null), 5000);
    } finally { setSnapSaving(false); }
  };

  // ─── Share ───
  const [shareMode, setShareMode] = useState(null); // null | 'picking' is default, 'sharing' shows link
  const [shareToken, setShareToken] = useState(null);
  const [shareType, setShareType] = useState(null);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareError, setShareError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleShare = async (type) => {
    if (!gameId) return;
    setShareBusy(true);
    setShareError(null);
    try {
      const res = await api.post(`/api/game/${gameId}/snapshot`, {
        name: `${campaignName} (shared)`,
        description: null,
        type: type === 'began' ? 'fresh_start' : 'branch',
        visibility: 'unlisted',
      });
      setShareToken(res.snapshot?.shareToken || null);
      setShareType(type);
      setShareMode('sharing');
    } catch (err) {
      setShareError(err.message); setTimeout(() => setShareError(null), 5000);
    } finally { setShareBusy(false); }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/snapshot/${shareToken}`;
    try { navigator.clipboard.writeText(url); } catch { /* noop */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // ─── Confirmation Dialog ───
  if (cpConfirm) {
    const { action, cp } = cpConfirm;
    return (
      <div>
        <SectionLabel>{action === 'load' ? 'Load Checkpoint' : 'Delete Checkpoint'}</SectionLabel>
        <div style={{
          background: '#111528', border: '1px solid #1e2540', borderRadius: 8, padding: 20,
          textAlign: 'center',
        }}>
          <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 14, color: '#c8c0b0', marginBottom: 6 }}>
            {cp.name}
          </div>
          <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 13, color: '#7082a4', marginBottom: 16 }}>
            {action === 'load'
              ? `Load this checkpoint? Your progress since turn ${cp.turnNumber} will be lost.`
              : 'Delete this checkpoint? This cannot be undone.'}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button onClick={() => setCpConfirm(null)} disabled={cpBusy != null} style={{
              padding: '8px 20px', borderRadius: 5, cursor: 'pointer',
              fontFamily: "var(--font-alegreya-sans)", fontSize: 13,
              background: 'transparent', border: '1px solid #1e2540', color: '#7082a4',
            }}>Cancel</button>
            <button
              onClick={() => action === 'load' ? handleLoadCheckpoint(cp) : handleDeleteCheckpoint(cp)}
              disabled={cpBusy != null}
              style={{
                padding: '8px 20px', borderRadius: 5, cursor: cpBusy ? 'not-allowed' : 'pointer',
                fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
                background: action === 'load' ? '#1a1810' : '#201416',
                border: `1px solid ${action === 'load' ? '#c9a84c' : '#e85a5a'}`,
                color: action === 'load' ? '#c9a84c' : '#e85a5a',
                opacity: cpBusy ? 0.5 : 1,
              }}>
              {cpBusy ? 'Working...' : action === 'load' ? 'Load' : 'Delete'}
            </button>
          </div>
          {cpError && <div className={styles.errorText} style={{ marginTop: 10 }}>{cpError}</div>}
        </div>
      </div>
    );
  }

  // Build checkpoint slots (pad to 3)
  const cpSlots = [1, 2, 3].map(slotNum => {
    const cp = Array.isArray(checkpoints) ? checkpoints[slotNum - 1] : null;
    return { slotNum, cp };
  });

  return (
    <div>
      {/* ── Checkpoints ── */}
      <SectionLabel>Checkpoints</SectionLabel>
      <div style={{ background: '#111528', border: '1px solid #1e2540', borderRadius: 8, padding: 16 }}>
        <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 13, color: '#7082a4', marginBottom: 12 }}>
          Quick-save up to 3 slots. Save, load, or delete at any time.
        </div>
        {checkpoints === null && (
          <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 13, color: '#6b83a3', padding: 8 }}>Loading checkpoints...</div>
        )}
        {checkpoints === false && (
          <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 13, color: '#e8845a' }}>
            Couldn't load checkpoints. <button onClick={fetchCheckpoints} style={{ background: 'none', border: 'none', color: '#c9a84c', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', textDecoration: 'underline', padding: 0 }}>Retry</button>
          </div>
        )}
        {Array.isArray(checkpoints) && cpSlots.map(({ slotNum, cp }) => (
          <div key={slotNum} style={{
            padding: '10px 12px', borderRadius: 6, marginBottom: slotNum < 3 ? 8 : 0,
            border: `1px solid ${cp ? '#3a3328' : '#161c34'}`,
            background: cp ? '#0e1420' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{
              fontFamily: "var(--font-alegreya-sans)", fontSize: 13,
              color: cp ? '#d0c098' : '#6b83a3', fontWeight: cp ? 500 : 400, flex: 1,
            }}>
              {cp ? cp.name : `Slot ${slotNum} \u2014 Empty`}
              {cp && <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 10, color: '#6b83a3', marginLeft: 8 }}>T{cp.turnNumber}</span>}
            </span>
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              {cp ? (
                <>
                  <button onClick={() => setCpConfirm({ action: 'load', cp })} disabled={cpBusy != null} style={{
                    padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
                    fontFamily: "var(--font-alegreya-sans)", fontSize: 12,
                    background: 'transparent', border: '1px solid #1e2540', color: '#7082a4',
                    transition: 'all 0.2s', opacity: cpBusy ? 0.5 : 1,
                  }}>Load</button>
                  <button onClick={() => setCpConfirm({ action: 'delete', cp })} disabled={cpBusy != null} style={{
                    padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
                    fontFamily: "var(--font-alegreya-sans)", fontSize: 12,
                    background: 'transparent', border: '1px solid #161c34', color: '#6b83a3',
                    transition: 'all 0.2s', opacity: cpBusy ? 0.5 : 1,
                  }}>Delete</button>
                </>
              ) : (
                <button onClick={() => handleSaveCheckpoint(slotNum)} disabled={cpBusy != null} style={{
                  padding: '4px 14px', borderRadius: 4, cursor: cpBusy ? 'not-allowed' : 'pointer',
                  fontFamily: "var(--font-alegreya-sans)", fontSize: 12, fontWeight: 600,
                  background: '#1a1810', border: '1px solid #c9a84c',
                  color: '#c9a84c', transition: 'all 0.2s', opacity: cpBusy ? 0.5 : 1,
                }}>{cpBusy === slotNum ? 'Saving...' : 'Save'}</button>
              )}
            </div>
          </div>
        ))}
        {cpError && <div className={styles.errorText} style={{ marginTop: 8 }}>{cpError}</div>}
      </div>

      {/* ── Save World Snapshot ── */}
      <SectionLabel extra={snapSaving ? <span className={styles.savingDot} /> : null}>
        Save World Snapshot
      </SectionLabel>
      <div style={{ background: '#111528', border: '1px solid #1e2540', borderRadius: 8, padding: 16 }}>
        <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 13, color: '#7082a4', marginBottom: 10 }}>
          Save the current world state to Your Worlds for reuse in future games.
        </div>
        <input
          type="text" value={snapName} onChange={e => setSnapName(e.target.value)}
          maxLength={100}
          style={{
            width: '100%', boxSizing: 'border-box', padding: '8px 12px',
            background: '#0a0e1a', border: '1px solid #1e2540', borderRadius: 6,
            fontFamily: "var(--font-alegreya-sans)", fontSize: 14, color: '#c8c0b0',
            outline: 'none', marginBottom: 10,
          }}
        />
        <button onClick={handleSaveSnapshot} disabled={snapSaving || !snapName.trim()} style={{
          width: '100%', padding: '8px 0', borderRadius: 6, cursor: snapSaving ? 'not-allowed' : 'pointer',
          fontFamily: "var(--font-alegreya-sans)", fontSize: 14, fontWeight: 600,
          background: snapSuccess ? '#10201420' : '#1a1810',
          border: `1px solid ${snapSuccess ? '#8aba7a' : '#c9a84c'}`,
          color: snapSuccess ? '#8aba7a' : '#c9a84c',
          transition: 'all 0.2s', opacity: snapSaving ? 0.5 : 1,
        }}>
          {snapSuccess ? '\u2713 Saved to Your Worlds' : snapSaving ? 'Saving...' : 'Save Snapshot'}
        </button>
        {snapError && <div className={styles.errorText} style={{ marginTop: 6 }}>{snapError}</div>}
      </div>

      {/* ── Share This World ── */}
      <SectionLabel extra={shareBusy ? <span className={styles.savingDot} /> : null}>
        Share This World
      </SectionLabel>
      <div style={{ background: '#111528', border: '1px solid #1e2540', borderRadius: 8, padding: 16 }}>
        {shareMode !== 'sharing' ? (
          <div>
            <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 13, color: '#7082a4', marginBottom: 12 }}>
              Generate an unlisted link so others can start a game in your world.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => handleShare('began')} disabled={shareBusy} style={{
                flex: 1, padding: '10px 8px', borderRadius: 6, cursor: shareBusy ? 'not-allowed' : 'pointer',
                background: 'transparent', border: '1px solid #1e2540',
                fontFamily: "var(--font-alegreya-sans)", fontSize: 13, color: '#c8c0b0',
                transition: 'all 0.2s', opacity: shareBusy ? 0.5 : 1,
              }}>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>As it began</div>
                <div style={{ fontSize: 11, color: '#6b83a3' }}>Turn 1, original world</div>
              </button>
              <button onClick={() => handleShare('current')} disabled={shareBusy} style={{
                flex: 1, padding: '10px 8px', borderRadius: 6, cursor: shareBusy ? 'not-allowed' : 'pointer',
                background: 'transparent', border: '1px solid #1e2540',
                fontFamily: "var(--font-alegreya-sans)", fontSize: 13, color: '#c8c0b0',
                transition: 'all 0.2s', opacity: shareBusy ? 0.5 : 1,
              }}>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>As it is now</div>
                <div style={{ fontSize: 11, color: '#6b83a3' }}>Turn {currentTurn}, evolved state</div>
              </button>
            </div>
            {shareError && <div className={styles.errorText} style={{ marginTop: 6 }}>{shareError}</div>}
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <button onClick={() => { setShareMode(null); setShareToken(null); setCopied(false); }} style={{
                background: 'none', border: 'none', color: '#6b83a3', cursor: 'pointer',
                fontFamily: "var(--font-alegreya-sans)", fontSize: 12,
              }}>{'\u2190'} Back</button>
              <span style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 13, color: '#d0c098', fontWeight: 600 }}>
                Share: {shareType === 'began' ? 'As it began' : 'As it is now'}
              </span>
            </div>
            {shareToken ? (
              <>
                <div style={{
                  background: '#0a0e1a', border: '1px solid #1e2540', borderRadius: 6,
                  padding: '8px 12px', fontFamily: "var(--font-jetbrains)", fontSize: 12,
                  color: '#8a94a8', marginBottom: 10, wordBreak: 'break-all',
                }}>
                  {window.location.origin}/snapshot/{shareToken}
                </div>
                <button onClick={handleCopyLink} style={{
                  width: '100%', padding: '8px 0', borderRadius: 6, cursor: 'pointer',
                  fontFamily: "var(--font-alegreya-sans)", fontSize: 14, fontWeight: 600,
                  background: copied ? '#10201420' : '#1a1810',
                  border: `1px solid ${copied ? '#8aba7a' : '#c9a84c'}`,
                  color: copied ? '#8aba7a' : '#c9a84c', transition: 'all 0.2s',
                }}>
                  {copied ? '\u2713 Copied to clipboard' : 'Copy Link'}
                </button>
              </>
            ) : (
              <div style={{ fontFamily: "var(--font-alegreya-sans)", fontSize: 13, color: '#e8845a' }}>
                Snapshot was created but no share link was returned. Check Your Worlds in the main menu.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Main Settings Modal
// =============================================================================

const TABS = [
  { id: 'game', label: 'Game Settings' },
  { id: 'display', label: 'Display' },
  { id: 'world', label: 'World' },
];

export default function SettingsModal({ settings, onSave, onClose, gameId, gameState, onGameStateReload }) {
  const [activeTab, setActiveTab] = useState('game');

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        {/* Tab bar */}
        <div className={styles.tabBar}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? styles.tabButtonActive : styles.tabButton}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
          <div className={styles.tabBarSpacer} />
          <button className={styles.closeButton} onClick={onClose} aria-label="Close settings">
            &times;
          </button>
        </div>

        {/* Tab content */}
        <div className={styles.tabContent}>
          {activeTab === 'game' && <GameSettingsTab gameId={gameId} gameState={gameState} />}
          {activeTab === 'display' && <DisplayTab settings={settings} onSave={onSave} />}
          {activeTab === 'world' && (
            <WorldTab
              gameId={gameId}
              gameState={gameState}
              onGameStateReload={onGameStateReload}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─��── FILE: app/play/components/Sidebar.js ────
import { useState, useCallback } from 'react';
import CharacterTab from './CharacterTab';
import InventoryTab from './InventoryTab';
import NPCTab from './NPCTab';
import GlossaryTab from './GlossaryTab';
import MapTab from './MapTab';
import NotesTab from './NotesTab';
import styles from './Sidebar.module.css';

// ─── SVG Tab Icons (from mockup's TabIcons) ───

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
  notes: (color) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="12" y2="17" />
    </svg>
  ),
};

const TABS = [
  { id: 'character', label: 'Character' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'npcs', label: 'NPCs' },
  { id: 'glossary', label: 'Glossary' },
  { id: 'map', label: 'Map' },
  { id: 'notes', label: 'Notes' },
];

export default function Sidebar({
  collapsed,
  characterData,
  glossaryData,
  glossaryTerms,
  mapData,
  notesData,
  gameId,
  notifications,
  onClearNotification,
  onNotesChange,
  onEntityClick,
  onOpenReport,
  debugMode,
  isDebugUser,
  onToggleDebug,
}) {
  const [activeTab, setActiveTab] = useState('character');
  const [width, setWidth] = useState(340);

  const handleTabClick = useCallback((tabId) => {
    setActiveTab(tabId);
    if (notifications?.[tabId]) {
      onClearNotification?.(tabId);
    }
  }, [notifications, onClearNotification]);

  // ─── Resize Handle ───
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = width;

    const onMove = (moveE) => {
      const delta = startX - moveE.clientX;
      setWidth(Math.max(280, Math.min(600, startWidth + delta)));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [width]);

  if (collapsed) return null;

  const renderContent = () => {
    switch (activeTab) {
      case 'character':
        return <CharacterTab data={characterData} onEntityClick={onEntityClick} />;
      case 'inventory':
        return <InventoryTab data={characterData} onEntityClick={onEntityClick} />;
      case 'npcs':
        return <NPCTab glossaryData={glossaryData} glossaryTerms={glossaryTerms} onEntityClick={onEntityClick} />;
      case 'glossary':
        return <GlossaryTab data={glossaryData} characterData={characterData} glossaryTerms={glossaryTerms} onEntityClick={onEntityClick} />;
      case 'map':
        return <MapTab data={mapData} gameId={gameId} onEntityClick={onEntityClick} />;
      case 'notes':
        return <NotesTab data={notesData} gameId={gameId} onNotesChange={onNotesChange} />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.sidebar} style={{ width }}>
      <div className={styles.resizeHandle} onMouseDown={handleMouseDown} />
      <div className={styles.tabBar}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => handleTabClick(tab.id)}
            title={tab.label}
            aria-label={tab.label}
          >
            {TabIcons[tab.id](activeTab === tab.id ? '#c9a84c' : '#7082a4')}
            {notifications?.[tab.id] > 0 && (
              <span className={styles.badge}>{notifications[tab.id]}</span>
            )}
          </button>
        ))}
      </div>
      <div className={styles.tabContent}>
        {renderContent()}
      </div>
      {(onOpenReport || isDebugUser) && (
        <div className={styles.sidebarFooter}>
          {onOpenReport && (
            <>
              <button className={styles.footerIconBtn} onClick={() => onOpenReport('bug')} aria-label="Report a bug" data-tooltip="Report a bug">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="8" y="6" width="8" height="14" rx="4" /><path d="M19 10h2" /><path d="M3 10h2" />
                  <path d="M19 14h2" /><path d="M3 14h2" /><path d="M19 18h2" /><path d="M3 18h2" />
                  <path d="M16 2l-2 4" /><path d="M8 2l2 4" />
                </svg>
              </button>
              <button className={styles.footerIconBtn} onClick={() => onOpenReport('suggest')} aria-label="Share a suggestion" data-tooltip="Share a suggestion">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18h6" /><path d="M10 22h4" />
                  <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
                </svg>
              </button>
            </>
          )}
          {isDebugUser && onToggleDebug && (
            <button className={styles.footerBtn} onClick={onToggleDebug}
              style={{ color: debugMode ? '#c9a84c' : undefined, borderColor: debugMode ? '#c9a84c33' : undefined }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
              </svg>
              Debug {debugMode ? 'ON' : 'OFF'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─��── FILE: app/play/components/TalkToGM.js ────
import { useState, useEffect, useCallback, useRef } from 'react';
import * as api from '@/lib/api';
import { renderLinkedText } from '@/lib/renderLinkedText';
import styles from './TalkToGM.module.css';

// ─── Contextual Chip Logic ───

const SOCIAL_SKILLS = ['persuasion', 'intimidation', 'deception', 'charm', 'diplomacy', 'empathy'];

function getContextualChipLabel(resolution, lastStateChanges) {
  if (!resolution) return 'How do rolls work?';
  if (resolution.isCombat === true) return 'How does combat work?';
  if (
    resolution.stat === 'cha' &&
    resolution.skillUsed &&
    SOCIAL_SKILLS.includes(resolution.skillUsed.toLowerCase())
  ) return 'How do social encounters work?';
  if (resolution.fortunesBalance === 'outmatched' || resolution.fortunesBalance === 'dominant') {
    return "How does Fortune's Balance work?";
  }
  if (resolution.skillUsed) return 'How do skill checks work?';
  if (
    lastStateChanges?.conditions?.added?.length > 0 ||
    lastStateChanges?.conditions?.modified?.length > 0
  ) return 'How do conditions work?';
  return 'How do rolls work?';
}

// ─── Sparkle Icon ───
function SparkleIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className={styles.sparkleIcon}>
      <path d="M6 0L7.2 4.8L12 6L7.2 7.2L6 12L4.8 7.2L0 6L4.8 4.8L6 0Z" fill="currentColor" />
    </svg>
  );
}

// ─── Rotating Placeholder ───
const META_PLACEHOLDERS = [
  "I want to work my way into the king's service...",
  "How do I become a ship's pilot?",
  "Who poisoned the merchant in Thornwall?",
  "I'd prefer a bow over this sword...",
  "More combat, less shopping",
  "What steps should I take to join the thieves' guild?",
];

function useRotatingPlaceholder() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % META_PLACEHOLDERS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);
  return META_PLACEHOLDERS[index];
}

// ─── Static Chips ───
const STATIC_CHIPS = [
  'Where can I go?',
  'Remind me of my goals',
  'What do I know about this place?',
];

export default function TalkToGM({ gameId, onTurnResponse, lastResolution, lastStateChanges, onMetaResponse, glossaryTerms, onEntityClick }) {
  const [open, setOpen] = useState(false);
  const [tabMode, setTabMode] = useState('rules'); // 'rules' | 'story'

  // ─── Rules Tab State ───
  const [rulesInput, setRulesInput] = useState('');
  const [rulesLoading, setRulesLoading] = useState(false);
  const [rulesResult, setRulesResult] = useState(null);
  const [lastQuestion, setLastQuestion] = useState('');
  const rulesInputRef = useRef(null);

  // ─── My Story Tab State ───
  const [storyInput, setStoryInput] = useState('');
  const [storyLoading, setStoryLoading] = useState(false);
  const [storyResult, setStoryResult] = useState(null);
  const storyInputRef = useRef(null);

  const rotatingPlaceholder = useRotatingPlaceholder();

  // Auto-focus input when panel opens or tab changes
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      if (tabMode === 'rules') rulesInputRef.current?.focus();
      else storyInputRef.current?.focus();
    }, 50);
    return () => clearTimeout(t);
  }, [open, tabMode]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open]);

  const handleClose = () => {
    setOpen(false);
  };

  // ─── Rules Tab: Phase 1 (free lookup) ───
  const handleAskRules = useCallback(async (questionText) => {
    const question = (questionText || rulesInput).trim();
    if (!question || !gameId || rulesLoading) return;

    setRulesLoading(true);
    setRulesResult(null);
    setLastQuestion(question);
    setRulesInput('');

    try {
      const res = await api.post(`/api/game/${gameId}/talk-to-gm`, { question });
      setRulesResult(res);
    } catch (err) {
      console.error('Talk to GM failed:', err);
      setRulesResult({ error: err.message || 'Failed to reach the GM.' });
    } finally {
      setRulesLoading(false);
    }
  }, [rulesInput, gameId, rulesLoading]);

  // ─── Rules Tab: Phase 2 (escalation, costs a turn) ───
  const handleEscalate = useCallback(async () => {
    if (!lastQuestion || !gameId || rulesLoading) return;

    setRulesLoading(true);
    try {
      const res = await api.post(`/api/game/${gameId}/talk-to-gm/escalate`, {
        question: lastQuestion,
      });
      if (res.turnAdvanced && onTurnResponse) {
        onTurnResponse(res, '[GM Escalation]');
      }
      handleClose();
    } catch (err) {
      console.error('GM escalation failed:', err);
      setRulesResult({ error: err.message || 'Escalation failed.' });
    } finally {
      setRulesLoading(false);
    }
  }, [lastQuestion, gameId, rulesLoading, onTurnResponse]);

  // ─── Rules Tab: Meta fallback (free, no turn cost) ───
  const handleMetaFromRules = useCallback(async () => {
    if (!lastQuestion || !gameId || rulesLoading) return;

    setRulesLoading(true);
    setRulesResult(prev => ({ ...prev, metaLoading: true }));

    try {
      const res = await api.post(`/api/game/${gameId}/talk-to-gm/meta`, { question: lastQuestion });
      const responseText = res.response || 'The GM considered your question but had no specific response.';
      setRulesResult(prev => ({ ...prev, metaResponse: responseText, metaLoading: false }));
    } catch (err) {
      console.error('Meta from rules failed:', err);
      setRulesResult(prev => ({ ...prev, metaResponse: 'Failed to reach the GM. You can try escalating instead.', metaLoading: false }));
    } finally {
      setRulesLoading(false);
    }
  }, [lastQuestion, gameId, rulesLoading]);

  // ─── My Story Tab: Meta question ───
  const handleAskStory = useCallback(async () => {
    const question = storyInput.trim();
    if (!question || !gameId || storyLoading) return;

    setStoryLoading(true);
    setStoryResult(null);
    setStoryInput('');

    try {
      const res = await api.post(`/api/game/${gameId}/talk-to-gm/meta`, { question });

      const responseText = res.response || 'The GM considered your question but had no specific response.';

      setStoryResult({
        text: responseText,
        directiveStored: res.directiveStored || false,
        directiveLane: res.directiveLane || null,
      });

      // Inject as GM aside into narrative
      if (onMetaResponse) {
        onMetaResponse(responseText);
      }
    } catch (err) {
      console.error('Meta question failed:', err);
      if (err.status === 429) {
        setStoryResult({ text: "You've asked the GM a lot recently. Give it a moment.", isRateLimit: true });
      } else {
        setStoryResult({ text: 'Failed to reach the GM. Try again.' });
      }
    } finally {
      setStoryLoading(false);
    }
  }, [storyInput, gameId, storyLoading, onMetaResponse]);

  // ─── Formatting Helpers ───

  const renderProse = (text) => {
    if (!text || typeof text !== 'string') return null;
    const paragraphs = text.split(/\n\n|\n/).filter(p => p.trim());
    return (
      <div className={styles.commandProse}>
        {paragraphs.map((p, i) => <p key={i}>{renderLinkedText(p, glossaryTerms, onEntityClick)}</p>)}
      </div>
    );
  };

  const formatLabel = (key) => {
    return key
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  const formatClockValue = (clock) => {
    if (!clock) return null;
    const h = clock.hour ?? 0;
    const m = clock.minute ?? 0;
    const period = h >= 12 ? 'PM' : 'AM';
    const dh = h % 12 || 12;
    const parts = [];
    if (clock.day) parts.push(`Day ${clock.day}`);
    parts.push(`${dh}:${String(m).padStart(2, '0')} ${period}`);
    return parts.join(' \u00b7 ');
  };

  const renderStatRow = (key, value) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if ('base' in value || 'effective' in value) {
        return (
          <div key={key} className={styles.commandRow}>
            <span className={styles.commandRowLabel}>{key.toUpperCase()}</span>
            <span className={styles.commandRowValue}>
              {value.effective ?? value.base}{value.base !== value.effective && value.base != null ? ` (base ${value.base})` : ''}
            </span>
          </div>
        );
      }
    }
    return (
      <div key={key} className={styles.commandRow}>
        <span className={styles.commandRowLabel}>{key.toUpperCase()}</span>
        <span className={styles.commandRowValue}>{typeof value === 'number' ? value.toFixed(1) : String(value)}</span>
      </div>
    );
  };

  // ─── Command-Specific Renderers ───

  const renderBriefingData = (data) => {
    if (typeof data.briefing === 'string' && data.briefing.trim()) {
      return renderProse(data.briefing);
    }
    const parts = [];
    if (data.currentScene) parts.push(renderProse(data.currentScene));
    if (data.clock) {
      parts.push(
        <div key="clock" className={styles.commandRow}>
          <span className={styles.commandRowLabel}>Time</span>
          <span className={styles.commandRowValue}>{formatClockValue(data.clock)}</span>
        </div>
      );
    }
    if (parts.length === 0) {
      return <div className={styles.commandEmptyMessage}>The GM couldn't prepare a briefing right now. Try again after a few more turns.</div>;
    }
    return <>{parts}</>;
  };

  const renderStatusReport = (data) => {
    const sections = [];

    if (data.stats || data.character?.stats) {
      const stats = data.stats || data.character?.stats || {};
      sections.push(
        <div key="stats" className={styles.commandSection}>
          <div className={styles.commandSectionTitle}>Stats</div>
          {Object.entries(stats).map(([k, v]) => renderStatRow(k, v))}
        </div>
      );
    }

    const conditions = data.conditions || data.character?.conditions;
    if (Array.isArray(conditions) && conditions.length > 0) {
      sections.push(
        <div key="conditions" className={styles.commandSection}>
          <div className={styles.commandSectionTitle}>Conditions</div>
          {conditions.map((c, i) => (
            <div key={i} className={styles.commandCondition}>
              <span className={styles.commandConditionName}>{c.name || c}</span>
              {c.penalty && <span className={styles.commandConditionPenalty}>{c.penalty} {(c.stat || '').toUpperCase()}</span>}
            </div>
          ))}
        </div>
      );
    }

    const skills = data.skills || data.character?.skills;
    if (Array.isArray(skills) && skills.length > 0) {
      sections.push(
        <div key="skills" className={styles.commandSection}>
          <div className={styles.commandSectionTitle}>Skills</div>
          {skills.map((s, i) => (
            <div key={i} className={styles.commandSkillItem}>
              <span className={styles.commandSkillName}>
                {s.name}
                {s.type && <span className={styles.commandSkillType}>{s.type}</span>}
              </span>
              <span className={styles.commandSkillValue}>+{(s.modifier ?? s.value ?? 0).toFixed(1)}</span>
            </div>
          ))}
        </div>
      );
    }

    const inventory = data.inventory || data.character?.inventory;
    if (inventory) {
      sections.push(
        <div key="inv" className={styles.commandSection}>
          <div className={styles.commandSectionTitle}>Inventory</div>
          {inventory.usedSlots != null && (
            <div className={styles.commandRow}>
              <span className={styles.commandRowLabel}>Slots</span>
              <span className={styles.commandRowValue}>{inventory.usedSlots}/{inventory.maxSlots}</span>
            </div>
          )}
          {inventory.currency?.display && (
            <div className={styles.commandRow}>
              <span className={styles.commandRowLabel}>Currency</span>
              <span className={styles.commandRowValueGold}>{inventory.currency.display}</span>
            </div>
          )}
          {inventory.encumbrance && (
            <div className={styles.commandRow}>
              <span className={styles.commandRowLabel}>Encumbrance</span>
              <span className={styles.commandRowValue}>{inventory.encumbrance}</span>
            </div>
          )}
        </div>
      );
    }

    if (data.location || data.world?.currentLocation) {
      sections.push(
        <div key="location" className={styles.commandRow}>
          <span className={styles.commandRowLabel}>Location</span>
          <span className={styles.commandRowValue}>{data.location || data.world?.currentLocation}</span>
        </div>
      );
    }
    if (data.clock || data.game?.clock) {
      const clock = data.clock || data.game?.clock;
      sections.push(
        <div key="clock" className={styles.commandRow}>
          <span className={styles.commandRowLabel}>Time</span>
          <span className={styles.commandRowValue}>{formatClockValue(clock)}</span>
        </div>
      );
    }

    if (sections.length === 0) return renderGenericData(data);
    return <>{sections}</>;
  };

  const renderSkillReview = (data) => {
    const skills = Array.isArray(data.skills) ? data.skills
      : Array.isArray(data) ? data : null;
    if (!skills || skills.length === 0) {
      return <div className={styles.commandEmptyMessage}>No skills discovered yet.</div>;
    }
    return (
      <div className={styles.commandSection}>
        {skills.map((s, i) => (
          <div key={i} className={styles.commandSkillItem}>
            <span className={styles.commandSkillName}>
              {s.name}
              {s.type && <span className={styles.commandSkillType}>{s.type}</span>}
            </span>
            <span className={styles.commandSkillValue}>+{(s.modifier ?? s.value ?? 0).toFixed(1)}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderObjectives = (data) => {
    const quests = Array.isArray(data.quests) ? data.quests : [];
    const playerObjectives = Array.isArray(data.objectives || data.playerObjectives) ? (data.objectives || data.playerObjectives) : [];
    if (quests.length === 0 && playerObjectives.length === 0) {
      return <div className={styles.commandEmptyMessage}>No active objectives right now.</div>;
    }
    return (
      <>
        {quests.length > 0 && (
          <div className={styles.commandSection}>
            <div className={styles.commandSectionTitle}>Quests</div>
            {quests.map((q, i) => (
              <div key={i} className={styles.commandListItem}>
                <strong style={{ color: 'var(--text-heading)' }}>{q.title || q}</strong>
                {q.status && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-dim)' }}>({q.status})</span>}
              </div>
            ))}
          </div>
        )}
        {playerObjectives.length > 0 && (
          <div className={styles.commandSection}>
            <div className={styles.commandSectionTitle}>Your Objectives</div>
            {playerObjectives.map((o, i) => (
              <div key={i} className={styles.commandListItem}>{typeof o === 'string' ? o : o.text || o.title || JSON.stringify(o)}</div>
            ))}
          </div>
        )}
      </>
    );
  };

  const renderHelp = (data) => {
    const commands = Array.isArray(data.commands) ? data.commands
      : Array.isArray(data) ? data : null;
    if (!commands) return renderGenericData(data);
    return (
      <div className={styles.commandSection}>
        {commands.map((cmd, i) => (
          <div key={i} className={styles.commandHelpRow}>
            <span className={styles.commandHelpName}>{cmd.name || cmd.command || cmd}</span>
            <span className={styles.commandHelpDesc}>{cmd.description || cmd.desc || ''}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderGenericData = (data) => {
    if (data == null) return <div className={styles.commandEmptyMessage}>No data returned.</div>;
    if (typeof data === 'string') return renderProse(data);
    if (Array.isArray(data)) {
      return (
        <div className={styles.commandSection}>
          {data.map((item, i) => (
            <div key={i} className={styles.commandListItem}>
              {typeof item === 'string' ? item : typeof item === 'object' && item.name ? item.name : formatLabel(JSON.stringify(item))}
            </div>
          ))}
        </div>
      );
    }

    const entries = Object.entries(data).filter(([, v]) => v != null && v !== '' && v !== false);
    if (entries.length === 0) return <div className={styles.commandEmptyMessage}>The GM had nothing to report.</div>;

    return (
      <div className={styles.commandSection}>
        {entries.map(([key, value]) => {
          if (key.startsWith('_') || key === 'fallback') return null;

          if (typeof value === 'object' && !Array.isArray(value)) {
            return (
              <div key={key} className={styles.commandSection}>
                <div className={styles.commandSectionTitle}>{formatLabel(key)}</div>
                {renderGenericData(value)}
              </div>
            );
          }

          if (Array.isArray(value)) {
            if (value.length === 0) return null;
            return (
              <div key={key} className={styles.commandSection}>
                <div className={styles.commandSectionTitle}>{formatLabel(key)}</div>
                {value.map((item, i) => (
                  <div key={i} className={styles.commandListItem}>
                    {typeof item === 'string' ? item : item.name || item.title || JSON.stringify(item)}
                  </div>
                ))}
              </div>
            );
          }

          return (
            <div key={key} className={styles.commandRow}>
              <span className={styles.commandRowLabel}>{formatLabel(key)}</span>
              <span className={styles.commandRowValue}>
                {typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(1)) : String(value)}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderCommandResponse = (command, data) => {
    if (data == null) {
      return <div className={styles.commandEmptyMessage}>The GM had nothing to report for that command.</div>;
    }

    switch (command) {
      case 'briefing':
        return renderBriefingData(data);
      case 'status_report':
        return renderStatusReport(data);
      case 'skill_review':
        return renderSkillReview(data);
      case 'objectives':
        return renderObjectives(data);
      case 'help':
        return renderHelp(data);
      default:
        if (data.message && typeof data.message === 'string') {
          return renderProse(data.message);
        }
        return renderGenericData(data);
    }
  };

  // ─── Render Rules Result ───
  const renderRulesResult = () => {
    if (!rulesResult) return null;

    if (rulesResult.error) {
      return <div className={styles.resultContent} style={{ color: 'var(--color-danger)' }}>{rulesResult.error}</div>;
    }

    if (rulesResult.source === 'command') {
      return (
        <div className={styles.resultCommand}>
          <div className={styles.resultLabel}>{formatLabel(rulesResult.command || 'command')}</div>
          {renderCommandResponse(rulesResult.command, rulesResult.data)}
        </div>
      );
    }

    if (rulesResult.source === 'rulebook') {
      return (
        <div>
          <div className={styles.resultLabel}>Rulebook</div>
          <div className={styles.resultTitle}>{rulesResult.title}</div>
          {rulesResult.section && (
            <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: '11px', color: 'var(--text-dim)', marginBottom: '6px' }}>
              {rulesResult.section}
            </div>
          )}
          <div className={styles.commandProse}>{renderLinkedText(rulesResult.content, glossaryTerms, onEntityClick)}</div>
        </div>
      );
    }

    // No keyword match — show meta response if available, otherwise offer meta then escalation
    if (rulesResult.metaResponse) {
      return (
        <div>
          <div className={styles.metaResponse} style={{ marginBottom: 10 }}>
            <div className={styles.metaLabel}>GM</div>
            <div className={styles.metaText}>{renderLinkedText(rulesResult.metaResponse, glossaryTerms, onEntityClick)}</div>
          </div>
          {rulesResult.canEscalate && (
            <>
              <div className={styles.resultSuggestion}>Need the GM to act on this in-world?</div>
              <button className={styles.escalateButton} onClick={handleEscalate} disabled={rulesLoading}>
                {rulesLoading ? 'Thinking...' : 'Escalate (costs a turn)'}
              </button>
              <div className={styles.turnCostWarning}>This will advance the story by one turn.</div>
            </>
          )}
        </div>
      );
    }

    return (
      <div>
        <div className={styles.resultSuggestion}>
          {rulesResult.suggestion || 'Not in the rulebook. Let me ask the GM...'}
        </div>
        {rulesResult.canEscalate && !rulesResult.metaLoading && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className={styles.escalateButton} style={{ borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)' }}
              onClick={handleMetaFromRules}
              disabled={rulesLoading}
            >
              {rulesLoading ? 'Thinking...' : 'Ask the GM (free)'}
            </button>
            <button
              className={styles.escalateButton}
              onClick={handleEscalate}
              disabled={rulesLoading}
            >
              {rulesLoading ? 'Thinking...' : 'Escalate (costs a turn)'}
            </button>
          </div>
        )}
        {rulesResult.metaLoading && <div className={styles.loadingText}>The GM is thinking...</div>}
      </div>
    );
  };

  // ─── Collapsed: floating button ───
  if (!open) {
    return (
      <button
        className={styles.gmButton}
        onClick={() => setOpen(true)}
        aria-label="Talk to the GM"
        title="Talk to the GM"
      >
        ?
      </button>
    );
  }

  const contextualChip = getContextualChipLabel(lastResolution, lastStateChanges);
  const showChips = !rulesLoading;

  // ─── Expanded panel ───
  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>Talk to the GM</span>
        <button className={styles.closeButton} onClick={handleClose} aria-label="Close">&times;</button>
      </div>

      {/* Tabs */}
      <div className={styles.tabRow}>
        <button
          className={`${styles.tab} ${tabMode === 'rules' ? styles.tabActive : ''}`}
          onClick={() => setTabMode('rules')}
        >
          Rules
        </button>
        <button
          className={`${styles.tab} ${tabMode === 'story' ? styles.tabActive : ''}`}
          onClick={() => setTabMode('story')}
        >
          My Story
        </button>
      </div>

      {/* ─── Rules Tab ─── */}
      {tabMode === 'rules' && (
        <>
          <div className={styles.resultArea}>
            {showChips && (
              <div className={styles.chipRow}>
                {STATIC_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    className={styles.chip}
                    onClick={() => handleAskRules(chip)}
                    disabled={rulesLoading}
                  >
                    {chip}
                  </button>
                ))}
                <button
                  className={styles.chip}
                  onClick={() => handleAskRules(contextualChip)}
                  disabled={rulesLoading}
                >
                  <SparkleIcon />
                  {contextualChip}
                </button>
              </div>
            )}

            {rulesLoading && !rulesResult && <div className={styles.loadingText}>Asking the GM...</div>}
            {renderRulesResult()}
          </div>

          <div className={styles.inputRow}>
            <input
              ref={rulesInputRef}
              type="text"
              className={styles.input}
              placeholder="Ask a question..."
              value={rulesInput}
              onChange={e => setRulesInput(e.target.value)}
              onKeyDown={e => {
                e.stopPropagation();
                if (e.key === 'Enter' && rulesInput.trim()) {
                  e.preventDefault();
                  handleAskRules();
                }
              }}
              disabled={rulesLoading}
              maxLength={500}
              aria-label="Question for the GM"
            />
            <button
              className={styles.sendButton}
              onClick={() => handleAskRules()}
              disabled={rulesLoading || !rulesInput.trim()}
            >
              Ask
            </button>
          </div>
        </>
      )}

      {/* ─── My Story Tab ─── */}
      {tabMode === 'story' && (
        <>
          <div className={styles.resultArea}>
            {storyLoading && <div className={styles.loadingText}>The GM is considering...</div>}
            {storyResult && (
              <div className={styles.metaResponse}>
                <div className={styles.metaLabel}>GM</div>
                <div className={storyResult.isRateLimit ? styles.metaTextWarning : styles.metaText}>{renderLinkedText(storyResult.text, glossaryTerms, onEntityClick)}</div>
                {storyResult.directiveStored && (
                  <div className={styles.directiveConfirmation}>
                    {storyResult.directiveLane === 'goal'
                      ? 'The GM noted your goal and will look for opportunities.'
                      : 'The GM noted your preference.'}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={styles.storyInputArea}>
            <div className={styles.inputRow}>
              <input
                ref={storyInputRef}
                type="text"
                className={styles.input}
                placeholder={rotatingPlaceholder}
                value={storyInput}
                onChange={e => setStoryInput(e.target.value)}
                onKeyDown={e => {
                  e.stopPropagation();
                  if (e.key === 'Enter' && storyInput.trim()) {
                    e.preventDefault();
                    handleAskStory();
                  }
                }}
                disabled={storyLoading}
                maxLength={500}
                aria-label="Story question for the GM"
              />
              <button
                className={styles.sendButton}
                onClick={handleAskStory}
                disabled={storyLoading || !storyInput.trim()}
              >
                Ask
              </button>
            </div>
            <div className={styles.storyHint}>The GM will respond without advancing your turn.</div>
          </div>
        </>
      )}
    </div>
  );
}

// ─��── FILE: app/play/components/TopBar.js ────
import Link from 'next/link';
import AuthAvatar from '@/components/AuthAvatar';
import styles from './TopBar.module.css';

function SidebarIcon({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  );
}

function BookIcon({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function SettingsIcon({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function formatTopBarClock(clock) {
  if (!clock) return null;
  const hour = clock.hour ?? Math.floor((clock.globalClock || 0) / 60);
  const minute = clock.minute ?? ((clock.globalClock || 0) % 60);
  const day = clock.day ?? clock.currentDay;
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  const timeStr = `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
  return { day, timeStr, weather: clock.weather || null };
}

export default function TopBar({ setting, clock, sseConnected, sidebarOpen, onToggleSidebar, onOpenSettings, debugMode }) {
  const clockData = formatTopBarClock(clock);

  return (
    <header className={styles.topBar}>
      <div className={styles.left}>
        <Link href="/menu" className={styles.wordmark}>
          <span className={styles.crucible}>CRUCIBLE</span>
          <span className={styles.rpg}>RPG</span>
        </Link>
        {setting && (
          <>
            <div className={styles.separator} />
            <span className={styles.settingName}>{setting}</span>
          </>
        )}
      </div>
      <div className={styles.right}>
        {clockData && (
          <div className={styles.clockDisplay}>
            {clockData.day && <span className={styles.clockSegment}>Day {clockData.day}</span>}
            <span className={styles.clockDot}>{'\u00b7'}</span>
            <span className={styles.clockSegment}>{clockData.timeStr}</span>
            {clockData.weather && (
              <>
                <span className={styles.clockDot}>{'\u00b7'}</span>
                <span className={styles.clockWeather}>{clockData.weather}</span>
              </>
            )}
          </div>
        )}
        {debugMode && (
          <div className={styles.debugBadge} title="Debug mode active (Ctrl+Shift+D to toggle)">
            DEBUG
          </div>
        )}
        <Link
          href="/rulebook"
          target="_blank"
          className={styles.iconButton}
          title="Rulebook"
          aria-label="Rulebook"
        >
          <BookIcon color="#7082a4" />
        </Link>
        <button
          className={styles.iconButton}
          onClick={onOpenSettings}
          title="Display settings"
          aria-label="Display settings"
        >
          <SettingsIcon color="#7082a4" />
        </button>
        <button
          className={styles.iconButton}
          onClick={onToggleSidebar}
          title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        >
          <SidebarIcon color={sidebarOpen ? '#c9a84c' : '#7082a4'} />
        </button>
        <AuthAvatar size={28} />
        <div
          className={styles.connectionDot}
          style={{ background: sseConnected ? '#8aba7a' : '#e8845a' }}
          title={sseConnected ? 'Connected' : 'Disconnected'}
          aria-label={sseConnected ? 'Server connected' : 'Server disconnected'}
        />
      </div>
    </header>
  );
}

// ─��── FILE: app/play/components/TurnBlock.js ────
import React, { useState, forwardRef } from 'react';
import InlineDicePanel from './InlineDicePanel';
import ResolutionBlock from './ResolutionBlock';
import ReflectionBlock from './ReflectionBlock';
import { renderNarrative } from '@/lib/renderLinkedText';
import styles from './TurnBlock.module.css';

// Format clock fields for display
function formatTime(clock) {
  if (!clock) return null;
  const hour = clock.hour ?? Math.floor((clock.globalClock || 0) / 60);
  const minute = clock.minute ?? ((clock.globalClock || 0) % 60);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
}

function getTimeEmoji(clock) {
  if (!clock) return null;
  const hour = clock.hour ?? Math.floor((clock.globalClock || 0) / 60);
  if (hour >= 5 && hour < 8) return '\u{1F305}';   // sunrise
  if (hour >= 8 && hour < 18) return '\u2600\uFE0F'; // sun
  if (hour >= 18 && hour < 21) return '\u{1F307}';  // sunset
  return '\u{1F319}';                                 // night
}

function getWeatherEmoji(weather) {
  if (!weather) return null;
  const w = weather.toLowerCase();
  if (w.includes('clear') || w.includes('sunny')) return '\u2600\uFE0F';
  if (w.includes('cloud') || w.includes('overcast')) return '\u2601\uFE0F';
  if (w.includes('storm') || w.includes('thunder')) return '\u26C8\uFE0F';
  if (w.includes('rain') || w.includes('drizzle')) return '\u{1F327}\uFE0F';
  if (w.includes('snow') || w.includes('blizzard')) return '\u2744\uFE0F';
  if (w.includes('fog') || w.includes('mist')) return '\u{1F32B}\uFE0F';
  if (w.includes('wind')) return '\u{1F32C}\uFE0F';
  return null;
}

// ─── Status Change Badges ───
// Conditions: added=warning(orange), removed=cleared(green), modified=escalated(orange)
// Inventory: added=gained(gold), removed=lost(orange), modified=modified(blue)
// CON conditions get red instead of orange

function StatusBadges({ stateChanges }) {
  if (!stateChanges) return null;

  const badges = [];

  // Conditions
  const conds = stateChanges.conditions;
  if (conds) {
    if (Array.isArray(conds.added)) {
      conds.added.forEach(item => {
        const name = typeof item === 'string' ? item : (item.name || 'Unknown condition');
        const isCon = (typeof item === 'object' && item !== null) ? (item.stat || '').toLowerCase() === 'con' : false;
        badges.push({
          type: isCon ? 'condConDanger' : 'condAdded',
          text: `\u26A0 ${name}${(typeof item === 'object' && item?.penalty) ? `: ${item.penalty} ${(item.stat || '').toUpperCase()}` : ''}`,
          key: `cond-add-${name}`,
        });
      });
    }
    if (Array.isArray(conds.removed)) {
      conds.removed.forEach(item => {
        const name = typeof item === 'string' ? item : (item.name || 'Unknown condition');
        badges.push({
          type: 'condRemoved',
          text: `\u2713 ${name} cleared`,
          key: `cond-rm-${name}`,
        });
      });
    }
    if (Array.isArray(conds.modified)) {
      conds.modified.forEach(item => {
        const name = typeof item === 'string' ? item : (item.name || 'Unknown condition');
        const isCon = (typeof item === 'object' && item !== null) ? (item.stat || '').toLowerCase() === 'con' : false;
        badges.push({
          type: isCon ? 'condConDanger' : 'condModified',
          text: `\u26A0 ${name}${(typeof item === 'object' && item?.previousName) ? ` \u2192 ${item.name}` : ' escalated'}`,
          key: `cond-mod-${name}`,
        });
      });
    }
  }

  // Inventory
  const inv = stateChanges.inventory;
  if (inv) {
    if (Array.isArray(inv.added)) {
      inv.added.forEach(item => {
        const name = typeof item === 'string' ? item : (item.name || 'Unknown item');
        badges.push({
          type: 'invAdded',
          text: `+ ${name}`,
          key: `inv-add-${name}`,
        });
      });
    }
    if (Array.isArray(inv.removed)) {
      inv.removed.forEach(item => {
        const name = typeof item === 'string' ? item : (item.name || 'Unknown item');
        badges.push({
          type: 'invRemoved',
          text: `\u2013 ${name}`,
          key: `inv-rm-${name}`,
        });
      });
    }
    if (Array.isArray(inv.modified)) {
      inv.modified.forEach(item => {
        const name = typeof item === 'string' ? item : (item.name || 'Unknown item');
        badges.push({
          type: 'invModified',
          text: `~ ${name}`,
          key: `inv-mod-${name}`,
        });
      });
    }
  }

  if (badges.length === 0) return null;

  const badgeClass = (type) => {
    switch (type) {
      case 'condAdded':    return styles.badgeCondWarning;
      case 'condModified': return styles.badgeCondWarning;
      case 'condConDanger':return styles.badgeCondCon;
      case 'condRemoved':  return styles.badgeCondCleared;
      case 'invAdded':     return styles.badgeInvGained;
      case 'invRemoved':   return styles.badgeInvLost;
      case 'invModified':  return styles.badgeInvModified;
      default:             return styles.badgeCondWarning;
    }
  };

  return (
    <div className={styles.badges}>
      {badges.map(b => (
        <span key={b.key} className={`${styles.badge} ${badgeClass(b.type)}`}>
          {b.text}
        </span>
      ))}
    </div>
  );
}

const TurnBlock = forwardRef(function TurnBlock({ turn, isNew, glossaryTerms, onEntityClick }, ref) {
  const hasResolution = !!turn.resolution;
  const shouldAnimate = isNew && hasResolution;
  const [showContent, setShowContent] = useState(!shouldAnimate);

  const timeStr = formatTime(turn.clock);
  const timeEmoji = getTimeEmoji(turn.clock);
  const day = turn.clock?.day ?? turn.clock?.currentDay;
  const weatherEmoji = getWeatherEmoji(turn.weather);

  return (
    <div className={styles.turnBlock} ref={ref}>
      <div className={styles.turnHeader}>
        {turn.location && (
          <span className={styles.headerChip}>
            <span className={styles.headerEmoji}>{'\u{1F4CD}'}</span>
            <span className={styles.headerValue}>{turn.location}</span>
          </span>
        )}
        {day && (
          <span className={styles.headerChip}>
            <span className={styles.headerEmoji}>{'\u{1F4C5}'}</span>
            <span className={styles.headerValue}>Day {day}</span>
          </span>
        )}
        {timeStr && (
          <span className={styles.headerChip}>
            <span className={styles.headerEmoji}>{timeEmoji}</span>
            <span className={styles.headerValue}>{timeStr}</span>
          </span>
        )}
        {turn.weather && (
          <span className={styles.headerChip}>
            {weatherEmoji && <span className={styles.headerEmoji}>{weatherEmoji}</span>}
            <span className={styles.headerValue}>{turn.weather}</span>
          </span>
        )}
        <span className={styles.headerChip}>
          <span className={styles.headerEmoji}>{'\u{1F504}'}</span>
          <span className={styles.headerValue}>Turn {turn.number}</span>
        </span>
      </div>

      {turn.playerAction && (
        <div className={styles.playerAction}>{turn.playerAction}</div>
      )}

      {/* Dice display — shows Fortune's Balance, animated d20s */}
      <InlineDicePanel
        resolution={turn.resolution}
        animate={shouldAnimate}
        onComplete={() => setShowContent(true)}
      />

      {/* Resolution + narrative appear after dice animation completes */}
      {showContent && (
        <>
          <ResolutionBlock resolution={turn.resolution} />

          <ReflectionBlock reflection={turn.reflection} glossaryTerms={glossaryTerms} onEntityClick={onEntityClick} />

          <div className={styles.narrativeText}>
            {renderNarrative(turn.narrative, glossaryTerms, onEntityClick)}
          </div>

          <StatusBadges stateChanges={turn.stateChanges} />
        </>
      )}
    </div>
  );
});

export default TurnBlock;
