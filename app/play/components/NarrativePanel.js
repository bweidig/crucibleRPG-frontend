import { useRef, useEffect, forwardRef } from 'react';
import TurnBlock from './TurnBlock';
import TalkToGM from './TalkToGM';
import styles from './NarrativePanel.module.css';

// Small compass icon for GM aside header
function AsideCompassIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.2" />
      <polygon points="9,3 10.5,8 9,7 7.5,8" fill="currentColor" />
      <polygon points="9,15 10.5,10 9,11 7.5,10" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

const NarrativePanel = forwardRef(function NarrativePanel({
  turns, sessionRecap, worldBriefing, gameId, onTurnResponse,
  lastResolution, lastStateChanges, onMetaResponse,
}, ref) {
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

            // GM aside entries (non-turn)
            if (turn.type === 'gm_aside') {
              return (
                <div key={`aside-${turn.timestamp ?? i}`} className={styles.gmAside}>
                  <div className={styles.gmAsideHeader}>
                    <AsideCompassIcon />
                    <span className={styles.gmAsideLabel}>GM</span>
                  </div>
                  <div className={styles.gmAsideBody}>{turn.content}</div>
                </div>
              );
            }

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

      <TalkToGM
        gameId={gameId}
        onTurnResponse={onTurnResponse}
        lastResolution={lastResolution}
        lastStateChanges={lastStateChanges}
        onMetaResponse={onMetaResponse}
      />
    </div>
  );
});

export default NarrativePanel;
