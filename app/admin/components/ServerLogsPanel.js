'use client';

import { useState, useEffect, useMemo } from 'react';
import { getServerLogs } from '@/lib/adminApi';
import styles from '../page.module.css';

// ─── Server Logs helpers (AD-583) ───
// Map console.log [tag] prefixes into named groups for the collapsible UI.
const LOG_GROUP_DEFS = [
  { label: 'Resolution', tags: ['resolution', 'executeTurn', 'resolve-action', 'fortunes-balance', 'crucible-roll'] },
  { label: 'Context Curation', tags: ['context-curator', 'retrieval', 'manifest'] },
  { label: 'AI Call', tags: ['gemini-diag', 'gemini', 'openai-diag', 'openai', 'anthropic', 'callAI'] },
  { label: 'AI Raw Response', tags: ['AI_RAW_RESPONSE'] },
  { label: 'State Changes', tags: ['stateChange', 'applyStateChanges', 'conditions', 'inventory', 'triage'] },
  { label: 'Classification', tags: ['classify', 'classifier', 'skill-matching'] },
];
const LOG_GROUP_ORDER = ['Resolution', 'Context Curation', 'AI Call', 'AI Raw Response', 'State Changes', 'Classification', 'Errors', 'Other'];

function groupLogLines(lines) {
  const groups = Object.fromEntries(LOG_GROUP_ORDER.map(l => [l, []]));
  for (const line of lines || []) {
    if ((line.level || '').toLowerCase() === 'error') {
      groups['Errors'].push(line);
      continue;
    }
    const msg = String(line.message || '');
    let matched = false;
    for (const def of LOG_GROUP_DEFS) {
      if (def.tags.some(tag => msg.includes(`[${tag}]`))) {
        groups[def.label].push(line);
        matched = true;
        break;
      }
    }
    if (!matched) groups['Other'].push(line);
  }
  return groups;
}

function relMs(ts, baseTs) {
  if (!ts || !baseTs) return '';
  const diff = new Date(ts).getTime() - new Date(baseTs).getTime();
  const sign = diff >= 0 ? '+' : '';
  return `${sign}${diff}ms`;
}

function isInitEntry(entry) {
  return entry.turnNumber == null || entry.turnNumber === 0;
}

function turnLabelFor(entry) {
  return isInitEntry(entry) ? 'Init' : `Turn ${entry.turnNumber}`;
}

function formatLogLineForCopy(line, baseTs) {
  const rel = baseTs ? relMs(line.timestamp, baseTs) : '';
  const lvl = `[${(line.level || 'log').toLowerCase()}]`;
  return [rel, lvl, line.message || ''].filter(Boolean).join(' ');
}

function formatTurnForCopy(entry) {
  const lines = entry.lines || [];
  const baseTs = lines[0]?.timestamp;
  const tsStr = entry.capturedAt ? new Date(entry.capturedAt).toLocaleString() : '';
  const header = `=== ${turnLabelFor(entry)} (${entry.requestType || 'turn'}) \u2014 ${tsStr} ===`;
  const body = lines.map(l => formatLogLineForCopy(l, baseTs)).join('\n');
  return `${header}\n${body}`;
}

function reqTypeBadgeClass(reqType) {
  const t = (reqType || '').toLowerCase();
  if (t === 'init') return styles.badgePurple;
  if (t === 'error') return styles.badgeError;
  if (t === 'bug_report_flush') return styles.badgeGold;
  if (t === 'gm_question') return styles.badgeGreen;
  if (t === 'rewind') return styles.badgeOrange;
  return styles.badgeBlue; // turn
}

// Server Logs panel — turn-pill multi-select view of server-side console
// output captured per game per turn. Designed for one-click copy-into-Claude
// debugging. Loads everything for the game in a single fetch (Option A from
// the spec — fine for playtester games under ~100 turns).
export function ServerLogsPanel({ gameId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [lastClickedId, setLastClickedId] = useState(null);
  const [expandedTurns, setExpandedTurns] = useState(() => new Set());
  const [expandedGroups, setExpandedGroups] = useState(() => new Set());
  const [copyStatus, setCopyStatus] = useState({});

  useEffect(() => {
    if (!gameId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setLogs([]);
    setSelectedIds(new Set());
    setLastClickedId(null);
    setExpandedTurns(new Set());
    setExpandedGroups(new Set());

    getServerLogs(gameId, { limit: 200 })
      .then(data => {
        if (cancelled) return;
        const items = Array.isArray(data?.logs) ? data.logs : [];
        setLogs(items);
        // Default selection: most recent entry, expanded, with errors group
        // auto-open if any errors are present.
        if (items.length > 0) {
          const sorted = [...items].sort((a, b) => {
            const at = a.turnNumber == null ? -1 : a.turnNumber;
            const bt = b.turnNumber == null ? -1 : b.turnNumber;
            if (at !== bt) return at - bt;
            return (a.id || 0) - (b.id || 0);
          });
          const latest = sorted[sorted.length - 1];
          setSelectedIds(new Set([latest.id]));
          setLastClickedId(latest.id);
          setExpandedTurns(new Set([latest.id]));
          const grouped = groupLogLines(latest.lines);
          if (grouped['Errors'].length > 0) {
            setExpandedGroups(new Set([`${latest.id}::Errors`]));
          }
        }
      })
      .catch(err => {
        if (!cancelled) setError(err?.message || 'Failed to load server logs');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [gameId]);

  // Sort: init first, then by turnNumber, then by id within same turn.
  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => {
      const at = a.turnNumber == null ? -1 : a.turnNumber;
      const bt = b.turnNumber == null ? -1 : b.turnNumber;
      if (at !== bt) return at - bt;
      return (a.id || 0) - (b.id || 0);
    });
  }, [logs]);

  const selectedEntries = useMemo(
    () => sortedLogs.filter(l => selectedIds.has(l.id)),
    [sortedLogs, selectedIds]
  );

  function handlePillClick(entry, e) {
    if (e.shiftKey && lastClickedId != null) {
      const last = sortedLogs.find(l => l.id === lastClickedId);
      // Range selection only operates on numeric (non-init) turns.
      if (last && !isInitEntry(last) && !isInitEntry(entry)) {
        const lo = Math.min(last.turnNumber, entry.turnNumber);
        const hi = Math.max(last.turnNumber, entry.turnNumber);
        const next = new Set(selectedIds);
        for (const log of sortedLogs) {
          if (!isInitEntry(log) && log.turnNumber >= lo && log.turnNumber <= hi) {
            next.add(log.id);
          }
        }
        setSelectedIds(next);
        // Auto-expand newly selected so the user sees what they grabbed.
        setExpandedTurns(prev => {
          const n = new Set(prev);
          for (const id of next) n.add(id);
          return n;
        });
        return;
      }
    }
    // Single toggle.
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(entry.id)) next.delete(entry.id);
      else {
        next.add(entry.id);
        setExpandedTurns(p => new Set([...p, entry.id]));
      }
      return next;
    });
    setLastClickedId(entry.id);
  }

  function selectAll() {
    setSelectedIds(new Set(sortedLogs.map(l => l.id)));
    setExpandedTurns(new Set(sortedLogs.map(l => l.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function selectionLabel() {
    if (selectedEntries.length === 0) return 'No turns selected';
    if (selectedEntries.length === sortedLogs.length) return `Selected: All ${sortedLogs.length} entries`;
    if (selectedEntries.length === 1) return `Selected: ${turnLabelFor(selectedEntries[0])}`;
    const numeric = selectedEntries.filter(e => !isInitEntry(e)).map(e => e.turnNumber);
    if (numeric.length === selectedEntries.length && numeric.length > 1) {
      const lo = Math.min(...numeric);
      const hi = Math.max(...numeric);
      const set = new Set(numeric);
      let contiguous = true;
      for (let i = lo; i <= hi; i++) {
        if (!set.has(i)) { contiguous = false; break; }
      }
      if (contiguous) return `Selected: Turns ${lo}\u2013${hi} (${numeric.length} turns)`;
    }
    return `Selected: ${selectedEntries.length} entries`;
  }

  async function copyText(text, key) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(s => ({ ...s, [key]: 'copied' }));
      setTimeout(() => setCopyStatus(s => {
        const n = { ...s }; delete n[key]; return n;
      }), 2000);
    } catch {
      setCopyStatus(s => ({ ...s, [key]: 'failed' }));
      setTimeout(() => setCopyStatus(s => {
        const n = { ...s }; delete n[key]; return n;
      }), 2500);
    }
  }

  function copySelected() {
    if (selectedEntries.length === 0) return;
    const today = new Date().toISOString().slice(0, 10);
    const summary = selectionLabel().replace('Selected: ', '');
    const header = `Server logs for Game #${gameId}, ${summary}, captured ${today}:`;
    const body = selectedEntries.map(formatTurnForCopy).join('\n\n');
    copyText(`${header}\n\n${body}`, 'selected');
  }

  function copyTurn(entry) {
    copyText(formatTurnForCopy(entry), `turn-${entry.id}`);
  }

  function copyGroup(entry, label, lines) {
    const baseTs = (entry.lines || [])[0]?.timestamp;
    const text = lines.map(l => formatLogLineForCopy(l, baseTs)).join('\n');
    copyText(text, `group-${entry.id}-${label}`);
  }

  function toggleTurn(id) {
    setExpandedTurns(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  function toggleGroup(key) {
    setExpandedGroups(prev => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key); else n.add(key);
      return n;
    });
  }

  if (!gameId) return null;
  if (loading) {
    return <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#7082a4', textAlign: 'center', padding: 40 }}>Loading server logs...</p>;
  }
  if (error) {
    return <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#e85a5a', textAlign: 'center', padding: 40 }}>{error}</p>;
  }
  if (sortedLogs.length === 0) {
    return (
      <div className={styles.tableCard} style={{ padding: 24, textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 14, color: '#c8c0b0', marginBottom: 8 }}>
          No server logs captured for this game.
        </p>
        <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#7082a4', margin: 0 }}>
          Logs are automatically captured for playtester games and games with logging enabled. For other games, logs are saved when a bug report is filed.
        </p>
      </div>
    );
  }

  const selectedCount = selectedEntries.length;
  const copyBtnLabel = copyStatus.selected === 'copied'
    ? '\u2713 Copied!'
    : copyStatus.selected === 'failed'
      ? 'Copy failed'
      : `Copy Selected${selectedCount > 0 ? ` (${selectedCount})` : ''}`;

  return (
    <div>
      {/* Pill Bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 11, fontWeight: 600, color: '#9a8545', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Captured Turns
          </span>
          <button className={styles.tinyBtn} onClick={selectAll}>Select All</button>
          <button className={styles.tinyBtn} onClick={clearSelection}>Clear</button>
        </div>
        <div className={styles.turnScrubber}>
          {sortedLogs.map(entry => {
            const sel = selectedIds.has(entry.id);
            const label = isInitEntry(entry) ? 'Init' : entry.turnNumber;
            const tip = `${entry.requestType || 'turn'}${entry.capturedAt ? ' \u2014 ' + new Date(entry.capturedAt).toLocaleString() : ''}`;
            return (
              <button
                key={entry.id}
                className={sel ? styles.serverLogPillActive : styles.serverLogPill}
                onClick={(e) => handlePillClick(entry, e)}
                title={tip}
              >
                <span>{label}</span>
                <span
                  className={reqTypeBadgeClass(entry.requestType)}
                  style={{ fontSize: 9, padding: '1px 5px' }}
                >
                  {entry.requestType || 'turn'}
                </span>
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: 8, fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4' }}>
          {selectionLabel()}
          {selectedCount > 1 && (
            <span style={{ marginLeft: 10, color: '#5a6480' }}>(Tip: Shift+Click for range)</span>
          )}
        </div>
      </div>

      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button
          className={styles.goldBtn}
          onClick={copySelected}
          disabled={selectedCount === 0}
          style={{ padding: '8px 16px', opacity: selectedCount === 0 ? 0.5 : 1 }}
        >
          {copyBtnLabel}
        </button>
      </div>

      {/* Selected Turn Logs */}
      {selectedCount === 0 ? (
        <div className={styles.tableCard} style={{ padding: 20, textAlign: 'center', fontFamily: 'var(--font-alegreya-sans)', fontSize: 13, color: '#7082a4' }}>
          Click a turn pill above to view its logs.
        </div>
      ) : (
        <div className={styles.serverLogsScroller}>
          {selectedEntries.map(entry => {
            const turnExpanded = expandedTurns.has(entry.id);
            const grouped = groupLogLines(entry.lines || []);
            const baseTs = (entry.lines || [])[0]?.timestamp;
            const tsStr = entry.capturedAt ? new Date(entry.capturedAt).toLocaleString() : '';
            const turnCopyKey = `turn-${entry.id}`;
            const turnCopyLabel = copyStatus[turnCopyKey] === 'copied' ? '\u2713 Copied' : copyStatus[turnCopyKey] === 'failed' ? 'Failed' : 'Copy Turn';
            return (
              <div key={entry.id} className={styles.tableCard} style={{ marginBottom: 10 }}>
                <div className={styles.serverLogTurnHeader} style={{ borderBottom: turnExpanded ? '1px solid #2a2622' : 'none' }}>
                  <button
                    className={styles.collapseToggle}
                    onClick={() => toggleTurn(entry.id)}
                    style={{ flex: 1, textAlign: 'left', textTransform: 'none', letterSpacing: 0 }}
                  >
                    <span style={{ fontSize: 10 }}>{turnExpanded ? '\u25BC' : '\u25B6'}</span>
                    <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 13, fontWeight: 700, color: '#d0c098', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      {turnLabelFor(entry)}
                    </span>
                    <span className={reqTypeBadgeClass(entry.requestType)}>{entry.requestType || 'turn'}</span>
                    {tsStr && (
                      <span style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4', fontWeight: 400 }}>{tsStr}</span>
                    )}
                    <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: '#5a6480', fontWeight: 400 }}>
                      {(entry.lines || []).length} lines
                    </span>
                  </button>
                  <button className={styles.tinyBtn} onClick={() => copyTurn(entry)}>{turnCopyLabel}</button>
                </div>

                {turnExpanded && (
                  <div style={{ padding: '10px 14px 14px' }}>
                    {LOG_GROUP_ORDER.every(l => grouped[l].length === 0) ? (
                      <p style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: 12, color: '#7082a4', margin: 0 }}>No log lines in this entry.</p>
                    ) : LOG_GROUP_ORDER.map(label => {
                      const lines = grouped[label];
                      if (!lines || lines.length === 0) return null;
                      const groupKey = `${entry.id}::${label}`;
                      // Errors group auto-expanded by default.
                      const isExpanded = label === 'Errors'
                        ? !expandedGroups.has(`${groupKey}::collapsed`)
                        : expandedGroups.has(groupKey);
                      const groupCopyKey = `group-${entry.id}-${label}`;
                      const groupCopyLabel = copyStatus[groupCopyKey] === 'copied' ? '\u2713' : copyStatus[groupCopyKey] === 'failed' ? '!' : 'Copy';
                      return (
                        <div key={label} style={{ marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button
                              className={styles.collapseToggle}
                              onClick={() => {
                                if (label === 'Errors') {
                                  // Toggle the "collapsed" sentinel for Errors so default = open.
                                  toggleGroup(`${groupKey}::collapsed`);
                                } else {
                                  toggleGroup(groupKey);
                                }
                              }}
                              style={{ flex: 1, textAlign: 'left' }}
                            >
                              <span style={{ fontSize: 9 }}>{isExpanded ? '\u25BC' : '\u25B6'}</span>
                              <span style={{ color: label === 'Errors' ? '#e85a5a' : '#9a8545' }}>
                                {label} <span style={{ color: '#7082a4', fontWeight: 400 }}>({lines.length})</span>
                              </span>
                            </button>
                            <button className={styles.tinyBtn} onClick={() => copyGroup(entry, label, lines)}>{groupCopyLabel}</button>
                          </div>
                          {isExpanded && (
                            <pre className={styles.serverLogPre}>
                              {lines.map((line, i) => {
                                const lvl = (line.level || 'log').toLowerCase();
                                const color = lvl === 'error' ? '#e85a5a' : lvl === 'warn' ? '#e8845a' : '#c8c0b0';
                                return (
                                  <div key={i} className={styles.serverLogLine} style={{ color }}>
                                    <span style={{ color: '#5a6480', marginRight: 8 }}>{relMs(line.timestamp, baseTs)}</span>
                                    <span style={{ color: '#7082a4', marginRight: 8 }}>[{lvl}]</span>
                                    {line.message || ''}
                                  </div>
                                );
                              })}
                            </pre>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
