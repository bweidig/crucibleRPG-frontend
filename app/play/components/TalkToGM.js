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

export default function TalkToGM({ gameId, onTurnResponse, lastResolution, lastStateChanges, onMetaResponse, glossaryTerms, onEntityClick, directiveState, onDeleteDirective, onRestoreDirective }) {
  const [open, setOpen] = useState(false);
  const [tabMode, setTabMode] = useState('rules'); // 'rules' | 'story' | 'directives'

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
        <button
          className={`${styles.tab} ${tabMode === 'directives' ? styles.tabActive : ''}`}
          onClick={() => setTabMode('directives')}
        >
          My Directives
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

      {/* ─── My Directives Tab ─── */}
      {tabMode === 'directives' && (
        <div className={styles.resultArea}>
          {(() => {
            const goals = directiveState?.goals || [];
            const prefs = directiveState?.preferences || [];
            const fulfilled = directiveState?.recentlyFulfilled || [];
            const limits = directiveState?.limits || { goalsMax: 10, preferencesMax: 10 };
            const isEmpty = goals.length === 0 && prefs.length === 0 && fulfilled.length === 0;

            if (isEmpty) {
              return (
                <div className={styles.directiveEmpty}>
                  No active directives. Use the My Story tab to tell the GM what you&rsquo;re working toward.
                </div>
              );
            }

            return (
              <div className={styles.directiveSections}>
                {/* Goals */}
                <div className={styles.directiveSection}>
                  <div className={styles.directiveSectionHeader}>
                    <span className={styles.directiveSectionTitle}>Goals</span>
                    <span className={styles.directiveCount}>{goals.length}/{limits.goalsMax}</span>
                  </div>
                  {goals.length === 0 ? (
                    <div className={styles.directiveNone}>No active goals.</div>
                  ) : goals.map((g, i) => (
                    <div key={i} className={styles.directiveItem}>
                      <span className={styles.directiveText}>{g.text}</span>
                      <button className={styles.directiveDismiss} onClick={() => onDeleteDirective?.({ lane: 'goal', index: i })} aria-label="Remove goal">&times;</button>
                    </div>
                  ))}
                </div>

                {/* Preferences */}
                <div className={styles.directiveSection}>
                  <div className={styles.directiveSectionHeader}>
                    <span className={styles.directiveSectionTitle}>Preferences</span>
                    <span className={styles.directiveCount}>{prefs.length}/{limits.preferencesMax}</span>
                  </div>
                  {prefs.length === 0 ? (
                    <div className={styles.directiveNone}>No active preferences.</div>
                  ) : prefs.map((p, i) => (
                    <div key={i} className={styles.directiveItem}>
                      <span className={styles.directiveText}>{p.text}</span>
                      <button className={styles.directiveDismiss} onClick={() => onDeleteDirective?.({ lane: 'preference', index: i })} aria-label="Remove preference">&times;</button>
                    </div>
                  ))}
                </div>

                {/* Recently Fulfilled */}
                {fulfilled.length > 0 && (
                  <div className={styles.directiveSection}>
                    <div className={styles.directiveSectionHeader}>
                      <span className={styles.directiveFulfilledTitle}>Recently Completed</span>
                    </div>
                    {fulfilled.map((f, i) => (
                      <div key={i} className={styles.directiveFulfilledItem}>
                        <div className={styles.directiveFulfilledContent}>
                          <span className={styles.directiveFulfilledText}>{f.text}</span>
                          {f.reason && <span className={styles.directiveFulfilledReason}>{f.reason}</span>}
                        </div>
                        <button className={styles.directiveRestore} onClick={() => onRestoreDirective?.(f.text)}>Restore</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
