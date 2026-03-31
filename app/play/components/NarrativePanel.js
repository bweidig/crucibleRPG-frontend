import { useRef, useEffect, forwardRef } from 'react';
import TurnBlock from './TurnBlock';
import TalkToGM from './TalkToGM';
import styles from './NarrativePanel.module.css';

const NarrativePanel = forwardRef(function NarrativePanel({ turns, sessionRecap, worldBriefing, gameId, onTurnResponse }, ref) {
  const newTurnRef = useRef(null);
  const bottomRef = useRef(null);

  // Auto-scroll: new turns scroll to turn header at top; initial load scrolls to bottom
  useEffect(() => {
    if (turns.length === 0) return;
    const lastTurn = turns[turns.length - 1];
    if (lastTurn._isNew && newTurnRef.current) {
      requestAnimationFrame(() => {
        newTurnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } else {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [turns.length]);

  return (
    <div className={styles.narrativeWrapper}>
      <div className={styles.narrativeScroll} ref={ref}>
        <div className={styles.narrativeInner}>
          {worldBriefing && (
            <div className={styles.worldBriefing}>
              <div className={styles.briefingLabel}>Prologue</div>
              <div className={styles.briefingText}>{worldBriefing}</div>
            </div>
          )}

          {turns.length === 0 && (
            <div className={styles.emptyState}>Starting your adventure...</div>
          )}

          {turns.map((turn, i) => {
            const isLast = i === turns.length - 1;
            const isNew = !!turn._isNew;
            return (
              <div key={turn.number ?? i}>
                {/* Show session recap just above the most recent turn */}
                {isLast && sessionRecap && (
                  <div className={styles.sessionRecap}>
                    <div className={styles.recapHeader}>PREVIOUSLY...</div>
                    <div className={styles.recapText}>{sessionRecap}</div>
                  </div>
                )}
                <TurnBlock
                  turn={turn}
                  isNew={isNew}
                  ref={isLast && isNew ? newTurnRef : undefined}
                />
              </div>
            );
          })}

          <div ref={bottomRef} />
        </div>
      </div>

      <TalkToGM gameId={gameId} onTurnResponse={onTurnResponse} />
    </div>
  );
});

export default NarrativePanel;
