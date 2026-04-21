import React from 'react';
import Die from './Die';
import styles from './Tray.module.css';

// ─── Phase → state mapping ───
// The Tray renders the crucible die during phase 1 and the two mortal dice
// during phase 2. State on each die is derived from the current phase plus
// extreme / winner logic.

function crucibleState(phase, isCrit, isFumble) {
  switch (phase) {
    case 'ready':        return 'ready';
    case 'p1-throw':     return 'throw';
    case 'p1-tumble':    return 'tumble';
    case 'p1-land':      return 'land';
    case 'p1-settled':   return isCrit ? 'crit' : isFumble ? 'fumble' : 'kept';
    case 'p1-exit':      return 'crucible-exit';
    default:             return 'kept';
  }
}

function mortalState(phase, isWinner) {
  switch (phase) {
    case 'p2-drop':      return 'drop-in';
    case 'p2-tumble':    return 'tumble';
    case 'p2-land':      return 'land';
    case 'p2-settled':   return isWinner ? 'kept' : 'discarded';
    default:             return 'kept';
  }
}

function computeWinner(mode, mortal1, mortal2) {
  if (mortal1 == null || mortal2 == null) return 1;
  if (mode === 'dominant') return (mortal1 <= mortal2) ? 1 : 2;
  // outmatched (and fallback): take highest
  return (mortal1 >= mortal2) ? 1 : 2;
}

export default function Tray({
  mode = 'matched',
  crucible,
  mortal1,
  mortal2,
  phase = 'ready',
  onTap,
  isCrit = false,
  isFumble = false,
}) {
  const showCrucible = phase === 'ready' || phase.startsWith('p1');
  const showMortals = phase.startsWith('p2');
  const winner = computeWinner(mode, mortal1, mortal2);

  const showResultTag = phase === 'p1-settled' && (isCrit || isFumble);

  return (
    <div className={styles.tray}>
      {showResultTag && (
        <div className={`${styles.resultTag} ${isCrit ? styles.resultTagCrit : styles.resultTagFumble}`}>
          <span className={styles.resultTagText}>
            {isCrit ? 'CRUCIBLE FAVORS YOU' : 'CRUCIBLE TURNS'}
          </span>
          <div className={`${styles.resultTagRule} ${isCrit ? styles.resultTagRuleCrit : styles.resultTagRuleFumble}`} />
        </div>
      )}

      {showCrucible && (
        <Die
          n={crucible}
          size={88}
          state={crucibleState(phase, isCrit, isFumble)}
          onClick={phase === 'ready' ? onTap : undefined}
        />
      )}

      {showMortals && (
        <>
          <Die
            n={mortal1}
            size={72}
            state={mortalState(phase, winner === 1)}
          />
          <Die
            n={mortal2}
            size={72}
            state={mortalState(phase, winner === 2)}
          />
        </>
      )}
    </div>
  );
}
