import { useState, useCallback, useEffect, useRef } from 'react';
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
function CompassPopover({ objectives, currentLocation, onEscalate, onClose }) {
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
              <span>{item.text}</span>
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
