import { useRef, useEffect, forwardRef } from 'react';
import TurnBlock from './TurnBlock';
import TalkToGM from './TalkToGM';
import styles from './NarrativePanel.module.css';

const NarrativePanel = forwardRef(function NarrativePanel({ turns, sessionRecap, gameId, onTurnResponse }, ref) {
  const bottomRef = useRef(null);

  // Auto-scroll to bottom when new turns arrive
  useEffect(() => {
    if (turns.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [turns.length]);

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

      <TalkToGM gameId={gameId} onTurnResponse={onTurnResponse} />
    </div>
  );
});

export default NarrativePanel;
