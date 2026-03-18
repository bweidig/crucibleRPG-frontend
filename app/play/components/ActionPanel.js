import { useState, useCallback } from 'react';
import styles from './ActionPanel.module.css';

export default function ActionPanel({ actions, submitting, error, onSubmit }) {
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

        {submitting ? (
          <div className={styles.submittingText}>Processing your action...</div>
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
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
