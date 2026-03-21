import { useState, useEffect, useCallback, useRef } from 'react';
import * as api from '@/lib/api';
import styles from './TalkToGM.module.css';

export default function TalkToGM({ gameId, onTurnResponse }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [lastQuestion, setLastQuestion] = useState('');
  const inputRef = useRef(null);

  // Auto-focus input when panel opens
  useEffect(() => {
    if (open) {
      // Small delay to ensure the DOM has rendered
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open]);

  const handleClose = () => {
    setOpen(false);
    setInput('');
    setResult(null);
    setLastQuestion('');
  };

  // Phase 1: Free lookup
  const handleAsk = useCallback(async () => {
    const question = input.trim();
    if (!question || !gameId || loading) return;

    setLoading(true);
    setResult(null);
    setLastQuestion(question);
    setInput('');

    try {
      const res = await api.post(`/api/game/${gameId}/talk-to-gm`, { question });
      setResult(res);
    } catch (err) {
      console.error('Talk to GM failed:', err);
      setResult({ error: err.message || 'Failed to reach the GM.' });
    } finally {
      setLoading(false);
    }
  }, [input, gameId, loading]);

  // Phase 2: Escalation (costs a turn)
  const handleEscalate = useCallback(async () => {
    if (!lastQuestion || !gameId || loading) return;

    setLoading(true);
    try {
      const res = await api.post(`/api/game/${gameId}/talk-to-gm/escalate`, {
        question: lastQuestion,
      });

      // Process as a turn response
      if (res.turnAdvanced && onTurnResponse) {
        onTurnResponse(res, '[GM Escalation]');
      }

      handleClose();
    } catch (err) {
      console.error('GM escalation failed:', err);
      setResult({ error: err.message || 'Escalation failed.' });
    } finally {
      setLoading(false);
    }
  }, [lastQuestion, gameId, loading, onTurnResponse]);

  // ─── Formatting Helpers ───

  const renderProse = (text) => {
    if (!text || typeof text !== 'string') return null;
    const paragraphs = text.split(/\n\n|\n/).filter(p => p.trim());
    return (
      <div className={styles.commandProse}>
        {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
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
    // Briefing null/empty — check other fields
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

    // Stats
    if (data.stats || data.character?.stats) {
      const stats = data.stats || data.character?.stats || {};
      sections.push(
        <div key="stats" className={styles.commandSection}>
          <div className={styles.commandSectionTitle}>Stats</div>
          {Object.entries(stats).map(([k, v]) => renderStatRow(k, v))}
        </div>
      );
    }

    // Conditions
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

    // Skills
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

    // Inventory
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

    // Location + clock
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

  // Generic fallback: key-value breakdown, never raw JSON
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

    // Object: render each key as a labeled row
    const entries = Object.entries(data).filter(([, v]) => v != null && v !== '' && v !== false);
    if (entries.length === 0) return <div className={styles.commandEmptyMessage}>The GM had nothing to report.</div>;

    return (
      <div className={styles.commandSection}>
        {entries.map(([key, value]) => {
          // Skip internal fields
          if (key.startsWith('_') || key === 'fallback') return null;

          // Nested object: render as sub-section
          if (typeof value === 'object' && !Array.isArray(value)) {
            return (
              <div key={key} className={styles.commandSection}>
                <div className={styles.commandSectionTitle}>{formatLabel(key)}</div>
                {renderGenericData(value)}
              </div>
            );
          }

          // Array: render as list
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

          // Primitive
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

  // ─── Route to the right renderer based on command type ───
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
        // set_objective confirmation, or any future command
        if (data.message && typeof data.message === 'string') {
          return renderProse(data.message);
        }
        return renderGenericData(data);
    }
  };

  // ─── Render Result ───
  const renderResult = () => {
    if (!result) return null;

    if (result.error) {
      return <div className={styles.resultContent} style={{ color: 'var(--color-danger)' }}>{result.error}</div>;
    }

    // Command match
    if (result.source === 'command') {
      return (
        <div className={styles.resultCommand}>
          <div className={styles.resultLabel}>{formatLabel(result.command || 'command')}</div>
          {renderCommandResponse(result.command, result.data)}
        </div>
      );
    }

    // Rulebook match
    if (result.source === 'rulebook') {
      return (
        <div>
          <div className={styles.resultLabel}>Rulebook</div>
          <div className={styles.resultTitle}>{result.title}</div>
          {result.section && (
            <div style={{ fontFamily: 'var(--font-alegreya-sans)', fontSize: '11px', color: 'var(--text-dim)', marginBottom: '6px' }}>
              {result.section}
            </div>
          )}
          <div className={styles.commandProse}>{result.content}</div>
        </div>
      );
    }

    // No match — offer escalation
    return (
      <div>
        <div className={styles.resultSuggestion}>
          {result.suggestion || 'The GM couldn\'t find an answer in the rulebook. Want to ask directly?'}
        </div>
        {result.canEscalate && (
          <>
            <button
              className={styles.escalateButton}
              onClick={handleEscalate}
              disabled={loading}
            >
              {loading ? 'Thinking...' : 'Ask the GM (costs a turn)'}
            </button>
            <div className={styles.turnCostWarning}>This will use one turn.</div>
          </>
        )}
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

  // ─── Expanded panel ───
  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>Talk to the GM</span>
        <button className={styles.closeButton} onClick={handleClose} aria-label="Close">&times;</button>
      </div>

      <div className={styles.resultArea}>
        {loading && !result && <div className={styles.loadingText}>Asking the GM...</div>}
        {renderResult()}
      </div>

      <div className={styles.inputRow}>
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          placeholder="Ask a question..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            e.stopPropagation();
            if (e.key === 'Enter' && input.trim()) {
              e.preventDefault();
              handleAsk();
            }
          }}
          disabled={loading}
          maxLength={500}
          aria-label="Question for the GM"
        />
        <button
          className={styles.sendButton}
          onClick={handleAsk}
          disabled={loading || !input.trim()}
        >
          Ask
        </button>
      </div>
    </div>
  );
}
