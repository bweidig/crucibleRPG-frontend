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
import ImageLightbox from './components/ImageLightbox';
import GalleryModal from './components/GalleryModal';
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

// ─── Streaming text drain rates (words per second) ─────────────────────────
// Base pace is a hair above comfortable reading; CATCHUP kicks in when the
// model is outrunning the render and we need to keep pace; FLUSH applies once
// the stream has finished so leftover buffered text doesn't trickle in for
// seconds after the response is "done."
const STREAM_WPS_BASE = 30;
const STREAM_WPS_CATCHUP = 50;
const STREAM_WPS_FLUSH = 60;
const STREAM_CATCHUP_WORD_THRESHOLD = 50;

// Drain up to `count` whitespace-delimited words from the front of `text`.
// Whitespace surrounding the drained words is included in `consumed` so
// concatenation reproduces the original formatting exactly.
//
// When `allowPartial` is false (stream still open) and the buffer ends in the
// middle of a word (no trailing whitespace), that partial word is held back
// for the next tick — prevents half-written words flashing on screen between
// chunks. When the stream is complete, `allowPartial` flips true and the
// remainder is flushed as-is.
function takeWords(text, count, allowPartial) {
  if (count <= 0 || !text) return { consumed: '', rest: text || '', count: 0 };

  let pos = 0;
  let wordsTaken = 0;

  while (pos < text.length && wordsTaken < count) {
    while (pos < text.length && /\s/.test(text[pos])) pos++;
    if (pos >= text.length) break;

    const wordStart = pos;
    while (pos < text.length && !/\s/.test(text[pos])) pos++;

    const endedAtSpace = pos < text.length;
    if (!endedAtSpace && !allowPartial) {
      // Partial word at end of buffer — back off and wait for more data.
      pos = wordStart;
      break;
    }
    wordsTaken++;
  }

  // Carry any trailing whitespace with the emitted words so the next call
  // starts on a clean word boundary.
  while (pos < text.length && /\s/.test(text[pos])) pos++;

  return { consumed: text.slice(0, pos), rest: text.slice(pos), count: wordsTaken };
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
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    return !window.matchMedia('(max-width: 1023px)').matches;
  });
  const [notifications, setNotifications] = useState({});

  // ─── Display Settings ───
  const [displaySettings, setDisplaySettings] = useState(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // ─── Entity Popup ───
  const [entityPopup, setEntityPopup] = useState(null);

  // Enrich item entities with inventory mechanical data before opening popup.
  // Narrative links only pass { term, type }, missing durability/damage/etc.
  // This mirrors the pattern GlossaryTab uses, but centralized for all click sources.
  const handleEntityClick = useCallback((entity) => {
    if (entity && characterData && (entity.type || '').toLowerCase() === 'item' && !entity.equipmentCategory) {
      const allItems = [
        ...(characterData.inventory?.equipped || []),
        ...(characterData.inventory?.carried || []),
      ];
      const match = allItems.find(i =>
        (i.name || '').toLowerCase() === (entity.term || entity.name || '').toLowerCase()
      );
      if (match) {
        setEntityPopup({ ...match, ...entity, term: entity.term || match.name, type: 'item' });
        return;
      }
    }
    setEntityPopup(entity);
  }, [characterData]);

  // ─── Report Modal ───
  const [reportMode, setReportMode] = useState(null); // null | 'bug' | 'suggest'

  // ─── Rewind ───
  const [rewindAvailable, setRewindAvailable] = useState(false);
  const [rewinding, setRewinding] = useState(false);

  // ─── Visualization ───
  const [visualizing, setVisualizing] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  // ─── Directives ───
  const [directiveState, setDirectiveState] = useState(null);
  const [directiveToasts, setDirectiveToasts] = useState([]);

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

  // Turn number of the turn currently being streamed via SSE (null when not streaming).
  // Ref (not state) because SSE event handlers registered at mount need the live value
  // without stale closures and without re-registering on every state change.
  const streamingTurnRef = useRef(null);

  // Streaming text buffer — narrative chunks arrive from SSE instantly but are
  // drained to the rendered turn state at a steady words-per-second pace, so
  // the player sees a smooth "typing" effect instead of jittery chunk jumps.
  //   pre/post       — unrendered text, split by AD-673 phase (pre/post roll)
  //   complete       — true once turn:complete has fired (drain in flush mode)
  //   draining       — guards against running two concurrent drain loops
  //   turnNumber     — which turn the drained text belongs to
  //   wordDebt       — fractional word accumulator for accurate WPS pacing
  //   generation     — bumped on reset so in-flight RAF loops from a prior
  //                    turn self-terminate before writing into the new turn
  const streamBufferRef = useRef({
    pre: '',
    post: '',
    complete: false,
    draining: false,
    turnNumber: null,
    wordDebt: 0,
    generation: 0,
  });

  // gameState mirror for SSE handlers: event listeners register once and close over
  // mount-time state. turn:complete needs the current clock to merge weather/day into
  // the finalized turn. useEffect below keeps the ref in sync.
  const gameStateRef = useRef(null);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

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

  // Keyboard shortcuts: A/B/C → corresponding choice button (delegating to its click
  // handler so selected/disabled logic is shared). Skipped when any modal/panel is
  // open or when focus is inside an editable element (input/textarea/contenteditable).
  useEffect(() => {
    function onKey(e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const el = document.activeElement;
      const isEditable = el && (
        el.tagName === 'INPUT' ||
        el.tagName === 'TEXTAREA' ||
        el.isContentEditable
      );
      if (isEditable) return;

      if (settingsOpen || entityPopup || reportMode || galleryOpen || lightboxImage) return;
      if (document.querySelector('[data-talk-to-gm-open="true"]')) return;

      const key = e.key?.toUpperCase();
      if (key === 'A' || key === 'B' || key === 'C') {
        const btn = document.querySelector(`[data-choice-id="${key}"]`);
        if (btn && !btn.disabled) {
          e.preventDefault();
          btn.click();
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [settingsOpen, entityPopup, reportMode, galleryOpen, lightboxImage]);

  // Save display settings when they change
  const handleSettingsChange = useCallback((newSettings) => {
    setDisplaySettings(newSettings);
    saveSettings(newSettings);
    window.dispatchEvent(new Event('display-settings-changed'));
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

  // ─── Directive Handlers ───
  // (Must be declared before handleTurnResponse which references them)
  const refetchDirectiveState = useCallback(async () => {
    if (!gameId) return;
    try {
      const state = await api.get(`/api/game/${gameId}/state`);
      setDirectiveState(state.directives || state.directiveState || null);
    } catch (err) {
      console.error('Failed to refetch directive state:', err);
    }
  }, [gameId]);

  const handleDeleteDirective = useCallback(async ({ lane, index }) => {
    if (!gameId) return;
    try {
      const res = await api.del(`/api/game/${gameId}/talk-to-gm/meta/directive?lane=${lane}&index=${index}`);
      setDirectiveState(res.directives || res);
    } catch (err) {
      console.error('Failed to remove directive:', err);
    }
  }, [gameId]);

  const handleRestoreDirective = useCallback(async (text) => {
    if (!gameId) return;
    try {
      await api.post(`/api/game/${gameId}/talk-to-gm/meta`, { question: `Please restore my directive: ${text}` });
      refetchDirectiveState();
    } catch (err) {
      console.error('Failed to restore directive:', err);
    }
  }, [gameId, refetchDirectiveState]);

  const addDirectiveToast = useCallback((removed) => {
    const id = Date.now() + Math.random();
    setDirectiveToasts(prev => [...prev, { id, ...removed }]);
    setTimeout(() => {
      setDirectiveToasts(prev => prev.map(t => t.id === id ? { ...t, fading: true } : t));
      setTimeout(() => {
        setDirectiveToasts(prev => prev.filter(t => t.id !== id));
      }, 300);
    }, 8000);
  }, []);

  const dismissDirectiveToast = useCallback((id) => {
    setDirectiveToasts(prev => prev.map(t => t.id === id ? { ...t, fading: true } : t));
    setTimeout(() => {
      setDirectiveToasts(prev => prev.filter(t => t.id !== id));
    }, 300);
  }, []);

  // ─── Shared turn response handler (used by submitAction + TalkToGM escalation) ───
  const handleTurnResponse = useCallback((response, playerActionText = null) => {
    // Streaming path: backend will emit the narrative over SSE. Drop a placeholder
    // turn with _isStreaming: true so the SSE handlers can find and append into it.
    // turn:complete (or turn:error) is what clears `submitting` and flips the flag off.
    if (response.streaming) {
      streamingTurnRef.current = response.turn.number;
      // Reinitialize the streaming buffer for this turn. Bumping generation
      // retires any RAF loop still in flight from a prior turn before it can
      // write into the new placeholder.
      streamBufferRef.current = {
        pre: '',
        post: '',
        complete: false,
        draining: false,
        turnNumber: response.turn.number,
        wordDebt: 0,
        generation: streamBufferRef.current.generation + 1,
      };
      setSubmitting(true);
      const clock = gameStateRef.current?.clock || null;
      setTurns(prev => [
        ...prev.map(t => t._isNew ? { ...t, _isNew: false } : t),
        {
          number: response.turn.number,
          sessionTurn: response.turn.sessionTurn,
          narrative: { preRoll: '', postRoll: '' },
          resolution: response.resolution || null,
          stateChanges: null,
          playerAction: playerActionText,
          clock,
          weather: clock?.weather || null,
          location: gameStateRef.current?.world?.currentLocation || null,
          _isNew: true,
          _isStreaming: true,
        },
      ]);
      return;
    }

    if (!response.turnAdvanced) return;

    // Merge stateChanges.clock with gameState.clock so weather, currentDay, etc.
    // persist even when the action response only sends { day, hour, minute }
    const turnClock = response.stateChanges?.clock
      ? { ...gameState?.clock, ...response.stateChanges.clock }
      : gameState?.clock || null;

    // Extract reflection from mechanicalResults (Long Rest end-of-day reflection)
    const reflection = response.mechanicalResults?.reflection || response.stateChanges?.reflection || null;

    // Clear _isNew from prior turns so only the newest plays the entrance animation.
    setTurns(prev => [
      ...prev.map(t => t._isNew ? { ...t, _isNew: false } : t),
      {
        number: response.turn.number,
        sessionTurn: response.turn.sessionTurn,
        narrative: response.narrative, // string OR { preRoll, postRoll } per AD-673
        gmAside: response.gmAside || null, // AD-674 — optional inline mechanical note
        resolution: response.resolution || null,
        stateChanges: response.stateChanges || null,
        reflection,
        cutParagraph: response.cutParagraph ?? null, // AD-726 — scene-cut closing prose (undefined pre-AD-726)
        playerAction: playerActionText,
        clock: turnClock,
        weather: turnClock?.weather || null,
        location: gameState?.world?.currentLocation || null,
        _isNew: true,
      },
    ]);

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

    // Update rewind availability from turn response
    if (response.rewindAvailable != null) {
      setRewindAvailable(response.rewindAvailable);
    }

    if (response.stateChanges) {
      addNotifications(response.stateChanges);
      refetchCharacter();
      refetchGlossary();
    }

    // AD-666: flag the Character tab when a passive mastery unlocks so the
    // new row in the Passive Masteries list (populated by the refetch above)
    // doesn't go unnoticed.
    if (response.mechanicalResults?.passive_mastery_unlocked) {
      setNotifications(prev => ({ ...prev, character: (prev.character || 0) + 1 }));
    }

    // Check for directive fulfillment
    if (response.directivesRemoved && response.directivesRemoved.length > 0) {
      for (const removed of response.directivesRemoved) {
        addDirectiveToast(removed);
      }
      refetchDirectiveState();
    }

    // Enrich latest debug entry with turn number
    if (response.turn?.number) {
      setDebugLog(prev => {
        if (prev.length === 0) return prev;
        const [latest, ...rest] = prev;
        return [{ ...latest, turnNumber: response.turn.number }, ...rest];
      });
    }
  }, [addNotifications, refetchCharacter, refetchGlossary, gameState, addDirectiveToast, refetchDirectiveState]);


  // ─── Meta Response Handler (My Story tab → GM aside in narrative) ───
  const handleMetaResponse = useCallback((content) => {
    setTurns(prev => [...prev, {
      type: 'gm_aside',
      content,
      timestamp: Date.now(),
    }]);
  }, []);

  // ─── Rewind Handler ───
  const handleRewind = useCallback(async () => {
    if (!gameId || rewinding) return;
    setRewinding(true);
    setError(null);

    try {
      const res = await api.post(`/api/game/${gameId}/rewind`);

      if (res.rewound) {
        // Remove last real turn (skip trailing gm_aside entries)
        setTurns(prev => {
          const reversed = [...prev];
          let cutIndex = reversed.length;
          for (let i = reversed.length - 1; i >= 0; i--) {
            cutIndex = i;
            if (reversed[i].type !== 'gm_aside') break;
          }
          return reversed.slice(0, cutIndex);
        });

        // Update all state from the returned game state
        const state = res.state || res;
        if (state.narrative?.availableActions) {
          setActions(state.narrative.availableActions);
        }
        if (state.world) {
          setGameState(prev => prev ? { ...prev, world: state.world } : prev);
        }
        if (state.clock) {
          setGameState(prev => prev ? { ...prev, clock: state.clock } : prev);
        }
        setRewindAvailable(false);

        // Refetch character/glossary to pick up restored state
        refetchCharacter();
        refetchGlossary();
      }
    } catch (err) {
      console.error('Rewind failed:', err);
      if (err.status === 400) {
        setError(err.message || 'No turn to rewind');
        setRewindAvailable(false);
      } else {
        setError(err.message || 'Rewind failed. Please try again.');
      }
    } finally {
      setRewinding(false);
    }
  }, [gameId, rewinding, refetchCharacter, refetchGlossary]);

  // ─── Visualize Handler ───
  const handleVisualize = useCallback(async () => {
    if (!gameId || visualizing) return;
    setVisualizing(true);
    try {
      const res = await api.post(`/api/game/${gameId}/visualize`, {});
      // Attach image to the latest real turn
      const sceneImage = {
        imageUrl: res.imageUrl,
        blurb: res.blurb || null,
        turnNumber: res.turnNumber,
        resolution: res.resolution,
        createdAt: res.createdAt,
      };
      setTurns(prev => {
        const updated = [...prev];
        // Find last real turn (not gm_aside)
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i].type !== 'gm_aside') {
            updated[i] = { ...updated[i], sceneImage };
            break;
          }
        }
        return updated;
      });
    } catch (err) {
      console.error('Visualize failed:', err);
      if (err.status !== 403) {
        setError(err.message || 'Failed to generate scene image.');
      }
    } finally {
      setVisualizing(false);
    }
  }, [gameId, visualizing]);

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

      if (response.streaming || response.turnAdvanced) {
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
      // Streaming path keeps `submitting` true until turn:complete or turn:error fires.
      if (!streamingTurnRef.current) {
        setSubmitting(false);
      }
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

        // Convert recentNarrative to turn blocks (this gives us the most recent
        // chunks with full role/content fidelity, which we use as the canonical
        // source for those turns).
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

        // Full history: fetch paginated /history and merge in any older turns
        // not already covered by recentNarrative. recentNarrative is bounded
        // by the backend; /history returns everything. Without this step, the
        // narrative would start at whatever cutoff the backend uses for "recent"
        // and prior-session turns wouldn't appear on rejoin.
        (async () => {
          try {
            const collected = [];
            let page = 1;
            const pageSize = 50;
            while (page <= 20) { // safety cap at 1000 turns
              const data = await api.get(`/api/game/${gameId}/history?page=${page}&pageSize=${pageSize}`);
              if (cancelled) return;
              const pageTurns = Array.isArray(data?.turns) ? data.turns : [];
              if (pageTurns.length === 0) break;
              collected.push(...pageTurns);
              const total = typeof data?.total === 'number' ? data.total : collected.length;
              if (collected.length >= total) break;
              page++;
            }
            if (cancelled || collected.length === 0) return;

            setTurns(prev => {
              const realTurns = prev.filter(t => t.type !== 'gm_aside');
              const asides = prev.filter(t => t.type === 'gm_aside');
              const existingNumbers = new Set(realTurns.map(t => t.number));
              // Map /history entries (structured per-turn) into our internal turn shape.
              // /history doesn't include resolution/stateChanges — historical turns
              // render with no dice and no consequences, which is fine.
              const additions = collected
                .filter(h => h?.number != null && !existingNumbers.has(h.number))
                .map(h => ({
                  number: h.number,
                  playerAction: h.playerAction || null,
                  narrative: h.narrative || null,
                  resolution: null,
                  stateChanges: null,
                  clock: h.timestamp ? {
                    day: h.timestamp.day,
                    hour: h.timestamp.hour,
                    minute: h.timestamp.minute,
                  } : null,
                  location: h.location || null,
                }));
              if (additions.length === 0) return prev;
              const merged = [...realTurns, ...additions].sort(
                (a, b) => (a.number || 0) - (b.number || 0)
              );
              return [...merged, ...asides];
            });
          } catch (err) {
            console.error('Failed to load full game history:', err);
          }
        })();

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
          if (state?.rewindAvailable != null) {
            setRewindAvailable(state.rewindAvailable);
          }
          if (state?.directives || state?.directiveState) {
            setDirectiveState(state.directives || state.directiveState);
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

          // ─── Narrative streaming events ───────────────────────────────────
          // The backend may emit narrative over SSE (POST /action returns
          // { streaming: true, turn, resolution } immediately, then streams chunks).
          // Listeners are registered once per mount and rely on refs (streamingTurnRef,
          // gameStateRef) to read live values without stale closures.

          // Safety sync — should match the placeholder we just built in submitAction.
          es.addEventListener('turn:start', (event) => {
            try {
              const data = JSON.parse(event.data);
              if (streamingTurnRef.current !== data.turnNumber) {
                console.warn('turn:start turnNumber mismatch', data.turnNumber, streamingTurnRef.current);
              }
            } catch (err) {
              console.error('Failed to parse turn:start:', err);
            }
          });

          // Paced drain loop — consumes buffered text at STREAM_WPS_* and writes
          // drained words into the streaming turn's narrative state. Started
          // lazily on the first chunk for a turn (or restarted after an idle
          // gap). A `generation` check in each tick lets buffer resets retire
          // stale loops without cancel-handle plumbing.
          function startDrainLoop() {
            const myGen = streamBufferRef.current.generation;
            let lastTime = performance.now();

            function drain(now) {
              const buf = streamBufferRef.current;
              if (buf.generation !== myGen || !buf.draining) return;

              // Clamp dt so a backgrounded tab waking up doesn't dump half the
              // buffer in one frame.
              const elapsed = Math.min(0.1, (now - lastTime) / 1000);
              lastTime = now;

              // Buffer empty: either all done, or parked waiting for new data.
              if (!buf.pre && !buf.post) {
                buf.wordDebt = 0;
                buf.draining = false;
                return;
              }

              const approxWords =
                (buf.pre ? buf.pre.split(/\s+/).filter(Boolean).length : 0) +
                (buf.post ? buf.post.split(/\s+/).filter(Boolean).length : 0);
              let wps = STREAM_WPS_BASE;
              if (buf.complete) wps = STREAM_WPS_FLUSH;
              else if (approxWords > STREAM_CATCHUP_WORD_THRESHOLD) wps = STREAM_WPS_CATCHUP;

              buf.wordDebt += elapsed * wps;
              const wordsThisFrame = Math.floor(buf.wordDebt);

              let emittedPre = '';
              let emittedPost = '';

              if (wordsThisFrame > 0) {
                buf.wordDebt -= wordsThisFrame;
                let remaining = wordsThisFrame;

                // Drain pre first so narrative order is preserved.
                if (buf.pre) {
                  const result = takeWords(buf.pre, remaining, buf.complete);
                  emittedPre = result.consumed;
                  buf.pre = result.rest;
                  remaining -= result.count;
                }
                // Only advance to post once pre is fully drained.
                if (!buf.pre && buf.post && remaining > 0) {
                  const result = takeWords(buf.post, remaining, buf.complete);
                  emittedPost = result.consumed;
                  buf.post = result.rest;
                }

                if (emittedPre || emittedPost) {
                  const targetTurnNumber = buf.turnNumber;
                  setTurns(prev => {
                    const idx = prev.findIndex(t => t.number === targetTurnNumber);
                    if (idx === -1) return prev;
                    const updated = [...prev];
                    const turn = { ...updated[idx] };
                    const narrative = (typeof turn.narrative === 'object' && turn.narrative !== null)
                      ? { ...turn.narrative }
                      : { preRoll: '', postRoll: '' };
                    if (emittedPre) narrative.preRoll = (narrative.preRoll || '') + emittedPre;
                    if (emittedPost) narrative.postRoll = (narrative.postRoll || '') + emittedPost;
                    turn.narrative = narrative;
                    updated[idx] = turn;
                    return updated;
                  });
                }
              }

              // Stall: we had word budget but takeWords held back a partial
              // word and the stream isn't done. Park the loop — the next
              // turn:narrative chunk will restart us with fresh data.
              const stalled = wordsThisFrame > 0 && !emittedPre && !emittedPost;
              if (stalled && !buf.complete) {
                buf.wordDebt = 0;
                buf.draining = false;
                return;
              }

              requestAnimationFrame(drain);
            }

            requestAnimationFrame(drain);
          }

          // Append a chunk into the streaming buffer (not directly into state).
          // Payload: { turnNumber, chunk, phase?: "pre" | "post" } — phase absent
          // on no-roll turns / split fallbacks; default to post in that case.
          // The drain loop pulls words out at STREAM_WPS_* and updates state.
          es.addEventListener('turn:narrative', (event) => {
            try {
              const data = JSON.parse(event.data);
              if (streamingTurnRef.current == null) return;

              const buf = streamBufferRef.current;
              // Defensive: first chunk seeds the turn number if handleTurnResponse
              // somehow hasn't set it. Mismatched turn numbers are ignored.
              if (buf.turnNumber == null) buf.turnNumber = data.turnNumber;
              if (data.turnNumber !== buf.turnNumber) return;

              if (data.phase === 'pre') {
                buf.pre += data.chunk;
              } else {
                buf.post += data.chunk;
              }

              if (!buf.draining) {
                buf.draining = true;
                startDrainLoop();
              }
            } catch (err) {
              console.error('Failed to parse turn:narrative:', err);
            }
          });

          // Inline GM aside (AD-674) — appended to the streaming turn when present.
          es.addEventListener('turn:gm_aside', (event) => {
            try {
              const data = JSON.parse(event.data);
              setTurns(prev => {
                const idx = prev.findIndex(t => t.number === data.turnNumber);
                if (idx === -1) return prev;
                const updated = [...prev];
                updated[idx] = { ...updated[idx], gmAside: data.aside ?? data.content };
                return updated;
              });
            } catch (err) {
              console.error('Failed to parse turn:gm_aside:', err);
            }
          });

          // NPC wound states (combat turns).
          es.addEventListener('turn:npc_states', (event) => {
            try {
              const data = JSON.parse(event.data);
              setTurns(prev => {
                const idx = prev.findIndex(t => t.number === data.turnNumber);
                if (idx === -1) return prev;
                const updated = [...prev];
                updated[idx] = { ...updated[idx], npcStates: data.npcStates };
                return updated;
              });
            } catch (err) {
              console.error('Failed to parse turn:npc_states:', err);
            }
          });

          // Streaming ended successfully — finalize the turn with stateChanges /
          // nextActions / clock merges and re-enable the action panel.
          // Narrative text may still be flushing through the drain loop when
          // this fires; marking the buffer complete switches it to FLUSH rate
          // so trailing text doesn't trickle in for seconds after. The action
          // panel re-enables immediately (see setSubmitting(false) below) —
          // the player is still reading anyway.
          es.addEventListener('turn:complete', (event) => {
            try {
              const data = JSON.parse(event.data);
              if (streamingTurnRef.current == null) return;
              streamingTurnRef.current = null;

              // Signal the drain loop to flush. If a drain loop is parked
              // (buffer drained empty between chunks), kick it back on so any
              // remaining bytes arriving right before close still render.
              const buf = streamBufferRef.current;
              buf.complete = true;
              if ((buf.pre || buf.post) && !buf.draining) {
                buf.draining = true;
                startDrainLoop();
              }

              // Mirror handleTurnResponse's clock merge: preserve weather/currentDay
              // when backend only sent { day, hour, minute } in stateChanges.clock.
              const turnClock = data.stateChanges?.clock
                ? { ...gameStateRef.current?.clock, ...data.stateChanges.clock }
                : gameStateRef.current?.clock || null;

              // Extract reflection (Long Rest end-of-day) like handleTurnResponse does.
              const reflection = data.mechanicalResults?.reflection
                || data.stateChanges?.reflection
                || null;

              setTurns(prev => {
                const idx = prev.findIndex(t => t.number === data.turnNumber && t._isStreaming);
                if (idx === -1) return prev;
                const updated = [...prev];
                updated[idx] = {
                  ...updated[idx],
                  stateChanges: data.stateChanges || null,
                  reflection,
                  cutParagraph: data.cutParagraph ?? null, // AD-726
                  clock: turnClock,
                  weather: turnClock?.weather || null,
                  _isStreaming: false,
                };
                return updated;
              });

              if (data.nextActions) {
                setActions(data.nextActions);
              }

              // Clear session recap + merge clock into gameState (same as handleTurnResponse).
              setGameState(prev => {
                if (!prev) return prev;
                const updates = { sessionRecap: null };
                if (data.stateChanges?.clock) {
                  updates.clock = { ...prev.clock, ...data.stateChanges.clock };
                }
                return { ...prev, ...updates };
              });

              if (data.rewindAvailable != null) {
                setRewindAvailable(data.rewindAvailable);
              }

              if (data.stateChanges) {
                addNotifications(data.stateChanges);
                refetchCharacter();
                refetchGlossary();
              }

              // AD-666: flag Character tab when a passive mastery unlocks.
              if (data.mechanicalResults?.passive_mastery_unlocked) {
                setNotifications(prev => ({ ...prev, character: (prev.character || 0) + 1 }));
              }

              // Directive fulfillment toasts.
              if (data.directivesRemoved && data.directivesRemoved.length > 0) {
                for (const removed of data.directivesRemoved) {
                  addDirectiveToast(removed);
                }
                refetchDirectiveState();
              }

              // Enrich latest debug entry with turn number + debug payload.
              if (data.turnNumber != null) {
                setDebugLog(prev => {
                  if (prev.length === 0) return prev;
                  const [latest, ...rest] = prev;
                  const patched = { ...latest, turnNumber: data.turnNumber };
                  if (data._debug) patched.debug = data._debug;
                  return [patched, ...rest];
                });
              }

              setSubmitting(false);
            } catch (err) {
              console.error('Failed to parse turn:complete:', err);
              streamingTurnRef.current = null;
              setSubmitting(false);
            }
          });

          // Backend silent retry — clear any narrative chunks we've rendered for
          // this turn but keep the placeholder (and dice, which came from the
          // synchronous POST resolution) so the player doesn't see the roll
          // flicker out of existence. A fresh turn:narrative sequence follows.
          es.addEventListener('turn:discard', (event) => {
            try {
              const data = JSON.parse(event.data);
              setTurns(prev => {
                const idx = prev.findIndex(t => t.number === data.turnNumber && t._isStreaming);
                if (idx === -1) return prev;
                const updated = [...prev];
                updated[idx] = {
                  ...updated[idx],
                  narrative: { preRoll: '', postRoll: '' },
                  gmAside: null,
                };
                return updated;
              });
              // Clear any buffered-but-not-yet-rendered text and bump generation
              // so the in-flight drain loop self-terminates before the retry
              // stream repopulates the buffer. streamingTurnRef and `submitting`
              // stay set — retry stream is incoming.
              streamBufferRef.current = {
                pre: '',
                post: '',
                complete: false,
                draining: false,
                turnNumber: data.turnNumber,
                wordDebt: 0,
                generation: streamBufferRef.current.generation + 1,
              };
            } catch (err) {
              console.error('Failed to parse turn:discard:', err);
            }
          });

          // Unrecoverable error during streaming. Clean up and surface the error.
          es.addEventListener('turn:error', (event) => {
            try {
              const data = JSON.parse(event.data);
              streamingTurnRef.current = null;
              // Drop anything in the buffer and retire the drain loop.
              streamBufferRef.current = {
                pre: '',
                post: '',
                complete: false,
                draining: false,
                turnNumber: null,
                wordDebt: 0,
                generation: streamBufferRef.current.generation + 1,
              };
              setTurns(prev => prev.filter(t => !(t.number === data.turnNumber && t._isStreaming)));
              setError(data.error || 'Turn failed. Please try again.');
              setSubmitting(false);
            } catch (err) {
              console.error('Failed to parse turn:error:', err);
              streamingTurnRef.current = null;
              streamBufferRef.current.draining = false;
              streamBufferRef.current.generation++;
              setSubmitting(false);
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
            // Prime gameStateRef so the streaming placeholder built inside
            // handleTurnResponse picks up the freshly-loaded clock/world instead of
            // null (the useEffect that syncs the ref from state hasn't fired yet).
            gameStateRef.current = game;
            const res = await api.post(`/api/game/${gameId}/action`, {
              custom: 'Begin the adventure',
            });
            if (cancelled) return;

            if (res.streaming) {
              // Streaming path: handleTurnResponse creates the placeholder and
              // keeps submitting=true; turn:complete finalizes.
              handleTurnResponse(res, null);
            } else if (res.turnAdvanced) {
              const firstTurnClock = res.stateChanges?.clock
                ? { ...game.clock, ...res.stateChanges.clock }
                : game.clock || null;

              setTurns([{
                number: res.turn.number,
                sessionTurn: res.turn.sessionTurn,
                narrative: res.narrative, // AD-673 shape: string OR { preRoll, postRoll }
                gmAside: res.gmAside || null, // AD-674
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
              if (res.rewindAvailable != null) {
                setRewindAvailable(res.rewindAvailable);
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
      streamingTurnRef.current = null;
      // Stop the drain loop so no orphan RAF survives unmount.
      streamBufferRef.current.draining = false;
      streamBufferRef.current.generation++;
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

  // Lock body scroll while the loading overlay is showing. iOS Safari will
  // otherwise let the page scroll behind the fixed overlay (the body's
  // min-height: 100vh exceeds the visible viewport when the URL bar is up),
  // which shows a scroll indicator even though there's nothing to see.
  useEffect(() => {
    if (overlayDismissed) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [overlayDismissed]);

  function handleEnterWorld() {
    setOverlayFading(true);
    window.scrollTo(0, 0);
    setTimeout(() => {
      setOverlayDismissed(true);
      // Scroll narrative to top for new games so player reads the prologue
      if (!isReturningGame && narrativeRef.current) {
        narrativeRef.current.scrollTo(0, 0);
      }
    }, 600);
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
        turnNumber={(() => {
          for (let i = turns.length - 1; i >= 0; i--) {
            if (turns[i].type !== 'gm_aside' && turns[i].number != null) return turns[i].number;
          }
          return null;
        })()}
        sseConnected={sseConnected}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(prev => !prev)}
        onOpenSettings={() => setSettingsOpen(true)}
        debugMode={debugMode}
      />
      <div className={`${styles.mainContent} ${!sidebarOpen ? styles.mainContentNoSidebar : ''}`}>
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
            onEntityClick={handleEntityClick}
            inventoryItems={[...(characterData?.inventory?.equipped || []), ...(characterData?.inventory?.carried || [])]}
            directiveState={directiveState}
            onDeleteDirective={handleDeleteDirective}
            onRestoreDirective={handleRestoreDirective}
            onImageClick={setLightboxImage}
          />
          <ActionPanel
            actions={actions}
            submitting={submitting}
            error={error}
            onSubmit={submitAction}
            rewindAvailable={rewindAvailable}
            rewinding={rewinding}
            onRewind={handleRewind}
            onVisualize={handleVisualize}
            visualizing={visualizing}
            isPlaytester={!!api.getUser()?.isPlaytester}
          />
          {directiveToasts.length > 0 && (
            <div className={styles.toastContainer}>
              {directiveToasts.map(toast => (
                <div key={toast.id} className={`${styles.directiveToast} ${toast.fading ? styles.directiveToastFading : ''}`}>
                  <div className={styles.directiveToastContent}>
                    <span className={styles.directiveToastText}>
                      Goal completed: {toast.text}
                    </span>
                    <button
                      className={styles.directiveToastRestore}
                      onClick={() => { handleRestoreDirective(toast.text); dismissDirectiveToast(toast.id); }}
                    >
                      Removed in error?
                    </button>
                  </div>
                  <button className={styles.directiveToastClose} onClick={() => dismissDirectiveToast(toast.id)}>&times;</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <Sidebar
          collapsed={!sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
          characterData={characterData}
          glossaryData={glossaryData}
          glossaryTerms={glossaryTerms}
          mapData={mapData}
          notesData={notesData}
          gameId={gameId}
          notifications={notifications}
          onClearNotification={(tabId) => setNotifications(prev => ({ ...prev, [tabId]: 0 }))}
          onNotesChange={refetchNotes}
          onEntityClick={handleEntityClick}
          onOpenReport={setReportMode}
          onOpenGallery={() => setGalleryOpen(true)}
          isPlaytester={!!api.getUser()?.isPlaytester}
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
          onEntityClick={handleEntityClick}
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

      {/* Gallery Modal */}
      {galleryOpen && (
        <GalleryModal
          gameId={gameId}
          onClose={() => setGalleryOpen(false)}
        />
      )}

      {/* Image Lightbox */}
      {lightboxImage && (
        <ImageLightbox
          imageUrl={lightboxImage.imageUrl}
          blurb={lightboxImage.blurb}
          turnNumber={lightboxImage.turnNumber}
          onClose={() => setLightboxImage(null)}
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

            {/* Wait message */}
            {!dataReady && (
              <p style={{
                fontFamily: 'var(--font-alegreya-sans)', fontSize: 13,
                color: 'var(--text-dim)', marginTop: 16,
              }}>This may take a minute or two.</p>
            )}

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
