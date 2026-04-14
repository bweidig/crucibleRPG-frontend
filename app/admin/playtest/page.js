'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getUser } from '@/lib/api';
import {
  getAdminUsers,
  getAdminGameNarrative,
  getAutoplayArchetypes, startAutoplay,
  getAutoplayRuns, getAutoplayRun, getAutoplayProgress,
  cancelAutoplay, deleteAutoplayRun,
} from '@/lib/adminApi';
import { ServerLogsPanel } from '../components/ServerLogsPanel';
import styles from './page.module.css';

// ═════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═════════════════════════════════════════════════════════════════════════════

const SETTINGS = [
  'Sword & Soil', 'Smoke & Steel', 'Concrete & Code',
  'Stars & Circuits', 'Ash & Remnants', 'Dream & Myth',
];

const STORYTELLERS = ['Chronicler', 'Bard', 'Trickster', 'Poet', 'Whisper', 'Noir'];

const DIFFICULTIES = ['Forgiving', 'Standard', 'Harsh', 'Brutal'];

const PLAY_STYLES = ['Normal', 'Chaotic', 'Adversarial'];

const CRITICAL_FLAGS = ['inventoryDesync', 'statCorruption', 'narrativeLoop', 'infiniteLoop', 'crash'];

// ═════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═════════════════════════════════════════════════════════════════════════════

function formatDuration(startedAt, completedAt) {
  if (!startedAt || !completedAt) return '--';
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  const totalSec = Math.floor(ms / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}m ${secs}s`;
}

function formatCost(val) {
  if (val == null || val === 0) return '$0.00';
  const n = Number(val);
  return n >= 0.01 ? `$${n.toFixed(2)}` : `$${n.toFixed(4)}`;
}

function playStyleBadge(style) {
  const s = (style || '').toLowerCase();
  if (s === 'normal') return styles.badgeNormal;
  if (s === 'chaotic') return styles.badgeChaotic;
  if (s === 'adversarial') return styles.badgeAdversarial;
  return styles.badgeNormal;
}

function statusBadge(status) {
  const s = (status || '').toLowerCase();
  if (s === 'completed') return styles.badgeCompleted;
  if (s === 'failed') return styles.badgeFailed;
  if (s === 'cancelled') return styles.badgeCancelled;
  if (s === 'running' || s === 'initializing') return styles.badgeRunning;
  return styles.badgeCancelled;
}

function tierClass(tier) {
  const t = Number(tier);
  if (t === 1) return styles.tierT1;
  if (t === 2) return styles.tierT2;
  if (t === 3) return styles.tierT3;
  if (t === 4 || t === 5) return styles.tierT4;
  if (t === 6) return styles.tierT6;
  return styles.tierT3;
}

// ═════════════════════════════════════════════════════════════════════════════
// CONFIG PANEL
// ═════════════════════════════════════════════════════════════════════════════

function ConfigPanel({ onRunStarted }) {
  const [playStyle, setPlayStyle] = useState('Normal');
  const [setting, setSetting] = useState('Sword & Soil');
  const [storyteller, setStoryteller] = useState('Chronicler');
  const [archetype, setArchetype] = useState(null);
  const [difficulty, setDifficulty] = useState('Standard');
  const [turnCount, setTurnCount] = useState(30);
  const [archetypes, setArchetypes] = useState([]);
  const [archetypesLoading, setArchetypesLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState(null);

  const fetchArchetypes = useCallback(async (s) => {
    setArchetypesLoading(true);
    try {
      const data = await getAutoplayArchetypes(s);
      setArchetypes(data.archetypes || data || []);
    } catch {
      setArchetypes([]);
    }
    setArchetypesLoading(false);
  }, []);

  useEffect(() => {
    fetchArchetypes(setting);
  }, [setting, fetchArchetypes]);

  useEffect(() => {
    setArchetype(null);
  }, [setting]);

  const costMin = (turnCount * 0.005).toFixed(2);
  const costMax = (turnCount * 0.015).toFixed(2);

  async function handleConfirm() {
    setLaunching(true);
    setError(null);
    try {
      const config = {
        playStyle: playStyle.toLowerCase(),
        setting,
        storyteller,
        archetype: archetype || null,
        difficulty,
        targetTurns: turnCount,
      };
      const result = await startAutoplay(config);
      setConfirming(false);
      setLaunching(false);
      onRunStarted(result);
    } catch (err) {
      setError(err.message || 'Failed to start run');
      setLaunching(false);
    }
  }

  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionTitle}>Configure Run</div>

      <div className={styles.configGrid}>
        {/* Play Style */}
        <div className={styles.fieldGroup}>
          <div className={styles.fieldLabel}>Play Style</div>
          <div className={styles.pillGroup}>
            {PLAY_STYLES.map(ps => (
              <button
                key={ps}
                className={playStyle === ps ? styles[`pill${ps}`] : styles.pill}
                onClick={() => setPlayStyle(ps)}
              >
                {ps}
              </button>
            ))}
          </div>
        </div>

        {/* Setting */}
        <div className={styles.fieldGroup}>
          <div className={styles.fieldLabel}>Setting</div>
          <select
            className={styles.selectInput}
            value={setting}
            onChange={e => setSetting(e.target.value)}
          >
            {SETTINGS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Storyteller */}
        <div className={styles.fieldGroup}>
          <div className={styles.fieldLabel}>Storyteller</div>
          <select
            className={styles.selectInput}
            value={storyteller}
            onChange={e => setStoryteller(e.target.value)}
          >
            {STORYTELLERS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Archetype */}
        <div className={styles.fieldGroup}>
          <div className={styles.fieldLabel}>Archetype</div>
          <select
            className={styles.selectInput}
            value={archetype || ''}
            onChange={e => setArchetype(e.target.value || null)}
            disabled={archetypesLoading}
          >
            <option value="">Random</option>
            {archetypes.map(a => {
              const name = typeof a === 'string' ? a : a.name || a.id;
              return <option key={name} value={name}>{name}</option>;
            })}
          </select>
        </div>

        {/* Difficulty */}
        <div className={styles.fieldGroup}>
          <div className={styles.fieldLabel}>Difficulty</div>
          <select
            className={styles.selectInput}
            value={difficulty}
            onChange={e => setDifficulty(e.target.value)}
          >
            {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* Turn Count */}
        <div className={styles.fieldGroup}>
          <div className={styles.fieldLabel}>Turn Count</div>
          <div className={styles.sliderRow}>
            <input
              type="range"
              className={styles.slider}
              min={10} max={100} step={5}
              value={turnCount}
              onChange={e => setTurnCount(Number(e.target.value))}
            />
            <span className={styles.sliderValue}>{turnCount}</span>
          </div>
          <div className={styles.costEstimate}>
            Est. cost: ${costMin} &ndash; ${costMax}
          </div>
        </div>
      </div>

      {/* Start / Confirm */}
      {!confirming ? (
        <button className={styles.startBtn} onClick={() => setConfirming(true)}>
          Start Run
        </button>
      ) : (
        <div className={styles.confirmBar}>
          <div className={styles.confirmText}>
            Start <strong>{playStyle}</strong> run in <strong>{setting}</strong> for <strong>{turnCount}</strong> turns?
            Estimated cost: ${costMin} &ndash; ${costMax}
          </div>
          <button
            className={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={launching}
          >
            {launching ? 'Starting...' : 'Confirm'}
          </button>
          <button
            className={styles.cancelBtn}
            onClick={() => { setConfirming(false); setError(null); }}
            disabled={launching}
          >
            Cancel
          </button>
        </div>
      )}

      {error && (
        <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#e85a5a', marginTop: 10 }}>
          {error}
        </p>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ACTIVE RUNS
// ═════════════════════════════════════════════════════════════════════════════

function ActiveRuns({ runs, onCancel, onCompleted }) {
  const [cancelling, setCancelling] = useState({});

  async function handleCancel(id) {
    setCancelling(prev => ({ ...prev, [id]: true }));
    try {
      await cancelAutoplay(id);
    } catch { /* polling will pick up the change */ }
    setCancelling(prev => ({ ...prev, [id]: false }));
  }

  if (!runs || runs.length === 0) {
    return (
      <div className={styles.sectionCard}>
        <div className={styles.sectionTitle}>Active Runs</div>
        <div className={styles.emptyText}>No active runs</div>
      </div>
    );
  }

  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionTitle}>Active Runs</div>
      {runs.map(run => {
        const pct = run.targetTurns > 0
          ? Math.round((run.completedTurns / run.targetTurns) * 100)
          : 0;
        const charLabel = run.characterName
          ? `${run.characterName} \u2014 ${run.archetypeName || ''} \u00B7 ${run.setting || ''}`
          : 'Initializing...';

        return (
          <div key={run.id} className={styles.runCard}>
            <div className={styles.runCardHeader}>
              <div>
                <span className={styles.runCharacter}>{charLabel}</span>
                <span style={{ marginLeft: 8 }} className={playStyleBadge(run.playStyle)}>{run.playStyle}</span>
                {(run.totalFlags || 0) > 0 && (
                  <span className={styles.flagBadge} style={{ marginLeft: 6 }}>{run.totalFlags} flags</span>
                )}
              </div>
              <button
                className={styles.cancelSmall}
                onClick={() => handleCancel(run.id)}
                disabled={cancelling[run.id]}
              >
                Cancel
              </button>
            </div>
            <div className={styles.progressText}>
              {run.completedTurns}/{run.targetTurns} turns ({pct}%)
            </div>
            <div className={styles.progressWrap}>
              <div className={styles.progressFill} style={{ width: `${pct}%` }} />
            </div>
            {(run.latestAction || run.latestTurn?.botAction) && (
              <div className={styles.latestAction}>{run.latestAction || run.latestTurn?.botAction}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// RUN DETAIL PANEL
// ═════════════════════════════════════════════════════════════════════════════

function RunDetailPanel({ runId, onClose, onReadingModeChange }) {
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedTurns, setExpandedTurns] = useState({});
  const [fullNarratives, setFullNarratives] = useState({});

  const anyExpanded = Object.values(expandedTurns).some(Boolean);
  useEffect(() => {
    if (onReadingModeChange) onReadingModeChange(anyExpanded);
  }, [anyExpanded, onReadingModeChange]);
  const panelClass = anyExpanded ? `${styles.pushPanel} ${styles.pushPanelWide}` : styles.pushPanel;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await getAutoplayRun(runId);
        if (!cancelled) {
          // Unwrap: API returns { run: {...}, turns: [...] }
          const unwrapped = data.run ? { ...data.run, turns: data.turns || [] } : data;
          setRun(unwrapped);
        }
      } catch { /* keep stale */ }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [runId]);

  useEffect(() => {
    const gameId = run?.gameId;
    if (!gameId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getAdminGameNarrative(gameId);
        if (cancelled) return;
        const entries = data?.narrative || data?.entries || [];
        const byTurn = {};
        for (const entry of entries) {
          const role = entry.role;
          if (role === 'ai' || role === 'narrator' || role === 'assistant') {
            byTurn[entry.turnNumber] = byTurn[entry.turnNumber]
              ? byTurn[entry.turnNumber] + '\n\n' + entry.content
              : entry.content;
          }
        }
        setFullNarratives(byTurn);
      } catch { /* fall back to snippets */ }
    })();
    return () => { cancelled = true; };
  }, [run?.gameId]);

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  if (loading) {
    return (
      <div className={panelClass} style={{ padding: 24, position: 'relative' }}>
        <button className={styles.panelClose} onClick={onClose}>&times;</button>
        <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4', marginTop: 40 }}>Loading...</p>
      </div>
    );
  }

  if (!run) {
    return (
      <div className={panelClass} style={{ padding: 24, position: 'relative' }}>
        <button className={styles.panelClose} onClick={onClose}>&times;</button>
        <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#e85a5a', marginTop: 40 }}>Failed to load run</p>
      </div>
    );
  }

  // Build flag breakdown
  const flagBreakdown = {};
  if (run.turns) {
    for (const t of run.turns) {
      const flags = t.diagnosticFlags || t.flags;
      if (flags && Array.isArray(flags)) {
        for (const f of flags) {
          const name = typeof f === 'string' ? f : f.type || f.name || 'unknown';
          flagBreakdown[name] = (flagBreakdown[name] || 0) + 1;
        }
      }
    }
  }
  // Also check top-level diagnosticFlags
  if (run.diagnosticFlags) {
    for (const [name, count] of Object.entries(run.diagnosticFlags)) {
      flagBreakdown[name] = (flagBreakdown[name] || 0) + (typeof count === 'number' ? count : 1);
    }
  }
  const hasFlags = Object.keys(flagBreakdown).length > 0;

  return (
    <div className={panelClass} style={{ padding: 24, position: 'relative' }}>
      <button className={styles.panelClose} onClick={onClose}>&times;</button>

      {/* Header */}
      <div style={{ marginBottom: 16, paddingRight: 40 }}>
        <h3 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 16, fontWeight: 700, color: '#d0c098', marginBottom: 4 }}>
          {run.characterName || `Run #${run.id}`}
        </h3>
        <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#7082a4' }}>
          {run.archetypeName || 'Unknown'} &middot; {run.setting}
        </div>
      </div>

      {/* Summary */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryItem}>
          <div className={styles.summaryLabel}>Status</div>
          <span className={statusBadge(run.status)}>{run.status}</span>
        </div>
        <div className={styles.summaryItem}>
          <div className={styles.summaryLabel}>Play Style</div>
          <span className={playStyleBadge(run.playStyle)}>{run.playStyle}</span>
        </div>
        <div className={styles.summaryItem}>
          <div className={styles.summaryLabel}>Storyteller</div>
          <div className={styles.summaryValue}>{run.storyteller}</div>
        </div>
        <div className={styles.summaryItem}>
          <div className={styles.summaryLabel}>Difficulty</div>
          <div className={styles.summaryValue}>{run.difficultyPreset || run.difficulty || '--'}</div>
        </div>
        <div className={styles.summaryItem}>
          <div className={styles.summaryLabel}>Turns</div>
          <div className={styles.summaryValue}>{run.completedTurns}/{run.targetTurns}</div>
        </div>
        <div className={styles.summaryItem}>
          <div className={styles.summaryLabel}>Cost</div>
          <div className={styles.summaryValue}>{formatCost(run.totalCost)}</div>
        </div>
        <div className={styles.summaryItem}>
          <div className={styles.summaryLabel}>Duration</div>
          <div className={styles.summaryValue}>{formatDuration(run.startedAt, run.completedAt)}</div>
        </div>
        <div className={styles.summaryItem}>
          <div className={styles.summaryLabel}>End Reason</div>
          <div className={styles.summaryValue}>{run.endReason || '--'}</div>
        </div>
        {(run.totalFlags || 0) > 0 && (
          <div className={styles.summaryItem}>
            <div className={styles.summaryLabel}>Total Flags</div>
            <div className={styles.summaryValue} style={{ color: '#e85a5a' }}>{run.totalFlags}</div>
          </div>
        )}
      </div>

      {/* Diagnostic Flags */}
      {hasFlags && (
        <>
          <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 700, color: '#d0c098', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
            Diagnostic Flags
          </div>
          <div className={styles.flagCard}>
            {Object.entries(flagBreakdown).sort((a, b) => b[1] - a[1]).map(([name, count]) => (
              <div key={name} className={styles.flagRow}>
                <span className={styles.flagName}>{name}</span>
                <span
                  className={styles.flagCount}
                  style={{ color: CRITICAL_FLAGS.includes(name) ? '#e85a5a' : '#e8c45a' }}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Turn Log */}
      {run.turns && run.turns.length > 0 && (
        <>
          <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 700, color: '#d0c098', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
            Turn Log
          </div>
          <div className={styles.turnList}>
            {run.turns.map((turn, i) => {
              const expanded = expandedTurns[i];
              const hasError = !!turn.error;
              const flags = turn.diagnosticFlags || turn.flags || [];
              const action = turn.botAction || turn.action;
              const narrative = fullNarratives[turn.turnNumber] || turn.narrativeSnippet || turn.narrative;
              const cost = turn.turnCost ?? turn.cost;
              return (
                <div key={i} className={hasError ? styles.turnEntryError : styles.turnEntry}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span className={styles.turnNumber}>T{turn.turnNumber ?? i + 1}</span>
                    {turn.tier != null && (
                      <span className={tierClass(turn.tier)}>T{turn.tier}</span>
                    )}
                    {turn.tierName && !turn.tier && (
                      <span className={styles.tierT3}>{turn.tierName}</span>
                    )}
                    {Array.isArray(flags) && flags.length > 0 && flags.map((f, fi) => {
                      const fname = typeof f === 'string' ? f : f.type || f.name || 'flag';
                      const isCritical = CRITICAL_FLAGS.includes(fname);
                      return (
                        <span key={fi} className={isCritical ? styles.flagBadge : styles.flagBadgeAmber}>
                          {fname}
                        </span>
                      );
                    })}
                    {cost != null && cost > 0 && (
                      <span className={styles.turnCost}>{formatCost(cost)}</span>
                    )}
                  </div>
                  {action && <div className={styles.turnAction}>{action}</div>}
                  {narrative && (() => {
                    const NARRATIVE_PREVIEW = 240;
                    const isLong = narrative.length > NARRATIVE_PREVIEW;
                    const shown = !isLong || expanded ? narrative : narrative.slice(0, NARRATIVE_PREVIEW).trimEnd() + '\u2026';
                    return (
                      <>
                        <div
                          className={styles.turnNarrative}
                          onClick={isLong ? () => setExpandedTurns(prev => ({ ...prev, [i]: !prev[i] })) : undefined}
                          style={{ cursor: isLong ? 'pointer' : 'default', whiteSpace: 'pre-wrap' }}
                        >
                          {shown}
                        </div>
                        {isLong && (
                          <button
                            type="button"
                            className={styles.narrativeExpandBtn}
                            onClick={() => setExpandedTurns(prev => ({ ...prev, [i]: !prev[i] }))}
                          >
                            {expanded ? '\u25B2 Show Less' : '\u25BC Show More'}
                          </button>
                        )}
                      </>
                    );
                  })()}
                  {hasError && <div className={styles.turnError}>{turn.error}</div>}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Server Logs */}
      {run.gameId != null && (
        <>
          <div style={{
            fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 700,
            color: '#d0c098', letterSpacing: '0.08em', textTransform: 'uppercase',
            marginTop: 20, marginBottom: 8,
          }}>
            Server Logs <span style={{ color: '#7082a4', fontWeight: 400, letterSpacing: 0, textTransform: 'none' }}>(Game #{run.gameId})</span>
          </div>
          <ServerLogsPanel gameId={run.gameId} />
        </>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// RUN HISTORY
// ═════════════════════════════════════════════════════════════════════════════

function RunHistory({ runs, onRefresh, loading, selectedRunId, onSelectRun, onDeleteRun }) {
  const [deleting, setDeleting] = useState(null);

  async function confirmDelete(id) {
    try {
      await deleteAutoplayRun(id);
      setDeleting(null);
      onDeleteRun(id);
    } catch { /* */ }
  }

  return (
    <div className={styles.sectionCard} style={{ padding: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 12px' }}>
        <div className={styles.sectionTitle} style={{ marginBottom: 0 }}>Run History</div>
        <button className={styles.refreshBtn} onClick={onRefresh} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {(!runs || runs.length === 0) ? (
        <div className={styles.emptyText} style={{ paddingBottom: 20 }}>No completed runs</div>
      ) : (
        <div className={styles.tableCard}>
          {/* Header */}
          <div className={styles.tableHeader}>
            <span className={styles.colLabel}>Status</span>
            <span className={styles.colLabel}>Character</span>
            <span className={styles.colLabel}>Setting</span>
            <span className={styles.colLabel}>Style</span>
            <span className={styles.colLabel}>Turns</span>
            <span className={styles.colLabel}>Flags</span>
            <span className={styles.colLabel}>Cost</span>
            <span className={styles.colLabel}>Duration</span>
            <span className={styles.colLabel}>End Reason</span>
            <span className={styles.colLabel}>Actions</span>
          </div>

          {/* Rows */}
          {runs.map(run => (
            <div
              key={run.id}
              className={styles.clickableRow}
              style={selectedRunId === run.id ? { background: '#161a28', borderLeftColor: '#c9a84c' } : {}}
              onClick={() => onSelectRun(run.id)}
            >
              <span className={statusBadge(run.status)}>{run.status}</span>
              <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#d0c098' }}>
                {run.characterName || '--'}{run.archetypeName ? ` (${run.archetypeName})` : ''}
              </span>
              <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#8a94a8' }}>
                {run.setting || '--'}
              </span>
              <span className={playStyleBadge(run.playStyle)}>{run.playStyle}</span>
              <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: '#b0b8cc' }}>
                {run.completedTurns}/{run.targetTurns}
              </span>
              <span>
                {(run.totalFlags || 0) > 0 ? (
                  <span className={styles.flagBadge}>{run.totalFlags}</span>
                ) : (
                  <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: '#7082a4' }}>0</span>
                )}
              </span>
              <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: '#b0b8cc' }}>
                {formatCost(run.totalCost)}
              </span>
              <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: '#8a94a8' }}>
                {formatDuration(run.startedAt, run.completedAt)}
              </span>
              <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#8a94a8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {run.endReason || '--'}
              </span>
              <span style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                <button className={styles.ghostBtn} onClick={() => onSelectRun(run.id)}>View</button>
                <button className={styles.dangerBtn} onClick={() => setDeleting(run.id)}>Delete</button>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleting && (
        <div className={styles.deleteModal} onClick={() => setDeleting(null)}>
          <div className={styles.deleteModalCard} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 16, fontWeight: 700, color: '#d0c098', marginBottom: 12 }}>
              Delete Run
            </h3>
            <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#c8c0b0', lineHeight: 1.6, marginBottom: 18 }}>
              Permanently delete this playtest run? This cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className={styles.ghostBtn} onClick={() => setDeleting(null)}>Cancel</button>
              <button className={styles.dangerBtn} onClick={() => confirmDelete(deleting)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════════════════

export default function PlaytestPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // Active runs
  const [activeRuns, setActiveRuns] = useState([]);
  const pollTimers = useRef({});

  // History
  const [historyRuns, setHistoryRuns] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Detail panel
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [readingMode, setReadingMode] = useState(false);

  // ─── Auth guard ───
  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/auth'); return; }
    const user = getUser();
    setUserEmail(user?.email || '');
    getAdminUsers()
      .then(() => { setAuthChecked(true); })
      .catch(err => {
        if (err.status === 403) router.replace('/menu');
        else router.replace('/auth');
      });
  }, [router]);

  // ─── Load history on mount ───
  useEffect(() => {
    if (!authChecked) return;
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked]);

  async function fetchHistory() {
    setHistoryLoading(true);
    try {
      const data = await getAutoplayRuns({ limit: 20 });
      const allRuns = data.runs || data || [];

      // Separate active vs completed
      const active = allRuns.filter(r => r.status === 'initializing' || r.status === 'running');
      const completed = allRuns.filter(r => r.status !== 'initializing' && r.status !== 'running');

      setActiveRuns(active);
      setHistoryRuns(completed);

      // Start polling for any active runs
      for (const run of active) {
        startPolling(run.id);
      }
    } catch { /* */ }
    setHistoryLoading(false);
  }

  // ─── Polling ───
  function startPolling(runId) {
    if (pollTimers.current[runId]) return;
    pollTimers.current[runId] = setInterval(async () => {
      try {
        const progress = await getAutoplayProgress(runId);
        setActiveRuns(prev => prev.map(r => r.id === runId ? { ...r, ...progress } : r));

        if (progress.status !== 'initializing' && progress.status !== 'running') {
          stopPolling(runId);
          // Move from active to history
          setActiveRuns(prev => prev.filter(r => r.id !== runId));
          setHistoryRuns(prev => [{ ...progress, _justCompleted: true }, ...prev.filter(r => r.id !== runId)]);
          // Clear highlight after animation
          setTimeout(() => {
            setHistoryRuns(prev => prev.map(r => r.id === runId ? { ...r, _justCompleted: false } : r));
          }, 1500);
        }
      } catch { /* keep polling */ }
    }, 4000);
  }

  function stopPolling(runId) {
    if (pollTimers.current[runId]) {
      clearInterval(pollTimers.current[runId]);
      delete pollTimers.current[runId];
    }
  }

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      Object.keys(pollTimers.current).forEach(id => clearInterval(pollTimers.current[id]));
    };
  }, []);

  // ─── Handlers ───
  function handleRunStarted(newRun) {
    const run = newRun.run || newRun;
    // Backend may return runId at top level instead of id
    if (!run.id && newRun.runId) run.id = newRun.runId;
    if (!run.id && run.runId) run.id = run.runId;
    setActiveRuns(prev => [...prev, run]);
    startPolling(run.id);
  }

  function handleDeleteRun(id) {
    setHistoryRuns(prev => prev.filter(r => r.id !== id));
    if (selectedRunId === id) setSelectedRunId(null);
  }

  // ─── Loading state ───
  if (!authChecked) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0e1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0e1a', color: '#c8c0b0' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 40px', maxWidth: 1280, borderBottom: '1px solid #1e2540',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <a href="/menu" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 22, fontWeight: 900, color: '#c9a84c', letterSpacing: '0.06em' }}>CRUCIBLE</span>
            <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 12, fontWeight: 600, color: '#9a8545', letterSpacing: '0.18em' }}>RPG</span>
          </a>
          <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 14, fontWeight: 600, color: '#7082a4', letterSpacing: '0.08em', textTransform: 'uppercase', marginLeft: 8 }}>PLAYTESTER</span>
        </div>
        <nav style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <a href="/admin" className={styles.headerLink}>Admin Dashboard</a>
          <span style={{ color: '#7082a4' }}>&middot;</span>
          <a href="/menu" className={styles.headerLink}>Main Menu</a>
        </nav>
        <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#7082a4' }}>
          Signed in as <span style={{ color: '#c9a84c' }}>{userEmail}</span>
        </div>
      </div>

      {/* Content — with optional side panel */}
      <div style={{ display: 'flex', maxWidth: readingMode ? 'none' : 1280 }}>
        {/* Detail panel (left push) */}
        {selectedRunId && (
          <RunDetailPanel
            runId={selectedRunId}
            onClose={() => { setSelectedRunId(null); setReadingMode(false); }}
            onReadingModeChange={setReadingMode}
          />
        )}

        {/* Main content */}
        <div style={{ flex: 1, padding: '24px 40px', minWidth: 0 }}>
          <ConfigPanel onRunStarted={handleRunStarted} />
          <ActiveRuns
            runs={activeRuns}
            onCancel={(id) => {
              stopPolling(id);
              setActiveRuns(prev => prev.filter(r => r.id !== id));
            }}
          />
          {!selectedRunId && (
            <RunHistory
              runs={historyRuns}
              loading={historyLoading}
              onRefresh={fetchHistory}
              selectedRunId={selectedRunId}
              onSelectRun={setSelectedRunId}
              onDeleteRun={handleDeleteRun}
            />
          )}
        </div>
      </div>
    </div>
  );
}
