import React from 'react';
import Die from './Die';
import styles from './CompactChip.module.css';

// Formats a number for display, trimming trailing .0 for integers.
function fmt(n) {
  if (n == null) return '?';
  if (typeof n !== 'number') return String(n);
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

// Signed margin (e.g. "+8.4", "-2.5"). 0 returns "±0".
function fmtMargin(n) {
  if (n == null) return '?';
  if (typeof n !== 'number') return String(n);
  if (n === 0) return '±0';
  const sign = n > 0 ? '+' : '';
  return `${sign}${Number.isInteger(n) ? n : n.toFixed(1)}`;
}

function tierColorClass(tier, isCrit, isFumble) {
  if (isCrit) return styles.tierCrit;
  if (isFumble) return styles.tierFailure;
  // Tier numbers: 1–3 = success variants, 4 = small mercy, 5+ = failure
  if (tier == null) return styles.tierNeutral;
  if (tier <= 2) return styles.tierSuccess;
  if (tier === 3) return styles.tierCostly;
  if (tier === 4) return styles.tierMercy;
  return styles.tierFailure;
}

// mode: 'matched' | 'outmatched' | 'dominant'
// For matched, only the kept die is shown.
// For outmatched/dominant, kept mortal + discarded mortal are shown side-by-side.
export default function CompactChip({
  kept,
  total,
  stat,
  statValue,
  skill,
  skillValue,
  dc,
  margin,
  tier,
  tierName,
  mode = 'matched',
  isCrit = false,
  isFumble = false,
  keptDie,        // value to render on the kept die face (dieSelected)
  discardedDie,   // optional discarded mortal value (outmatched/dominant only)
  animate = false, // play entrance animation when collapsing into this
}) {
  const keptState = isCrit ? 'crit' : isFumble ? 'fumble' : 'kept';
  const statDisplay = (stat || '').toUpperCase();
  const marginPositive = typeof margin === 'number' && margin >= 0;

  return (
    <div className={`${styles.chip} ${animate ? styles.chipIn : ''}`}>
      <div className={styles.dice}>
        <Die n={keptDie != null ? keptDie : kept} size={28} state={keptState} />
        {discardedDie != null && mode !== 'matched' && (
          <Die n={discardedDie} size={24} state="discarded" />
        )}
      </div>
      <div className={styles.meta}>
        {statDisplay && (
          <span className={styles.metaItem}>
            <span className={styles.metaKey}>{statDisplay}</span>
            <span className={styles.metaValue}>{fmt(statValue)}</span>
          </span>
        )}
        {skill && (
          <span className={styles.metaItem}>
            <span className={styles.metaKey}>{skill}</span>
            <span className={styles.metaValue}>+{fmt(skillValue)}</span>
          </span>
        )}
        {kept != null && (
          <span className={styles.metaItem}>
            <span className={styles.metaKey}>kept</span>
            <span className={styles.metaValue}>{kept}</span>
          </span>
        )}
        {total != null && (
          <span className={styles.metaItem}>
            <span className={styles.metaKey}>Total</span>
            <span className={styles.metaValue}>{fmt(total)}</span>
          </span>
        )}
        {dc != null && (
          <span className={styles.metaItem}>
            <span className={styles.metaKey}>vs DC</span>
            <span className={styles.metaValue}>{fmt(dc)}</span>
          </span>
        )}
        {margin != null && (
          <span className={`${styles.metaItem} ${marginPositive ? styles.marginPositive : styles.marginNegative}`}>
            <span className={styles.metaValue}>{fmtMargin(margin)}</span>
          </span>
        )}
        {tierName && (
          <span className={`${styles.tier} ${tierColorClass(tier, isCrit, isFumble)}`}>
            {tierName}
          </span>
        )}
      </div>
    </div>
  );
}
