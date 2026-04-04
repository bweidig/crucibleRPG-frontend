import { useRef, useEffect, forwardRef } from 'react';
import TurnBlock from './TurnBlock';
import TalkToGM from './TalkToGM';
import { renderLinkedText } from '@/lib/renderLinkedText';
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
  glossaryTerms, onEntityClick,
}, ref) {
  const newTurnRef = useRef(null);
  const bottomRef = useRef(null);
  const scrollRef = useRef(null);
  const recapShownRef = useRef(false);

  // Auto-scroll: first turn of new game → top; subsequent new turns → turn header; saved game load → bottom
  useEffect(() => {
    if (turns.length === 0) return;
    const lastTurn = turns[turns.length - 1];
    if (lastTurn._isNew && turns.length === 1) {
      // New game: first turn just arrived — scroll to top so player sees prologue
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    } else if (lastTurn._isNew && newTurnRef.current) {
      requestAnimationFrame(() => {
        newTurnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } else {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [turns.length]);

  return (
    <div className={styles.narrativeWrapper}>
      <div className={styles.narrativeScroll} ref={(el) => { scrollRef.current = el; if (typeof ref === 'function') ref(el); else if (ref) ref.current = el; }}>
        <div className={styles.narrativeInner}>
          {worldBriefing && (
            <div className={styles.worldBriefing}>
              <div className={styles.briefingLabel}>Prologue</div>
              <div className={styles.briefingText}>{renderLinkedText(worldBriefing, glossaryTerms, onEntityClick)}</div>
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

            // Show recap card only once per session — above the first turn rendered on load
            const showRecap = isLast && sessionRecap && !recapShownRef.current && !isNew;
            if (showRecap) recapShownRef.current = true;

            return (
              <div key={turn.number ?? i}>
                {showRecap && (
                  <div className={styles.sessionRecap}>
                    <div className={styles.recapHeader}>PREVIOUSLY...</div>
                    <div className={styles.recapText}>{sessionRecap}</div>
                  </div>
                )}
                <TurnBlock
                  turn={turn}
                  isNew={isNew}
                  glossaryTerms={glossaryTerms}
                  onEntityClick={onEntityClick}
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
