import { useState } from 'react';
import styles from './ResolutionBlock.module.css';

function fmt(n) {
  if (n == null) return '?';
  return typeof n === 'number' ? n.toFixed(1) : String(n);
}

export default function ResolutionBlock({ resolution }) {
  const [expanded, setExpanded] = useState(false);

  if (!resolution) return null;

  const stat = (resolution.stat || '').toUpperCase();
  const skill = resolution.skillUsed || null;
  const modifier = resolution.skillModifier;
  const isSuccess = resolution.margin >= 0;
  const marginSign = resolution.margin > 0 ? '+' : '';
  const balance = (resolution.fortunesBalance || 'matched');
  const balanceDisplay = balance.charAt(0).toUpperCase() + balance.slice(1);

  return (
    <div className={styles.resolutionBlock}>
      {/* Compressed summary — click to toggle */}
      <div
        className={styles.compressed}
        onClick={() => setExpanded(prev => !prev)}
        style={expanded ? { borderRadius: '6px 6px 0 0' } : undefined}
      >
        <div className={styles.summaryText}>
          <span className={styles.summaryAction}>{resolution.action ? resolution.action.split(':').pop().trim() : 'Action'}</span>
          <span className={styles.summaryDivider}>{' | '}</span>
          <span className={styles.summaryStat}>{stat} {fmt(resolution.total != null ? resolution.total - (resolution.dieSelected || 0) - (modifier || 0) : null)}</span>
          {skill && <span>{` + ${skill} ${fmt(modifier)}`}</span>}
          <span className={styles.summaryDice}>{` + d20(${resolution.dieSelected})`}</span>
          <span className={styles.summaryCalc}>{` = ${fmt(resolution.total)} vs DC ${fmt(resolution.dc)}`}</span>
          <span className={styles.summaryDivider}>{' | '}</span>
          <span className={isSuccess ? styles.summarySuccess : styles.summaryFailure}>
            {marginSign}{fmt(resolution.margin)}: {resolution.tierName}
          </span>
        </div>
        <button
          className={styles.toggleButton}
          onClick={(e) => { e.stopPropagation(); setExpanded(prev => !prev); }}
          title="Roll breakdown"
          aria-label={expanded ? 'Hide roll details' : 'Show roll details'}
        >
          ?
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className={styles.expanded}>
          <div className={styles.detailGrid}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Action:</span>
              <span className={styles.detailValue}>{resolution.action || 'Unknown'}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Stat:</span>
              <span className={styles.detailValue}>{stat}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Skill:</span>
              <span className={styles.detailValue}>
                {skill ? `${skill} (+${fmt(modifier)})` : 'None'}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Equipment:</span>
              <span className={styles.detailValueNum}>
                {resolution.equipmentQuality != null ? `${resolution.equipmentQuality > 0 ? '+' : ''}${fmt(resolution.equipmentQuality)}` : 'None'}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Fortune:</span>
              <span className={styles.detailValue}>{balanceDisplay}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Crucible Roll:</span>
              <span className={styles.detailValueNum}>
                {resolution.crucibleRoll != null
                  ? `d20(${resolution.crucibleRoll})${resolution.crucibleExtreme ? ` \u2014 ${resolution.crucibleExtreme === 'nat20' ? 'Natural 20!' : 'Natural 1'}` : ''}`
                  : 'N/A'
                }
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>d20 Roll:</span>
              <span className={styles.detailValueNum}>{resolution.dieSelected}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>DC:</span>
              <span className={styles.detailValueNum}>{fmt(resolution.dc)}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Total:</span>
              <span className={styles.detailValueNum}>{fmt(resolution.total)}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Result:</span>
              <span className={isSuccess ? styles.summarySuccess : styles.summaryFailure}>
                {marginSign}{fmt(resolution.margin)}: {resolution.tierName} ({resolution.tier})
              </span>
            </div>
            {resolution.debtPenalty > 0 && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Debt:</span>
                <span className={styles.detailDebt}>-{fmt(resolution.debtPenalty)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
