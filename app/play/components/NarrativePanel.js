import { useRef, useEffect, useState, forwardRef } from 'react';
import TurnBlock from './TurnBlock';
import styles from './NarrativePanel.module.css';

const NarrativePanel = forwardRef(function NarrativePanel({ turns, sessionRecap, gameId }, ref) {
  const bottomRef = useRef(null);
  const [gmOpen, setGmOpen] = useState(false);
  const [gmInput, setGmInput] = useState('');
  const [gmLoading, setGmLoading] = useState(false);
  const [gmResult, setGmResult] = useState(null);

  // Auto-scroll to bottom when new turns arrive
  useEffect(() => {
    if (turns.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [turns.length]);

  // Close GM panel on Escape
  useEffect(() => {
    if (!gmOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') setGmOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gmOpen]);

  const handleGmClose = () => {
    setGmOpen(false);
    setGmInput('');
    setGmResult(null);
  };

  return (
    <div className={styles.narrativeWrapper}>
      <div className={styles.narrativeScroll} ref={ref}>
        <div className={styles.narrativeInner}>
          {sessionRecap && (
            <div className={styles.sessionRecap}>
              <div className={styles.recapHeader}>PREVIOUSLY...</div>
              <div className={styles.recapText}>{sessionRecap}</div>
            </div>
          )}

          {turns.length === 0 && (
            <div className={styles.emptyState}>Starting your adventure...</div>
          )}

          {turns.map((turn, i) => (
            <TurnBlock key={turn.number ?? i} turn={turn} />
          ))}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Talk to GM — floating button, anchored to the narrative panel */}
      {!gmOpen && (
        <button
          className={styles.gmButton}
          onClick={() => setGmOpen(true)}
          aria-label="Talk to the GM"
          title="Talk to the GM"
        >
          ?
        </button>
      )}

      {gmOpen && (
        <div className={styles.gmPanel}>
          <div className={styles.gmHeader}>
            <span className={styles.gmTitle}>Talk to the GM</span>
            <button
              className={styles.gmCloseButton}
              onClick={handleGmClose}
              aria-label="Close"
            >
              X
            </button>
          </div>
          {gmResult && (
            <div className={styles.gmResult}>
              {gmResult}
            </div>
          )}
          <div className={styles.gmInputRow}>
            <input
              type="text"
              className={styles.gmInput}
              placeholder="Ask a question..."
              value={gmInput}
              onChange={e => setGmInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && gmInput.trim()) {
                  // Stub: full Talk to GM wiring comes in a later phase
                  setGmResult('Talk to GM will be fully wired in a future phase.');
                  setGmInput('');
                }
              }}
              disabled={gmLoading}
              maxLength={500}
              aria-label="Question for the GM"
            />
          </div>
        </div>
      )}
    </div>
  );
});

export default NarrativePanel;
