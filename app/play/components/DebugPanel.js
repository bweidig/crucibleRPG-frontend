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

// =============================================================================
// Plain Text Export
// =============================================================================

const KNOWN_DEBUG_KEYS = ['timing', 'ai', 'resolution', 'stateChanges', 'narrative', 'context', 'rowCounts', 'turn'];

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

  // AI Call
  if (d.ai) {
    lines.push('');
    lines.push('AI Call:');
    lines.push(`  Provider: ${d.ai.provider || '?'} | Model: ${d.ai.model || '?'} | Task: ${d.ai.task || '?'}`);
    const tok = d.ai.tokens || {};
    lines.push(`  Tokens: ${tok.prompt || 0} in / ${tok.completion || 0} out / ${tok.total || 0} total`);
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
// Detail Section Components
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
            {seg.label}: {seg.value}ms
          </span>
        ))}
        <span className={styles.timingLabel} style={{ marginLeft: 'auto' }}>
          Total: {total}ms
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
// Entry Row
// =============================================================================

function EntryRow({ entry, expanded, onToggle }) {
  const d = entry.debug || {};
  const statusColor = entry.status >= 500 ? '#e8845a' : entry.status >= 400 ? '#e8c45a' : '#8aba7a';
  const duration = d.timing?.total || entry.durationMs;
  const cost = d.ai?.estimatedCost;
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
// Main Debug Panel
// =============================================================================

export default function DebugPanel({ entries, onClear }) {
  const [collapsed, setCollapsed] = useState(false);
  const [height, setHeight] = useState(300);
  const [expandedId, setExpandedId] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const panelRef = useRef(null);

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

      {/* Entry list */}
      {!collapsed && (
        <div className={styles.entryList}>
          {entries.length === 0 ? (
            <div className={styles.emptyState}>
              No debug entries yet. API responses with _debug data will appear here.
            </div>
          ) : (
            entries.map(entry => (
              <EntryRow
                key={entry.id}
                entry={entry}
                expanded={expandedId === entry.id}
                onToggle={() => setExpandedId(prev => prev === entry.id ? null : entry.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
