import React, { useRef, useEffect, forwardRef } from 'react';
import TurnBlock from './TurnBlock';
import TalkToGM from './TalkToGM';
import { renderLinkedText } from '@/lib/renderLinkedText';
import styles from './NarrativePanel.module.css';

// Info-circle icon for GM aside header
function InfoCircleIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="8" cy="5" r="0.9" fill="currentColor" />
      <path d="M8 7.5V12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

const NarrativePanel = forwardRef(function NarrativePanel({
  turns, sessionRecap, worldBriefing, gameId, onTurnResponse,
  lastResolution, lastStateChanges, onMetaResponse,
  glossaryTerms, onEntityClick, inventoryItems,
  directiveState, onDeleteDirective, onRestoreDirective,
  onImageClick,
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
                    <InfoCircleIcon />
                    <span className={styles.gmAsideLabel}>GM ASIDE</span>
                  </div>
                  <div className={styles.gmAsideBody}>{renderLinkedText(turn.content, glossaryTerms, onEntityClick)}</div>
                </div>
              );
            }

            // Show recap card only once per session — above the first turn rendered on load
            const showRecap = isLast && sessionRecap && !recapShownRef.current && !isNew;
            if (showRecap) recapShownRef.current = true;

            // Fragment (not wrapper div) so TurnBlock elements are adjacent siblings in the DOM.
            // The .turnBlock + .turnBlock hairline selector in TurnBlock.module.css depends on this.
            return (
              <React.Fragment key={turn.number ?? i}>
                {showRecap && (
                  <div className={styles.sessionRecap}>
                    <div className={styles.recapHeader}>PREVIOUSLY...</div>
                    <div className={styles.recapText}>{renderLinkedText(sessionRecap, glossaryTerms, onEntityClick)}</div>
                  </div>
                )}
                <TurnBlock
                  turn={turn}
                  isNew={isNew}
                  glossaryTerms={glossaryTerms}
                  onEntityClick={onEntityClick}
                  inventoryItems={inventoryItems}
                  onImageClick={onImageClick}
                  ref={isLast && isNew ? newTurnRef : undefined}
                />
              </React.Fragment>
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
        glossaryTerms={glossaryTerms}
        onEntityClick={onEntityClick}
        directiveState={directiveState}
        onDeleteDirective={onDeleteDirective}
        onRestoreDirective={onRestoreDirective}
      />
    </div>
  );
});

export default NarrativePanel;
