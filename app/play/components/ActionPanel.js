import { useState, useCallback } from 'react';
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

export default function ActionPanel({
  actions, submitting, error, onSubmit,
  rewindAvailable, rewinding, onRewind,
  onVisualize, visualizing, isPlaytester,
}) {
  const [customText, setCustomText] = useState('');
  const [rewindConfirm, setRewindConfirm] = useState(false);

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
                    {'\u21A9'}
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
