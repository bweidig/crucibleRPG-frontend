import { useState, useCallback, useEffect, useRef } from 'react';
import styles from './ActionPanel.module.css';

// ─── Paintbrush SVG Icon (Visualize) ───
function PaintbrushIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M14.5 2.5C13.5 1.8 11 4 9.5 6C8 8 7 9.5 7.5 10.5C8 11.5 9 11 9 11C9 11 8.5 13 7 14C5.5 15 4 15.5 3 15C3 15 5 14 5.5 12.5C6 11 5 10.5 4.5 10C4 9.5 4.5 8.5 5.5 8C6.5 7.5 8 7 9.5 5.5C11 4 15.5 3.2 14.5 2.5Z" stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinejoin="round" />
      <circle cx="5" cy="11.5" r="1.2" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

// Render the optional stat/flavor tag on a choice button.
// Backend is rolling out `stat` (lowercase abbrev) and `flavor` (short approach tag)
// per AD-6xx — both optional. Nothing renders if neither field is present.
function OptionTag({ stat, flavor }) {
  if (!stat && !flavor) return null;
  const parts = [];
  if (stat) parts.push(stat.toUpperCase());
  if (flavor) parts.push(flavor);
  return <span className={styles.optionTag}>{parts.join(' · ')}</span>;
}

export default function ActionPanel({
  actions, submitting, error, onSubmit,
  rewindAvailable, rewinding, onRewind,
  onVisualize, visualizing, isPlaytester,
}) {
  const [customText, setCustomText] = useState('');
  const [rewindConfirm, setRewindConfirm] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const panelRef = useRef(null);

  // Two-tap commit: first tap (or tap on a different option) highlights the
  // option, second tap on the same option submits. Prevents fat-finger commits
  // on mobile. Mirrors the two-step rewindConfirm pattern below.
  const handleChoice = useCallback((id) => {
    setSelectedChoice(prev => {
      if (prev === id) {
        onSubmit({ choice: id });
        return id;
      }
      return id;
    });
  }, [onSubmit]);

  const handleCustom = useCallback(() => {
    const text = customText.trim();
    if (!text) return;
    setSelectedChoice(null);
    onSubmit({ custom: text });
    setCustomText('');
  }, [customText, onSubmit]);

  // AD-725: cut-turn Continue affordance. Single-tap submit (no two-tap commit).
  // Wire shape per AD-723/AD-725: lowercase literal "continue" string.
  const handleContinue = useCallback(() => {
    onSubmit({ custom: 'continue' });
  }, [onSubmit]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCustom();
    }
  }, [handleCustom]);

  // Clear the "selected" highlight once submitting ends (new turn arrived or error)
  // or when a new set of options arrives.
  useEffect(() => {
    if (!submitting) setSelectedChoice(null);
  }, [submitting, actions]);

  // Track dock height as a CSS variable so the narrative scroll can reserve
  // bottom padding and the latest turn never hides behind this panel.
  useEffect(() => {
    const el = panelRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const setVar = () => {
      document.documentElement.style.setProperty('--dock-h', `${el.offsetHeight}px`);
    };
    setVar();
    const ro = new ResizeObserver(setVar);
    ro.observe(el);
    return () => {
      ro.disconnect();
      document.documentElement.style.removeProperty('--dock-h');
    };
  }, []);

  // Nothing to show if no actions loaded yet
  if (!actions) return null;

  const options = Array.isArray(actions.options) ? actions.options : [];
  const customAllowed = actions.customAllowed !== false;

  // AD-725: detect a scene-cut turn. Backend collapses options to a single
  // Continue affordance when the engagement clock fires a cut.
  const isCutTurn = options.length === 1 && options[0]?.id === 'Continue';

  return (
    <div className={styles.actionPanel} ref={panelRef}>
      <div className={styles.actionInner}>
        {error && <div className={styles.errorText}>{error}</div>}

        {visualizing && (
          <div className={styles.visualizingText}>
            The world takes shape...
          </div>
        )}

        {submitting ? (
          <div className={styles.submittingText}>
            Processing your action...
          </div>
        ) : (
          <>
            {options.length > 0 && (
              <>
                <div className={styles.yourMoveRow}>
                  <div className={styles.yourMoveRule} />
                  <span className={styles.yourMoveLabel}>YOUR MOVE</span>
                  <div className={`${styles.yourMoveRule} ${styles.yourMoveRuleRight}`} />
                </div>
                {isCutTurn ? (
                  <button
                    className={styles.continueButton}
                    onClick={handleContinue}
                    disabled={submitting}
                  >
                    Continue
                  </button>
                ) : (
                  <div className={styles.options}>
                    {options.map(opt => {
                      const isSelected = selectedChoice === opt.id;
                      const isDimmed = selectedChoice && !isSelected;
                      return (
                        <button
                          key={opt.id}
                          className={`${styles.optionButton} ${isSelected ? styles.optionSelected : ''} ${isDimmed ? styles.optionDimmed : ''}`}
                          onClick={() => handleChoice(opt.id)}
                          disabled={submitting}
                          aria-pressed={isSelected}
                          data-choice-id={opt.id}
                        >
                          <span className={styles.optionKey}>{opt.id}</span>
                          <span className={styles.optionText}>{opt.text}</span>
                          <OptionTag stat={opt.stat} flavor={opt.flavor} />
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {customAllowed && (
              <div className={styles.customRow}>
                <span className={styles.customOrLabel}>OR</span>
                <input
                  type="text"
                  className={styles.customInput}
                  placeholder={isCutTurn ? 'Describe your next move' : 'Write your own action — the GM adapts'}
                  value={customText}
                  onChange={e => setCustomText(e.target.value)}
                  onFocus={() => setSelectedChoice(null)}
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
                {isPlaytester && onVisualize && (
                  <button
                    className={styles.visualizeButton}
                    onClick={onVisualize}
                    disabled={submitting || visualizing}
                    aria-label="Visualize scene"
                    title="Visualize this scene"
                  >
                    {visualizing ? (
                      <span className={styles.visualizeSpinner} />
                    ) : (
                      <PaintbrushIcon size={18} />
                    )}
                  </button>
                )}
                {onRewind && (
                  <button
                    className={styles.rewindButton}
                    onClick={() => setRewindConfirm(true)}
                    disabled={submitting || rewinding || !rewindAvailable}
                    aria-label="Undo last turn"
                    title="Undo last turn"
                  >
                    {'↩'}
                  </button>
                )}
              </div>
            )}

            {rewindConfirm && (
              <div className={styles.rewindConfirm}>
                <span className={styles.rewindConfirmText}>Undo your last turn?</span>
                <button
                  className={styles.rewindConfirmYes}
                  onClick={() => { setRewindConfirm(false); onRewind(); }}
                  disabled={rewinding}
                >
                  {rewinding ? 'Rewinding...' : 'Confirm'}
                </button>
                <button
                  className={styles.rewindConfirmNo}
                  onClick={() => setRewindConfirm(false)}
                  disabled={rewinding}
                >
                  Cancel
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
