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
  // Tracks whether the initial historical-load scroll has already happened.
  // Prevents the /history async fetch (which adds older turns to the top)
  // from yanking the user back to the bottom if they've scrolled up to read.
  const hasInitialScrolledRef = useRef(false);
  // RAF handle for debounced scroll-to-bottom during streaming — a fresh chunk
  // arrives every few ms, so we coalesce updates to one scroll per animation frame.
  const streamScrollRAF = useRef(null);

  useEffect(() => {
    if (turns.length === 0) return;
    const lastTurn = turns[turns.length - 1];

    if (lastTurn._isNew) {
      // A new turn just arrived. First-turn-of-a-new-game → scroll to top so
      // the player reads the prologue. Subsequent new turns → smooth-scroll
      // to the new turn's header.
      if (turns.length === 1 && scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      } else if (newTurnRef.current) {
        requestAnimationFrame(() => {
          newTurnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
      return;
    }

    // Non-new last turn → this is either the initial historical load or a
    // later /history merge. Only jump to the bottom on the INITIAL load;
    // later merges (which prepend older turns) must not disturb the user's
    // scroll position.
    if (!hasInitialScrolledRef.current) {
      hasInitialScrolledRef.current = true;
      // Double RAF so the layout (including dice/consequences/images) has
      // settled before we measure scrollHeight; a single RAF sometimes
      // measures a too-small height and leaves us short of the true bottom.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        });
      });
    }
  }, [turns.length]);

  // Auto-scroll during streaming: the streaming turn grows in place, so the
  // length-keyed effect above doesn't fire. We watch the full turns array so
  // this runs on every chunk, coalescing bursts of chunks into one scroll per
  // animation frame. Only scrolls if the user was already near the bottom —
  // if they've scrolled up to re-read, streaming text won't yank them back.
  useEffect(() => {
    if (turns.length === 0) return;
    const last = turns[turns.length - 1];
    if (!last._isStreaming) return;
    const scroller = scrollRef.current;
    if (!scroller) return;
    const distanceFromBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
    if (distanceFromBottom > 200) return; // user has scrolled up — leave them alone

    if (streamScrollRAF.current) cancelAnimationFrame(streamScrollRAF.current);
    streamScrollRAF.current = requestAnimationFrame(() => {
      streamScrollRAF.current = null;
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });

    return () => {
      if (streamScrollRAF.current) {
        cancelAnimationFrame(streamScrollRAF.current);
        streamScrollRAF.current = null;
      }
    };
  }, [turns]);

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
                    <div className={styles.recapHeader}>LAST TIME</div>
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
